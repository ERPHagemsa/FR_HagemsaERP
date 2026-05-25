"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { IconGasStation, IconPlus, IconTrash } from "@tabler/icons-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades";
import {
  crearTanquePorCodigo,
  eliminarTanquePorCodigo,
} from "../servicios/activos-api";
import type { TanqueActivo, TipoTanqueActivo } from "../tipos/activo.tipos";

type Props = {
  codigo: string;
  tanques: TanqueActivo[];
  editable?: boolean;
};

const tiposTanque: TipoTanqueActivo[] = ["DIESEL", "UREA"];

export function TanquesActivo({ codigo, tanques, editable = true }: Props) {
  const router = useRouter();
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);
  const [tipoTanque, setTipoTanque] = React.useState<TipoTanqueActivo>("DIESEL");
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const totalDiesel = sumarCapacidad(tanques, "DIESEL");
  const totalUrea = sumarCapacidad(tanques, "UREA");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const capacidad = Number(formData.get("capacidad"));
    const orden = Number(formData.get("orden") || 1);
    const observacion = String(formData.get("observacion") ?? "").trim();

    setMessage(null);
    setIsSaving(true);

    try {
      await crearTanquePorCodigo(codigo, {
        tipoTanque,
        capacidad,
        orden,
        observacion: observacion || undefined,
      });

      form.reset();
      setTipoTanque("DIESEL");
      setMostrarFormulario(false);
      setMessage({
        type: "success",
        text: "Tanque registrado correctamente.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el tanque.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete(tanque: TanqueActivo) {
    const confirmado = window.confirm(
      `Quieres eliminar el tanque ${formatear(tanque.tipoTanque).toLowerCase()} de ${formatearNumero(tanque.capacidad)} ${formatear(tanque.unidadMedida).toLowerCase()}?`
    );

    if (!confirmado) return;

    setMessage(null);
    setDeletingId(tanque.id);

    try {
      await eliminarTanquePorCodigo(codigo, tanque.id);
      setMessage({
        type: "success",
        text: "Tanque eliminado correctamente.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el tanque.",
      });
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

      {editable && message ? (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          )}
        >
          {message.text}
        </div>
      ) : null}

      {editable && mostrarFormulario ? (
        <form
          onSubmit={onSubmit}
          className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-foreground">
                Tipo tanque <span className="text-destructive">*</span>
              </span>
              <select
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                name="tipoTanque"
                onChange={(event) =>
                  setTipoTanque(event.target.value as TipoTanqueActivo)
                }
                value={tipoTanque}
              >
                {tiposTanque.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {formatear(tipo)}
                  </option>
                ))}
              </select>
            </label>

            <Field
              label="Capacidad"
              min="0.01"
              name="capacidad"
              required
              step="0.01"
              type="number"
            />
            <Field
              label="Unidad"
              name="unidadMedida"
              readOnly
              value={tipoTanque === "DIESEL" ? "GALON" : "LITRO"}
            />
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
                        ? "bg-red-600 text-white"
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
        <span className="flex size-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-600">
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
