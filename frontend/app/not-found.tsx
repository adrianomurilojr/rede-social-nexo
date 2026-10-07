import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Nexo</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">Esta página não existe.</h1>
      <Link href="/" className="mt-6 rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white">
        Voltar ao mural
      </Link>
    </main>
  );
}
