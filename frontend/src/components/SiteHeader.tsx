import { Link } from "react-router-dom";
import { Lock, Snowflake } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

const NAV = [
  { href: "/#inicio", label: "Início", testid: "nav-link-home" },
  { href: "/#servicos", label: "Serviços", testid: "nav-link-services" },
  { href: "/#agendar", label: "Agendar", testid: "nav-link-booking" },
  { href: "/#contato", label: "Contato", testid: "nav-link-contact" },
];

export default function SiteHeader() {
  return (
    <header
      data-testid="nav-header"
      className="sticky top-0 z-50 border-b border-cyan-500/15 bg-[#0B132B]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="/#inicio" className="flex items-center gap-2" data-testid="nav-link-brand">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Snowflake className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            JS <span className="text-cyan-400">Climatização</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.testid}
              href={item.href}
              data-testid={item.testid}
              className="rounded-md px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          to="/login"
          data-testid="nav-link-login"
          className={
            buttonVariants({ variant: "outline", size: "sm" }) +
            " border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
          }
        >
          <Lock className="mr-1.5 h-3.5 w-3.5" /> Área do Dono
        </Link>
      </div>
    </header>
  );
}
