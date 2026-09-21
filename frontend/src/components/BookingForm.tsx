import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";

import { ApiError, apiGet, apiPost } from "@/lib/api";
import { formatDateBR, maskCPF, maskPhone, onlyDigits } from "@/lib/format";
import type { Appointment, AppointmentCreate, SiteMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const SERVICO_OPTIONS = [
  { value: "Instalação", label: "Instalação de Ar-Condicionado" },
  { value: "Manutenção", label: "Manutenção & Higienização" },
];
const PERIODO_OPTIONS = [
  "Manhã (08h às 12h)",
  "Tarde (13h às 18h)",
  "Comercial Flexível",
];

interface FormState {
  nome: string;
  cpf: string;
  email: string;
  numero: string;
  endereco: string;
  servico: string;
  data: string;
  periodo: string;
  observacoes: string;
}

const EMPTY_FORM: FormState = {
  nome: "",
  cpf: "",
  email: "",
  numero: "",
  endereco: "",
  servico: "",
  data: "",
  periodo: "",
  observacoes: "",
};

function firstValidationMessage(body: unknown): string | null {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      return first.msg
        ? `Verifique os dados informados (${first.msg}).`
        : "Verifique os dados informados.";
    }
  }
  return null;
}

export default function BookingForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [success, setSuccess] = useState<Appointment | null>(null);

  // Server-anchored "today" — used only as the date input's minimum.
  const { data: meta } = useQuery({
    queryKey: ["meta"],
    queryFn: () => apiGet<SiteMeta>("/meta"),
    retry: false,
    staleTime: Infinity,
  });

  const createAppointment = useMutation({
    mutationFn: (body: AppointmentCreate) => apiPost<Appointment>("/appointments", body),
    onSuccess: (created) => {
      setSuccess(created);
      toast.success("Agendamento enviado! Confirmaremos pelo WhatsApp.");
    },
    onError: (err) => {
      const fallback = "Não foi possível enviar agora. Tente novamente em instantes.";
      toast.error(
        err instanceof ApiError ? (firstValidationMessage(err.body) ?? fallback) : fallback,
      );
    },
  });

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (form.nome.trim().length < 3) return void toast.error("Informe seu nome completo.");
    if (onlyDigits(form.cpf).length !== 11)
      return void toast.error("Informe um CPF válido com 11 dígitos.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return void toast.error("Informe um e-mail válido.");
    if (onlyDigits(form.numero).length < 10)
      return void toast.error("Informe um telefone com DDD (10 ou 11 dígitos).");
    if (form.endereco.trim().length < 5)
      return void toast.error("Informe o endereço completo.");
    if (!form.servico) return void toast.error("Selecione o tipo de serviço.");
    if (!form.data) return void toast.error("Escolha a data preferencial.");

    createAppointment.mutate({
      nome: form.nome.trim(),
      cpf: onlyDigits(form.cpf),
      email: form.email.trim(),
      numero: onlyDigits(form.numero),
      endereco: form.endereco.trim(),
      servico: form.servico,
      data: form.data,
      periodo: form.periodo || null,
      observacoes: form.observacoes.trim() || null,
    });
  };

  if (success) {
    return (
      <div
        data-testid="booking-success-message"
        className="frost flex flex-col items-start gap-4 rounded-2xl p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-heading text-xl font-bold text-white">Agendamento recebido!</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Oi, {success.nome.split(" ")[0]}! Recebemos seu pedido de{" "}
            <strong className="text-white">{success.servico}</strong> para{" "}
            <strong className="text-white">{formatDateBR(success.data)}</strong>. Confirmaremos
            pelo WhatsApp <strong className="text-white">{maskPhone(success.numero)}</strong> em
            breve.
          </p>
        </div>
        <Button
          variant="outline"
          data-testid="booking-new-appointment-btn"
          onClick={() => {
            setSuccess(null);
            setForm(EMPTY_FORM);
          }}
        >
          Fazer novo agendamento
        </Button>
      </div>
    );
  }

  return (
    <form
      data-testid="booking-form-main"
      onSubmit={onSubmit}
      className="frost space-y-5 rounded-2xl p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome Completo</Label>
          <Input
            id="nome"
            value={form.nome}
            onChange={(e) => set({ nome: e.target.value })}
            placeholder="Ex: João da Silva"
            data-testid="booking-input-nome"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={form.cpf}
            onChange={(e) => set({ cpf: maskCPF(e.target.value) })}
            placeholder="000.000.000-00"
            inputMode="numeric"
            data-testid="booking-input-cpf"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero">Número (WhatsApp / Telefone)</Label>
          <Input
            id="numero"
            type="tel"
            value={form.numero}
            onChange={(e) => set({ numero: maskPhone(e.target.value) })}
            placeholder="(11) 99999-9999"
            inputMode="tel"
            data-testid="booking-input-numero"
            autoComplete="tel"
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="joao@email.com"
            data-testid="booking-input-email"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="endereco">Endereço Completo</Label>
          <Input
            id="endereco"
            value={form.endereco}
            onChange={(e) => set({ endereco: e.target.value })}
            placeholder="Rua, Nº, Bairro, Cidade - UF"
            data-testid="booking-input-endereco"
            autoComplete="street-address"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="servico">Tipo de Serviço</Label>
          <Select value={form.servico} onValueChange={(value) => set({ servico: value })}>
            <SelectTrigger id="servico" data-testid="booking-select-servico" className="w-full">
              <SelectValue>
                {(v) => {
                  const val = v as string;
                  if (!val) return "Selecione o serviço";
                  return SERVICO_OPTIONS.find((s) => s.value === val)?.label ?? val;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SERVICO_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data Preferencial</Label>
          <Input
            id="data"
            type="date"
            value={form.data}
            min={meta?.today}
            onChange={(e) => set({ data: e.target.value })}
            data-testid="booking-input-data"
            className="[color-scheme:dark]"
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="periodo">Período Preferencial (opcional)</Label>
          <Select value={form.periodo} onValueChange={(value) => set({ periodo: value })}>
            <SelectTrigger id="periodo" data-testid="booking-select-periodo" className="w-full">
              <SelectValue>
                {(v) => {
                  const val = v as string;
                  return val || "Qualquer período";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PERIODO_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacoes">Observações / Modelo do Aparelho (opcional)</Label>
          <Textarea
            id="observacoes"
            value={form.observacoes}
            onChange={(e) => set({ observacoes: e.target.value })}
            placeholder="Ex: Split 12.000 BTUs no 3º andar ou barulho no motor"
            rows={3}
            data-testid="booking-input-observacoes"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full transition-transform active:scale-[0.98]"
        data-testid="booking-submit-btn"
        disabled={createAppointment.isPending}
      >
        {createAppointment.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
          </>
        ) : (
          <>
            <CalendarCheck className="mr-2 h-5 w-5" /> Solicitar agendamento
          </>
        )}
      </Button>
    </form>
  );
}
