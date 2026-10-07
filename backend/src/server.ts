import { buildApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

const app = await buildApp();
const port = Number(process.env.PORT ?? 3333);

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
