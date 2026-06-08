"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { asignarContrato, retirarContrato } from "../servicios/flota-api";
import { parseRef } from "./flota-normalizadores";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Button } from "@/compartido/componentes/ui/button";
import { Badge } from "@/compartido/componentes/ui/badge";
import { IconCheck, IconAlertTriangle, IconX, IconSearch, IconChevronDown } from "@tabler/icons-react";

/* ─── Catálogo de contratos ─────────────────────────────────────────── */
const CONTRATOS_DISPONIBLES = [
  {
    id: "11f89182-5df7-4bec-a8f3-6cd8c5b2d55a",
    codigo: "CON-001",
    nombre: "Contrato Transporte 2026",
    cuenta: { id: "0427e686-b641-492a-b803-127d61f1387a", codigo: "CTA-001", nombre: "Cuenta Antamina" },
  },
  {
    id: "11f89182-5df7-4bec-a8f3-6cd8c5b2d55b",
    codigo: "CON-002",
    nombre: "Contrato Transporte Anglo",
    cuenta: { id: "0427e686-b641-492a-b803-127d61f1387b", codigo: "CTA-002", nombre: "Cuenta Anglo" },
  },
  {
    id: "hagemsa-interno",
    codigo: "HAG-000",
    nombre: "Hagemsa Interno",
    cuenta: { id: "hagemsa-interno", codigo: "HAG-000", nombre: "Hagemsa Interno" },
  },
];

type ContratoCatalogo = (typeof CONTRATOS_DISPONIBLES)[number];

/* ─── Snackbar ─────────────────────────────────────────────────────── */
type SnackState = { mensaje: string; tipo: "success" | "error" } | null;

function TopSnackbar({ snack, onClose }: { snack: SnackState; onClose: () => void }) {
  useEffect(() => {
    if (!snack) return;
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [snack, onClose]);

  if (!snack) return null;
  const isSuccess = snack.tipo === "success";

  return (
    <div
      style={{ zIndex: 9999 }}
      className={`fixed top-0 left-0 right-0 flex items-center justify-between gap-3 px-6 py-3 shadow-lg text-white text-sm font-medium transition-all duration-300 ${
        isSuccess ? "bg-emerald-600" : "bg-red-600"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <IconCheck className="h-5 w-5 shrink-0" />
        ) : (
          <IconAlertTriangle className="h-5 w-5 shrink-0" />
        )}
        <span>{snack.mensaje}</span>
      </div>
      <button onClick={onClose} className="opacity-80 hover:opacity-100">
        <IconX className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ─── Combobox de búsqueda ─────────────────────────────────────────── */
interface ContratoComboboxProps {
  value: ContratoCatalogo | null;
  onChange: (c: ContratoCatalogo | null) => void;
  disabled?: boolean;
}

function ContratoCombobox({ value, onChange, disabled }: ContratoComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const filtered = CONTRATOS_DISPONIBLES.filter((c) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      c.codigo.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.cuenta.nombre.toLowerCase().includes(q)
    );
  });

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Calcular posición del dropdown cuando se abre
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const update = () => setRect(containerRef.current!.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  function selectItem(c: ContratoCatalogo) {
    onChange(c);
    setQuery("");
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
  }

  const displayText = value ? `${value.codigo} – ${value.nombre}` : "";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input principal */}
      <div
        className={`flex h-9 w-full items-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors ${
          open ? "ring-1 ring-ring" : ""
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <IconSearch className="ml-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          id="contrato-search"
          type="text"
          autoComplete="off"
          disabled={disabled}
          placeholder={displayText || "Buscar contrato por código o nombre…"}
          value={open ? query : displayText}
          onFocus={() => { setQuery(""); setOpen(true); }}
          onChange={handleInputChange}
          className="flex-1 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={() => { onChange(null); setQuery(""); }}
            className="mr-1 rounded p-0.5 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            <IconX className="h-3.5 w-3.5" />
          </button>
        )}
        <IconChevronDown
          className={`mr-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* Dropdown (rendered in portal to avoid clipping inside Card) */}
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
              <div className="rounded-md border border-border bg-background shadow-lg">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2.5 text-sm text-muted-foreground">
                    Sin resultados para &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <ul className="max-h-56 overflow-y-auto py-1">
                    {filtered.map((c) => {
                      const isSelected = value?.codigo === c.codigo;
                      return (
                        <li
                          key={c.id}
                          onMouseDown={() => selectItem(c)}
                          className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                            isSelected ? "bg-accent/60 font-medium" : ""
                          }`}
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="font-mono text-xs text-muted-foreground">{c.codigo}</span>
                            <span className="truncate">{c.nombre}</span>
                            <span className="truncate text-xs text-muted-foreground">{c.cuenta.nombre}</span>
                          </div>
                          {isSelected && <IconCheck className="h-4 w-4 shrink-0 text-primary" />}
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

/* ─── Componente principal ─────────────────────────────────────────── */
export default function DetalleVehiculoClient({ initialData, id }: any) {
  const router = useRouter();
  const [vehiculo, setVehiculo] = useState(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<SnackState>(null);

  // Pre-selección: buscar por codigo (evita colisión de IDs en seed)
  const contratoInicial = parseRef(initialData?.contrato);
  const itemInicial = contratoInicial
    ? CONTRATOS_DISPONIBLES.find((c) => c.codigo === contratoInicial.codigo) ?? null
    : null;
  const [contratoSeleccionado, setContratoSeleccionado] = useState<ContratoCatalogo | null>(itemInicial);

  function mostrarSnack(mensaje: string, tipo: "success" | "error") {
    setSnack({ mensaje, tipo });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!vehiculo || !contratoSeleccionado) return;
    setLoading(true);

    const result = await asignarContrato(vehiculo.placa, contratoSeleccionado, contratoSeleccionado.cuenta);

    if (result.success) {
      setVehiculo((v: any) => ({ ...v, contrato: contratoSeleccionado, cuenta: contratoSeleccionado.cuenta }));
      mostrarSnack(`Contrato ${contratoSeleccionado.codigo} asignado exitosamente`, "success");
      router.refresh();
    } else {
      mostrarSnack(result.mensaje, "error");
    }
    setLoading(false);
  }

  async function onRetire() {
    if (!vehiculo) return;
    setLoading(true);

    const result = await retirarContrato(vehiculo.placa);

    if (result.success) {
      setVehiculo((v: any) => ({ ...v, contrato: null, cuenta: null }));
      setContratoSeleccionado(null);
      mostrarSnack("Contrato retirado exitosamente", "success");
      router.refresh();
    } else {
      mostrarSnack(result.mensaje, "error");
    }
    setLoading(false);
  }

  if (!vehiculo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehículo no encontrado</CardTitle>
          <CardDescription>
            Servicio de Flota no disponible o placa incorrecta.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const contratoActual = parseRef(vehiculo?.contrato);
  const cuentaActual = parseRef(vehiculo?.cuenta);
  const tieneContrato = !!contratoActual?.id;

  return (
    <>
      <TopSnackbar snack={snack} onClose={() => setSnack(null)} />

      <div className="grid gap-6">
        {/* ─── Info general ─── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  Detalle de Unidad: {vehiculo.placa ?? id}
                </CardTitle>
                <CardDescription>
                  Información general y asignación contractual
                </CardDescription>
              </div>
              <Badge
                variant={
                  vehiculo.estadoOperativo === "OPERATIVO" ? "default" : "destructive"
                }
              >
                {vehiculo.estadoOperativo ?? "DESCONOCIDO"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">Placa</span>
                <span className="font-semibold text-lg font-mono">
                  {vehiculo.placa ?? id}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Modelo y Carrocería
                </span>
                <span className="font-semibold text-lg">
                  {vehiculo.modelo ?? "Sin detalle"} -{" "}
                  {vehiculo.carroceria ?? "Sin detalle"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Contrato Asignado
                </span>
                <span className="font-semibold text-lg">
                  {contratoActual
                    ? `${contratoActual.codigo} – ${contratoActual.nombre}`
                    : "Sin Contrato"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Cuenta Asociada
                </span>
                <span className="font-semibold text-lg">
                  {cuentaActual ? `${cuentaActual.codigo} – ${cuentaActual.nombre}` : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Gestión de contrato ─── */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Contrato</CardTitle>
            <CardDescription>
              Modifica o retira la asignación contractual actual de este vehículo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={onSave}
              className="flex flex-col md:flex-row gap-4 items-end"
            >
              <div className="grid w-full max-w-md items-center gap-1.5">
                <label htmlFor="contrato-search" className="text-sm font-medium">
                  Contrato a Asignar
                </label>
                <ContratoCombobox
                  value={contratoSeleccionado}
                  onChange={setContratoSeleccionado}
                  disabled={loading}
                />
                {contratoSeleccionado && (
                  <p className="text-xs text-muted-foreground">
                    Cuenta asociada: <span className="font-medium text-foreground">{contratoSeleccionado.cuenta.nombre}</span>
                  </p>
                )}
              </div>
              <Button type="submit" disabled={loading || !contratoSeleccionado}>
                {loading ? "Guardando..." : "Asignar Contrato"}
              </Button>
              {tieneContrato && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onRetire}
                  disabled={loading}
                >
                  Retirar Contrato
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
