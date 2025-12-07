import { and, desc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptions, payments, content, InsertSubscription, InsertPayment, InsertContent } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Subscription functions
export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(subscriptions).values(subscription);
  return result;
}

export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active"),
        gt(subscriptions.endDate, now)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function getUserSubscriptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));
}

export async function updateSubscriptionStatus(
  subscriptionId: number,
  status: "pending" | "active" | "expired" | "cancelled",
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (startDate) updateData.startDate = startDate;
  if (endDate) updateData.endDate = endDate;
  
  await db
    .update(subscriptions)
    .set(updateData)
    .where(eq(subscriptions.id, subscriptionId));
}

// Payment functions
export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(payment);
  return result;
}

export async function getPaymentBySubscriptionId(subscriptionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.subscriptionId, subscriptionId))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function updatePaymentStatus(
  paymentId: number,
  status: "pending" | "paid" | "failed" | "refunded",
  paidAt?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (paidAt) updateData.paidAt = paidAt;
  
  await db
    .update(payments)
    .set(updateData)
    .where(eq(payments.id, paymentId));
}

// Content functions
export async function createContent(contentData: InsertContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(content).values(contentData);
  return result;
}

export async function getAllContent() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(content)
    .orderBy(desc(content.createdAt));
}

export async function getPublicContent() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(content)
    .where(eq(content.isPublic, 1))
    .orderBy(desc(content.createdAt));
}

export async function deleteContent(contentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(content).where(eq(content.id, contentId));
}

export async function getContentStats() {
  const db = await getDb();
  if (!db) return { photos: 0, videos: 0, total: 0 };
  
  const allContent = await db.select().from(content);
  const photos = allContent.filter(c => c.type === "photo").length;
  const videos = allContent.filter(c => c.type === "video").length;
  
  return {
    photos,
    videos,
    total: allContent.length
  };
}
