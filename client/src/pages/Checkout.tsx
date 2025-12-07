import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Check, Copy, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Checkout() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [pixCode, setPixCode] = useState<string>("");
  const [pixQrCode, setPixQrCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const createSubscription = trpc.subscription.create.useMutation();
  const checkPayment = trpc.subscription.checkPayment.useMutation();

  const plans = {
    "1_month": {
      name: "1 mês",
      discount: "30% off",
      price: "R$ 19,90",
      value: 1990,
    },
    "3_months": {
      name: "3 meses",
      discount: "39% off",
      price: "R$ 29,90",
      value: 2990,
    },
    "6_months": {
      name: "6 meses",
      discount: "75% off",
      price: "R$ 59,90",
      value: 5990,
    },
  };

  // Obter plano da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    if (plan && plan in plans) {
      setSelectedPlan(plan);
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const handleCreateSubscription = async () => {
    if (!selectedPlan) return;

    try {
      const result = await createSubscription.mutateAsync({
        planType: selectedPlan as any,
      });

      setSubscriptionId(result.subscriptionId);
      setPixCode(result.payment?.pixCode || "");
      setPixQrCode(result.payment?.pixQrCode || "");

      // Iniciar verificação automática
      startPaymentCheck(result.subscriptionId);

      toast.success("Pagamento gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar pagamento. Tente novamente.");
      console.error(error);
    }
  };

  const startPaymentCheck = (subId: number) => {
    setChecking(true);
    const interval = setInterval(async () => {
      try {
        const result = await checkPayment.mutateAsync({
          subscriptionId: subId,
        });

        if (result.activated) {
          clearInterval(interval);
          setChecking(false);
          toast.success("Pagamento confirmado! Redirecionando...");
          setTimeout(() => {
            setLocation("/content");
          }, 2000);
        }
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
      }
    }, 3000); // Verificar a cada 3 segundos

    // Parar após 5 minutos
    setTimeout(() => {
      clearInterval(interval);
      setChecking(false);
    }, 300000);
  };

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualCheck = async () => {
    if (!subscriptionId) return;

    try {
      const result = await checkPayment.mutateAsync({ subscriptionId });

      if (result.activated) {
        toast.success("Pagamento confirmado! Redirecionando...");
        setTimeout(() => {
          setLocation("/content");
        }, 2000);
      } else {
        toast.info("Pagamento ainda não confirmado. Aguarde...");
      }
    } catch (error) {
      toast.error("Erro ao verificar pagamento.");
    }
  };

  if (authLoading || !isAuthenticated || !selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const plan = plans[selectedPlan as keyof typeof plans];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-rose-100">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-rose-600">Checkout</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!subscriptionId ? (
          // Resumo do Pedido
          <Card className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Confirme sua Assinatura
            </h2>

            {/* User Info */}
            <div className="bg-rose-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Assinante</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>

            {/* Plan Details */}
            <div className="border-2 border-rose-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Plano {plan.name}
                  </h3>
                  <p className="text-sm text-rose-600">{plan.discount}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-rose-600">
                    {plan.price}
                  </p>
                </div>
              </div>

              <div className="border-t border-rose-100 pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Acesso ilimitado a todo conteúdo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Fotos e vídeos exclusivos</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Novos conteúdos regularmente</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Liberação imediata após pagamento</span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Forma de Pagamento</p>
              <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border-2 border-green-200">
                <QrCode className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">PIX</p>
                  <p className="text-sm text-gray-600">
                    Pagamento instantâneo
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleCreateSubscription}
              disabled={createSubscription.isPending}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full py-6 text-lg font-semibold"
            >
              {createSubscription.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Gerando Pagamento...
                </>
              ) : (
                "Gerar Pagamento PIX"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Ao continuar, você concorda com nossos Termos de Uso e Política de
              Privacidade
            </p>
          </Card>
        ) : (
          // Pagamento PIX
          <Card className="bg-white rounded-3xl shadow-xl p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Pague com PIX
              </h2>
              <p className="text-gray-600">
                Escaneie o QR Code ou copie o código abaixo
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-white border-4 border-rose-200 rounded-2xl p-6 mb-6 flex justify-center">
              {pixQrCode ? (
                <img
                  src={pixQrCode}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* PIX Code */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2 text-center">
                Código PIX (Copia e Cola)
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-x-auto">
                  <code className="text-sm text-gray-700 break-all">
                    {pixCode}
                  </code>
                </div>
                <Button
                  onClick={handleCopyPixCode}
                  variant="outline"
                  className="border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Status */}
            {checking && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    Aguardando pagamento...
                  </p>
                  <p className="text-sm text-blue-700">
                    Verificando automaticamente a cada 3 segundos
                  </p>
                </div>
              </div>
            )}

            {/* Manual Check Button */}
            <Button
              onClick={handleManualCheck}
              disabled={checkPayment.isPending}
              variant="outline"
              className="w-full border-rose-300 text-rose-700 hover:bg-rose-50 rounded-full py-6 text-lg font-semibold"
            >
              {checkPayment.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                "Já Paguei - Verificar Agora"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              O acesso será liberado automaticamente após a confirmação do
              pagamento
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
