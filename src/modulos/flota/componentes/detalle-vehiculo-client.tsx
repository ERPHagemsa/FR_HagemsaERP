"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  Truck,
  Undo2,
  X,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  Avatar,
  AvatarFallback,
} from "@/compartido/componentes/ui/avatar";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { cn } from "@/compartido/utilidades/utils";
import { asignarContrato, retirarContrato } from "../servicios/flota-api";
import type { VehiculoFlota } from "../tipos/flota.tipos";
import type { ContratoDisponibleFlota } from "../tipos/flota.tipos";
import { parseRef } from "./flota-normalizadores";

type MensajeOperacion = { descripcion: string; tipo: "success" | "error" } | null;

type DetalleVehiculoClientProps = {
  contratosDisponibles: ContratoDisponibleFlota[];
  initialData: VehiculoFlota | null;
  id: string;
};

function DatoVer({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value || "-"}</dd>
    </div>
  );
}

function EstadoUnidadBadge({ estado }: { estado?: string | null }) {
  const operativo = estado === "OPERATIVO";

  return (
    <Badge
      variant={operativo ? "outline" : "destructive"}
      className="h-6 gap-1.5 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {operativo ? (
        <CheckCircle2 className="text-emerald-500" />
      ) : (
        <XCircle className="text-destructive" />
      )}
      {estado || "SIN ESTADO"}
    </Badge>
  );
}

function ContratoCombobox({
  contratosDisponibles,
  value,
  onChange,
  disabled,
}: {
  contratosDisponibles: ContratoDisponibleFlota[];
  value: ContratoDisponibleFlota | null;
  onChange: (contrato: ContratoDisponibleFlota | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const filtered = contratosDisponibles.filter((contrato) => {
    const q = query.trim().toLowerCase();

    return (
      !q ||
      contrato.codigo.toLowerCase().includes(q) ||
      contrato.nombre.toLowerCase().includes(q) ||
      contrato.cuenta?.nombre?.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handler(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const update = () => setRect(containerRef.current?.getBoundingClientRect() ?? null);
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  function selectItem(contrato: ContratoDisponibleFlota) {
    onChange(contrato);
    setQuery("");
    setOpen(false);
  }

  const displayText = value ? `${value.codigo} - ${value.nombre}` : "";

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={cn(
          "flex h-9 w-full items-center rounded-4xl border border-input bg-input/30 text-foreground transition-colors",
          open && "border-ring ring-[3px] ring-ring/50",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
        <input
          id="contrato-search"
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={displayText || "Buscar contrato por codigo o nombre"}
          value={open ? query : displayText}
          onFocus={() => {
            setQuery("");
            setOpen(true);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          className="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        {value && !disabled ? (
          <button
            type="button"
            aria-label="Limpiar contrato"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="mr-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
        <ChevronDown
          className={cn(
            "mr-3 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </div>

      {open && rect
        ? createPortal(
            <div
              style={{
                position: "fixed",
                left: rect.left,
                top: rect.bottom + 6,
                width: rect.width,
                zIndex: 9999,
              }}
            >
              <div className="overflow-hidden rounded-2xl bg-popover p-1 text-popover-foreground shadow-2xl ring-1 ring-foreground/5">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-muted-foreground">
                    Sin resultados para &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto">
                    {filtered.map((contrato) => {
                      const isSelected = value?.codigo === contrato.codigo;

                      return (
                        <li
                          key={contrato.id}
                          onMouseDown={() => selectItem(contrato)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent/70 font-medium",
                          )}
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="font-mono text-xs text-muted-foreground">
                              {contrato.codigo}
                            </span>
                            <span className="truncate">{contrato.nombre}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {contrato.cuenta?.nombre || "Sin cuenta asociada"}
                            </span>
                          </div>
                          {isSelected ? (
                            <Check className="size-4 shrink-0 text-primary" />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default function DetalleVehiculoClient({
  contratosDisponibles,
  initialData,
  id,
}: DetalleVehiculoClientProps) {
  const router = useRouter();
  const [vehiculo, setVehiculo] = useState<VehiculoFlota | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeOperacion>(null);

  const contratoInicial = parseRef(initialData?.contrato);
  const itemInicial = contratoInicial
    ? contratosDisponibles.find((contrato) => contrato.codigo === contratoInicial.codigo) ??
      null
    : null;
  const [contratoSeleccionado, setContratoSeleccionado] =
    useState<ContratoDisponibleFlota | null>(itemInicial);

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!vehiculo || !contratoSeleccionado) return;

    setLoading(true);
    setMensaje(null);
    const unidadId = vehiculo.id ?? id;
    const result = await asignarContrato(
      unidadId,
      contratoSeleccionado,
      contratoSeleccionado.cuenta,
    );

    if (result.success) {
      setVehiculo((actual) =>
        actual
          ? {
              ...actual,
              contrato: contratoSeleccionado,
              cuenta: contratoSeleccionado.cuenta,
            }
          : actual,
      );
      setMensaje({
        tipo: "success",
        descripcion: `Contrato ${contratoSeleccionado.codigo} asignado exitosamente.`,
      });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", descripcion: result.mensaje });
    }

    setLoading(false);
  }

  async function onRetire() {
    if (!vehiculo) return;

    setLoading(true);
    setMensaje(null);
    const unidadId = vehiculo.id ?? id;
    const result = await retirarContrato(unidadId);

    if (result.success) {
      setVehiculo((actual) =>
        actual
          ? {
              ...actual,
              contrato: null,
              cuenta: null,
            }
          : actual,
      );
      setContratoSeleccionado(null);
      setMensaje({
        tipo: "success",
        descripcion: "Contrato retirado exitosamente.",
      });
      router.refresh();
    } else {
      setMensaje({ tipo: "error", descripcion: result.mensaje });
    }

    setLoading(false);
  }

  if (!vehiculo) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Vehiculo no encontrado</AlertTitle>
        <AlertDescription>
          Servicio de Flota no disponible o placa incorrecta.
        </AlertDescription>
      </Alert>
    );
  }

  const unidadId = vehiculo.id ?? id;
  const contratoActual = parseRef(vehiculo.contrato);
  const cuentaActual = parseRef(vehiculo.cuenta);
  const tieneContrato = Boolean(contratoActual?.id);

  return (
    <>
      {mensaje ? (
        <Alert variant={mensaje.tipo === "error" ? "destructive" : "default"}>
          <AlertTitle>
            {mensaje.tipo === "error" ? "No se pudo completar" : "Operacion completada"}
          </AlertTitle>
          <AlertDescription>{mensaje.descripcion}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar size="lg" className="rounded-lg after:rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              <Truck className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="break-words text-2xl font-semibold tracking-normal">
                {vehiculo.placa ?? vehiculo.placaRodaje ?? unidadId}
              </h1>
              <EstadoUnidadBadge estado={vehiculo.estadoOperativo} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {vehiculo.marca || "Sin marca"} - {vehiculo.modelo || "Sin modelo"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <Undo2 />
            Volver
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/flota/unidades/${encodeURIComponent(unidadId)}/auditoria`}>
              <BarChart3 />
              Auditar
            </Link>
          </Button>
          {tieneContrato ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => void onRetire()}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <XCircle />}
              Retirar contrato
            </Button>
          ) : null}
          <Button
            type="submit"
            form="contrato-form"
            size="sm"
            disabled={loading || !contratoSeleccionado}
          >
            {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            Asignar contrato
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border border-border bg-card p-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <DatoVer label="Placa" value={vehiculo.placa || vehiculo.placaRodaje || "-"} />
        <DatoVer label="Codigo" value={vehiculo.codigo} />
        <DatoVer label="Tipo activo" value={vehiculo.tipoActivo} />
        <DatoVer label="Estado registro" value={vehiculo.estadoRegistro ?? vehiculo.estadoActivo} />
        <DatoVer label="Marca" value={vehiculo.marca ?? vehiculo.vehiculo?.marca} />
        <DatoVer label="Modelo" value={vehiculo.modelo ?? vehiculo.vehiculo?.modelo} />
        <DatoVer label="Año Fab." value={vehiculo.anioFabricacion} />
        <DatoVer label="Color" value={vehiculo.color} />
        <DatoVer label="Serie Chasis" value={vehiculo.serieChasis} />
        <DatoVer label="Serie Motor" value={vehiculo.serieMotor} />
        <DatoVer label="Carroceria" value={vehiculo.carroceria ?? vehiculo.vehiculo?.carroceria} />
        <DatoVer label="Ubicacion" value={vehiculo.ubicacion} />
      </dl>

      <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">Asignacion contractual</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifica el contrato asociado y revisa la cuenta vinculada.
          </p>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <DatoVer
              label="Contrato actual"
              value={
                contratoActual
                  ? `${contratoActual.codigo} - ${contratoActual.nombre}`
                  : "Sin contrato"
              }
            />
            <DatoVer
              label="Cuenta asociada"
              value={
                cuentaActual
                  ? `${cuentaActual.codigo} - ${cuentaActual.nombre}`
                  : "Sin cuenta"
              }
            />
            <DatoVer label="Ultima actualizacion" value={vehiculo.updatedAt} />
            <DatoVer label="ID" value={vehiculo.id} />
          </dl>

          <form id="contrato-form" onSubmit={(event) => void onSave(event)}>
            <div className="grid gap-2">
              <label htmlFor="contrato-search" className="text-sm font-medium">
                Contrato a asignar
              </label>
              <ContratoCombobox
                contratosDisponibles={contratosDisponibles}
                value={contratoSeleccionado}
                onChange={setContratoSeleccionado}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {contratoSeleccionado
                  ? `Cuenta asociada: ${
                      contratoSeleccionado.cuenta?.nombre || "Sin cuenta asociada"
                    }`
                  : "Selecciona un contrato para habilitar la asignacion."}
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
