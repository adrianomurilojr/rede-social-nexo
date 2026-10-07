"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type AuthMode = "login" | "register";
type User = { id: string; username: string; email: string };

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("nexo-token")) {
      router.replace("/");
    }
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode === "register" ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { username, email, password } : { email, password }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = typeof result === "object" && result !== null && "message" in result
          && typeof result.message === "string"
          ? result.message
          : "Não foi possível concluir sua solicitação.";
        throw new Error(message);
      }
      if (
        typeof result !== "object"
        || result === null
        || !("token" in result)
        || typeof result.token !== "string"
        || !("user" in result)
        || typeof result.user !== "object"
        || result.user === null
        || !("id" in result.user)
        || !("username" in result.user)
        || !("email" in result.user)
        || typeof result.user.id !== "string"
        || typeof result.user.username !== "string"
        || typeof result.user.email !== "string"
      ) {
        throw new Error("A resposta do servidor está incompleta.");
      }

      const user: User = {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
      };
      window.localStorage.setItem("nexo-token", result.token);
      window.localStorage.setItem("nexo-user", JSON.stringify(user));
      router.replace("/");
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError("Não foi possível conectar à API. Confira se o backend está em execução.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Não foi possível entrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-transparent">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
          <Link href={isRegister ? "/login" : "/register"} className="flex items-center gap-3" aria-label="Nexo início">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue text-lg font-bold text-white">n</span>
            <span className="text-xl font-semibold tracking-tight">nexo<span className="text-gold">.</span></span>
          </Link>
          <Link href={isRegister ? "/login" : "/register"} className="flex items-center gap-2 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft size={16} /> {isRegister ? "Entrar" : "Criar conta"}
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <section className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-panel p-6 sm:p-8">
          <div className="mb-6">
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/[0.1] text-gold">
              <Sparkles size={19} />
            </span>
            <h1 className="text-2xl font-semibold">{isRegister ? "Chegue mais perto." : "Entre na conversa."}</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              {isRegister
                ? "Crie sua conta e faça parte de uma comunidade para boas conversas."
                : "Acesse sua conta para continuar no seu mural."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isRegister && (
              <label className="block text-xs font-medium text-slate-300">
                Nome de usuário
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_]+"
                  required
                  autoComplete="username"
                  placeholder="seu_nome"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue"
                />
              </label>
            )}
            <label className="block text-xs font-medium text-slate-300">
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
                autoComplete="email"
                placeholder="voce@email.com"
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue"
              />
            </label>
            <label className="block text-xs font-medium text-slate-300">
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={isRegister ? 8 : 1}
                maxLength={72}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder={isRegister ? "Mínimo de 8 caracteres" : "Sua senha"}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-ink px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue"
              />
            </label>

            {error && (
              <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Aguarde..." : isRegister ? "Criar minha conta" : "Entrar na Nexo"}
              {!loading && <ArrowUpRight size={16} />}
            </button>
          </form>

          <p className="mt-6 border-t border-white/[0.07] pt-5 text-center text-sm text-muted">
            {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-medium text-gold transition hover:text-amber-300"
            >
              {isRegister ? "Entrar" : "Criar conta"}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
