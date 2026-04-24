import { defineConfig, env } from "prisma/config";
import { loadEnvFiles } from "./src/config/envFiles";

loadEnvFiles();

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  // migrations: {
  //   path: 'prisma/migrations',
  // },
  datasource: {
    url: env('DATABASE_URL'),
  },
})