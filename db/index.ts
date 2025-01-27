import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as users from "./schemas/users";


const schema = {
  ...users
};

const connection = process.env.DRIZZLE_DATABASE_URL as string;
const queryClient = postgres(connection, { max: 1 });
export const databaseDrizzle = drizzle(queryClient, { schema });
export const migrateToLatest = async () => {
  await migrate(databaseDrizzle, { migrationsFolder: "drizzle" });
};
