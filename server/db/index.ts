import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql2 from 'mysql2/promise';
import * as schema from './schema';

const connection = mysql2.createPool({
  uri: process.env.DATABASE_URL,
});

export const db = drizzle(connection, { schema, mode: 'default' });
