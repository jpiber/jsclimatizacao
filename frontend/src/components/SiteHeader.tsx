import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Menu, Snowflake } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
  { href: "/#inicio", label: "Início", testid: "nav-link-home" },
  { href: "/#servicos", label: "Serviços", testid: "nav-link-services" },
  { href: "/#agendar", label: "Agendar", testid: "nav-link-booking" },
  { href: "/#contato", label: "Contato", testid: "nav-link-contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header
      data-testid="nav-header"
      className="sticky top-0 z-50 border-b border-cyan-500/15 bg-[#0B132B]/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="/#inicio" className="flex items-center gap-2" data-testid="nav-link-brand">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Snowflake className="h-5 w-5" />
          </span>
          <span className="font-heading text-base font-bold tracking-tight text-white sm:text-lg">
            JS <span className="text-cyan-400">Climatização</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
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

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            data-testid="nav-link-login"
            className={
              buttonVariants({ variant: "outline", size: "sm" }) +
              " border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
            }
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">Área do Dono</span>
            <span className="sm:hidden">Entrar</span>
          </Link>

          {/* Mobile menu — the nav links above are hidden below md */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Abrir menu de navegação"
                  data-testid="mobile-menu-trigger"
                  className="text-slate-200 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72 border-cyan-500/20 bg-[#0B132B]">
              <SheetHeader>
                <SheetTitle className="font-heading text-white">
                  JS <span className="text-cyan-400">Climatização</span>
                </SheetTitle>
              </SheetHeader>
              <nav
                className="mt-2 flex flex-col gap-1 px-4 pb-6"
                aria-label="Navegação mobile"
                data-testid="mobile-menu-nav"
              >
                {NAV.map((item) => (
                  <a
                    key={item.testid}
                    href={item.href}
                    data-testid={`mobile-${item.testid}`}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-3 text-base text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
                <Link
                  to="/login"
                  data-testid="mobile-nav-link-login"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md px-3 py-3 text-base text-cyan-300 transition-colors hover:bg-cyan-500/10"
                >
                  Área do Dono
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
