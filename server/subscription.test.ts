import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@test.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Subscription System", () => {
  it("should create a subscription with correct plan type", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscription.create({
      planType: "1_month",
    });

    expect(result.subscriptionId).toBeDefined();
    expect(result.payment).toBeDefined();
    expect(result.payment?.amount).toBe(1990); // R$ 19,90
    expect(result.payment?.status).toBe("pending");
    expect(result.payment?.pixCode).toBeDefined();
    expect(result.payment?.pixQrCode).toBeDefined();
  });

  it("should calculate correct amounts for different plans", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Test 3 months plan
    const result3Months = await caller.subscription.create({
      planType: "3_months",
    });
    expect(result3Months.payment?.amount).toBe(2990); // R$ 29,90

    // Test 6 months plan
    const result6Months = await caller.subscription.create({
      planType: "6_months",
    });
    expect(result6Months.payment?.amount).toBe(5990); // R$ 59,90
  });

  it("should activate subscription after payment confirmation", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Create subscription
    const createResult = await caller.subscription.create({
      planType: "1_month",
    });

    // Simulate payment confirmation
    const checkResult = await caller.subscription.checkPayment({
      subscriptionId: createResult.subscriptionId,
    });

    expect(checkResult.status).toBe("paid");
    expect(checkResult.activated).toBe(true);

    // Verify active subscription
    const activeSubscription = await caller.subscription.getActive();
    expect(activeSubscription).toBeDefined();
    expect(activeSubscription?.status).toBe("active");
  });

  it("should return null for user without active subscription", async () => {
    const ctx = createTestContext(999); // New user without subscription
    const caller = appRouter.createCaller(ctx);

    const activeSubscription = await caller.subscription.getActive();
    expect(activeSubscription).toBeNull();
  });
});

describe("Content Access Control", () => {
  it("should allow admin to upload content", async () => {
    const ctx = createTestContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.content.upload({
      title: "Test Photo",
      description: "Test description",
      type: "photo",
      fileData: base64Image,
      mimeType: "image/png",
      isPublic: false,
    });

    expect(result.success).toBe(true);
    expect(result.url).toBeDefined();
  });

  it("should prevent non-admin from uploading content", async () => {
    const ctx = createTestContext(1, "user");
    const caller = appRouter.createCaller(ctx);

    const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    await expect(
      caller.content.upload({
        title: "Test Photo",
        type: "photo",
        fileData: base64Image,
        mimeType: "image/png",
        isPublic: false,
      })
    ).rejects.toThrow("Apenas administradores podem fazer upload de conteudo");
  });

  it("should return content stats", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.content.stats();

    expect(stats).toBeDefined();
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.photos).toBeGreaterThanOrEqual(0);
    expect(stats.videos).toBeGreaterThanOrEqual(0);
  });
});
