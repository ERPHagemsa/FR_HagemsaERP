"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Truck } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { Separator } from "@/compartido/componentes/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import type { VehiculoFlota } from "@/modulos/flota/asignaciones/tipos/asignaciones.tipos";
import { useTiposChecklistQuery } from "../servicios/tipos-checklist-queries";
import { useColoresRotulacionQuery } from "../servicios/colores-rotulacion-queries";
import { useIniciarInspeccionMutation } from "../servicios/inspecciones-queries";
import type { Inspeccion } from "../tipos/inspeccion.tipos";

// Etiqueta legible de una asignación (contrato / cuenta vienen como `unknown`).
function etiquetaReferencia(ref: unknown): string | null {
  if (!ref || typeof ref !== "object") return null;
  const r = ref as Record<string, unknown>;
  const codigo = typeof r.codigo === "string" ? r.codigo : null;
  const nombre = typeof r.nombre === "string" ? r.nombre : null;
  return [codigo, nombre].filter(Boolean).join(" — ") || null;
}

function etiquetaAsignacion(a: NonNullable<VehiculoFlota["asignaciones"]>[number]): string {
  const contrato = etiquetaReferencia(a.contrato);
  const cuenta = etiquetaReferencia(a.cuenta);
  return [contrato, cuenta].filter(Boolean).join(" · ") || `Asignación ${a.id ?? ""}`;
}

function aNumeroONull(valor: FormDataEntryValue | null): number | null {
  const s = String(valor ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function aTextoONull(valor: FormDataEntryValue | null): string | null {
  const s = String(valor ?? "").trim();
  return s.length > 0 ? s : null;
}

export function IniciarInspeccionSheet({
  unidad,
  onCerrar,
  onIniciada,
}: {
  unidad: VehiculoFlota;
  onCerrar: () => void;
  onIniciada: (inspeccion: Inspeccion) => void;
}) {
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [tipoId, setTipoId] = useState<string>("");
  const [asignacionId, setAsignacionId] = useState<string>("");
  const [colorId, setColorId] = useState<string>("");

  const tiposConsulta = useTiposChecklistQuery({ estadoRegistro: "ACTIVO", limite: 100 });
  const tipos = tiposConsulta.data?.datos ?? [];

  const coloresConsulta = useColoresRotulacionQuery({ estadoRegistro: "ACTIVO", limite: 100 });
  const colores = coloresConsulta.data?.datos ?? [];

  const asignaciones = unidad.asignaciones ?? [];
  const requiereAsignacion = asignaciones.length > 0;

  const tipoSel = useMemo(() => tipos.find((t) => t.id === tipoId) ?? null, [tipos, tipoId]);
  const operadoresRequeridos = tipoSel?.operadoresRequeridos ?? 1;

  const placa = unidad.placa ?? unidad.placaRodaje ?? unidad.codigo ?? unidad.id;
  const carroceria = unidad.carroceria ?? unidad.vehiculo?.carroceria ?? null;

  const iniciar = useIniciarInspeccionMutation({
    onSuccess: (inspeccion) => {
      setErrorForm(null);
      toast.success("Inspección iniciada", {
        description: "Se resolvió la plantilla según la carrocería de la unidad.",
      });
      onIniciada(inspeccion);
    },
    onError: (err) => setErrorForm(extraerMensajeError(err)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!tipoId) {
      setErrorForm("Seleccione un tipo de checklist.");
      return;
    }
    if (requiereAsignacion && !asignacionId) {
      setErrorForm("Esta unidad tiene asignaciones vigentes; seleccione una.");
      return;
    }

    const operadoresDocumentos: string[] = [];
    for (let i = 0; i < operadoresRequeridos; i++) {
      const doc = aTextoONull(formData.get(`operador-${i}`));
      if (doc) operadoresDocumentos.push(doc);
    }

    setErrorForm(null);
    iniciar.mutate({
      tipoChecklistId: tipoId,
      unidadId: unidad.id,
      asignacionId: asignacionId ? Number(asignacionId) : null,
      horometro: aNumeroONull(formData.get("horometro")),
      hubodometro: aNumeroONull(formData.get("hubodometro")),
      kilometraje: aNumeroONull(formData.get("kilometraje")),
      destino: aTextoONull(formData.get("destino")),
      colorRotulacionId: colorId || null,
      inspectorDocumento: aTextoONull(formData.get("inspectorDocumento")),
      operadoresDocumentos: operadoresDocumentos.length > 0 ? operadoresDocumentos : null,
      observaciones: aTextoONull(formData.get("observaciones")),
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorForm(null);
      onCerrar();
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Iniciar checklist</SheetTitle>
            <SheetDescription>
              Elija el tipo de checklist. El sistema resuelve automáticamente la
              plantilla según la carrocería de la unidad.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errorForm ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo iniciar</AlertTitle>
                  <AlertDescription>{errorForm}</AlertDescription>
                </Alert>
              ) : null}

              {/* Unidad (contexto, solo lectura) */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background">
                  <Truck className="size-4 text-muted-foreground" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{placa}</span>
                  <span className="text-xs text-muted-foreground">
                    {carroceria ? `Carrocería: ${carroceria}` : "Carrocería no definida"}
                    {" — resuelve la plantilla aplicable."}
                  </span>
                </div>
              </div>

              {/* Asignación (contrato/cuenta) */}
              {requiereAsignacion ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-asignacion">
                    Asignación (contrato / cuenta) <span className="text-destructive">*</span>
                  </Label>
                  <Select value={asignacionId} onValueChange={setAsignacionId}>
                    <SelectTrigger id="ins-asignacion" className="w-full">
                      <SelectValue placeholder="Seleccione la asignación vigente" />
                    </SelectTrigger>
                    <SelectContent>
                      {asignaciones.map((a) => (
                        <SelectItem key={a.id ?? etiquetaAsignacion(a)} value={String(a.id ?? "")}>
                          {etiquetaAsignacion(a)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* Tipo de checklist */}
              <div className="grid gap-1.5">
                <Label htmlFor="ins-tipo">
                  Tipo de checklist <span className="text-destructive">*</span>
                </Label>
                <Select value={tipoId} onValueChange={setTipoId}>
                  <SelectTrigger id="ins-tipo" className="w-full">
                    <SelectValue
                      placeholder={
                        tiposConsulta.isLoading ? "Cargando tipos..." : "Seleccione un tipo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre} · {t.operadoresRequeridos === 2 ? "Relevo" : "Normal"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Datos de operación */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-horometro">Horómetro</Label>
                  <Input id="ins-horometro" name="horometro" type="number" step="any" inputMode="decimal" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-hubodometro">Hubodómetro</Label>
                  <Input id="ins-hubodometro" name="hubodometro" type="number" step="any" inputMode="decimal" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-kilometraje">Kilometraje</Label>
                  <Input id="ins-kilometraje" name="kilometraje" type="number" step="any" inputMode="decimal" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-destino">Destino de carga</Label>
                  <Input id="ins-destino" name="destino" placeholder="Ej. Mina Antapaccay" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-color">Color de rotulación</Label>
                  <Select value={colorId} onValueChange={setColorId}>
                    <SelectTrigger id="ins-color" className="w-full">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {colores.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span
                            className="mr-2 inline-block size-3 rounded-sm border border-border/50 align-middle"
                            style={{ backgroundColor: c.valorHex }}
                          />
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Inspector y operadores */}
              <div className="grid gap-1.5">
                <Label htmlFor="ins-inspector">Documento del inspector</Label>
                <Input id="ins-inspector" name="inspectorDocumento" placeholder="DNI / documento" />
              </div>

              <div className="grid gap-2">
                <Label>
                  {operadoresRequeridos === 2 ? "Documentos de operadores (relevo)" : "Documento del operador"}
                </Label>
                {Array.from({ length: operadoresRequeridos }).map((_, i) => (
                  <Input
                    key={i}
                    name={`operador-${i}`}
                    placeholder={
                      operadoresRequeridos === 2
                        ? `Operador ${i === 0 ? "A (recepción)" : "B (asignación)"}`
                        : "DNI / documento"
                    }
                  />
                ))}
                {tipoSel ? (
                  <p className="text-xs text-muted-foreground">
                    Este tipo exige {operadoresRequeridos}{" "}
                    {operadoresRequeridos === 1 ? "operador" : "operadores"}.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ins-observaciones">Observaciones</Label>
                <Textarea id="ins-observaciones" name="observaciones" rows={3} maxLength={1000} />
              </div>
            </div>
          </div>

          <Separator />
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={iniciar.isPending}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={iniciar.isPending}>
              {iniciar.isPending ? "Iniciando..." : "Iniciar checklist"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
