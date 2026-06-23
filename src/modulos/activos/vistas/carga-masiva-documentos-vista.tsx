"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileUp,
  Layers,
  Trash2,
  Upload,
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
import { Textarea } from "@/compartido/componentes/ui/textarea";
import { cn } from "@/compartido/utilidades/utils";
import {
  obtenerTiposDocumento,
  procesarCargaMasivaDocumentos,
} from "../servicios/activos-api";
import type {
  ArchivoDocumentoMasivo,
  CargaMasivaDocumentosResultado,
  TipoDocumentoCarga,
  TipoDocumentoMaestro,
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

/** Separa placas/codigos escritos por el usuario (saltos, comas, espacios). */
function parsearPlacas(texto: string): string[] {
  return Array.from(
    new Set(
      texto
        .split(/[\s,;]+/)
        .map((valor) => valor.trim().toUpperCase())
        .filter((valor) => valor.length > 0),
    ),
  );
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
  const [placasTexto, setPlacasTexto] = React.useState("");
  const [procesando, setProcesando] = React.useState(false);
  const [resultado, setResultado] =
    React.useState<CargaMasivaDocumentosResultado | null>(null);
  const [tiposMaestro, setTiposMaestro] = React.useState<
    TipoDocumentoMaestro[]
  >([]);

  // Maestro Documentario: define alcance y si el tipo requiere vencimiento.
  React.useEffect(() => {
    let activo = true;
    obtenerTiposDocumento()
      .then((tipos) => {
        if (activo) setTiposMaestro(tipos);
      })
      .catch(() => {
        // Si falla, se asume comportamiento INDIVIDUAL (como antes).
      });
    return () => {
      activo = false;
    };
  }, []);

  const tipoMeta = React.useMemo(
    () => tiposMaestro.find((tipo) => tipo.codigo === tipoDocumento),
    [tiposMaestro, tipoDocumento],
  );
  const esCompartido = tipoMeta?.alcance === "COMPARTIDO";
  const requiereVencimiento = tipoMeta?.requiereVencimiento ?? false;
  const placasCompartido = React.useMemo(
    () => parsearPlacas(placasTexto),
    [placasTexto],
  );

  function reiniciar() {
    setPaso("configurar");
    setArchivos([]);
    setResultado(null);
    setFechaVencimiento("");
    setPlacasTexto("");
  }

  function cambiarTipo(valor: TipoDocumentoCarga) {
    setTipoDocumento(valor);
    // El alcance cambia el flujo: reiniciamos la seleccion para evitar mezclas.
    setArchivos([]);
    setPlacasTexto("");
    setPaso("configurar");
  }

  async function onArchivos(event: React.ChangeEvent<HTMLInputElement>) {
    const lista = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (lista.length === 0) return;

    const validos: File[] = [];
    for (const file of lista) {
      if (file.size > TAM_MAX_MB * 1024 * 1024) {
        toast.error(`${file.name} supera ${TAM_MAX_MB} MB y se omitio.`);
        continue;
      }
      validos.push(file);
    }
    if (validos.length === 0) return;

    if (esCompartido) {
      // Un solo documento (ej. poliza) que luego se abre a varias placas.
      const file = validos[0];
      setArchivos([
        {
          nombreArchivo: file.name,
          identificador: "",
          tipoDocumento,
          fechaVencimiento: fechaVencimiento || undefined,
          contenidoBase64: await archivoADataUrl(file),
        },
      ]);
      return;
    }

    const nuevos: ArchivoDocumentoMasivo[] = [];
    for (const file of validos) {
      nuevos.push({
        nombreArchivo: file.name,
        identificador: identificadorDesdeNombre(file.name),
        tipoDocumento,
        fechaVencimiento: fechaVencimiento || undefined,
        contenidoBase64: await archivoADataUrl(file),
      });
    }
    setArchivos((actuales) => [...actuales, ...nuevos]);
    setPaso("revisar");
  }

  function quitarArchivo(indice: number) {
    setArchivos((actuales) => actuales.filter((_, i) => i !== indice));
  }

  async function confirmar() {
    if (archivos.length === 0) return;
    if (requiereVencimiento && !fechaVencimiento) {
      toast.error("Este tipo de documento requiere fecha de vencimiento.");
      return;
    }
    if (esCompartido && placasCompartido.length === 0) {
      toast.error("Indica al menos una placa o codigo que cubra el documento.");
      return;
    }

    setProcesando(true);
    try {
      const datos = await procesarCargaMasivaDocumentos({
        archivos: archivos.map((archivo) => ({
          ...archivo,
          tipoDocumento,
          fechaVencimiento: fechaVencimiento || archivo.fechaVencimiento,
          ...(esCompartido
            ? {
                identificador: placasCompartido[0],
                identificadores: placasCompartido,
              }
            : {}),
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
              Sube documentos (SOAT, polizas, etc.) y se asocian solos al
              activo. El tipo define si el documento es de un activo o
              compartido por varios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {esCompartido ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sm dark:border-sky-900 dark:bg-sky-950/30">
                <p className="flex items-center gap-2 font-medium text-sky-800 dark:text-sky-300">
                  <Layers className="size-4" />
                  Documento compartido
                </p>
                <p className="mt-1 text-muted-foreground">
                  Este tipo cubre <strong>varios activos</strong> (ej. una
                  poliza de flota). Sube <strong>un solo archivo</strong> e
                  indica las placas o codigos que cubre. Se asociara a cada uno.
                </p>
              </div>
            ) : (
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
                    <code>ACT-000901.pdf</code> &rarr; activo con codigo
                    ACT-000901
                  </li>
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select
                  value={tipoDocumento}
                  onValueChange={(v) => cambiarTipo(v as TipoDocumentoCarga)}
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
                  {esCompartido
                    ? "Compartido: un archivo para varias placas."
                    : "Aplica a todos los archivos de este lote."}
                </p>
              </div>
              <div className="space-y-2">
                <Label>
                  Fecha de vencimiento{" "}
                  {requiereVencimiento ? (
                    <span className="text-destructive">(obligatorio)</span>
                  ) : (
                    "(opcional)"
                  )}
                </Label>
                <Input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className={cn(
                    requiereVencimiento &&
                      !fechaVencimiento &&
                      "border-destructive",
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Comun para SOAT/poliza del mismo periodo.
                </p>
              </div>
            </div>

            {esCompartido && (
              <div className="space-y-2">
                <Label>Placas o codigos que cubre</Label>
                <Textarea
                  rows={3}
                  placeholder="Ej: ABC-123, DEF-456, ACT-000901"
                  value={placasTexto}
                  onChange={(e) => setPlacasTexto(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separa por coma, espacio o salto de linea.{" "}
                  {placasCompartido.length > 0 &&
                    `${placasCompartido.length} placa(s) detectada(s).`}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="archivos-docs">
                <input
                  id="archivos-docs"
                  type="file"
                  multiple={!esCompartido}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={onArchivos}
                />
                <Button type="button" asChild>
                  <span className="cursor-pointer">
                    <Upload className="size-4" />
                    {esCompartido
                      ? "Seleccionar documento"
                      : "Seleccionar documentos"}
                  </span>
                </Button>
              </label>

              {esCompartido && archivos.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {archivos[0].nombreArchivo}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="ml-auto"
                    disabled={placasCompartido.length === 0}
                    onClick={() => setPaso("revisar")}
                  >
                    Continuar
                  </Button>
                </>
              )}
            </div>
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
                  {esCompartido
                    ? `1 documento para ${placasCompartido.length} activo(s).`
                    : `${archivos.length} archivo(s). Verifica que el identificador (placa/codigo) sea correcto antes de cargar.`}
                </CardDescription>
              </div>
              <Badge variant={esCompartido ? "default" : "outline"}>
                {esCompartido && <Layers className="mr-1 size-3" />}
                {TIPOS_DOCUMENTO.find((t) => t.valor === tipoDocumento)
                  ?.etiqueta}
                {esCompartido ? " - compartido" : ""}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {esCompartido ? (
              <div className="space-y-3">
                <div className="rounded-lg border p-3 text-sm">
                  <span className="text-muted-foreground">Documento:</span>{" "}
                  <span className="font-medium">
                    {archivos[0]?.nombreArchivo}
                  </span>
                </div>
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Se asociara a estas placas/codigos:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {placasCompartido.map((placa) => (
                      <Badge key={placa} variant="secondary">
                        {placa}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
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
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPaso("configurar")}
                >
                  Volver
                </Button>
                {!esCompartido && (
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
                )}
              </div>
              <Button
                type="button"
                onClick={confirmar}
                disabled={archivos.length === 0 || procesando}
              >
                {procesando
                  ? "Cargando..."
                  : esCompartido
                    ? `Cargar a ${placasCompartido.length} activo(s)`
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
