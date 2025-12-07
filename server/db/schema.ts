import { mysqlTable, varchar, int, serial } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  // Adicione outros campos de usuário se necessário
});

export const subscriptions = mysqlTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  planId: varchar('plan_id', { length: 255 }).notNull(),
  mercadopagoPreapprovalId: varchar('mercadopago_preapproval_id', { length: 255 }).unique(),
  status: varchar('status', { length: 50 }).notNull(), // Ex: 'pending', 'authorized', 'cancelled'
  // Adicione outros campos de assinatura se necessário
});
