"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CheckCircle2, CircleX, Clock, Download, Loader2, Search, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import { Input } from "@/compartido/componentes/ui/input";
import { SiteHeader } from "@/compartido/componentes/site-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import {
  importarUnidades,
  obtenerActivosDisponibles,
  type ActivoDisponible,
} from "@/modulos/flota/asignaciones/servicios/asignaciones-api";

function resolverPlaca(activo: ActivoDisponible): string {
  return (
    activo.vehiculo?.placa ??
    activo.vehiculo?.placaRodaje ??
    activo.placa ??
    "—"
  );
}

function resolverMarca(activo: ActivoDisponible): string {
  return activo.vehiculo?.marca ?? activo.marca ?? "—";
}

function resolverModelo(activo: ActivoDisponible): string {
  return activo.vehiculo?.modelo ?? activo.modelo ?? "—";
}

export default function ImportarUnidadesPage() {
  const router = useRouter();
  const [activos, setActivos] = useState<ActivoDisponible[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [exitoMensaje, setExitoMensaje] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cargarActivos = useCallback(async () => {
    setCargando(true);
    setErrorMensaje(null);
    try {
      const datos = await obtenerActivosDisponibles();
      setActivos(datos);
    } catch (error) {
      setErrorMensaje(
        extraerMensajeError(error, "No se pudieron cargar los activos disponibles."),
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarActivos();
  }, [cargarActivos]);

  const activosFiltrados = activos.filter((a) => {
    const texto = busqueda.toLowerCase();
    const placa = resolverPlaca(a).toLowerCase();
    const marca = resolverMarca(a).toLowerCase();
    const desc = (a.descripcion ?? "").toLowerCase();
    const codigo = (a.codigo ?? "").toLowerCase();
    return (
      placa.includes(texto) ||
      marca.includes(texto) ||
      desc.includes(texto) ||
      codigo.includes(texto)
    );
  });

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleTodos() {
    if (seleccionados.size === activosFiltrados.length && activosFiltrados.length > 0) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(activosFiltrados.map((a) => a.id)));
    }
  }

  function handleImportar() {
    if (seleccionados.size === 0) return;
    setErrorMensaje(null);
    setExitoMensaje(null);

    startTransition(async () => {
      const resultado = await importarUnidades(Array.from(seleccionados));
      if (resultado.success) {
        setExitoMensaje(resultado.mensaje);
        setTimeout(() => {
          router.push("/flota/unidades");
          router.refresh();
        }, 1500);
      } else {
        setErrorMensaje(resultado.mensaje);
      }
    });
  }

  const todosSeleccionados =
    activosFiltrados.length > 0 &&
    seleccionados.size === activosFiltrados.length;

  return (
    <>
      <SiteHeader
        title="Importar Unidades"
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Listar unidades de flota", href: "/flota/unidades" },
          { title: "Importar unidades desde activos" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-normal">
                <Truck className="size-6 text-primary" />
                Importar unidades desde Activos
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecciona los activos que deseas registrar en la flota. Solo
                aparecen vehículos que aún no han sido importados.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push("/flota/unidades")}>
                Cancelar
              </Button>
              <Button
                id="btn-confirmar-importar"
                onClick={handleImportar}
                disabled={seleccionados.size === 0 || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Importando…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Importar{" "}
                    {seleccionados.size > 0 ? `(${seleccionados.size})` : ""}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card">
            {/* Búsqueda */}
            <div className="border-b border-border p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="input-busqueda-activos"
                  placeholder="Buscar por placa, marca, descripción…"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Mensajes de feedback */}
            {(errorMensaje || exitoMensaje) && (
              <div className="border-b border-border px-4 py-3">
                {errorMensaje && (
                  <p className="text-sm font-medium text-destructive">{errorMensaje}</p>
                )}
                {exitoMensaje && (
                  <p className="text-sm font-medium text-emerald-500">{exitoMensaje}</p>
                )}
              </div>
            )}

            {/* Tabla */}
            <div className="p-0">
              {cargando ? (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  Cargando activos disponibles…
                </div>
              ) : activosFiltrados.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Truck className="size-8 opacity-30" />
                  <p className="text-sm">
                    {busqueda
                      ? "Sin resultados para tu búsqueda."
                      : "No hay activos disponibles para importar."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          id="chk-todos"
                          checked={todosSeleccionados}
                          onCheckedChange={toggleTodos}
                          aria-label="Seleccionar todos"
                        />
                      </TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado Operativo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activosFiltrados.map((activo) => {
                      const placa = resolverPlaca(activo);
                      const marca = resolverMarca(activo);
                      const modelo = resolverModelo(activo);
                      const estadoOperativo = activo.vehiculo?.estadoOperativo ?? activo.estadoOperativo;
                      const isChecked = seleccionados.has(activo.id);

                      return (
                        <TableRow
                          key={activo.id}
                          data-state={isChecked ? "selected" : undefined}
                          className="cursor-pointer"
                          onClick={() => toggleSeleccion(activo.id)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              id={`chk-activo-${activo.id}`}
                              checked={isChecked}
                              onCheckedChange={() => toggleSeleccion(activo.id)}
                              aria-label={`Seleccionar ${placa}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {placa}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{marca}</span>
                            {modelo && modelo !== "—" && (
                              <span className="text-muted-foreground">
                                {" "}· {modelo}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate text-muted-foreground">
                            {activo.descripcion ?? activo.codigo ?? "—"}
                          </TableCell>
                          <TableCell>
                            <EstadoOperativoBadge value={estadoOperativo ?? null} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function EstadoOperativoBadge({ value }: { value: string | null }) {
  if (value === "OPERATIVO") {
    return (
      <Badge
        variant="outline"
        className="h-6 gap-1.5 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
      >
        <CheckCircle2 data-icon="inline-start" className="text-emerald-600 dark:text-emerald-400" />
        Operativo
      </Badge>
    );
  }
  if (value === "MANTENIMIENTO") {
    return (
      <Badge
        variant="outline"
        className="h-6 gap-1.5 rounded-full border-amber-300/70 bg-amber-50 px-2.5 text-[12px] font-medium text-amber-700 shadow-xs dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-400"
      >
        <Clock data-icon="inline-start" className="text-amber-500 dark:text-amber-400" />
        Mantenimiento
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-destructive/30 bg-destructive/10 px-2.5 text-[12px] font-medium text-destructive shadow-xs"
    >
      <CircleX data-icon="inline-start" />
      {value ?? "—"}
    </Badge>
  );
}
