"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, LogOut, MessageCircle, Send, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

type User = { id: string; username: string; email: string };
type Post = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; username: string };
  likeCount: number;
  likedByMe: boolean;
};

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...Object.fromEntries(new Headers(options.headers).entries()),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? "Não foi possível concluir a solicitação.");
  return data as T;
}

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function timeAgo(date: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const loadPosts = useCallback(async (authToken?: string) => {
    try {
      const result = await apiRequest<Post[]>("/api/posts", {}, authToken);
      setPosts(result);
      setError("");
    } catch {
      setError("Não foi possível conectar à API. Confira se o backend está em execução.");
    }
  }, []);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("nexo-token");
    const savedUser = window.localStorage.getItem("nexo-user");
    if (!savedToken || !savedUser) {
      window.location.replace("/login");
      return;
    }

    try {
      const savedUserData: unknown = JSON.parse(savedUser);
      if (
        typeof savedUserData !== "object"
        || savedUserData === null
        || !("id" in savedUserData)
        || !("username" in savedUserData)
        || !("email" in savedUserData)
        || typeof savedUserData.id !== "string"
        || typeof savedUserData.username !== "string"
        || typeof savedUserData.email !== "string"
      ) {
        throw new Error("Sessão inválida.");
      }
      setToken(savedToken);
      setUser({ id: savedUserData.id, username: savedUserData.username, email: savedUserData.email });
      setSessionReady(true);
      void loadPosts(savedToken);
    } catch {
      window.localStorage.removeItem("nexo-token");
      window.localStorage.removeItem("nexo-user");
      window.location.replace("/login");
    }
  }, [loadPosts]);

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    try {
      const post = await apiRequest<Post>("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content }),
      }, token);
      setPosts((current) => [post, ...current]);
      setContent("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível publicar.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(postId: string) {
    if (!token) {
      setError("Entre na sua conta para curtir uma publicação.");
      return;
    }
    try {
      const result = await apiRequest<{ liked: boolean }>(`/api/posts/${postId}/like`, {
        method: "POST",
      }, token);
      setPosts((current) => current.map((post) => post.id === postId
        ? { ...post, likedByMe: result.liked, likeCount: post.likeCount + (result.liked ? 1 : -1) }
        : post));
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível curtir.");
    }
  }

  function signOut() {
    window.localStorage.removeItem("nexo-token");
    window.localStorage.removeItem("nexo-user");
    window.location.replace("/login");
  }

  if (!sessionReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-transparent text-sm text-muted">
        Abrindo seu mural...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Nexo início">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue text-lg font-bold text-white">n</span>
            <span className="text-xl font-semibold tracking-tight">nexo<span className="text-gold">.</span></span>
          </Link>
          <div className="hidden items-center gap-2 text-sm text-muted sm:flex">
            <span className="h-2 w-2 rounded-full bg-gold" />
            Um espaço para boas conversas
          </div>
          <button onClick={signOut} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-gold/50 hover:text-white">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 lg:py-14">
        <section>
          <div className="mb-9 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.07] px-3 py-1.5 text-xs font-medium text-gold">
              <Sparkles size={14} /> MENOS RUÍDO, MAIS CONEXÃO
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Ideias boas merecem <span className="text-gold">espaço.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted">
              Uma comunidade para compartilhar o que importa, encontrar novas perspectivas e conversar de verdade.
            </p>
          </div>

          <div className="mb-5 flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Seu mural</h2>
            <span className="text-xs text-muted">Mais recentes</span>
          </div>

          {user && (
            <form onSubmit={submitPost} className="mb-5 rounded-2xl border border-white/[0.08] bg-panel p-4">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/20 text-sm font-semibold text-blue-200">
                  {initials(user.username)}
                </span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="O que está pensando?"
                  className="w-full resize-none bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-500"
                  aria-label="Escreva uma publicação"
                />
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/[0.07] pt-3">
                <span className="text-xs text-muted">{content.length}/500</span>
                <button disabled={loading || !content.trim()} className="flex items-center gap-2 rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                  Publicar <Send size={14} />
                </button>
              </div>
            </form>
          )}

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-2xl border border-white/[0.08] bg-panel p-5 transition hover:border-white/[0.14]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.08] text-xs font-bold text-gold">
                    {initials(post.author.username)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-100">@{post.author.username}</p>
                    <p className="mt-0.5 text-xs text-muted">{timeAgo(post.createdAt)}</p>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                </div>
                <p className="whitespace-pre-wrap break-words py-4 text-[15px] leading-7 text-slate-200">{post.content}</p>
                <div className="flex items-center gap-5 border-t border-white/[0.07] pt-3">
                  <button
                    onClick={() => void toggleLike(post.id)}
                    aria-label={post.likedByMe ? "Descurtir publicação" : "Curtir publicação"}
                    className={`flex items-center gap-2 text-sm transition ${post.likedByMe ? "text-gold" : "text-muted hover:text-gold"}`}
                  >
                    <Heart size={17} fill={post.likedByMe ? "currentColor" : "none"} />
                    {post.likeCount}
                  </button>
                  <span className="flex items-center gap-2 text-sm text-muted"><MessageCircle size={17} /> Conversar</span>
                </div>
              </article>
            ))}
            {!posts.length && !error && (
              <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
                <MessageCircle className="mx-auto text-gold" size={24} />
                <p className="mt-3 text-sm font-medium text-slate-200">O mural está esperando por você.</p>
                <p className="mt-1 text-sm text-muted">Entre ou crie sua conta para começar uma conversa.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-white/[0.08] bg-panel p-6">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue/20 text-lg font-semibold text-blue-200">
              {initials(user?.username ?? "")}
            </span>
            <h2 className="mt-4 text-center text-lg font-semibold">Que bom ter você, {user?.username}.</h2>
            <p className="mt-1 text-center text-sm text-muted">Sua próxima conversa começa aqui.</p>
          </section>

          <section className="rounded-2xl border border-gold/15 bg-gradient-to-br from-gold/[0.09] to-transparent p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-gold"><Sparkles size={16} /> Um lugar mais leve</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">Sem algoritmos barulhentos. Só você, suas ideias e pessoas abertas a ouvir.</p>
          </section>

          <footer className="px-2 text-xs leading-6 text-slate-600">
            Feito para conversas que valem a pena. <span className="text-gold">Nexo © 2026</span>
          </footer>
        </aside>
      </div>
    </main>
  );
}
