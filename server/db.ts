import { drizzle } from 'drizzle-orm/node-postgres';
// Option 2: Alternative ESM import
import pkg from 'pg';
const { Client, Pool } = pkg;
import * as schema from "@shared/schema";
import ws from "ws";

import 'dotenv/config';
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });