"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, FileUp, Trash2, Upload, XCircle } from "lucide-react";
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
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades/utils";
import { procesarCargaMasivaDocumentos } from "../servicios/activos-api";
import type {
  ArchivoDocumentoMasivo,
  CargaMasivaDocumentosResultado,
  TipoDocumentoCarga,
} from "../tipos/carga-masiva.tipos";

type Paso = "configurar" | "revisar" | "resultado";

const TIPOS_DOCUMENTO: Array<{ valor: TipoDocumentoCarga; etiqueta: string }> = [
  { valor: "SOAT", etiqueta: "SOAT" },
  { valor: "POLIZA", etiqueta: "Poliza" },
  { valor: "TARJETA_PROPIEDAD", etiqueta: "Tarjeta de propiedad" },
  { valor: "REVISION_TECNICA", etiqueta: "Revision tecnica" },
  { valor: "FACTURA", etiqueta: "Factura" },
  { valor: "CERTIFICADO", etiqueta: "Certificado" },
  { valor: "MANUAL", etiqueta: "Manual" },
  { valor: "OTRO", etiqueta: "Otro" },
];

const TAM_MAX_MB = 10;

/** Extrae placa/codigo del nombre: stem sin extension, antes del primer "_". */
function identificadorDesdeNombre(nombre: string): string {
  const sinExtension = nombre.replace(/\.[^.]+$/, "");
  return sinExtension.split("_")[0].trim().toUpperCase();
}

function archivoADataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CargaMasivaDocumentosVista() {
  const [paso, setPaso] = React.useState<Paso>("configurar");
  const [tipoDocumento, setTipoDocumento] =
    React.useState<TipoDocumentoCarga>("SOAT");
  const [fechaVencimiento, setFechaVencimiento] = React.useState("");
  const [archivos, setArchivos] = React.useState<ArchivoDocumentoMasivo[]>([]);
  const [procesando, setProcesando] = React.useState(false);
  const [resultado, setResultado] =
    React.useState<CargaMasivaDocumentosResultado | null>(null);

  function reiniciar() {
    setPaso("configurar");
    setArchivos([]);
    setResultado(null);
    setFechaVencimiento("");
  }

  async function onArchivos(event: React.ChangeEvent<HTMLInputElement>) {
    const lista = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (lista.length === 0) return;

    const nuevos: ArchivoDocumentoMasivo[] = [];
    for (const file of lista) {
      if (file.size > TAM_MAX_MB * 1024 * 1024) {
        toast.error(`${file.name} supera ${TAM_MAX_MB} MB y se omitio.`);
        continue;
      }
      nuevos.push({
        nombreArchivo: file.name,
        identificador: identificadorDesdeNombre(file.name),
        tipoDocumento,
        fechaVencimiento: fechaVencimiento || undefined,
        contenidoBase64: await archivoADataUrl(file),
      });
    }

    if (nuevos.length === 0) return;
    setArchivos((actuales) => [...actuales, ...nuevos]);
    setPaso("revisar");
  }

  function quitarArchivo(indice: number) {
    setArchivos((actuales) => actuales.filter((_, i) => i !== indice));
  }

  async function confirmar() {
    if (archivos.length === 0) return;
    setProcesando(true);
    try {
      const datos = await procesarCargaMasivaDocumentos({
        archivos: archivos.map((archivo) => ({
          ...archivo,
          tipoDocumento,
          fechaVencimiento: fechaVencimiento || archivo.fechaVencimiento,
        })),
      });
      setResultado(datos);
      setPaso("resultado");
      toast.success(
        `${datos.totalAsociados} asociados, ${datos.totalSinActivo} sin activo.`,
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo procesar la carga de documentos.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {paso === "configurar" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Carga masiva de documentos</CardTitle>
            <CardDescription>
              Sube varios documentos (SOAT, polizas, etc.) y se asocian solos al
              activo segun el nombre del archivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Como nombrar los archivos</p>
              <p className="mt-1 text-muted-foreground">
                El nombre debe empezar con la{" "}
                <strong>placa o el codigo</strong> del activo. Ejemplos:
              </p>
              <ul className="mt-2 list-inside list-disc text-muted-foreground">
                <li>
                  <code>BTZ-750.pdf</code> &rarr; activo con placa BTZ-750
                </li>
                <li>
                  <code>BTZ-750_SOAT.pdf</code> &rarr; placa BTZ-750 (lo de
                  despues del &quot;_&quot; se ignora)
                </li>
                <li>
                  <code>ACT-000901.pdf</code> &rarr; activo con codigo ACT-000901
                </li>
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select
                  value={tipoDocumento}
                  onValueChange={(v) =>
                    setTipoDocumento(v as TipoDocumentoCarga)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_DOCUMENTO.map((t) => (
                      <SelectItem key={t.valor} value={t.valor}>
                        {t.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Aplica a todos los archivos de este lote.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Fecha de vencimiento (opcional)</Label>
                <Input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comun para SOAT/poliza del mismo periodo.
                </p>
              </div>
            </div>

            <label htmlFor="archivos-docs">
              <input
                id="archivos-docs"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={onArchivos}
              />
              <Button type="button" asChild>
                <span className="cursor-pointer">
                  <Upload className="size-4" />
                  Seleccionar documentos
                </span>
              </Button>
            </label>
          </CardContent>
        </Card>
      )}

      {paso === "revisar" && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Revisar documentos</CardTitle>
                <CardDescription>
                  {archivos.length} archivo(s). Verifica que el identificador
                  (placa/codigo) sea correcto antes de cargar.
                </CardDescription>
              </div>
              <Badge variant="outline">
                {TIPOS_DOCUMENTO.find((t) => t.valor === tipoDocumento)?.etiqueta}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[26rem] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Identificador (placa/codigo)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivos.map((archivo, i) => (
                    <TableRow key={`${archivo.nombreArchivo}-${i}`}>
                      <TableCell>{archivo.nombreArchivo}</TableCell>
                      <TableCell className="font-medium">
                        {archivo.identificador || (
                          <span className="text-destructive">
                            (nombre invalido)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => quitarArchivo(i)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaso("configurar")}
                >
                  Volver
                </Button>
                <label htmlFor="archivos-docs-mas">
                  <input
                    id="archivos-docs-mas"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={onArchivos}
                  />
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      <FileUp className="size-4" />
                      Agregar mas
                    </span>
                  </Button>
                </label>
              </div>
              <Button
                type="button"
                onClick={confirmar}
                disabled={archivos.length === 0 || procesando}
              >
                {procesando
                  ? "Cargando..."
                  : `Cargar ${archivos.length} documento(s)`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {paso === "resultado" && resultado && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Resultado</CardTitle>
                <CardDescription>
                  {resultado.totalAsociados} documento(s) asociados de{" "}
                  {resultado.totalArchivos}.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-emerald-600">
                  {resultado.totalAsociados} asociados
                </Badge>
                <Badge
                  variant={resultado.totalSinActivo ? "destructive" : "outline"}
                >
                  {resultado.totalSinActivo} sin activo
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[26rem] overflow-auto rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 bg-muted">
                  <TableRow>
                    <TableHead className="w-24">Estado</TableHead>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultado.detalles.map((detalle, i) => (
                    <TableRow
                      key={`${detalle.nombreArchivo}-${i}`}
                      className={cn(
                        detalle.estado !== "ASOCIADO" && "bg-destructive/5",
                      )}
                    >
                      <TableCell>
                        {detalle.estado === "ASOCIADO" ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="size-3.5" /> Ok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="size-3.5" /> Falla
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{detalle.nombreArchivo}</TableCell>
                      <TableCell className="font-medium">
                        {detalle.codigoActivo || detalle.identificador}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {detalle.mensajeError || "Documento cargado"}
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
              <Button type="button" onClick={reiniciar}>
                Nueva carga de documentos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
