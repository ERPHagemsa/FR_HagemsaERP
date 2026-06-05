"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { asignarContrato, retirarContrato } from "../servicios/flota-api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Badge } from "@/compartido/componentes/ui/badge";
import { IconCheck, IconAlertTriangle, IconX } from "@tabler/icons-react";

/* ─── Snackbar tipo barra superior ─────────────────────────────────── */
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

/* ─── Componente principal ─────────────────────────────────────────── */
export default function DetalleVehiculoClient({ initialData, id }: any) {
  const router = useRouter();
  const [vehiculo, setVehiculo] = useState(initialData ?? null);
  const [contrato, setContrato] = useState(initialData?.contrato ?? "");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<SnackState>(null);

  function mostrarSnack(mensaje: string, tipo: "success" | "error") {
    setSnack({ mensaje, tipo });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!vehiculo || !contrato.trim()) return;
    setLoading(true);

    const result = await asignarContrato(vehiculo.placa, contrato.trim());

    if (result.success) {
      setVehiculo((v: any) => ({ ...v, contrato: contrato.trim() }));
      mostrarSnack(result.mensaje, "success");
      router.refresh(); // re-fetch server data
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
      setVehiculo((v: any) => ({ ...v, contrato: "", cuenta: "" }));
      setContrato("");
      mostrarSnack(result.mensaje, "success");
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

  const tieneContrato =
    vehiculo.contrato && vehiculo.contrato !== "Sin Contrato" && vehiculo.contrato !== "";

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
                  {vehiculo.contrato || "Sin Contrato"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Cuenta Asociada
                </span>
                <span className="font-semibold text-lg">{vehiculo.cuenta || "-"}</span>
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
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <label htmlFor="contrato" className="text-sm font-medium">
                  Código de Contrato
                </label>
                <Input
                  id="contrato"
                  value={contrato}
                  onChange={(e) => setContrato(e.target.value)}
                  placeholder="Ej: CON-001"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading || !contrato.trim()}>
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
