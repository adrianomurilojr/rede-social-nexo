import { compare, hash } from "bcryptjs";
import type { FastifyInstance, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const registerSchema = z.object({
  username: z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

function validationError(reply: FastifyReply, issues: z.ZodIssue[]) {
  return reply.code(400).send({
    message: "Dados inválidos.",
    errors: issues.map(({ path, message }) => ({ field: path.join("."), message })),
  });
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return validationError(reply, parsed.error.issues);

    const { username, email, password } = parsed.data;
    try {
      const user = await prisma.user.create({
        data: { username, email: email.toLowerCase(), passwordHash: await hash(password, 12) },
        select: { id: true, username: true, email: true },
      });
      const token = app.jwt.sign({ userId: user.id });
      return reply.code(201).send({ token, user });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return reply.code(409).send({ message: "Nome de usuário ou e-mail já cadastrado." });
      }
      throw error;
    }
  });

  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) return validationError(reply, parsed.error.issues);

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
      return reply.code(401).send({ message: "E-mail ou senha incorretos." });
    }

    const token = app.jwt.sign({ userId: user.id });
    return reply.send({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  });
}
