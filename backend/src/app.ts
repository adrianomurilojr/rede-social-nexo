import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";
import { authRoutes } from "./routes/auth.js";
import { postRoutes } from "./routes/posts.js";

export async function buildApp() {
  const app = Fastify({ logger: true });
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET precisa ter pelo menos 32 caracteres.");
  }

  await app.register(cors, { origin: process.env.FRONTEND_URL ?? "http://localhost:3000" });
  await app.register(jwt, { secret: jwtSecret });
  app.get("/api/health", async () => ({ status: "ok" }));
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(postRoutes, { prefix: "/api/posts" });
  return app;
}
