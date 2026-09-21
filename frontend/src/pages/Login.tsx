import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarCheck2,
  KeyRound,
  ListChecks,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Snowflake,
} from "lucide-react";

import { ApiError, apiPost } from "@/lib/api";
import { beginSession, saveSessionToken } from "@/lib/session";
import type { LoginRequest, SessionUser } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const ASSURANCES = [
  {
    icon: ListChecks,
    title: "Todos os agendamentos em um só lugar",
    text: "Veja cada pedido de Instalação e Manutenção em tempo real.",
  },
  {
    icon: CalendarCheck2,
    title: "Confirme com um clique",
    text: "Marque atendimentos como concluídos ou exclua o que não servir.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso protegido",
    text: "Sessão segura por cookie httpOnly, exclusiva do dono.",
  },
];

export default function Login() {
  useDocumentTitle(
    "Área do Dono — Entrar",
    "Acesso restrito ao dono da JS Climatização para ver e gerenciar os agendamentos recebidos.",
  );
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: (body: LoginRequest) => apiPost<SessionUser>("/auth/login", body),
    onSuccess: async (session) => {
      saveSessionToken(session.access_token);
      await beginSession();
      navigate("/dashboard", { replace: true });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError && err.status === 401
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar agora. Tente novamente.",
      );
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha e-mail e senha.");
      return;
    }
    login.mutate({ email: email.trim(), password });
  };

  return (
    <div className="min-h-svh bg-background">
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-cyan-500/10 bg-[#0B132B] p-10 lg:flex">
          <div aria-hidden="true" className="glow-beam absolute inset-0" />
          <Link
            to="/"
            className="relative flex items-center gap-2"
            data-testid="login-brand-link"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Snowflake className="h-5 w-5" />
            </span>
            <span className="font-heading text-lg font-bold text-white">
              JS <span className="text-cyan-400">Climatização</span>
            </span>
          </Link>

          <div className="relative max-w-md space-y-8">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white">
              Todos os agendamentos na palma da sua mão.
            </h2>
            <ul className="space-y-6">
              {ASSURANCES.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-slate-500">
            © {new Date().getFullYear()} JS Climatização — acesso restrito ao dono.
          </p>
        </div>

        {/* Form panel */}
        <div className="relative flex flex-col items-center justify-center gap-8 px-4 py-12 subtle-grid sm:px-8">
          <Link
            to="/"
            data-testid="login-back-link"
            className={
              buttonVariants({ variant: "ghost", size: "sm" }) +
              " self-start text-slate-300 hover:text-white lg:self-center"
            }
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar ao site
          </Link>

          <form
            data-testid="owner-login-form"
            onSubmit={onSubmit}
            className="frost w-full max-w-md space-y-6 rounded-2xl p-8"
          >
            <div className="space-y-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Lock className="h-5 w-5" />
              </span>
              <h1 className="mt-3 font-heading text-2xl font-bold text-white">
                Entrar no painel
              </h1>
              <p className="text-sm text-slate-400">
                Acesso exclusivo do dono para ver e gerenciar os agendamentos recebidos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dono@jsclimatizacao.com"
                  data-testid="login-input-email"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  data-testid="login-input-password"
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full transition-transform active:scale-[0.98]"
              data-testid="login-submit-btn"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
