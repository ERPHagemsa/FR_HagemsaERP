"use client";

import { useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  ExternalLink,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
} from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/compartido/componentes/ui/card";
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
import { Separator } from "@/compartido/componentes/ui/separator";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import { PdfVistaPreviaVersion } from "./pdf-vista-previa-version";
import {
  useAnularVersionMutation,
  usePublicarVersionMutation,
  useRedefinirEstructuraMutation,
  useVersionPlantillaQuery,
} from "../servicios/plantillas-queries";
import type {
  AmbitoSeccion,
  ItemFormInput,
  RedefinirEstructuraPayload,
  SeccionFormInput,
  SeccionVersion,
  TipoRespuestaItem,
} from "../tipos/checklist.tipos";

const ETIQUETAS_TIPO_RESPUESTA: Record<TipoRespuestaItem, string> = {
  CONFORMIDAD: "Conformidad (C/NC/NA)",
  MEDICION: "Medición",
  SELECCION: "Selección",
  TEXTO: "Texto libre",
  BOOLEANO: "Sí / No",
};

// ---------------------------------------------------------------------------
// Estado local del form (reducer) — ids del backend NUNCA se usan como key
// estable acá: `redefinir-estructura` los recrea en cada guardado.
// ---------------------------------------------------------------------------

function nuevoId(): string {
  return crypto.randomUUID();
}

function crearItemVacio(): ItemFormInput {
  return {
    clientId: nuevoId(),
    etiqueta: "",
    etiquetaImpresa: null,
    tipoRespuesta: "CONFORMIDAD",
    requerido: true,
    capturaCantidad: false,
    unidad: null,
    rangoMin: null,
    rangoMax: null,
    opciones: null,
  };
}

function crearSeccionVacia(): SeccionFormInput {
  return { clientId: nuevoId(), nombre: "", ambito: "PRINCIPAL", items: [] };
}

function mapearASeccionesForm(secciones: SeccionVersion[]): SeccionFormInput[] {
  return secciones
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((s) => ({
      clientId: nuevoId(),
      nombre: s.nombre,
      ambito: s.ambito,
      items: s.items
        .slice()
        .sort((a, b) => a.orden - b.orden)
        .map((it) => ({
          clientId: nuevoId(),
          etiqueta: it.etiqueta,
          etiquetaImpresa: it.etiquetaImpresa,
          tipoRespuesta: it.tipoRespuesta,
          requerido: it.requerido,
          capturaCantidad: it.capturaCantidad,
          unidad: it.unidad,
          rangoMin: it.rangoMin,
          rangoMax: it.rangoMax,
          opciones: it.opciones,
        })),
    }));
}

type AccionEditor =
  | { tipo: "seed"; secciones: SeccionFormInput[] }
  | { tipo: "agregarSeccion" }
  | { tipo: "eliminarSeccion"; seccionId: string }
  | { tipo: "moverSeccion"; seccionId: string; direccion: -1 | 1 }
  | {
      tipo: "actualizarSeccion";
      seccionId: string;
      patch: Partial<Pick<SeccionFormInput, "nombre" | "ambito">>;
    }
  | { tipo: "agregarItem"; seccionId: string }
  | { tipo: "eliminarItem"; seccionId: string; itemId: string }
  | { tipo: "moverItem"; seccionId: string; itemId: string; direccion: -1 | 1 }
  | { tipo: "actualizarItem"; seccionId: string; itemId: string; patch: Partial<ItemFormInput> };

function moverEnArreglo<T>(arr: T[], indice: number, direccion: -1 | 1): T[] {
  const destino = indice + direccion;
  if (indice < 0 || destino < 0 || destino >= arr.length) return arr;
  const copia = arr.slice();
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  return copia;
}

function seccionesReducer(state: SeccionFormInput[], accion: AccionEditor): SeccionFormInput[] {
  switch (accion.tipo) {
    case "seed":
      return accion.secciones;
    case "agregarSeccion":
      return [...state, crearSeccionVacia()];
    case "eliminarSeccion":
      return state.filter((s) => s.clientId !== accion.seccionId);
    case "moverSeccion": {
      const i = state.findIndex((s) => s.clientId === accion.seccionId);
      return moverEnArreglo(state, i, accion.direccion);
    }
    case "actualizarSeccion":
      return state.map((s) => (s.clientId === accion.seccionId ? { ...s, ...accion.patch } : s));
    case "agregarItem":
      return state.map((s) =>
        s.clientId === accion.seccionId ? { ...s, items: [...s.items, crearItemVacio()] } : s,
      );
    case "eliminarItem":
      return state.map((s) =>
        s.clientId === accion.seccionId
          ? { ...s, items: s.items.filter((it) => it.clientId !== accion.itemId) }
          : s,
      );
    case "moverItem":
      return state.map((s) => {
        if (s.clientId !== accion.seccionId) return s;
        const i = s.items.findIndex((it) => it.clientId === accion.itemId);
        return { ...s, items: moverEnArreglo(s.items, i, accion.direccion) };
      });
    case "actualizarItem":
      return state.map((s) =>
        s.clientId === accion.seccionId
          ? {
              ...s,
              items: s.items.map((it) =>
                it.clientId === accion.itemId ? { ...it, ...accion.patch } : it,
              ),
            }
          : s,
      );
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Fila de ítem
// ---------------------------------------------------------------------------

function FilaItem({
  item,
  index,
  total,
  esPlantillaFiel,
  soloLectura,
  onActualizar,
  onEliminar,
  onMover,
}: {
  item: ItemFormInput;
  index: number;
  total: number;
  esPlantillaFiel: boolean;
  soloLectura: boolean;
  onActualizar: (patch: Partial<ItemFormInput>) => void;
  onEliminar: () => void;
  onMover: (direccion: -1 | 1) => void;
}) {
  // El padre renderiza esta fila con `key={item.clientId}`: si el ítem cambia
  // de identidad (reseed tras guardar), React remonta el componente y este
  // estado local nace de nuevo — no hace falta sincronizarlo en un efecto.
  const [opcionesTexto, setOpcionesTexto] = useState(() => (item.opciones ?? []).join(", "));

  function commitOpciones() {
    const opciones = opcionesTexto
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onActualizar({ opciones: opciones.length ? opciones : null });
  }

  // Estructura bloqueada (solo texto editable): plantilla fiel activa o
  // versión publicada.
  const soloTextoEditable = esPlantillaFiel && !soloLectura;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card p-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Pregunta / ítem</Label>
          {soloLectura ? (
            <p className="text-sm">{item.etiqueta}</p>
          ) : (
            <Input
              value={item.etiqueta}
              onChange={(e) => onActualizar({ etiqueta: e.target.value })}
              placeholder="Ej. Nivel de aceite de motor"
            />
          )}
          {item.etiquetaImpresa ? (
            <p className="text-xs text-muted-foreground">
              Texto impreso original (fijo): <span className="italic">{item.etiquetaImpresa}</span>
            </p>
          ) : null}
        </div>

        {!soloLectura ? (
          <div className="flex items-center gap-1 pt-5">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={index === 0}
              onClick={() => onMover(-1)}
              aria-label="Subir ítem"
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={index === total - 1}
              onClick={() => onMover(1)}
              aria-label="Bajar ítem"
            >
              <ArrowDown />
            </Button>
            {!esPlantillaFiel ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={onEliminar}
                aria-label="Eliminar ítem"
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {soloTextoEditable || soloLectura ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{ETIQUETAS_TIPO_RESPUESTA[item.tipoRespuesta]}</Badge>
          {item.requerido ? <Badge variant="outline">Requerido</Badge> : null}
          {item.tipoRespuesta === "MEDICION" ? (
            <Badge variant="outline">
              {item.unidad ?? "sin unidad"} · rango {item.rangoMin ?? "—"} a {item.rangoMax ?? "—"}
            </Badge>
          ) : null}
          {item.tipoRespuesta === "SELECCION" && item.opciones?.length ? (
            <Badge variant="outline">{item.opciones.join(" / ")}</Badge>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">Tipo de respuesta</Label>
            <Select
              value={item.tipoRespuesta}
              onValueChange={(v) => onActualizar({ tipoRespuesta: v as TipoRespuestaItem })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ETIQUETAS_TIPO_RESPUESTA) as TipoRespuestaItem[]).map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {ETIQUETAS_TIPO_RESPUESTA[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-4 pb-1.5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={item.requerido}
                onCheckedChange={(v) => onActualizar({ requerido: v === true })}
              />
              Requerido
            </label>
            {item.tipoRespuesta === "MEDICION" ? (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={item.capturaCantidad}
                  onCheckedChange={(v) => onActualizar({ capturaCantidad: v === true })}
                />
                Captura cantidad
              </label>
            ) : null}
          </div>

          {item.tipoRespuesta === "MEDICION" ? (
            <>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Unidad</Label>
                <Input
                  value={item.unidad ?? ""}
                  onChange={(e) => onActualizar({ unidad: e.target.value || null })}
                  placeholder="Ej. PSI, mm, %"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Rango mín.</Label>
                  <Input
                    type="number"
                    value={item.rangoMin ?? ""}
                    onChange={(e) =>
                      onActualizar({ rangoMin: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Rango máx.</Label>
                  <Input
                    type="number"
                    value={item.rangoMax ?? ""}
                    onChange={(e) =>
                      onActualizar({ rangoMax: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
              </div>
            </>
          ) : null}

          {item.tipoRespuesta === "SELECCION" ? (
            <div className="grid gap-1.5 sm:col-span-2 lg:col-span-4">
              <Label className="text-xs text-muted-foreground">
                Opciones (separadas por coma)
              </Label>
              <Input
                value={opcionesTexto}
                onChange={(e) => setOpcionesTexto(e.target.value)}
                onBlur={commitOpciones}
                placeholder="Bien, Regular, Malo"
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta de sección
// ---------------------------------------------------------------------------

function TarjetaSeccion({
  seccion,
  index,
  total,
  esPlantillaFiel,
  soloLectura,
  dispatch,
}: {
  seccion: SeccionFormInput;
  index: number;
  total: number;
  esPlantillaFiel: boolean;
  soloLectura: boolean;
  dispatch: (accion: AccionEditor) => void;
}) {
  const estructuraSeccionBloqueada = esPlantillaFiel && !soloLectura;

  return (
    <Card>
      <CardHeader className="gap-3 border-b border-border pb-4">
        <div className="flex items-start gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Nombre de la sección</Label>
            {estructuraSeccionBloqueada || soloLectura ? (
              <CardTitle className="text-base">{seccion.nombre}</CardTitle>
            ) : (
              <Input
                value={seccion.nombre}
                onChange={(e) =>
                  dispatch({
                    tipo: "actualizarSeccion",
                    seccionId: seccion.clientId,
                    patch: { nombre: e.target.value },
                  })
                }
                placeholder="Ej. Motor y fluidos"
              />
            )}
          </div>

          {!soloLectura ? (
            <div className="flex items-center gap-1 pt-5">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => dispatch({ tipo: "moverSeccion", seccionId: seccion.clientId, direccion: -1 })}
                aria-label="Subir sección"
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={index === total - 1}
                onClick={() => dispatch({ tipo: "moverSeccion", seccionId: seccion.clientId, direccion: 1 })}
                aria-label="Bajar sección"
              >
                <ArrowDown />
              </Button>
              {!esPlantillaFiel ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => dispatch({ tipo: "eliminarSeccion", seccionId: seccion.clientId })}
                  aria-label="Eliminar sección"
                >
                  <Trash2 />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {!estructuraSeccionBloqueada && !soloLectura ? (
          <div className="grid max-w-56 gap-1.5">
            <Label className="text-xs text-muted-foreground">Ámbito</Label>
            <Select
              value={seccion.ambito}
              onValueChange={(v) =>
                dispatch({
                  tipo: "actualizarSeccion",
                  seccionId: seccion.clientId,
                  patch: { ambito: v as AmbitoSeccion },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRINCIPAL">Principal</SelectItem>
                <SelectItem value="ACOPLE">Acople (remolque/semirremolque)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Badge variant="outline" className="w-fit">
            Ámbito: {seccion.ambito === "ACOPLE" ? "Acople" : "Principal"}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-5">
        {seccion.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta sección todavía no tiene ítems.</p>
        ) : (
          seccion.items.map((item, itemIndex) => (
            <FilaItem
              key={item.clientId}
              item={item}
              index={itemIndex}
              total={seccion.items.length}
              esPlantillaFiel={esPlantillaFiel}
              soloLectura={soloLectura}
              onActualizar={(patch) =>
                dispatch({
                  tipo: "actualizarItem",
                  seccionId: seccion.clientId,
                  itemId: item.clientId,
                  patch,
                })
              }
              onEliminar={() =>
                dispatch({ tipo: "eliminarItem", seccionId: seccion.clientId, itemId: item.clientId })
              }
              onMover={(direccion) =>
                dispatch({
                  tipo: "moverItem",
                  seccionId: seccion.clientId,
                  itemId: item.clientId,
                  direccion,
                })
              }
            />
          ))
        )}

        {!esPlantillaFiel && !soloLectura ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => dispatch({ tipo: "agregarItem", seccionId: seccion.clientId })}
          >
            <Plus data-icon="inline-start" />
            Agregar ítem
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Confirmaciones — Publicar / Descartar borrador
// ---------------------------------------------------------------------------

function DialogPublicar({
  abierto,
  numeroVersion,
  onCerrar,
  onConfirmar,
  pendiente,
  error,
}: {
  abierto: boolean;
  numeroVersion: number | undefined;
  onCerrar: () => void;
  onConfirmar: () => void;
  pendiente: boolean;
  error: string | null;
}) {
  return (
    <AlertDialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publicar versión {numeroVersion}</AlertDialogTitle>
          <AlertDialogDescription>
            Al publicar, esta versión queda inmutable: para volver a cambiar la estructura va a
            hacer falta crear una versión nueva a partir de esta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo publicar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar} disabled={pendiente}>
            {pendiente ? "Publicando..." : "Publicar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DialogDescartar({
  abierto,
  onCerrar,
  onConfirmar,
  pendiente,
  error,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => void;
  pendiente: boolean;
  error: string | null;
}) {
  return (
    <AlertDialog open={abierto} onOpenChange={(open) => !open && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar borrador</AlertDialogTitle>
          <AlertDialogDescription>
            Se anula este borrador. Esta información ya no se podrá recuperar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo descartar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirmar} disabled={pendiente}>
            {pendiente ? "Descartando..." : "Descartar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function PlantillaVersionEditor({
  plantillaId,
  versionId,
}: {
  plantillaId: number;
  versionId: number;
}) {
  const router = useRouter();
  const consulta = useVersionPlantillaQuery(versionId);
  const version = consulta.data;

  const [secciones, dispatch] = useReducer(seccionesReducer, [] as SeccionFormInput[]);
  // Sembrado inicial del form a partir del GET. Ajustar estado en el cuerpo del
  // render (no en un efecto) evita el re-render en cascada post-commit — mismo
  // patrón que React recomienda para "resetear estado cuando cambia una prop".
  const [seededVersionId, setSeededVersionId] = useState<number | null>(null);
  if (version && seededVersionId !== version.id) {
    dispatch({ tipo: "seed", secciones: mapearASeccionesForm(version.secciones) });
    setSeededVersionId(version.id);
  }

  const formulario = version?.presentacion?.formulario ?? null;
  const esPlantillaFiel = Boolean(formulario);
  const soloLectura = version?.publicada === true;

  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const guardar = useRedefinirEstructuraMutation(versionId, {
    onSuccess: async () => {
      setErrorGuardar(null);
      const { data } = await consulta.refetch();
      if (data) {
        dispatch({ tipo: "seed", secciones: mapearASeccionesForm(data.secciones) });
      }
    },
    onError: (err) => setErrorGuardar(extraerMensajeError(err)),
  });

  const [dialogPublicarAbierto, setDialogPublicarAbierto] = useState(false);
  const [errorPublicar, setErrorPublicar] = useState<string | null>(null);
  const publicar = usePublicarVersionMutation(versionId, {
    onSuccess: () => {
      setErrorPublicar(null);
      setDialogPublicarAbierto(false);
      router.push(`/flota/checklist/plantillas/${plantillaId}`);
    },
    onError: (err) => setErrorPublicar(extraerMensajeError(err)),
  });

  const [dialogDescartarAbierto, setDialogDescartarAbierto] = useState(false);
  const [errorDescartar, setErrorDescartar] = useState<string | null>(null);
  const descartar = useAnularVersionMutation(versionId, plantillaId, {
    onSuccess: () => {
      setErrorDescartar(null);
      setDialogDescartarAbierto(false);
      router.push(`/flota/checklist/plantillas/${plantillaId}`);
    },
    onError: (err) => setErrorDescartar(extraerMensajeError(err)),
  });

  function handleGuardar() {
    const payload: RedefinirEstructuraPayload = {
      secciones: secciones.map((s, si) => ({
        nombre: s.nombre.trim(),
        orden: si + 1,
        ambito: s.ambito,
        items: s.items.map((it, ii) => ({
          etiqueta: it.etiqueta.trim(),
          etiquetaImpresa: it.etiquetaImpresa,
          tipoRespuesta: it.tipoRespuesta,
          requerido: it.requerido,
          capturaCantidad: it.capturaCantidad,
          unidad: it.unidad,
          rangoMin: it.rangoMin,
          rangoMax: it.rangoMax,
          opciones: it.opciones,
          orden: ii + 1,
        })),
      })),
    };
    setErrorGuardar(null);
    guardar.mutate(payload);
  }

  if (consulta.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (consulta.error || !version) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar la versión</AlertTitle>
        <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="flex min-w-0 flex-col gap-5">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CardTitle>Versión {version.numeroVersion}</CardTitle>
            <Badge variant={soloLectura ? "default" : "outline"}>
              {version.estadoRegistro === "ANULADO"
                ? "Anulada"
                : soloLectura
                  ? "Publicada"
                  : "Borrador"}
            </Badge>
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" asChild>
            <a
              href={`/api/flota/plantillas-versiones/${versionId}/preview-pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink data-icon="inline-start" />
              Ver vista previa (PDF)
            </a>
          </Button>
        </CardHeader>
      </Card>

      {soloLectura ? (
        <Alert>
          <AlertTitle>Versión publicada — solo lectura</AlertTitle>
          <AlertDescription>
            Esta versión es inmutable. Para modificar su estructura hay que crear una versión
            nueva desde el listado de versiones de la plantilla.
          </AlertDescription>
        </Alert>
      ) : null}

      {esPlantillaFiel && !soloLectura ? (
        <Alert>
          <ShieldAlert />
          <AlertTitle>Formato de impresión fijo (documento legal)</AlertTitle>
          <AlertDescription>
            Esta plantilla tiene un formato de impresión fijo (documento legal). Solo se puede
            editar el texto de las preguntas existentes — agregar o quitar preguntas requiere
            rediseñar el formato impreso.
          </AlertDescription>
        </Alert>
      ) : null}

      {errorGuardar ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{errorGuardar}</AlertDescription>
        </Alert>
      ) : null}

      {secciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {soloLectura ? "Esta versión no tiene secciones." : "Todavía no hay secciones. Agregá la primera."}
        </p>
      ) : (
        secciones.map((seccion, index) => (
          <TarjetaSeccion
            key={seccion.clientId}
            seccion={seccion}
            index={index}
            total={secciones.length}
            esPlantillaFiel={esPlantillaFiel}
            soloLectura={soloLectura}
            dispatch={dispatch}
          />
        ))
      )}

      {!esPlantillaFiel && !soloLectura ? (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => dispatch({ tipo: "agregarSeccion" })}
        >
          <Plus data-icon="inline-start" />
          Agregar sección
        </Button>
      ) : null}

      {!soloLectura ? (
        <>
          <Separator />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDialogDescartarAbierto(true)}
            >
              <Ban data-icon="inline-start" />
              Descartar borrador
            </Button>
            <Button type="button" variant="outline" onClick={handleGuardar} disabled={guardar.isPending}>
              {guardar.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
            <Button type="button" onClick={() => setDialogPublicarAbierto(true)}>
              <Send data-icon="inline-start" />
              Publicar
            </Button>
          </div>
        </>
      ) : null}

      <DialogPublicar
        abierto={dialogPublicarAbierto}
        numeroVersion={version.numeroVersion}
        onCerrar={() => setDialogPublicarAbierto(false)}
        onConfirmar={() => publicar.mutate()}
        pendiente={publicar.isPending}
        error={errorPublicar}
      />
      <DialogDescartar
        abierto={dialogDescartarAbierto}
        onCerrar={() => setDialogDescartarAbierto(false)}
        onConfirmar={() => descartar.mutate()}
        pendiente={descartar.isPending}
        error={errorDescartar}
      />
      </div>

      <aside className="hidden lg:block">
        <PdfVistaPreviaVersion versionId={versionId} dependencia={version.secciones} />
      </aside>
    </div>
  );
}
