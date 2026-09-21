import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  LogOut,
  MessageCircle,
  Search,
  Snowflake,
  Trash2,
} from "lucide-react";

import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { formatDateBR, maskCPF, maskPhone, onlyDigits } from "@/lib/format";
import { SESSION_QUERY_KEY, endSession, fetchSessionUser } from "@/lib/session";
import type { Appointment, AppointmentStatus, SiteMeta } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterValue = "todos" | "instalacao" | "manutencao" | "pendente" | "atendido";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "instalacao", label: "Instalação" },
  { value: "manutencao", label: "Manutenção" },
  { value: "pendente", label: "Pendentes" },
  { value: "atendido", label: "Atendidos" },
];

function StatusBadge({ status }: { status: AppointmentStatus }) {
  if (status === "atendido") {
    return (
      <Badge className="border border-emerald-500/30 bg-[#064E3B] text-[#6EE7B7]">
        Atendido
      </Badge>
    );
  }
  return (
    <Badge className="border border-amber-500/30 bg-[#451A03] text-[#FCD34D]">Pendente</Badge>
  );
}

function StatCard(props: {
  testid: string;
  label: string;
  value: string | number;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <Card data-testid={props.testid} size="sm" className="frost bg-card/60">
      <CardContent className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 ${props.iconClass}`}
        >
          {props.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-wider text-slate-400">
            {props.label}
          </p>
          <p className="font-heading text-2xl font-bold text-white">{props.value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterValue>("todos");
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<Appointment | null>(null);

  const session = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSessionUser,
    retry: false,
  });
  const meta = useQuery({
    queryKey: ["meta"],
    queryFn: () => apiGet<SiteMeta>("/meta"),
    retry: false,
    staleTime: Infinity,
  });
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiGet<Appointment[]>("/appointments"),
    enabled: !!session.data,
  });

  const toggleStatus = useMutation({
    mutationFn: (appointment: Appointment) =>
      apiPatch<Appointment>(`/appointments/${appointment.id}`, {
        status: appointment.status === "pendente" ? "atendido" : "pendente",
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(
        `Agendamento de ${updated.nome.split(" ")[0]} marcado como ${
          updated.status === "atendido" ? "atendido" : "pendente"
        }.`,
      );
    },
    onError: () => toast.error("Não foi possível atualizar o status."),
  });

  const removeAppointment = useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/appointments/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setToDelete(null);
      toast.success("Agendamento excluído.");
    },
    onError: () => toast.error("Não foi possível excluir o agendamento."),
  });

  const appointments = appointmentsQuery.data ?? [];
  const today = meta.data?.today;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      if (filter === "instalacao" && appointment.servico !== "Instalação") return false;
      if (filter === "manutencao" && appointment.servico !== "Manutenção") return false;
      if (filter === "pendente" && appointment.status !== "pendente") return false;
      if (filter === "atendido" && appointment.status !== "atendido") return false;
      if (!q) return true;
      return [appointment.nome, appointment.cpf, appointment.numero, appointment.endereco].some(
        (field) => field.toLowerCase().includes(q),
      );
    });
  }, [appointments, filter, search]);

  if (session.isError) return <Navigate to="/login" replace />;

  if (session.isLoading) {
    return (
      <div
        data-testid="owner-dashboard-container"
        className="flex min-h-svh items-center justify-center bg-background"
      >
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const user = session.data;
  const pendentes = appointments.filter((a) => a.status === "pendente").length;
  const atendidos = appointments.filter((a) => a.status === "atendido").length;
  const hoje = today ? appointments.filter((a) => a.data === today).length : "—";

  const handleLogout = async () => {
    await endSession();
    navigate("/login", { replace: true });
  };

  return (
    <div data-testid="owner-dashboard-container" className="min-h-svh bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-cyan-500/15 bg-[#0B132B]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Snowflake className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-sm font-bold text-white">
                JS <span className="text-cyan-400">Climatização</span>
              </p>
              <p className="text-xs text-slate-400">Painel do Dono</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="hidden text-sm text-slate-400 sm:block">{user.email}</span>
            ) : null}
            <Link
              to="/"
              data-testid="dashboard-view-site-link"
              className={
                buttonVariants({ variant: "ghost", size: "sm" }) +
                " text-slate-300 hover:text-white"
              }
            >
              Ver site
            </Link>
            <Button
              variant="outline"
              size="sm"
              data-testid="owner-logout-btn"
              onClick={() => void handleLogout()}
              className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Stats */}
        <section aria-label="Resumo dos agendamentos" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            testid="stat-total"
            label="Total de Agendamentos"
            value={appointments.length}
            icon={<Calendar className="h-5 w-5 text-cyan-400" />}
            iconClass="text-cyan-400"
          />
          <StatCard
            testid="stat-pendentes"
            label="Agendamentos Pendentes"
            value={pendentes}
            icon={<Clock className="h-5 w-5 text-amber-400" />}
            iconClass="text-amber-400"
          />
          <StatCard
            testid="stat-atendidos"
            label="Agendamentos Atendidos"
            value={atendidos}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            iconClass="text-emerald-400"
          />
          <StatCard
            testid="stat-hoje"
            label="Agendados para Hoje"
            value={hoje}
            icon={<CalendarDays className="h-5 w-5 text-cyan-400" />}
            iconClass="text-cyan-400"
          />
        </section>

        {/* Filters */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
            <TabsList data-testid="dashboard-filter-tabs">
              {FILTERS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF, telefone ou endereço"
              data-testid="dashboard-search-input"
              className="pl-9"
            />
          </div>
        </section>

        {/* Content */}
        {appointmentsQuery.isError ? (
          <div
            data-testid="appointments-error-alert"
            className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-[#451A03]/60 p-4 text-sm text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Não foi possível carregar os agendamentos.</p>
              <p className="text-amber-300/80">Verifique sua conexão e recarregue a página.</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-testid="appointments-empty-state"
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 py-16 text-center"
          >
            <Calendar className="h-8 w-8 text-slate-500" />
            <p className="font-medium text-slate-300">Nenhum agendamento encontrado</p>
            <p className="text-sm text-slate-500">
              {search.trim() || filter !== "todos"
                ? "Ajuste a busca ou os filtros para ver mais resultados."
                : "Assim que os clientes agendarem pelo site, os pedidos aparecem aqui."}
            </p>
          </div>
        ) : (
          <div className="frost overflow-hidden rounded-2xl">
            <Table data-testid="dashboard-appointments-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((appointment) => (
                  <TableRow key={appointment.id} data-testid={`appointment-row-${appointment.id}`}>
                    <TableCell className="max-w-56">
                      <p className="font-medium text-white">{appointment.nome}</p>
                      <p className="truncate text-xs text-slate-400">{appointment.endereco}</p>
                      <p className="font-mono text-xs text-slate-500">
                        {maskCPF(appointment.cpf)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-200">
                        {maskPhone(appointment.numero)}
                      </p>
                      <p className="truncate text-xs text-slate-400">{appointment.email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-200">{appointment.servico}</p>
                      {appointment.periodo ? (
                        <p className="text-xs text-slate-400">{appointment.periodo}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-200">{formatDateBR(appointment.data)}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={appointment.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`btn-toggle-status-${appointment.id}`}
                          aria-label={
                            appointment.status === "pendente"
                              ? `Marcar agendamento de ${appointment.nome} como atendido`
                              : `Reabrir agendamento de ${appointment.nome}`
                          }
                          disabled={toggleStatus.isPending}
                          onClick={() => toggleStatus.mutate(appointment)}
                        >
                          {appointment.status === "pendente" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-400" />
                          )}
                          <span className="ml-1.5 hidden xl:inline">
                            {appointment.status === "pendente" ? "Marcar atendido" : "Reabrir"}
                          </span>
                        </Button>
                        <a
                          href={`https://wa.me/55${onlyDigits(appointment.numero)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid={`appointment-whatsapp-${appointment.id}`}
                          aria-label={`Falar com ${appointment.nome} no WhatsApp`}
                          className={
                            buttonVariants({ variant: "ghost", size: "icon-sm" }) +
                            " text-emerald-400 hover:text-emerald-300"
                          }
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          data-testid={`btn-delete-appointment-${appointment.id}`}
                          aria-label={`Excluir agendamento de ${appointment.nome}`}
                          className="text-red-400 hover:text-red-300"
                          onClick={() => setToDelete(appointment)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Delete confirmation */}
      <Dialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
      >
        <DialogContent data-testid="delete-appointment-dialog">
          <DialogHeader>
            <DialogTitle>Excluir agendamento</DialogTitle>
            <DialogDescription>
              Excluir o agendamento de {toDelete?.nome ?? ""}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" data-testid="delete-appointment-cancel-btn" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              data-testid="delete-appointment-confirm-btn"
              disabled={removeAppointment.isPending}
              onClick={() => toDelete && removeAppointment.mutate(toDelete.id)}
            >
              {removeAppointment.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
