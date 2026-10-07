import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authenticate } from "../plugins/authenticate.js";

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export async function postRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (request, reply) => {
    let userId: string | undefined;
    if (request.headers.authorization) {
      try {
        await request.jwtVerify();
        userId = request.user.userId;
      } catch {
        return reply.code(401).send({ message: "Token inválido ou expirado." });
      }
    }

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { likes: true } },
        likes: userId ? { where: { userId }, select: { id: true } } : false,
      },
    });
    return posts.map(({ _count, likes, ...post }) => ({
      ...post,
      likeCount: _count.likes,
      likedByMe: Array.isArray(likes) && likes.length > 0,
    }));
  });

  app.post("/", { preHandler: authenticate }, async (request, reply) => {
    const parsed = createPostSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Dados inválidos.",
        errors: parsed.error.issues.map(({ path, message }) => ({
          field: path.join("."),
          message,
        })),
      });
    }

    const post = await prisma.post.create({
      data: { content: parsed.data.content, authorId: request.user.userId },
      include: { author: { select: { id: true, username: true } } },
    });
    return reply.code(201).send({ ...post, likeCount: 0, likedByMe: false });
  });

  app.post("/:postId/like", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ postId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ message: "Identificador de publicação inválido." });
    }

    const { postId } = params.data;
    const userId = request.user.userId;
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return reply.code(404).send({ message: "Publicação não encontrada." });

    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      return reply.send({ liked: false });
    }

    await prisma.like.create({ data: { userId, postId } });
    return reply.send({ liked: true });
  });
}
