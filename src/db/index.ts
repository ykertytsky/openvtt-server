import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/openvtt';

// For query purposes
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });

export * from './schema';

