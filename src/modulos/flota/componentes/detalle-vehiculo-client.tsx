"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Search,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { cn } from "@/compartido/utilidades/utils";
import { FlotaPageHeader } from "./flota-page-header";
import { asignarContrato, retirarContrato } from "../servicios/flota-api";
import type { VehiculoFlota } from "../tipos/flota.tipos";
import type { ContratoDisponibleFlota, ReferenciaFlota } from "../tipos/flota.tipos";
import { parseRef } from "./flota-normalizadores";

type MensajeOperacion = { descripcion: string; tipo: "success" | "error" } | null;

type DetalleVehiculoClientProps = {
  contratosDisponibles: ContratoDisponibleFlota[];
  cuentasDisponibles: ReferenciaFlota[];
  initialData: VehiculoFlota | null;
  id: string;
};

function formatearFecha(fecha?: string | null) {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(d);
}

function DatoVer({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 wrap-break-word font-medium">{value || "-"}</dd>
    </div>
  );
}

function EstadoUnidadBadge({ estado }: { estado?: string | null }) {
  const operativo = estado === "OPERATIVO";

  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {operativo ? (
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
      ) : (
        <XCircle data-icon="inline-start" className="text-destructive" />
      )}
      {estado || "SIN ESTADO"}
    </Badge>
  );
}

function BusquedaCombobox<T>({
  items,
  value,
  onChange,
  disabled,
  inputId,
  placeholder,
  getKey,
  getLabel,
  isSelected,
  matches,
  renderOption,
}: {
  items: T[];
  value: T | null;
  onChange: (item: T | null) => void;
  disabled?: boolean;
  inputId: string;
  placeholder: string;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  isSelected: (item: T) => boolean;
  matches: (item: T, query: string) => boolean;
  renderOption: (item: T) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    return !q || matches(item, q);
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

  function selectItem(item: T) {
    onChange(item);
    setQuery("");
    setOpen(false);
  }

  const displayText = value ? getLabel(value) : "";

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
          id={inputId}
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={displayText || placeholder}
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
            aria-label="Limpiar seleccion"
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
                    {filtered.map((item) => {
                      const selected = isSelected(item);

                      return (
                        <li
                          key={getKey(item)}
                          onMouseDown={() => selectItem(item)}
                          className={cn(
                            "flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                            selected && "bg-accent/70 font-medium",
                          )}
                        >
                          {renderOption(item)}
                          {selected ? (
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
  cuentasDisponibles,
  initialData,
  id,
}: DetalleVehiculoClientProps) {
  const router = useRouter();
  const [vehiculo, setVehiculo] = useState<VehiculoFlota | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeOperacion>(null);
  const [contratoSeleccionado, setContratoSeleccionado] =
    useState<ContratoDisponibleFlota | null>(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<ReferenciaFlota | null>(null);

  const asignaciones = vehiculo?.asignaciones ?? [];
  const codigosAsignados = new Set(
    asignaciones
      .map((a) => parseRef(a.contrato)?.codigo)
      .filter((codigo): codigo is string => Boolean(codigo)),
  );
  const contratosParaAgregar = contratosDisponibles.filter(
    (contrato) => !codigosAsignados.has(contrato.codigo),
  );

  function onChangeContrato(contrato: ContratoDisponibleFlota | null) {
    setContratoSeleccionado(contrato);
    if (contrato) {
      setCuentaSeleccionada(contrato.cuenta);
    }
  }

  function onChangeCuenta(cuenta: ReferenciaFlota | null) {
    setCuentaSeleccionada(cuenta);
    if (contratoSeleccionado && contratoSeleccionado.cuenta?.codigo !== cuenta?.codigo) {
      setContratoSeleccionado(null);
    }
  }

  async function onSave(event: React.SyntheticEvent) {
    event.preventDefault();
    if (!vehiculo || !cuentaSeleccionada) return;

    setLoading(true);
    setMensaje(null);
    const unidadId = vehiculo.id ?? id;
    const result = await asignarContrato(unidadId, contratoSeleccionado, cuentaSeleccionada);

    if (result.success) {
      setVehiculo((actual) =>
        actual
          ? {
              ...actual,
              asignaciones: [
                ...(actual.asignaciones ?? []),
                { contrato: contratoSeleccionado, cuenta: cuentaSeleccionada },
              ],
            }
          : actual,
      );
      setMensaje({
        tipo: "success",
        descripcion: contratoSeleccionado
          ? `Contrato ${contratoSeleccionado.codigo} asignado exitosamente.`
          : `Cuenta ${cuentaSeleccionada.codigo} asignada exitosamente.`,
      });
      setContratoSeleccionado(null);
      setCuentaSeleccionada(null);
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
      setVehiculo((actual) => (actual ? { ...actual, asignaciones: [] } : actual));
      setMensaje({
        tipo: "success",
        descripcion: "Todos los contratos fueron retirados exitosamente.",
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
  const tieneContratos = asignaciones.length > 0;

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

      <FlotaPageHeader
        title={vehiculo.placa ?? vehiculo.placaRodaje ?? unidadId}
        description={`${vehiculo.marca || "Sin marca"} · ${vehiculo.modelo || "Sin modelo"}`}
        meta={<EstadoUnidadBadge estado={vehiculo.estadoOperativo} />}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft data-icon="inline-start" />
              Volver
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/flota/unidades/${encodeURIComponent(unidadId)}/auditoria`}>
                <TrendingUp data-icon="inline-start" />
                Auditar
              </Link>
            </Button>
            {tieneContratos ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void onRetire()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <XCircle data-icon="inline-start" />
                )}
                Retirar todos los contratos
              </Button>
            ) : null}
            <Button
              type="submit"
              form="contrato-form"
              size="sm"
              disabled={loading || !cuentaSeleccionada}
            >
              {loading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <CheckCircle2 data-icon="inline-start" />
              )}
              Asignar
            </Button>
          </>
        }
      />

      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-2 lg:grid-cols-4">
        <DatoVer label="Placa" value={vehiculo.placa || vehiculo.placaRodaje || "-"} />
        <DatoVer label="Codigo" value={vehiculo.codigo} />
        <DatoVer label="Tipo activo" value={vehiculo.tipoActivo} />
        <DatoVer label="Estado registro" value={vehiculo.estadoRegistro ?? vehiculo.estadoActivo} />
        <DatoVer label="Marca" value={vehiculo.marca ?? vehiculo.vehiculo?.marca} />
        <DatoVer label="Modelo" value={vehiculo.modelo ?? vehiculo.vehiculo?.modelo} />
        <DatoVer label="Ano Fab." value={vehiculo.anioFabricacion} />
        <DatoVer label="Color" value={vehiculo.color} />
        <DatoVer label="Serie Chasis" value={vehiculo.serieChasis} />
        <DatoVer label="Serie Motor" value={vehiculo.serieMotor} />
        <DatoVer label="Carroceria" value={vehiculo.carroceria ?? vehiculo.vehiculo?.carroceria} />
        <DatoVer label="Ubicacion" value={vehiculo.ubicacion} />
      </dl>

      <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Asignacion contractual</h2>
          <p className="text-sm leading-5 text-muted-foreground">
            Una unidad puede tener varios contratos simultaneos. Agrega o retira las asignaciones.
          </p>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <div className="flex flex-col gap-3">
            {asignaciones.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Esta unidad no tiene contratos asignados.
              </div>
            ) : (
              asignaciones.map((asignacion, index) => {
                const contrato = parseRef(asignacion.contrato);
                const cuenta = parseRef(asignacion.cuenta);

                return (
                  <dl
                    key={contrato?.id ?? index}
                    className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-2"
                  >
                    <DatoVer
                      label="Contrato"
                      value={contrato ? `${contrato.codigo} - ${contrato.nombre}` : "-"}
                    />
                    <DatoVer
                      label="Cuenta"
                      value={cuenta ? `${cuenta.codigo} - ${cuenta.nombre}` : "Sin cuenta"}
                    />
                    <DatoVer label="Vigencia inicio" value={formatearFecha(asignacion.fechaInicio)} />
                    <DatoVer label="Vigencia fin" value={formatearFecha(asignacion.fechaFin)} />
                  </dl>
                );
              })
            )}
          </div>

          <form id="contrato-form" onSubmit={(event) => void onSave(event)}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="cuenta-search" className="text-sm font-medium">
                  Cuenta <span className="text-destructive">*</span>
                </label>
                <BusquedaCombobox<ReferenciaFlota>
                  items={cuentasDisponibles}
                  value={cuentaSeleccionada}
                  onChange={onChangeCuenta}
                  disabled={loading}
                  inputId="cuenta-search"
                  placeholder="Buscar cuenta por codigo o nombre"
                  getKey={(cuenta) => cuenta.id}
                  getLabel={(cuenta) => `${cuenta.codigo} - ${cuenta.nombre}`}
                  isSelected={(cuenta) => cuenta.codigo === cuentaSeleccionada?.codigo}
                  matches={(cuenta, q) =>
                    cuenta.codigo.toLowerCase().includes(q) ||
                    cuenta.nombre.toLowerCase().includes(q)
                  }
                  renderOption={(cuenta) => (
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs text-muted-foreground">
                        {cuenta.codigo}
                      </span>
                      <span className="truncate">{cuenta.nombre}</span>
                    </div>
                  )}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="contrato-search" className="text-sm font-medium">
                  Contrato (opcional)
                </label>
                <BusquedaCombobox<ContratoDisponibleFlota>
                  items={contratosParaAgregar}
                  value={contratoSeleccionado}
                  onChange={onChangeContrato}
                  disabled={loading}
                  inputId="contrato-search"
                  placeholder="Buscar contrato por codigo o nombre"
                  getKey={(contrato) => contrato.id}
                  getLabel={(contrato) => `${contrato.codigo} - ${contrato.nombre}`}
                  isSelected={(contrato) => contrato.codigo === contratoSeleccionado?.codigo}
                  matches={(contrato, q) =>
                    contrato.codigo.toLowerCase().includes(q) ||
                    contrato.nombre.toLowerCase().includes(q) ||
                    Boolean(contrato.cuenta?.nombre?.toLowerCase().includes(q))
                  }
                  renderOption={(contrato) => (
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs text-muted-foreground">
                        {contrato.codigo}
                      </span>
                      <span className="truncate">{contrato.nombre}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {contrato.cuenta?.nombre || "Sin cuenta asociada"}
                      </span>
                    </div>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {contratoSeleccionado
                    ? "La cuenta se actualizo segun el contrato seleccionado."
                    : "Si seleccionas un contrato, la cuenta se completa automaticamente."}
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
