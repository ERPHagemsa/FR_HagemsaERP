"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Cloud,
  CloudOff,
  Download,
  Loader2,
  Lock,
} from "lucide-react";

import { extraerMensajeError, obtenerStatusError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
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
import { Separator } from "@/compartido/componentes/ui/separator";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/compartido/componentes/ui/toggle-group";
import {
  useAutoguardarRespuestasMutation,
  useCerrarInspeccionMutation,
  useInspeccionQuery,
} from "../servicios/inspecciones-queries";
import { descargarPdfInspeccion } from "../servicios/inspeccion-api";
import type {
  EstadoItem,
  Inspeccion,
  InspeccionItem,
  InspeccionNeumatico,
  LecturaNeumaticoPayload,
  RespuestaItemPayload,
} from "../tipos/inspeccion.tipos";

// El disparo principal del autoguardado es el blur (o una acción discreta ya
// completa, como un toggle) — no cada tecla. Este timer es solo una red de
// seguridad para el caso en que un campo se quede enfocado mucho tiempo sin
// que el usuario pase a otro (así no se pierde una edición larga).
const RETRASO_AUTOGUARDADO_SEGURIDAD_MS = 4000;
// Backoff exponencial ante error de red/servidor, topado en este intervalo —
// pero SIN límite de intentos: el autoguardado existe justamente para
// sobrevivir un corte de red temporal, así que ante un error reintentable
// nunca se rinde solo mientras queden cambios sin guardar (ver flush()). Un
// abandono automático definitivo solo aplica a errores NO reintentables
// (validación 4xx), donde insistir con el mismo payload no cambia nada.
const RETRASO_MAXIMO_REINTENTO_MS = 30_000;

type RespuestaLocal = {
  estadoItem: EstadoItem;
  cantidad: number | null;
  valorNumerico: number | null;
  valorTexto: string | null;
  valorBooleano: boolean | null;
  observacion: string | null;
};

type NeumaticoLocal = {
  cocadaMm: number | null;
  otro: string | null;
};

// Mismo criterio que Inspeccion.estaRespondido() en el backend (dominio) —
// por tipo de respuesta, ¿ya tiene un valor capturado?
function estaRespondido(item: InspeccionItem, r: RespuestaLocal): boolean {
  switch (item.tipoRespuesta) {
    case "CONFORMIDAD":
      return r.estadoItem !== "SIN_RESPONDER";
    case "MEDICION":
      return r.valorNumerico != null;
    case "SELECCION":
    case "TEXTO":
      return !!r.valorTexto;
    case "BOOLEANO":
      return r.valorBooleano != null;
    default:
      return false;
  }
}

// Badge de progreso por sección: solo cuenta OBLIGATORIOS pendientes (son los
// que de verdad bloquean pasar a COMPLETA); mezclar con opcionales confundiría
// más de lo que ayuda. Sin obligatorios en la sección, no muestra nada.
function BadgeSeccion({
  items,
  respuestas,
}: {
  items: InspeccionItem[];
  respuestas: Record<string, RespuestaLocal>;
}) {
  const requeridos = items.filter((i) => i.requerido);
  if (requeridos.length === 0) return null;
  const pendientes = requeridos.filter((i) => {
    const r = respuestas[i.id];
    return !r || !estaRespondido(i, r);
  }).length;
  if (pendientes === 0) {
    return (
      <Badge variant="secondary" className="gap-1 text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" /> Completa
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
      {pendientes} {pendientes === 1 ? "pendiente" : "pendientes"}
    </Badge>
  );
}

function respuestaDesdeItem(item: InspeccionItem): RespuestaLocal {
  return {
    estadoItem: item.estadoItem,
    cantidad: item.cantidad,
    valorNumerico: item.valorNumerico,
    valorTexto: item.valorTexto,
    valorBooleano: item.valorBooleano,
    observacion: item.observacion,
  };
}

function neumaticoDesdeLectura(n: InspeccionNeumatico): NeumaticoLocal {
  return { cocadaMm: n.cocadaMm, otro: n.otro };
}

type EstadoAutoguardado = "idle" | "pendiente" | "guardando" | "guardado" | "error";

function IndicadorGuardado({ estado }: { estado: EstadoAutoguardado }) {
  switch (estado) {
    case "pendiente":
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CloudOff className="size-3.5" /> Cambios sin guardar...
        </span>
      );
    case "guardando":
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Guardando...
        </span>
      );
    case "guardado":
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
          <Cloud className="size-3.5" /> Guardado
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="size-3.5" /> No se pudo guardar
        </span>
      );
    default:
      return null;
  }
}

function DatoOperacion({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{etiqueta}</span>
      <span className="text-sm font-medium">{valor ?? "—"}</span>
    </div>
  );
}

export function InspeccionCaptura({ inspeccionId }: { inspeccionId: number }) {
  const router = useRouter();
  const consulta = useInspeccionQuery(inspeccionId);
  const inspeccion = consulta.data;

  // Estado local editable (server es la fuente al cargar; luego el usuario edita
  // localmente y el autoguardado sincroniza en segundo plano).
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaLocal>>({});
  const [neumaticosLocal, setNeumaticosLocal] = useState<Record<string, NeumaticoLocal>>({});
  const [estadoActual, setEstadoActual] = useState<Inspeccion["estado"] | null>(null);
  const seededRef = useRef<number | null>(null);
  // Secciones CERRADAS por el usuario (set vacío = todo abierto por defecto).
  // Plegable simple (mostrar/ocultar), sin animación de altura: el Accordion
  // compartido (Radix, h-(--radix-accordion-content-height)) mide mal el alto
  // con una tabla grande de inputs interactivos y deja el contenido recortado.
  const [seccionesCerradas, setSeccionesCerradas] = useState<Set<number>>(new Set());

  function alternarSeccion(id: number) {
    setSeccionesCerradas((actual) => {
      const siguiente = new Set(actual);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  // Mapas "sucios": id -> valor vigente en el momento de la edición. Se pueblan
  // directamente en los handlers (no en updaters de setState, que deben ser
  // puros) y `flush` los lee sin depender de refs-espejo del estado React.
  const dirtyItemsRef = useRef<Record<string, RespuestaLocal>>({});
  const dirtyNeumaticosRef = useRef<Record<string, NeumaticoLocal>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Reintentos consecutivos por error de red/servidor (5xx o sin respuesta).
  // Se resetea en cada envío exitoso.
  const reintentosRef = useRef(0);
  const [autoguardadoEstado, setAutoguardadoEstado] = useState<EstadoAutoguardado>("idle");

  const autoguardar = useAutoguardarRespuestasMutation(inspeccionId);

  const cerrar = useCerrarInspeccionMutation(inspeccionId, {
    onSuccess: () => {
      toast.success("Inspección confirmada y firmada");
      void consulta.refetch();
    },
    onError: (err) => toast.error(extraerMensajeError(err)),
  });

  const [descargandoPdf, setDescargandoPdf] = useState(false);

  async function handleDescargarPdf() {
    setDescargandoPdf(true);
    try {
      const blob = await descargarPdfInspeccion(inspeccionId);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `checklist-${inspeccion?.codigo ?? inspeccionId}.pdf`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extraerMensajeError(err));
    } finally {
      setDescargandoPdf(false);
    }
  }

  // Seed inicial: una sola vez por inspección cargada.
  useEffect(() => {
    if (!inspeccion || seededRef.current === inspeccion.id) return;
    seededRef.current = inspeccion.id;

    const respuestasIniciales: Record<string, RespuestaLocal> = {};
    for (const seccion of inspeccion.secciones) {
      for (const item of seccion.items) {
        respuestasIniciales[item.id] = respuestaDesdeItem(item);
      }
    }
    const neumaticosIniciales: Record<string, NeumaticoLocal> = {};
    for (const n of inspeccion.neumaticos) {
      neumaticosIniciales[n.id] = neumaticoDesdeLectura(n);
    }

    setRespuestas(respuestasIniciales);
    setNeumaticosLocal(neumaticosIniciales);
    setEstadoActual(inspeccion.estado);
    dirtyItemsRef.current = {};
    dirtyNeumaticosRef.current = {};
    setAutoguardadoEstado("idle");
  }, [inspeccion]);

  function programarGuardado() {
    setAutoguardadoEstado("pendiente");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, RETRASO_AUTOGUARDADO_SEGURIDAD_MS);
  }

  // Dispara el guardado ya, sin esperar el timer de seguridad. Se usa en
  // blur (el usuario terminó con ese campo) y en acciones discretas que ya
  // son un cambio completo (toggles de conformidad/booleano).
  function flushInmediato() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    flush();
  }

  function flush() {
    const entradasItems = Object.entries(dirtyItemsRef.current);
    const entradasNeumaticos = Object.entries(dirtyNeumaticosRef.current);
    if (entradasItems.length === 0 && entradasNeumaticos.length === 0) return;

    dirtyItemsRef.current = {};
    dirtyNeumaticosRef.current = {};
    setAutoguardadoEstado("guardando");

    const respuestasPayload: RespuestaItemPayload[] = entradasItems.map(([itemId, r]) => ({
      itemId: Number(itemId),
      estadoItem: r.estadoItem !== "SIN_RESPONDER" ? r.estadoItem : undefined,
      cantidad: r.cantidad,
      valorNumerico: r.valorNumerico,
      valorTexto: r.valorTexto,
      valorBooleano: r.valorBooleano,
      observacion: r.observacion,
    }));

    const neumaticosPayload: LecturaNeumaticoPayload[] = entradasNeumaticos.map(
      ([neumaticoId, n]) => ({ neumaticoId: Number(neumaticoId), cocadaMm: n.cocadaMm, otro: n.otro }),
    );

    autoguardar
      .mutateAsync({ respuestas: respuestasPayload, neumaticos: neumaticosPayload })
      .then((actualizada) => {
        // Avisar la recuperación solo si venía de fallar de verdad (no en
        // cada guardado normal) — responde a "¿si vuelve la red se guarda
        // todo como si nada hubiera pasado?": sí, y esto se lo confirma al
        // usuario en vez de dejarlo adivinar.
        if (reintentosRef.current > 0) {
          toast.success("Conexión recuperada: los cambios pendientes se guardaron.");
        }
        reintentosRef.current = 0;
        setEstadoActual(actualizada.estado);
        setAutoguardadoEstado("guardado");
        setTimeout(() => {
          setAutoguardadoEstado((actual) => (actual === "guardado" ? "idle" : actual));
        }, 2000);
      })
      .catch((err) => {
        // Re-marcamos como sucios (sin pisar una edición más nueva que ya haya
        // vuelto a ensuciar el mismo id): el dato del usuario no se pierde
        // aunque el envío haya fallado. Este pool es acumulado (no por
        // intento): la próxima vez que algo dispare un flush —el propio
        // reintento, o cualquier otra edición/blur mientras tanto— se manda
        // TODO lo pendiente junto, incluido esto.
        for (const [id, v] of entradasItems) {
          if (!(id in dirtyItemsRef.current)) dirtyItemsRef.current[id] = v;
        }
        for (const [id, v] of entradasNeumaticos) {
          if (!(id in dirtyNeumaticosRef.current)) dirtyNeumaticosRef.current[id] = v;
        }
        setAutoguardadoEstado("error");

        const status = obtenerStatusError(err);
        // Sin respuesta (status 0) o 5xx: falla transitoria de red/servidor —
        // se reintenta solo SIN límite de intentos (ver comentario en la
        // constante). 4xx (ej. una validación de dominio) es permanente:
        // reintentar el mismo payload jamás va a funcionar, así que NO se
        // reprograma solo — se avisa y se espera a que el usuario corrija el
        // campo (lo que dispara un nuevo intento por su cuenta).
        const reintentable = status === null || status === 0 || status >= 500;

        if (!reintentable) {
          reintentosRef.current = 0;
          toast.error(
            extraerMensajeError(err, "No se pudo guardar: revise el valor ingresado."),
          );
          return;
        }

        reintentosRef.current += 1;
        // Solo se avisa al empezar a fallar, no en cada intento — con una
        // caída larga esto reintentaría decenas de veces y no hace falta
        // repetir el mismo toast cada vez.
        if (reintentosRef.current === 1) {
          toast.error(
            "Sin conexión con el servidor. Los cambios quedan pendientes y se reintenta solo en segundo plano.",
          );
        }

        const espera = Math.min(
          RETRASO_AUTOGUARDADO_SEGURIDAD_MS * 2 ** (reintentosRef.current - 1),
          RETRASO_MAXIMO_REINTENTO_MS,
        );
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, espera);
      });
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function actualizarRespuesta(
    itemId: number,
    patch: Partial<RespuestaLocal>,
    opciones?: { inmediato?: boolean },
  ) {
    const nuevo: RespuestaLocal = { ...respuestas[itemId], ...patch };
    dirtyItemsRef.current[itemId] = nuevo;
    setRespuestas((actual) => ({ ...actual, [itemId]: nuevo }));
    if (opciones?.inmediato) flushInmediato();
    else programarGuardado();
  }

  function actualizarNeumatico(neumaticoId: number, patch: Partial<NeumaticoLocal>) {
    const nuevo: NeumaticoLocal = { ...neumaticosLocal[neumaticoId], ...patch };
    dirtyNeumaticosRef.current[neumaticoId] = nuevo;
    setNeumaticosLocal((actual) => ({ ...actual, [neumaticoId]: nuevo }));
    programarGuardado();
  }

  const neumaticosPorGrupo = useMemo(() => {
    const grupos = new Map<string, InspeccionNeumatico[]>();
    for (const n of inspeccion?.neumaticos ?? []) {
      const arr = grupos.get(n.grupo) ?? [];
      arr.push(n);
      grupos.set(n.grupo, arr);
    }
    for (const arr of grupos.values()) arr.sort((a, b) => a.orden - b.orden);
    return [...grupos.entries()];
  }, [inspeccion]);

  if (consulta.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (consulta.error || !inspeccion) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar la inspección</AlertTitle>
        <AlertDescription>
          {consulta.error ? extraerMensajeError(consulta.error) : "No encontrada."}
        </AlertDescription>
      </Alert>
    );
  }

  const secciones = [...inspeccion.secciones].sort((a, b) => a.orden - b.orden);
  const esInmutable = (estadoActual ?? inspeccion.estado) === "CONFIRMADA";
  // `autoguardadoEstado` cubre todo el ciclo (se pone "pendiente" en cada
  // edición y solo vuelve a "idle"/"guardado" tras un flush exitoso), por lo
  // que basta como señal de "hay cambios sin confirmar guardado" sin leer
  // refs. "error" cuenta también: desde que dejamos de reintentar solo ante
  // un fallo permanente (ver flush), quedarse en "error" SÍ significa que hay
  // una edición sin guardar — no debe poder confirmarse por encima de eso.
  const hayPendientes =
    autoguardadoEstado === "pendiente" ||
    autoguardadoEstado === "guardando" ||
    autoguardadoEstado === "error";
  const puedeConfirmar =
    !esInmutable && (estadoActual ?? inspeccion.estado) === "COMPLETA" && !hayPendientes;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // Si queda algo sin guardar (recién tipeado, aún dentro de la
            // ventana de seguridad) lo mandamos antes de salir — la request
            // sigue en vuelo aunque el componente se desmonte al navegar.
            flushInmediato();
            router.push("/flota/checklist/inspecciones");
          }}
        >
          <ArrowLeft data-icon="inline-start" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          {!esInmutable ? <IndicadorGuardado estado={autoguardadoEstado} /> : null}
          <Badge variant={esInmutable ? "default" : (estadoActual ?? inspeccion.estado) === "COMPLETA" ? "secondary" : "outline"}>
            {estadoActual ?? inspeccion.estado}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDescargarPdf}
            disabled={descargandoPdf}
          >
            {descargandoPdf ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Download data-icon="inline-start" />
            )}
            PDF
          </Button>
        </div>
      </div>

      {/* Cabecera. La clase (Camión/Equipo liviano/Remolcador/Semirremolque) va
          como badge junto al título — es el dato que identifica de un vistazo
          qué checklist es, sin tener que abrir el PDF para saberlo. */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="flex flex-wrap items-center gap-2">
            Inspección {inspeccion.codigo ? `#${inspeccion.codigo}` : ""}
            {inspeccion.vehiculoPlaca ? ` — ${inspeccion.vehiculoPlaca}` : ""}
            {inspeccion.vehiculo?.clase ? (
              <Badge variant="outline">{inspeccion.vehiculo.clase}</Badge>
            ) : null}
            {inspeccion.acido ? (
              <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                Ácido sulfúrico
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            {inspeccion.tipoChecklist?.nombre ?? "Tipo de checklist"}
            {inspeccion.vehiculo?.marca || inspeccion.vehiculo?.modelo
              ? ` · ${[inspeccion.vehiculo.marca, inspeccion.vehiculo.modelo].filter(Boolean).join(" ")}`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 pt-5 sm:grid-cols-4">
          <DatoOperacion etiqueta="Horómetro" valor={inspeccion.horometro} />
          <DatoOperacion etiqueta="Hubodómetro" valor={inspeccion.hubodometro} />
          <DatoOperacion etiqueta="Kilometraje" valor={inspeccion.kilometraje} />
          <DatoOperacion etiqueta="Destino" valor={inspeccion.destino} />
          <DatoOperacion
            etiqueta="Color de rotulación"
            valor={
              inspeccion.colorRotulacion?.nombre ? (
                <span className="inline-flex items-center gap-1.5">
                  {inspeccion.colorRotulacion.valorHex ? (
                    <span
                      className="inline-block size-3 rounded-sm border border-border/50"
                      style={{ backgroundColor: inspeccion.colorRotulacion.valorHex }}
                    />
                  ) : null}
                  {inspeccion.colorRotulacion.nombre}
                </span>
              ) : null
            }
          />
        </CardContent>
      </Card>

      {esInmutable ? (
        <Alert>
          <Lock className="size-4" />
          <AlertTitle>Inspección confirmada</AlertTitle>
          <AlertDescription>
            Esta inspección quedó firmada e inmutable; no se puede editar.
          </AlertDescription>
        </Alert>
      ) : (estadoActual ?? inspeccion.estado) === "COMPLETA" ? (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Todos los ítems requeridos están respondidos</AlertTitle>
          <AlertDescription>Ya puede confirmar y firmar la inspección.</AlertDescription>
        </Alert>
      ) : null}

      {/* Secciones e ítems: plegable por sección (plantillas grandes llegan a
          15+ secciones / 160+ ítems) — arranca todo desplegado para que nada
          quede oculto de entrada; el badge solo cuenta OBLIGATORIOS pendientes.
          Mostrar/ocultar simple (sin animación de altura): con una tabla de
          inputs interactivos, el Accordion compartido (Radix,
          h-(--radix-accordion-content-height)) medía mal el alto y recortaba
          el contenido. */}
      {secciones.map((seccion) => {
        const abierta = !seccionesCerradas.has(seccion.id);
        return (
          <Card key={seccion.id}>
            <CardHeader
              className="cursor-pointer select-none border-b border-border"
              onClick={() => alternarSeccion(seccion.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">{seccion.nombre}</CardTitle>
                <div className="flex items-center gap-2">
                  <BadgeSeccion items={seccion.items} respuestas={respuestas} />
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${abierta ? "" : "-rotate-90"}`}
                  />
                </div>
              </div>
            </CardHeader>
            {abierta ? (
              <CardContent className="pt-4">
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[32%]">Ítem</TableHead>
                        <TableHead className="w-[26%]">Respuesta</TableHead>
                        <TableHead className="w-[12%]">Cantidad</TableHead>
                        <TableHead className="w-[30%]">Observación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...seccion.items]
                        .sort((a, b) => a.orden - b.orden)
                        .map((item) => {
                          const r = respuestas[item.id];
                          if (!r) return null;
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="text-sm align-top pt-3">
                                {item.etiqueta}
                                {item.requerido ? (
                                  <span className="ml-1 text-destructive">*</span>
                                ) : null}
                              </TableCell>
                              <TableCell className="align-top pt-2">
                                <ControlRespuesta
                                  item={item}
                                  respuesta={r}
                                  deshabilitado={esInmutable}
                                  onCambio={(patch, opciones) =>
                                    actualizarRespuesta(item.id, patch, opciones)
                                  }
                                  onBlurCampo={flushInmediato}
                                />
                              </TableCell>
                              <TableCell className="align-top pt-2">
                                {item.capturaCantidad ? (
                                  <Input
                                    type="number"
                                    min={0}
                                    step={1}
                                    className="h-8 w-20"
                                    value={r.cantidad ?? ""}
                                    disabled={esInmutable}
                                    onChange={(e) => {
                                      if (e.target.value === "") {
                                        actualizarRespuesta(item.id, { cantidad: null });
                                        return;
                                      }
                                      // El navegador no impide tipear un decimal o un
                                      // negativo pese a min/step; el backend exige
                                      // entero >= 0 (ver Inspeccion.responder) y lo
                                      // rechazaría con un 400 que ya no se reintenta
                                      // solo — se ajusta acá para no llegar a eso.
                                      const valor = Math.max(0, Math.round(Number(e.target.value)));
                                      actualizarRespuesta(item.id, { cantidad: valor });
                                    }}
                                    onBlur={flushInmediato}
                                  />
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="align-top pt-2">
                                <Input
                                  className="h-8"
                                  placeholder="Observación"
                                  value={r.observacion ?? ""}
                                  disabled={esInmutable}
                                  maxLength={300}
                                  onChange={(e) =>
                                    actualizarRespuesta(item.id, {
                                      observacion: e.target.value === "" ? null : e.target.value,
                                    })
                                  }
                                  onBlur={flushInmediato}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            ) : null}
          </Card>
        );
      })}

      {/* Neumáticos */}
      {neumaticosPorGrupo.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDot className="size-4" />
              Neumáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-4">
            {neumaticosPorGrupo.map(([grupo, neumaticos]) => (
              <div key={grupo} className="flex flex-col gap-2">
                <span className="text-sm font-medium text-muted-foreground">{grupo}</span>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Posición</TableHead>
                        <TableHead className="w-40">Cocada (mm)</TableHead>
                        <TableHead>Otro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {neumaticos.map((n) => {
                        const local = neumaticosLocal[n.id];
                        if (!local) return null;
                        return (
                          <TableRow key={n.id}>
                            <TableCell className="text-sm font-medium">{n.posicion}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                step="0.1"
                                className="h-8 w-28"
                                value={local.cocadaMm ?? ""}
                                disabled={esInmutable}
                                onChange={(e) =>
                                  actualizarNeumatico(n.id, {
                                    cocadaMm: e.target.value === "" ? null : Number(e.target.value),
                                  })
                                }
                                onBlur={flushInmediato}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8"
                                placeholder="Otro"
                                value={local.otro ?? ""}
                                disabled={esInmutable}
                                onChange={(e) =>
                                  actualizarNeumatico(n.id, {
                                    otro: e.target.value === "" ? null : e.target.value,
                                  })
                                }
                                onBlur={flushInmediato}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {!esInmutable ? (
        <>
          <Separator />
          <div className="flex items-center justify-end gap-3">
            {!puedeConfirmar && (estadoActual ?? inspeccion.estado) !== "COMPLETA" ? (
              <span className="text-sm text-muted-foreground">
                Responda todos los ítems requeridos para poder confirmar.
              </span>
            ) : null}
            <Button
              onClick={() => cerrar.mutate()}
              disabled={!puedeConfirmar || cerrar.isPending}
            >
              {cerrar.isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Check data-icon="inline-start" />
              )}
              {cerrar.isPending ? "Confirmando..." : "Confirmar y firmar"}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Control de respuesta por tipoRespuesta
// ---------------------------------------------------------------------------

function ControlRespuesta({
  item,
  respuesta,
  deshabilitado,
  onCambio,
  onBlurCampo,
}: {
  item: InspeccionItem;
  respuesta: RespuestaLocal;
  deshabilitado: boolean;
  onCambio: (patch: Partial<RespuestaLocal>, opciones?: { inmediato?: boolean }) => void;
  // Solo para los controles de tipeo libre (MEDICION/TEXTO/SELECCION): fuerza
  // el flush de lo que ya esté sucio al perder el foco, sin marcar el campo
  // como sucio si no cambió (a diferencia de pasar por onCambio).
  onBlurCampo: () => void;
}) {
  switch (item.tipoRespuesta) {
    case "CONFORMIDAD":
      return (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={respuesta.estadoItem !== "SIN_RESPONDER" ? respuesta.estadoItem : ""}
          onValueChange={(valor) => {
            if (!valor || deshabilitado) return;
            onCambio({ estadoItem: valor as EstadoItem }, { inmediato: true });
          }}
        >
          <ToggleGroupItem
            value="CONFORME"
            disabled={deshabilitado}
            aria-label="Conforme"
            className="data-[state=on]:bg-green-600 data-[state=on]:text-white data-[state=on]:border-green-600 dark:data-[state=on]:bg-green-600"
          >
            C
          </ToggleGroupItem>
          <ToggleGroupItem
            value="NO_CONFORME"
            disabled={deshabilitado}
            aria-label="No conforme"
            className="data-[state=on]:bg-red-600 data-[state=on]:text-white data-[state=on]:border-red-600 dark:data-[state=on]:bg-red-600"
          >
            NC
          </ToggleGroupItem>
          <ToggleGroupItem
            value="NO_APLICA"
            disabled={deshabilitado}
            aria-label="No aplica"
            className="data-[state=on]:bg-slate-500 data-[state=on]:text-white data-[state=on]:border-slate-500 dark:data-[state=on]:bg-slate-500"
          >
            NA
          </ToggleGroupItem>
        </ToggleGroup>
      );
    case "MEDICION":
      return (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            step="any"
            className="h-8 w-24"
            value={respuesta.valorNumerico ?? ""}
            disabled={deshabilitado}
            min={item.rangoMin ?? undefined}
            max={item.rangoMax ?? undefined}
            onChange={(e) => {
              if (e.target.value === "") {
                onCambio({ valorNumerico: null });
                return;
              }
              // El navegador no clampa min/max en un <input type="number"> fuera
              // de un <form> con validación nativa; se ajusta acá para no
              // enviar un valor fuera de rango (el backend lo rechazaría y el
              // autoguardado quedaría reintentando indefinidamente).
              let valor = Number(e.target.value);
              if (item.rangoMin != null) valor = Math.max(item.rangoMin, valor);
              if (item.rangoMax != null) valor = Math.min(item.rangoMax, valor);
              onCambio({ valorNumerico: valor });
            }}
            onBlur={onBlurCampo}
          />
          {item.unidad ? (
            <span className="text-xs text-muted-foreground">{item.unidad}</span>
          ) : null}
        </div>
      );
    case "BOOLEANO":
      return (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={
            respuesta.valorBooleano === null ? "" : respuesta.valorBooleano ? "true" : "false"
          }
          onValueChange={(valor) => {
            if (!valor || deshabilitado) return;
            onCambio({ valorBooleano: valor === "true" }, { inmediato: true });
          }}
        >
          <ToggleGroupItem value="true" disabled={deshabilitado}>
            Sí
          </ToggleGroupItem>
          <ToggleGroupItem value="false" disabled={deshabilitado}>
            No
          </ToggleGroupItem>
        </ToggleGroup>
      );
    case "SELECCION":
    case "TEXTO":
      return (
        <Input
          className="h-8"
          value={respuesta.valorTexto ?? ""}
          disabled={deshabilitado}
          onChange={(e) => onCambio({ valorTexto: e.target.value === "" ? null : e.target.value })}
          onBlur={onBlurCampo}
        />
      );
    default:
      return null;
  }
}
