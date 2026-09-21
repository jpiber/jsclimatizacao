import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Snowflake,
  Star,
  Wrench,
} from "lucide-react";

import SiteHeader from "@/components/SiteHeader";
import BookingForm from "@/components/BookingForm";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const WHATSAPP_URL = "https://wa.me/5511999998888";
const PHONE_DISPLAY = "(11) 99999-8888";
const PHONE_TEL = "+5511999998888";
const EMAIL_DISPLAY = "contato@jsclimatizacao.com.br";

// Width/quality params keep the delivered bytes small (compression handled by the CDN).
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1761330440311-16e160cad236?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBjbGVhbiUyMGxpdmluZyUyMHJvb20lMjBhaXIlMjBjb25kaXRpb25pbmd8ZW58MHx8fDE3ODk5OTIyMzl8MA&ixlib=rb-4.1.0&q=72&w=900&auto=format";

const SERVICES = [
  {
    id: "instalacao",
    title: "Instalação de Ar-Condicionado",
    description:
      "Instalação completa padrão de fábrica para modelos Split Hi-Wall, Inverter, Cassete e Piso Teto — tubulação de cobre, teste de estanqueidade em nitrogênio e vácuo absoluto.",
    badge: "Mais Solicitado",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxlbGVjdHJpY2lhbiUyMHJlcGFpciUyMGNvb2xpbmd8ZW58MHx8fDE3ODk5OTIyMzR8MA&ixlib=rb-4.1.0&q=72&w=760&auto=format",
    highlights: ["Garantia estendida", "Infraestrutura limpa", "Cálculo térmico exato"],
  },
  {
    id: "manutencao",
    title: "Manutenção & Higienização",
    description:
      "Manutenção preventiva e corretiva com higienização química bactericida (norma PMOC), recarga de fluido refrigerante e desobstrução de dreno para eficiência energética máxima.",
    badge: "Essencial para Saúde",
    image:
      "https://images.pexels.com/photos/5463581/pexels-photo-5463581.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=520&w=760",
    highlights: [
      "Elimina 99,9% dos ácaros e fungos",
      "Reduz até 30% na conta de luz",
      "Diagnóstico elétrico e mecânico",
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Envie o pedido",
    text: "Preencha o formulário em 2 minutos com o serviço e a data que prefere.",
  },
  {
    n: "02",
    title: "Confirmamos pelo WhatsApp",
    text: "Nossa equipe confirma a visita e ajusta qualquer detalhe com você.",
  },
  {
    n: "03",
    title: "Técnico no local",
    text: "No dia combinado, nosso técnico certificado executa o serviço com garantia.",
  },
];

export default function Home() {
  useDocumentTitle(
    "JS Climatização | Instalação e Manutenção de Ar-Condicionado",
    "JS Climatização — instalação e manutenção de ar-condicionado com agendamento online. Agende sua visita técnica em minutos.",
  );

  return (
    <div className="relative min-h-svh bg-background">
      <div aria-hidden="true" className="subtle-grid pointer-events-none fixed inset-0 opacity-50" />

      <div className="relative">
        <SiteHeader />

        <main>
          {/* Hero */}
          <section id="inicio" className="relative overflow-hidden">
            <div aria-hidden="true" className="glow-beam absolute inset-0" />
            <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-24">
              <motion.div
                className="lg:col-span-7"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Badge className="border border-cyan-500/30 bg-[#0E3A52] text-[#7DD3FC]">
                  Instalação e Manutenção de Ar-Condicionado
                </Badge>
                <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Conforto térmico com <span className="text-cyan-400">precisão técnica</span>{" "}
                  para sua casa ou empresa
                </h1>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
                  A JS Climatização instala, mantém e higieniza o ar do seu ambiente com equipe
                  certificada, agilidade e garantia. Agende sua visita técnica online em minutos.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#agendar"
                    data-testid="hero-cta-agendar"
                    className={
                      buttonVariants({ size: "lg" }) +
                      " transition-transform active:scale-[0.98]"
                    }
                  >
                    <CalendarCheck className="mr-2 h-5 w-5" /> Agendar visita técnica
                  </a>
                  <a
                    href="#servicos"
                    data-testid="hero-cta-servicos"
                    className={
                      buttonVariants({ variant: "outline", size: "lg" }) +
                      " border-cyan-500/30 text-cyan-200 transition-transform hover:bg-cyan-500/10 hover:text-cyan-100 active:scale-[0.98]"
                    }
                  >
                    Ver serviços
                  </a>
                </div>
                <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-400" /> Garantia de 90 dias
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cyan-400" /> Atendimento em até 24h
                  </span>
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400" /> Nota 4,9 dos clientes
                  </span>
                </div>
              </motion.div>

              <motion.div
                className="relative lg:col-span-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              >
                <div className="frost overflow-hidden rounded-2xl">
                  <img
                    src={HERO_IMAGE}
                    alt="Sala contemporânea com ar-condicionado split instalado pela JS Climatização"
                    width={900}
                    height={600}
                    decoding="async"
                    className="h-72 w-full object-cover sm:h-96"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/90 via-transparent to-transparent" />
                </div>
                <div className="animate-float-soft frost absolute -bottom-5 left-6 hidden items-center gap-3 rounded-xl p-4 sm:flex">
                  <BadgeCheck className="h-8 w-8 text-cyan-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Equipe certificada</p>
                    <p className="text-xs text-slate-400">Técnicos habilitados e com PMOC</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Services */}
          <section id="servicos" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
              Nossos serviços
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-white">
              Tudo que seu ar-condicionado precisa
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
              {SERVICES.map((service) => (
                <article
                  key={service.id}
                  data-testid={`service-card-${service.id}`}
                  className="frost group overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_10px_30px_rgba(0,180,216,0.15)] motion-reduce:transition-none"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.image}
                      alt={`Serviço de ${service.title} da JS Climatização`}
                      loading="lazy"
                      decoding="async"
                      width={760}
                      height={520}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1C2541] via-[#0B132B]/40 to-transparent" />
                    <Badge className="absolute right-4 top-4 border border-cyan-500/30 bg-[#0B132B]/80 text-[#7DD3FC]">
                      {service.badge}
                    </Badge>
                  </div>
                  <div className="space-y-4 p-6">
                    <h3 className="font-heading text-xl font-bold text-white">{service.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-300">{service.description}</p>
                    <ul className="space-y-2">
                      {service.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex items-center gap-2 text-sm text-slate-300"
                        >
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />{" "}
                          {highlight}
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#agendar"
                      className={
                        buttonVariants({ variant: "ghost", size: "sm" }) +
                        " px-0 text-cyan-400 hover:bg-transparent hover:text-cyan-300"
                      }
                    >
                      Agendar este serviço <Wrench className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
            <div className="frost rounded-2xl p-8 sm:p-10">
              <h2 className="font-heading text-2xl font-bold text-white">Como funciona</h2>
              <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
                {STEPS.map((step) => (
                  <div key={step.n} className="border-l border-cyan-500/20 pl-5">
                    <span className="font-mono text-sm text-cyan-400">{step.n}</span>
                    <h3 className="mt-1 font-heading text-lg font-bold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Booking */}
          <section
            id="agendar"
            className="relative scroll-mt-20 border-y border-cyan-500/10 bg-[#0E1730]/60 py-16"
          >
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                  Agendamento online
                </p>
                <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-white">
                  Agende sua visita técnica
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-300">
                  Preencha o formulário e nossa equipe confirma a visita pelo WhatsApp. Sem
                  compromisso, sem fila de telefone.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Resposta em até 1 dia
                    útil
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Orçamento transparente
                    antes do serviço
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Garantia em todas as
                    execuções
                  </li>
                </ul>
                <div className="mt-8 space-y-3 text-sm text-slate-300">
                  <p className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-cyan-400" />
                    <a
                      href={`tel:${PHONE_TEL}`}
                      data-testid="contact-phone-link"
                      className="transition-colors hover:text-white"
                    >
                      {PHONE_DISPLAY}
                    </a>
                  </p>
                  <p className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-cyan-400" />
                    <a
                      href={`mailto:${EMAIL_DISPLAY}`}
                      data-testid="contact-email-link"
                      className="break-all transition-colors hover:text-white"
                    >
                      {EMAIL_DISPLAY}
                    </a>
                  </p>
                  <p className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 shrink-0 text-cyan-400" /> Av. das Nações, 1250 —
                    São Paulo/SP
                  </p>
                </div>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="booking-whatsapp-link"
                  className={
                    buttonVariants({ variant: "outline" }) +
                    " mt-8 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                  }
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Falar no WhatsApp
                </a>
              </div>

              <div className="lg:col-span-7">
                <BookingForm />
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer id="contato" className="relative scroll-mt-20">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
              <div className="md:col-span-2">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  data-testid="footer-brand-link"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Snowflake className="h-5 w-5" />
                  </span>
                  <span className="font-heading text-lg font-bold text-white">
                    JS <span className="text-cyan-400">Climatização</span>
                  </span>
                </Link>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                  Conforto térmico, ar puro e precisão técnica para sua casa ou empresa.
                  Instalação e manutenção de ar-condicionado com agendamento online.
                </p>
              </div>

              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                  Serviços
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li>
                    <a
                      href="/#servicos"
                      data-testid="footer-link-instalacao"
                      className="transition-colors hover:text-cyan-300"
                    >
                      Instalação de Ar-Condicionado
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#servicos"
                      data-testid="footer-link-manutencao"
                      className="transition-colors hover:text-cyan-300"
                    >
                      Manutenção &amp; Higienização
                    </a>
                  </li>
                  <li>
                    <a
                      href="/#agendar"
                      data-testid="footer-link-agendar"
                      className="transition-colors hover:text-cyan-300"
                    >
                      Agendar visita técnica
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-white">
                  Contato
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li>
                    <a
                      href={`tel:${PHONE_TEL}`}
                      data-testid="footer-phone-link"
                      className="transition-colors hover:text-cyan-300"
                    >
                      {PHONE_DISPLAY}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${EMAIL_DISPLAY}`}
                      data-testid="footer-email-link"
                      className="break-all transition-colors hover:text-cyan-300"
                    >
                      {EMAIL_DISPLAY}
                    </a>
                  </li>
                  <li>Seg a Sáb, 8h às 18h</li>
                  <li>
                    <Link
                      to="/login"
                      data-testid="footer-link-login"
                      className="text-cyan-400 transition-colors hover:text-cyan-300"
                    >
                      Área do Dono
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 border-t border-border/60 pt-6 text-xs text-slate-500">
              © {new Date().getFullYear()} JS Climatização — Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
