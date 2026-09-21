import { Link } from "react-router-dom";
import { Home as HomeIcon, CalendarCheck, SearchX } from "lucide-react";

import SiteHeader from "@/components/SiteHeader";
import { buttonVariants } from "@/components/ui/button";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle(
    "Página não encontrada (404)",
    "A página que você procura não existe. Volte ao início da JS Climatização ou agende sua visita técnica.",
  );

  return (
    <div className="relative min-h-svh bg-background">
      <div aria-hidden="true" className="subtle-grid pointer-events-none fixed inset-0 opacity-50" />
      <div className="relative">
        <SiteHeader />
        <main
          data-testid="not-found-page"
          className="mx-auto flex max-w-3xl flex-col items-start px-4 py-20 sm:px-6 sm:py-28"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <SearchX className="h-6 w-6" />
          </span>
          <p className="mt-6 font-mono text-sm text-cyan-400">Erro 404</p>
          <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Esta página saiu para uma manutenção
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
            O endereço que você abriu não existe ou foi movido. Você pode voltar ao início ou
            agendar sua visita técnica de instalação e manutenção agora mesmo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/"
              data-testid="not-found-home-link"
              className={buttonVariants({ size: "lg" }) + " transition-transform active:scale-[0.98]"}
            >
              <HomeIcon className="mr-2 h-5 w-5" /> Voltar ao início
            </Link>
            <Link
              to="/#agendar"
              data-testid="not-found-booking-link"
              className={
                buttonVariants({ variant: "outline", size: "lg" }) +
                " border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10 hover:text-cyan-100"
              }
            >
              <CalendarCheck className="mr-2 h-5 w-5" /> Agendar visita
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
