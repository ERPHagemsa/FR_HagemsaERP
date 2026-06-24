"use client";

import * as React from "react";
import Link from "next/link";
import {
  Boxes,
  Car,
  CheckCircle2,
  Cpu,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  Package,
  Upload,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades/utils";
import { useCatalogosActivos } from "../ganchos/use-catalogos-activos";
import type { CatalogosActivos } from "../ganchos/use-catalogos-activos";
import {
  COLUMNAS_POR_TIPO,
  ETIQUETA_TIPO_ACTIVO,
  TIPO_ACTIVO_DISPOSITIVO_ID,
  TIPO_ACTIVO_EQUIPO_ID,
  TIPO_ACTIVO_HERRAMIENTA_ID,
  TIPO_ACTIVO_OTRO_ID,
  TIPO_ACTIVO_VEHICULO_ID,
} from "../servicios/carga-masiva-columnas";
import {
  descargarPlantilla,
  parsearArchivo,
} from "../servicios/carga-masiva-excel";
import { procesarCargaMasiva } from "../servicios/activos-api";
import type {
  CargaMasiva,
  FilaPrevisualizada,
} from "../tipos/carga-masiva.tipos";

type Paso = "tipo" | "cargar" | "revisar" | "resultado";

const TIPOS: Array<{ tipo: number; icono: React.ReactNode; detalle: string }> =
  [
    {
      tipo: TIPO_ACTIVO_VEHICULO_ID,
      icono: <Car className="size-6" />,
      detalle: "Unidades con placa, motor, dimensiones y tanques.",
    },
    {
      tipo: TIPO_ACTIVO_EQUIPO_ID,
      icono: <Boxes className="size-6" />,
      detalle: "Equipos con dimensiones y control operativo.",
    },
    {
      tipo: TIPO_ACTIVO_DISPOSITIVO_ID,
      icono: <Cpu className="size-6" />,
      detalle: "Dispositivos con marca, modelo y serie.",
    },
    {
      tipo: TIPO_ACTIVO_HERRAMIENTA_ID,
      icono: <Wrench className="size-6" />,
      detalle: "Herramientas y activos menores.",
    },
    {
      tipo: TIPO_ACTIVO_OTRO_ID,
      icono: <Package className="size-6" />,
      detalle: "Otros activos con datos basicos.",
    },
  ];

const PASOS: Array<{ id: Paso; titulo: string }> = [
  { id: "tipo", titulo: "Tipo" },
  { id: "cargar", titulo: "Plantilla y archivo" },
  { id: "revisar", titulo: "Revisar" },
  { id: "resultado", titulo: "Resultado" },
];

export function CargaMasivaVista() {
  const catalogos = useCatalogosActivos();
  const [paso, setPaso] = React.useState<Paso>("tipo");
  const [tipo, setTipo] = React.useState<number | null>(null);
  const [nombreArchivo, setNombreArchivo] = React.useState<string>("");
  const [filas, setFilas] = React.useState<FilaPrevisualizada[]>([]);
  const [procesando, setProcesando] = React.useState(false);
  const [resultado, setResultado] = React.useState<CargaMasiva | null>(null);

  const validas = filas.filter((fila) => fila.esValida);
  const conError = filas.filter((fila) => !fila.esValida);

  function reiniciar() {
    setPaso("tipo");
    setTipo(null);
    setNombreArchivo("");
    setFilas([]);
    setResultado(null);
  }

  function elegirTipo(nuevoTipo: number) {
    setTipo(nuevoTipo);
    setFilas([]);
    setNombreArchivo("");
    setPaso("cargar");
  }

  async function onArchivo(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo || !tipo) return;

    try {
      const parseadas = await parsearArchivo(archivo, tipo, catalogos);
      if (parseadas.length === 0) {
        toast.error("El archivo no tiene filas de datos.");
        return;
      }
      setNombreArchivo(archivo.name);
      setFilas(parseadas);
      setPaso("revisar");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo leer el archivo. Verifica que sea un Excel valido.");
    }
  }

  async function confirmar() {
    if (!tipo || validas.length === 0) return;
    setProcesando(true);
    try {
      const carga = await procesarCargaMasiva({
        tipoActivoReferenciaId: tipo,
        nombreArchivo,
        filas: validas.map((fila) => ({ fila: fila.fila, activo: fila.activo })),
      });
      setResultado(carga);
      setPaso("resultado");
      toast.success(
        `Carga procesada: ${carga.totalCreados} creados, ${carga.totalRechazados} rechazados.`,
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo procesar la carga masiva.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <Pasos pasoActual={paso} />

      {paso === "tipo" && <PasoTipo onElegir={elegirTipo} />}

      {paso === "cargar" && tipo && (
        <PasoCargar
          tipo={tipo}
          catalogos={catalogos}
          onArchivo={onArchivo}
          onVolver={() => setPaso("tipo")}
        />
      )}

      {paso === "revisar" && tipo && (
        <PasoRevisar
          tipo={tipo}
          nombreArchivo={nombreArchivo}
          filas={filas}
          validas={validas.length}
          conError={conError.length}
          procesando={procesando}
          onConfirmar={confirmar}
          onVolver={() => setPaso("cargar")}
        />
      )}

      {paso === "resultado" && resultado && (
        <PasoResultado resultado={resultado} onNueva={reiniciar} />
      )}
    </div>
  );
}

function Pasos({ pasoActual }: { pasoActual: Paso }) {
  const indiceActual = PASOS.findIndex((p) => p.id === pasoActual);
  return (
    <div className="flex items-center gap-2">
      {PASOS.map((p, i) => {
        const completado = i < indiceActual;
        const activo = i === indiceActual;
        return (
          <React.Fragment key={p.id}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                  activo && "border-primary bg-primary text-primary-foreground",
                  completado &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  !activo && !completado && "border-muted text-muted-foreground",
                )}
              >
                {completado ? <CheckCircle2 className="size-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  activo ? "font-medium" : "text-muted-foreground",
                )}
              >
                {p.titulo}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className="h-px w-6 flex-none bg-border md:w-12" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PasoTipo({ onElegir }: { onElegir: (tipo: number) => void }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>1. Selecciona el tipo de activo</CardTitle>
        <CardDescription>
          Cada tipo abre distintos campos. La plantilla traera solo las columnas
          que apliquen.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TIPOS.map(({ tipo, icono, detalle }) => (
          <button
            key={tipo}
            type="button"
            onClick={() => onElegir(tipo)}
            className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition hover:border-primary hover:bg-accent"
          >
            <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              {icono}
            </span>
            <span className="font-medium">{ETIQUETA_TIPO_ACTIVO[tipo]}</span>
            <span className="text-xs text-muted-foreground">{detalle}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {COLUMNAS_POR_TIPO[tipo].length} columnas
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

function PasoCargar({
  tipo,
  catalogos,
  onArchivo,
  onVolver,
}: {
  tipo: number;
  catalogos: CatalogosActivos;
  onArchivo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolver: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>
          2. Plantilla y archivo — {ETIQUETA_TIPO_ACTIVO[tipo]}
        </CardTitle>
        <CardDescription>
          Descarga la plantilla, llena los datos en la hoja &quot;Activos&quot; y
          subela aqui. La hoja &quot;Instrucciones&quot; explica cada columna.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-start gap-3 rounded-lg border p-5">
          <FileSpreadsheet className="size-8 text-emerald-600" />
          <p className="text-sm font-medium">Paso A — Descargar plantilla</p>
          <p className="text-xs text-muted-foreground">
            Excel con {COLUMNAS_POR_TIPO[tipo].length} columnas y una fila de
            ejemplo.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => descargarPlantilla(tipo, catalogos)}
          >
            <Download className="size-4" />
            Descargar plantilla
          </Button>
        </div>

        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5">
          <FileUp className="size-8 text-primary" />
          <p className="text-sm font-medium">Paso B — Subir archivo lleno</p>
          <p className="text-xs text-muted-foreground">
            Formatos: .xlsx, .xls o .csv. Se validara antes de crear nada.
          </p>
          <label htmlFor="archivo-carga">
            <input
              id="archivo-carga"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onArchivo}
            />
            <Button type="button" asChild>
              <span className="cursor-pointer">
                <Upload className="size-4" />
                Seleccionar archivo
              </span>
            </Button>
          </label>
        </div>
      </CardContent>
      <CardContent>
        <Button type="button" variant="ghost" onClick={onVolver}>
          Volver
        </Button>
      </CardContent>
    </Card>
  );
}

function PasoRevisar({
  tipo,
  nombreArchivo,
  filas,
  validas,
  conError,
  procesando,
  onConfirmar,
  onVolver,
}: {
  tipo: number;
  nombreArchivo: string;
  filas: FilaPrevisualizada[];
  validas: number;
  conError: number;
  procesando: boolean;
  onConfirmar: () => void;
  onVolver: () => void;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>3. Revisar previsualizacion</CardTitle>
            <CardDescription>
              {nombreArchivo} — {ETIQUETA_TIPO_ACTIVO[tipo]}. Solo se crearan las
              filas validas.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-600">{validas} validas</Badge>
            <Badge variant={conError ? "destructive" : "outline"}>
              {conError} con error
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[26rem] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted">
              <TableRow>
                <TableHead className="w-14">Fila</TableHead>
                <TableHead className="w-24">Estado</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Ubicacion</TableHead>
                <TableHead>Errores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((fila) => (
                <TableRow
                  key={fila.fila}
                  className={cn(!fila.esValida && "bg-destructive/5")}
                >
                  <TableCell className="text-muted-foreground">
                    {fila.fila}
                  </TableCell>
                  <TableCell>
                    {fila.esValida ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="size-3.5" /> Ok
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="size-3.5" /> Error
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {fila.valoresCrudos.codigo || "—"}
                  </TableCell>
                  <TableCell>{fila.valoresCrudos.descripcion || "—"}</TableCell>
                  <TableCell>{fila.valoresCrudos.ubicacion || "—"}</TableCell>
                  <TableCell className="text-xs">
                    {Object.keys(fila.errores).length > 0 ? (
                      <span className="text-destructive">
                        {Object.entries(fila.errores)
                          .map(([campo, msg]) => `${campo}: ${msg}`)
                          .join(" · ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onVolver}>
            Volver
          </Button>
          <Button
            type="button"
            onClick={onConfirmar}
            disabled={validas === 0 || procesando}
          >
            {procesando
              ? "Procesando..."
              : `Crear ${validas} activo${validas === 1 ? "" : "s"}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PasoResultado({
  resultado,
  onNueva,
}: {
  resultado: CargaMasiva;
  onNueva: () => void;
}) {
  const detalles = resultado.detalles ?? [];
  const creados = detalles.filter((d) => d.estado === "CREADO");
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>4. Resultado — lote {resultado.codigo}</CardTitle>
            <CardDescription>
              {resultado.totalCreados} creados de {resultado.totalLeidos} leidos.
              Entra a cada activo para agregar documentos o imagenes.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-600">
              {resultado.totalCreados} creados
            </Badge>
            <Badge variant={resultado.totalRechazados ? "destructive" : "outline"}>
              {resultado.totalRechazados} rechazados
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[26rem] overflow-auto rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted">
              <TableRow>
                <TableHead className="w-14">Fila</TableHead>
                <TableHead className="w-28">Estado</TableHead>
                <TableHead>Codigo</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="w-32">Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalles.map((detalle) => (
                <TableRow key={detalle.id}>
                  <TableCell className="text-muted-foreground">
                    {detalle.fila}
                  </TableCell>
                  <TableCell>
                    {detalle.estado === "CREADO" ? (
                      <Badge className="bg-emerald-600">Creado</Badge>
                    ) : (
                      <Badge variant="destructive">Rechazado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {detalle.codigoActivo || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {detalle.mensajeError || "Creado correctamente"}
                  </TableCell>
                  <TableCell>
                    {detalle.estado === "CREADO" && detalle.codigoActivo ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/activos/${detalle.codigoActivo}`}>
                          Abrir
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link href="/activos/inventario">Ir al listado de activos</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            {creados.length > 0 && (
              <Button asChild variant="outline">
                <Link href="/activos/carga-masiva-documentos">
                  <FileText className="size-4" />
                  Agregar documentos a estos activos
                </Link>
              </Button>
            )}
            <Button type="button" onClick={onNueva}>
              Nueva carga
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
