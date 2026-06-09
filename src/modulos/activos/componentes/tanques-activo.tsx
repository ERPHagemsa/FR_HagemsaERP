"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { IconGasStation, IconPlus, IconTrash } from "@tabler/icons-react";

import { extraerMensajeError } from "@/compartido/api";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { cn } from "@/compartido/utilidades";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import {
  useCrearTanqueActivoMutation,
  useEliminarTanqueActivoMutation,
} from "../servicios/activos-queries";
import type { TanqueActivo, TipoTanqueActivo } from "../tipos/activo.tipos";

type Props = {
  codigo: string;
  tanques: TanqueActivo[];
  editable?: boolean;
};

export function TanquesActivo({ codigo, tanques, editable = true }: Props) {
  const router = useRouter();
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);
  const [tipoTanque, setTipoTanque] = React.useState<TipoTanqueActivo>("DIESEL");
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const crearTanqueMutation = useCrearTanqueActivoMutation(codigo);
  const eliminarTanqueMutation = useEliminarTanqueActivoMutation(codigo);

  const totalDiesel = sumarCapacidad(tanques, "DIESEL");
  const totalUrea = sumarCapacidad(tanques, "UREA");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const tipoTanqueSeleccionado =
      formData.get("tipoTanque") === "UREA" ? "UREA" : "DIESEL";
    const capacidad = Number(formData.get("capacidad"));
    const orden = Number(formData.get("orden") || 1);
    const observacion = String(formData.get("observacion") ?? "").trim();

    setIsSaving(true);

    try {
      await crearTanqueMutation.mutateAsync({
        tipoTanque: tipoTanqueSeleccionado,
        capacidad,
        orden,
        observacion: observacion || undefined,
      });

      form.reset();
      setTipoTanque("DIESEL");
      setMostrarFormulario(false);
      toast.success("Tanque registrado correctamente.");
      router.refresh();
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo registrar el tanque."));
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete(tanque: TanqueActivo) {
    const confirmado = window.confirm(
      `Quieres eliminar el tanque ${formatear(tanque.tipoTanque).toLowerCase()} de ${formatearNumero(tanque.capacidad)} ${formatear(tanque.unidadMedida).toLowerCase()}?`
    );

    if (!confirmado) return;

    setDeletingId(tanque.id);

    try {
      await eliminarTanqueMutation.mutateAsync(tanque.id);
      toast.success("Tanque eliminado correctamente.");
      router.refresh();
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudo eliminar el tanque."));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Tanques del activo</p>
          <p className="text-sm text-muted-foreground">
            {tanques.length} tanque{tanques.length === 1 ? "" : "s"} registrado
            {tanques.length === 1 ? "" : "s"}
          </p>
        </div>
        {editable ? (
          <Button
            type="button"
            onClick={() => setMostrarFormulario((value) => !value)}
          >
            <IconPlus />
            Nuevo tanque
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ResumenTanque
          label="Diesel"
          total={totalDiesel}
          unidad="galones"
          tipo="DIESEL"
        />
        <ResumenTanque label="Urea" total={totalUrea} unidad="litros" tipo="UREA" />
      </div>

      {editable && mostrarFormulario ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TipoTanqueSelector tipoTanque={tipoTanque} onChange={setTipoTanque} />

            <Field
              label="Capacidad"
              min="0.01"
              name="capacidad"
              required
              step="0.01"
              type="number"
            />
            <UnidadTanqueDisplay tipoTanque={tipoTanque} />
            <Field label="Orden" min="1" name="orden" step="1" type="number" />
          </div>
          <Field
            label="Observacion"
            name="observacion"
            placeholder="Tanque principal, tanque auxiliar, etc."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMostrarFormulario(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar tanque"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Observacion</TableHead>
              <TableHead>Registro</TableHead>
              {editable ? <TableHead>Accion</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tanques.map((tanque) => (
              <TableRow key={tanque.id}>
                <TableCell>{tanque.orden}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      tanque.tipoTanque === "DIESEL"
                        ? "bg-primary text-primary-foreground"
                        : "bg-sky-600 text-white"
                    }
                  >
                    {formatear(tanque.tipoTanque)}
                  </Badge>
                </TableCell>
                <TableCell>{formatearNumero(tanque.capacidad)}</TableCell>
                <TableCell>{formatear(tanque.unidadMedida)}</TableCell>
                <TableCell>{tanque.observacion ?? "-"}</TableCell>
                <TableCell>{formatearFecha(tanque.createdAt)}</TableCell>
                {editable ? (
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(tanque)}
                      disabled={deletingId === tanque.id}
                    >
                      <IconTrash className="size-4" />
                      {deletingId === tanque.id ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
            {!tanques.length ? (
              <TableRow>
                <TableCell
                  colSpan={editable ? 7 : 6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay tanques registrados para este activo.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ResumenTanque({
  label,
  total,
  unidad,
  tipo,
}: {
  label: string;
  total: number;
  unidad: string;
  tipo: TipoTanqueActivo;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <IconGasStation className="size-5" />
        </span>
        <p className="font-semibold">{label}</p>
      </div>
      <p className="text-2xl font-semibold">{formatearNumero(total)}</p>
      <p className="text-sm text-muted-foreground">
        {unidad} registrados en tanque{tipo === "DIESEL" ? "s diesel" : "s de urea"}
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`tanque-${name}`}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input id={`tanque-${name}`} name={name} required={required} {...props} />
    </div>
  );
}

function TipoTanqueSelector({
  tipoTanque,
  onChange,
}: {
  tipoTanque: TipoTanqueActivo;
  onChange: (tipo: TipoTanqueActivo) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>
        Tipo tanque <span className="text-destructive">*</span>
      </Label>
      <input name="tipoTanque" type="hidden" value={tipoTanque} readOnly />
      <div className="grid h-9 grid-cols-2 rounded-lg border border-input bg-background p-0.5">
        {(["DIESEL", "UREA"] as TipoTanqueActivo[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => onChange(tipo)}
            className={cn(
              "rounded-md px-3 text-sm font-medium text-muted-foreground transition",
              tipoTanque === tipo && "bg-primary text-primary-foreground"
            )}
          >
            {tipo === "DIESEL" ? "Diesel" : "Urea"}
          </button>
        ))}
      </div>
    </div>
  );
}

function UnidadTanqueDisplay({ tipoTanque }: { tipoTanque: TipoTanqueActivo }) {
  const unidad = tipoTanque === "UREA" ? "Litros" : "Galones";

  return (
    <div className="grid gap-2">
      <Label>Unidad</Label>
      <div
        key={unidad}
        className="flex h-9 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm font-medium text-foreground"
      >
        {unidad}
      </div>
    </div>
  );
}

function sumarCapacidad(tanques: TanqueActivo[], tipo: TipoTanqueActivo) {
  return tanques
    .filter((tanque) => tanque.tipoTanque === tipo)
    .reduce((total, tanque) => total + tanque.capacidad, 0);
}

function formatear(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatearNumero(value: number) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
