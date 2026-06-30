"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileUp,
  Layers,
  Search,
  Trash2,
  Upload,
  X,
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
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
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
import {
  buscarActivosPorCodigoOPlaca,
  obtenerTiposDocumento,
  procesarCargaMasivaDocumentos,
} from "../servicios/activos-api";
import type { Activo } from "../tipos/activo.tipos";
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
  const [seleccionados, setSeleccionados] = React.useState<Activo[]>([]);
  const [prellenado, setPrellenado] = React.useState(false);
  const [busquedaTexto, setBusquedaTexto] = React.useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = React.useState<Activo[]>(
    [],
  );
  const [buscando, setBuscando] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);
  const [resultado, setResultado] =
    React.useState<CargaMasivaDocumentosResultado | null>(null);
  const [tiposMaestro, setTiposMaestro] = React.useState<
    TipoDocumentoMaestro[]
  >([]);
  const [codigosLote, setCodigosLote] = React.useState<string[]>([]);

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

  // Si llegamos desde "Agregar documentos a estos activos" (carga masiva de
  // activos), traemos los codigos del lote para prellenar placas si el
  // siguiente documento resulta ser compartido (ej. poliza de flota).
  React.useEffect(() => {
    const guardado = window.sessionStorage.getItem(
      "activos:loteParaDocumentos",
    );
    if (!guardado) return;
    window.sessionStorage.removeItem("activos:loteParaDocumentos");
    try {
      const codigos = JSON.parse(guardado);
      if (Array.isArray(codigos) && codigos.length > 0) {
        setCodigosLote(codigos);
      }
    } catch {
      // Dato corrupto: se ignora, el usuario escribe las placas a mano.
    }
  }, []);

  const tipoMeta = React.useMemo(
    () => tiposMaestro.find((tipo) => tipo.codigo === tipoDocumento),
    [tiposMaestro, tipoDocumento],
  );
  const esCompartido = tipoMeta?.alcance === "COMPARTIDO";
  const requiereVencimiento = tipoMeta?.requiereVencimiento ?? false;
  const placasCompartido = React.useMemo(
    () => seleccionados.map((activo) => activo.codigo),
    [seleccionados],
  );

  // Busqueda con debounce: por codigo o placa, para tildar activos en vez de
  // escribirlos de memoria.
  React.useEffect(() => {
    if (!esCompartido || !busquedaTexto.trim()) {
      setResultadosBusqueda([]);
      return;
    }
    let cancelado = false;
    setBuscando(true);
    const temporizador = setTimeout(() => {
      buscarActivosPorCodigoOPlaca(busquedaTexto)
        .then((activos) => {
          if (!cancelado) setResultadosBusqueda(activos);
        })
        .catch(() => {
          if (!cancelado) setResultadosBusqueda([]);
        })
        .finally(() => {
          if (!cancelado) setBuscando(false);
        });
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [busquedaTexto, esCompartido]);

  function toggleSeleccionado(activo: Activo, marcar: boolean) {
    setPrellenado(false);
    setSeleccionados((actuales) =>
      marcar
        ? actuales.some((a) => a.id === activo.id)
          ? actuales
          : [...actuales, activo]
        : actuales.filter((a) => a.id !== activo.id),
    );
  }

  function reiniciar() {
    setPaso("configurar");
    setArchivos([]);
    setResultado(null);
    setFechaVencimiento("");
    setSeleccionados([]);
    setPrellenado(false);
    setBusquedaTexto("");
    setResultadosBusqueda([]);
  }

  function cambiarTipo(valor: TipoDocumentoCarga) {
    setTipoDocumento(valor);
    // El alcance cambia el flujo: reiniciamos la seleccion para evitar mezclas.
    setArchivos([]);
    setBusquedaTexto("");
    setResultadosBusqueda([]);
    const metaNuevoTipo = tiposMaestro.find((tipo) => tipo.codigo === valor);
    const esCompartidoNuevo = metaNuevoTipo?.alcance === "COMPARTIDO";
    if (esCompartidoNuevo && codigosLote.length > 0) {
      // Si venimos de un lote recien creado y el tipo es compartido (poliza),
      // pre-tildamos esos activos en vez de dejar la seleccion vacia.
      Promise.all(
        codigosLote.map((codigo) => buscarActivosPorCodigoOPlaca(codigo)),
      ).then((resultados) => {
        const encontrados = resultados
          .flat()
          .filter((activo, i, arr) =>
            codigosLote.includes(activo.codigo) &&
            arr.findIndex((a) => a.id === activo.id) === i,
          );
        setSeleccionados(encontrados);
        setPrellenado(encontrados.length > 0);
      });
    } else {
      setSeleccionados([]);
      setPrellenado(false);
    }
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
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Buscar activos que cubre este documento</Label>
                  {prellenado && (
                    <p className="text-xs text-sky-700 dark:text-sky-400">
                      Pre-tildados los {seleccionados.length} activo(s) que
                      acabas de crear. Destilda los que no apliquen.
                    </p>
                  )}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Buscar por placa o codigo (ej: BTZ-750, ACT-000901)"
                      value={busquedaTexto}
                      onChange={(e) => setBusquedaTexto(e.target.value)}
                    />
                  </div>
                  {busquedaTexto.trim() && (
                    <div className="max-h-48 overflow-auto rounded-lg border">
                      {buscando ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          Buscando...
                        </p>
                      ) : resultadosBusqueda.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          Sin resultados para &quot;{busquedaTexto}&quot;.
                        </p>
                      ) : (
                        resultadosBusqueda.map((activo) => {
                          const marcado = seleccionados.some(
                            (a) => a.id === activo.id,
                          );
                          return (
                            <label
                              key={activo.id}
                              htmlFor={`activo-${activo.id}`}
                              className="flex cursor-pointer items-center gap-3 border-b p-2.5 last:border-b-0 hover:bg-accent"
                            >
                              <Checkbox
                                id={`activo-${activo.id}`}
                                checked={marcado}
                                onCheckedChange={(checked) =>
                                  toggleSeleccionado(activo, Boolean(checked))
                                }
                              />
                              <span className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {activo.codigo}
                                  {activo.vehiculo?.placa
                                    ? ` — ${activo.vehiculo.placa}`
                                    : ""}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {activo.descripcion}
                                </span>
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Seleccionados ({seleccionados.length})
                  </Label>
                  {seleccionados.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Busca arriba y marca los activos que cubre este
                      documento.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {seleccionados.map((activo) => (
                        <Badge
                          key={activo.id}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {activo.codigo}
                          <button
                            type="button"
                            aria-label={`Quitar ${activo.codigo}`}
                            onClick={() => toggleSeleccionado(activo, false)}
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
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
