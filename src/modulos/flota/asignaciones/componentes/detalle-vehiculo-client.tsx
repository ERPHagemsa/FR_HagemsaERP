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
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades/utils";
import { FlotaPageHeader } from "../../compartido/componentes/flota-page-header";
import {
  asignarContrato,
  obtenerUnidadPorId,
  retirarAsignacion,
  retirarContrato,
} from "../servicios/asignaciones-api";
import type { VehiculoFlota } from "../tipos/asignaciones.tipos";
import type { ContratoDisponibleFlota, ReferenciaFlota } from "../tipos/asignaciones.tipos";
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
  const [retirandoId, setRetirandoId] = useState<number | null>(null);
  const [retirandoTodas, setRetirandoTodas] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeOperacion>(null);
  const [contratoSeleccionado, setContratoSeleccionado] =
    useState<ContratoDisponibleFlota | null>(null);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<ReferenciaFlota | null>(null);
  const [confirmarUna, setConfirmarUna] = useState<{ id: number; detalle?: string } | null>(
    null,
  );
  const [confirmarTodas, setConfirmarTodas] = useState(false);

  const asignaciones = vehiculo?.asignaciones ?? [];
  const codigosAsignados = new Set(
    asignaciones
      .map((a) => parseRef(a.contrato)?.codigo)
      .filter((codigo): codigo is string => Boolean(codigo)),
  );
  const contratosParaAgregar = contratosDisponibles.filter(
    (contrato) => !codigosAsignados.has(contrato.codigo),
  );
  const unidadIdActual = vehiculo?.id ?? id;

  // Tras una mutacion, recargamos la unidad para reflejar ids reales y vigencias.
  async function refrescarVehiculo() {
    const actualizado = await obtenerUnidadPorId(unidadIdActual);
    if (actualizado) setVehiculo(actualizado);
    router.refresh();
  }

  function limpiarSeleccion() {
    setContratoSeleccionado(null);
    setCuentaSeleccionada(null);
  }

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
    const result = await asignarContrato(
      unidadIdActual,
      contratoSeleccionado,
      cuentaSeleccionada,
    );

    if (result.success) {
      setMensaje({
        tipo: "success",
        descripcion: contratoSeleccionado
          ? `Contrato ${contratoSeleccionado.codigo} asignado exitosamente.`
          : `Cuenta ${cuentaSeleccionada.codigo} asignada exitosamente.`,
      });
      limpiarSeleccion();
      setMostrarFormulario(false);
      await refrescarVehiculo();
    } else {
      setMensaje({ tipo: "error", descripcion: result.mensaje });
    }

    setLoading(false);
  }

  function pedirConfirmacionUna(asignacionId?: number, detalle?: string) {
    if (asignacionId == null) return;
    setConfirmarUna({ id: asignacionId, detalle });
  }

  async function confirmarRetirarUna() {
    if (!vehiculo || !confirmarUna) return;
    const asignacionId = confirmarUna.id;
    setConfirmarUna(null);

    setRetirandoId(asignacionId);
    setMensaje(null);
    const result = await retirarAsignacion(unidadIdActual, asignacionId);

    if (result.success) {
      setMensaje({ tipo: "success", descripcion: "Asignacion retirada exitosamente." });
      await refrescarVehiculo();
    } else {
      setMensaje({ tipo: "error", descripcion: result.mensaje });
    }

    setRetirandoId(null);
  }

  async function confirmarRetirarTodas() {
    if (!vehiculo) return;
    setConfirmarTodas(false);

    setRetirandoTodas(true);
    setMensaje(null);
    const result = await retirarContrato(unidadIdActual);

    if (result.success) {
      setMensaje({
        tipo: "success",
        descripcion: "Todas las asignaciones fueron retiradas exitosamente.",
      });
      await refrescarVehiculo();
    } else {
      setMensaje({ tipo: "error", descripcion: result.mensaje });
    }

    setRetirandoTodas(false);
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
  const ocupado = loading || retirandoTodas || retirandoId !== null;

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
              <Link href={`/flota/unidades/${encodeURIComponent(unidadId)}/historial`}>
                <TrendingUp data-icon="inline-start" />
                Auditar
              </Link>
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
        <DatoVer label="Año Fab." value={vehiculo.anioFabricacion} />
        <DatoVer label="Color" value={vehiculo.color} />
        <DatoVer label="Serie Chasis" value={vehiculo.serieChasis} />
        <DatoVer label="Serie Motor" value={vehiculo.serieMotor} />
        <DatoVer label="Carroceria" value={vehiculo.carroceria ?? vehiculo.vehiculo?.carroceria} />
        <DatoVer label="Ubicacion" value={vehiculo.ubicacion} />
      </dl>

      <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">Asignacion contractual</h2>
            <p className="text-sm leading-5 text-muted-foreground">
              {asignaciones.length} asignacion{asignaciones.length === 1 ? "" : "es"} vigente
              {asignaciones.length === 1 ? "" : "s"}. Una unidad puede tener varias.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tieneContratos ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmarTodas(true)}
                disabled={ocupado}
              >
                {retirandoTodas ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <XCircle data-icon="inline-start" />
                )}
                Retirar todas
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant={mostrarFormulario ? "outline" : "default"}
              onClick={() => {
                setMostrarFormulario((valor) => !valor);
                limpiarSeleccion();
              }}
              disabled={ocupado}
            >
              {mostrarFormulario ? (
                <>
                  <X data-icon="inline-start" />
                  Cancelar
                </>
              ) : (
                <>
                  <Plus data-icon="inline-start" />
                  Agregar asignacion
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-5">
          {mostrarFormulario ? (
            <form
              onSubmit={(event) => void onSave(event)}
              className="grid gap-4 rounded-xl border border-border bg-muted/20 p-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
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
                    Contrato
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
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {contratoSeleccionado
                  ? "Cuenta actualizada segun el contrato seleccionado."
                  : ""}
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMostrarFormulario(false);
                    limpiarSeleccion();
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !cuentaSeleccionada}>
                  {loading ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <CheckCircle2 data-icon="inline-start" />
                  )}
                  Guardar asignacion
                </Button>
              </div>
            </form>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Vigencia inicio</TableHead>
                  <TableHead>Vigencia fin</TableHead>
                  <TableHead className="text-center">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asignaciones.map((asignacion, index) => {
                  const contrato = parseRef(asignacion.contrato);
                  const cuenta = parseRef(asignacion.cuenta);

                  return (
                    <TableRow key={asignacion.id ?? contrato?.id ?? index}>
                      <TableCell className="font-medium">
                        {contrato ? (
                          <div className="flex min-w-0 flex-col">
                            <span className="font-mono text-xs text-muted-foreground">
                              {contrato.codigo}
                            </span>
                            <span className="truncate">{contrato.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin contrato</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cuenta ? (
                          <div className="flex min-w-0 flex-col">
                            <span className="font-mono text-xs text-muted-foreground">
                              {cuenta.codigo}
                            </span>
                            <span className="truncate">{cuenta.nombre}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin cuenta</span>
                        )}
                      </TableCell>
                      <TableCell>{formatearFecha(asignacion.fechaInicio) ?? "-"}</TableCell>
                      <TableCell>{formatearFecha(asignacion.fechaFin) ?? "-"}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={ocupado || asignacion.id == null}
                          onClick={() =>
                            pedirConfirmacionUna(
                              asignacion.id,
                              contrato?.codigo ?? cuenta?.codigo,
                            )
                          }
                        >
                          {retirandoId === asignacion.id ? (
                            <Loader2 data-icon="inline-start" className="animate-spin" />
                          ) : (
                            <Trash2 data-icon="inline-start" />
                          )}
                          Retirar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!tieneContratos ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-6 opacity-50" />
                        Esta unidad no tiene asignaciones vigentes.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <AlertDialog open={confirmarUna !== null} onOpenChange={(open) => !open && setConfirmarUna(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar asignacion</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmarUna?.detalle
                ? `¿Quieres retirar la asignacion de ${confirmarUna.detalle}? Esta accion quedara registrada en el historial.`
                : "¿Quieres retirar esta asignacion? Esta accion quedara registrada en el historial."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmarRetirarUna()}>
              Retirar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarTodas} onOpenChange={setConfirmarTodas}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar todas las asignaciones</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Quieres retirar las {asignaciones.length} asignacion
              {asignaciones.length === 1 ? "" : "es"} vigente
              {asignaciones.length === 1 ? "" : "s"} de esta unidad? Esta accion quedara
              registrada en el historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmarRetirarTodas()}>
              Retirar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
