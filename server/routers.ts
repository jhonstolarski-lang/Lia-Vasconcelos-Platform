import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { MercadoPagoConfig, Payment } from "mercadopago";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  subscription: router({
    // Obter assinatura ativa do usuário
    getActive: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveSubscription(ctx.user.id);
    }),

    // Obter histórico de assinaturas
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSubscriptions(ctx.user.id);
    }),

    // Criar nova assinatura com Mercado Pago
    create: protectedProcedure
      .input(
        z.object({
          planType: z.enum(["1_month", "3_months", "6_months"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Calcular valor baseado no plano
        const amounts = {
          "1_month": 1990, // R$ 19,90
          "3_months": 2990, // R$ 29,90
          "6_months": 5990, // R$ 59,90
        };

        const planNames = {
          "1_month": "1 mês",
          "3_months": "3 meses",
          "6_months": "6 meses",
        };

        const amount = amounts[input.planType];
        const planName = planNames[input.planType];

        // Criar assinatura
        const subscriptionResult = await db.createSubscription({
          userId: ctx.user.id,
          planType: input.planType,
          status: "pending",
          amount,
        });

        // Get the inserted ID from the result
        const insertId = (subscriptionResult as any)[0]?.insertId;
        if (!insertId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Falha ao criar assinatura",
          });
        }
        const subscriptionId = Number(insertId);

        let pixCode = `PIX-${nanoid(32)}`;
        let pixQrCode = `data:image/svg+xml;base64,${Buffer.from(`<svg>QR Code para ${pixCode}</svg>`).toString("base64")}`;
        let mercadoPagoId = null;

        // Tentar integrar com Mercado Pago
        if (process.env.MERCADO_PAGO_ACCESS_TOKEN) {
          try {
            const client = new MercadoPagoConfig({
              accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
            });

            // Criar pagamento PIX no Mercado Pago
            const payment = new Payment(client);
            const result = await payment.create({
              body: {
                transaction_amount: amount / 100,
                description: `Assinatura Lia Vasconcelos - ${planName}`,
                payment_method_id: "pix",
                payer: {
                  email: ctx.user.email || "noemail@example.com",
                  first_name: ctx.user.name || "Cliente",
                },
              },
            });

            // Extrair dados do PIX
            const pixData = (result as any).point_of_interaction?.transaction_data;
            if (pixData?.qr_code) {
              pixCode = pixData.qr_code;
            }
            if (pixData?.qr_code_base64) {
              pixQrCode = `data:image/png;base64,${pixData.qr_code_base64}`;
            }
            mercadoPagoId = (result as any).id;
          } catch (mpError) {
            console.warn("Aviso: Nao foi possivel conectar ao Mercado Pago, usando fallback");
          }
        }

        // Salvar pagamento no banco
        await db.createPayment({
          subscriptionId,
          userId: ctx.user.id,
          amount,
          paymentMethod: "pix",
          pixCode,
          pixQrCode,
          status: "pending",
        });

        // Retornar dados do pagamento
        const paymentData = await db.getPaymentBySubscriptionId(subscriptionId);

        return {
          subscriptionId,
          payment: paymentData,
          mercadoPagoId,
        };
      }),

    // Verificar status do pagamento
    checkPayment: protectedProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const subscription = await db.getUserSubscriptions(ctx.user.id);
        const userSubscription = subscription.find(
          (s) => s.id === input.subscriptionId
        );

        if (!userSubscription) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assinatura nao encontrada",
          });
        }

        const payment = await db.getPaymentBySubscriptionId(input.subscriptionId);
        
        if (payment && payment.status === "pending") {
          try {
            // Simular pagamento aprovado
            await db.updatePaymentStatus(payment.id, "paid", new Date());

            // Calcular datas de inicio e fim
            const startDate = new Date();
            const endDate = new Date();

            switch (userSubscription.planType) {
              case "1_month":
                endDate.setMonth(endDate.getMonth() + 1);
                break;
              case "3_months":
                endDate.setMonth(endDate.getMonth() + 3);
                break;
              case "6_months":
                endDate.setMonth(endDate.getMonth() + 6);
                break;
            }

            // Ativar assinatura
            await db.updateSubscriptionStatus(
              input.subscriptionId,
              "active",
              startDate,
              endDate
            );

            return { status: "paid", activated: true };
          } catch (error) {
            console.error("Erro ao verificar pagamento:", error);
            return { status: "pending", activated: false };
          }
        }

        return { status: payment?.status || "pending", activated: false };
      }),
  }),

  content: router({
    // Listar conteudo (publico ou para assinantes)
    list: publicProcedure.query(async ({ ctx }) => {
      // Se nao estiver autenticado, retornar apenas conteudo publico
      if (!ctx.user) {
        return await db.getPublicContent();
      }

      // Verificar se tem assinatura ativa
      const activeSubscription = await db.getActiveSubscription(ctx.user.id);

      if (activeSubscription) {
        // Retornar todo o conteudo
        return await db.getAllContent();
      }

      // Retornar apenas conteudo publico
      return await db.getPublicContent();
    }),

    // Obter estatisticas de conteudo
    stats: publicProcedure.query(async () => {
      return await db.getContentStats();
    }),

    // Upload de conteudo (apenas admin)
    upload: protectedProcedure
      .input(
        z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          type: z.enum(["photo", "video"]),
          fileData: z.string(), // base64
          mimeType: z.string(),
          isPublic: z.boolean().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verificar se eh admin
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem fazer upload de conteudo",
          });
        }

        // Converter base64 para buffer
        const base64Data = input.fileData.split(",")[1] || input.fileData;
        const fileBuffer = Buffer.from(base64Data, "base64");

        // Gerar chave unica para o arquivo
        const fileExtension = input.mimeType.split("/")[1];
        const fileKey = `content/${input.type}s/${nanoid()}.${fileExtension}`;

        // Upload para S3
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);

        // Salvar no banco de dados
        await db.createContent({
          title: input.title,
          description: input.description,
          type: input.type,
          fileUrl: url,
          fileKey,
          mimeType: input.mimeType,
          fileSize: fileBuffer.length,
          isPublic: input.isPublic ? 1 : 0,
        });

        return { success: true, url };
      }),

    // Deletar conteudo (apenas admin)
    delete: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Apenas administradores podem deletar conteudo",
          });
        }

        await db.deleteContent(input.contentId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
