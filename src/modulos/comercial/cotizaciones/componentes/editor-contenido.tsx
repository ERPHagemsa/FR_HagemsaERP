"use client";

import * as React from "react";
import { LayersIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import type {
  DraftCargoAdicional,
  DraftLinea,
  DraftSeccion,
} from "../servicios/cotizaciones-editor.utils";
import {
  lineaVacia,
  seccionDefectoVacia,
  seccionVacia,
} from "../servicios/cotizaciones-editor.utils";
import { useListarCatalogosCargoAdicional } from "../servicios/cotizaciones-queries";
import { EditorCargos } from "./editor-cargos";
import { LineaDetalleDrawer } from "./linea-detalle-drawer";
import {
  claseBadgeTipo,
  etiquetaTipo,
  formatearMoneda,
  mapearErroresContenido,
  resumenDetalle,
  totalLinea,
} from "./lineas-grid.utils";

const COLUMNAS = 8;

type Props = {
  secciones: DraftSeccion[];
  moneda: string;
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (secciones: DraftSeccion[]) => void;
};

/**
 * EditorContenido — bloque unificado de contenido de la cotizacion.
 *
 * Una sola grilla: las secciones son filas-encabezado dentro de la grilla (no
 * cards paralelas). La seccion por defecto (esDefecto) es el bucket "sin agrupar".
 * El detalle polimorfico de cada linea vive en un drawer lateral. Los cargos
 * adicionales del bucket por defecto van pegados a la grilla y SUMAN al total.
 *
 * Componente controlado: todo cambio sale por onChange(secciones). El unico
 * estado interno es que linea tiene el drawer abierto.
 */
export function EditorContenido({
  secciones,
  moneda,
  erroresCampo = {},
  disabled,
  onChange,
}: Props) {
  // Edicion de una linea EXISTENTE (ya en la grilla).
  const [drawerClave, setDrawerClave] = React.useState<string | null>(null);
  // Alta de una linea NUEVA aun sin confirmar: vive fuera de la grilla hasta
  // que el usuario pulse "Aplicar". claveSeccion null = bucket por defecto.
  const [nuevaLinea, setNuevaLinea] = React.useState<{
    claveSeccion: string | null;
    linea: DraftLinea;
  } | null>(null);

  // Catalogo de cargos adicionales — cargado una sola vez al nivel del editor.
  const { data: catalogoData } = useListarCatalogosCargoAdicional({ estado: "ACTIVO", porPagina: 50 });
  const opcionesCatalogo = catalogoData?.data ?? [];

  // ---- Derivados -----------------------------------------------------------
  const seccionDefecto = secciones.find((s) => s.esDefecto);
  const seccionesExplicitas = secciones.filter((s) => !s.esDefecto);
  const hayGrupos = seccionesExplicitas.length > 0;
  // Regla de negocio: una cotizacion es PLANA (lineas sueltas) o AGRUPADA
  // (secciones con nombre), nunca mezcla. Estos flags hacen excluyentes las
  // acciones "Agregar linea" suelta vs "Agregar seccion".
  const lineasSueltas = (seccionDefecto?.lineas.length ?? 0) > 0;
  const seccionesOrdenadas = [
    ...secciones.filter((s) => s.esDefecto),
    ...seccionesExplicitas,
  ];

  const todasLasLineas = secciones.flatMap((s) => s.lineas);
  const lineaExistente = todasLasLineas.find((l) => l.claveCliente === drawerClave) ?? null;
  // El drawer muestra la linea nueva (si se esta dando de alta) o la existente.
  const lineaDrawer = nuevaLinea ? nuevaLinea.linea : lineaExistente;
  const drawerAbierto = nuevaLinea !== null || drawerClave !== null;

  const totalLineasCount = secciones.reduce((acc, s) => acc + s.lineas.length, 0);
  const subtotalLineas = secciones.reduce(
    (acc, s) => acc + s.lineas.reduce((a, l) => a + totalLinea(l), 0),
    0
  );
  const totalCargos = secciones.reduce(
    (acc, s) => acc + s.cargosAdicionales.reduce((a, c) => a + (parseFloat(c.monto) || 0), 0),
    0
  );
  const total = subtotalLineas + totalCargos;

  const errores = mapearErroresContenido(secciones, erroresCampo);

  function subtotalDeSeccion(s: DraftSeccion): number {
    // Contrato §5.4: subtotal de seccion = Σ lineas + Σ cargos adicionales.
    const lineas = s.lineas.reduce((a, l) => a + totalLinea(l), 0);
    const cargos = s.cargosAdicionales.reduce((a, c) => a + (parseFloat(c.monto) || 0), 0);
    return lineas + cargos;
  }

  // ---- Helpers de mutacion (controlado) -----------------------------------
  // Garantiza el bucket por defecto y devuelve [secciones, claveDefecto].
  function conDefecto(): [DraftSeccion[], string] {
    const def = secciones.find((s) => s.esDefecto);
    if (def) return [secciones, def.claveCliente];
    const nuevoDef = seccionDefectoVacia();
    return [[nuevoDef, ...secciones], nuevoDef.claveCliente];
  }

  function actualizarLinea(claveLinea: string, patch: Partial<DraftLinea>) {
    onChange(
      secciones.map((s) => ({
        ...s,
        lineas: s.lineas.map((l) =>
          l.claveCliente === claveLinea ? { ...l, ...patch } : l
        ),
      }))
    );
  }

  function eliminarLinea(claveLinea: string) {
    // Cerrar el drawer si apunta a la linea que estamos eliminando (evita
    // que quede abierto con un borrador "fantasma" de una linea ya borrada).
    if (drawerClave === claveLinea) setDrawerClave(null);
    onChange(
      secciones.map((s) => ({
        ...s,
        lineas: s.lineas.filter((l) => l.claveCliente !== claveLinea),
      }))
    );
  }

  // Abrir el drawer con una linea NUEVA sin confirmar (no entra a la grilla hasta
  // "Aplicar"). Asi "Cancelar" la descarta de verdad.
  function agregarLinea(claveSeccion: string) {
    setNuevaLinea({ claveSeccion, linea: lineaVacia() });
  }

  // Igual, pero apuntando al bucket por defecto (se resuelve recien al confirmar).
  function agregarLineaDefecto() {
    setNuevaLinea({ claveSeccion: null, linea: lineaVacia() });
  }

  function cerrarDrawer() {
    setDrawerClave(null);
    setNuevaLinea(null); // descarta la linea nueva sin confirmar
  }

  function aplicarDrawer(linea: DraftLinea) {
    // Alta confirmada: recien aca la linea nueva entra a la grilla.
    if (nuevaLinea) {
      if (nuevaLinea.claveSeccion === null) {
        const [base, claveDef] = conDefecto();
        onChange(
          base.map((s) =>
            s.claveCliente === claveDef ? { ...s, lineas: [...s.lineas, linea] } : s
          )
        );
      } else {
        const claveSeccion = nuevaLinea.claveSeccion;
        onChange(
          secciones.map((s) =>
            s.claveCliente === claveSeccion ? { ...s, lineas: [...s.lineas, linea] } : s
          )
        );
      }
      setNuevaLinea(null);
      return;
    }
    // Edicion de una linea existente
    actualizarLinea(linea.claveCliente, linea);
    setDrawerClave(null);
  }

  function agregarSeccion() {
    const nueva = seccionVacia(false);
    nueva.orden = secciones.length;
    onChange([...secciones, nueva]);
  }

  function actualizarSeccion(claveSeccion: string, patch: Partial<DraftSeccion>) {
    onChange(
      secciones.map((s) => (s.claveCliente === claveSeccion ? { ...s, ...patch } : s))
    );
  }

  // Quitar una seccion devuelve sus lineas al bucket "sin agrupar" (no se pierden).
  // Quitar una seccion no pierde sus lineas, pero respeta la regla plana/agrupada:
  // si quedan otras secciones, las lineas pasan a la primera (sigue agrupada);
  // si era la ultima, vuelven al bucket por defecto (la cotizacion pasa a plana).
  function eliminarSeccion(claveSeccion: string) {
    const sec = secciones.find((s) => s.claveCliente === claveSeccion);
    if (!sec) return;
    const restantes = secciones.filter((s) => s.claveCliente !== claveSeccion);
    const otroGrupo = restantes.find((s) => !s.esDefecto);
    if (otroGrupo) {
      onChange(
        restantes.map((s) =>
          s.claveCliente === otroGrupo.claveCliente
            ? { ...s, lineas: [...s.lineas, ...sec.lineas] }
            : s
        )
      );
      return;
    }
    let def = restantes.find((s) => s.esDefecto);
    let base = restantes;
    if (!def) {
      def = seccionDefectoVacia();
      base = [def, ...restantes];
    }
    const claveDef = def.claveCliente;
    onChange(
      base.map((s) =>
        s.claveCliente === claveDef ? { ...s, lineas: [...s.lineas, ...sec.lineas] } : s
      )
    );
  }

  function actualizarCargosDefecto(cargos: DraftCargoAdicional[]) {
    const [base, claveDef] = conDefecto();
    onChange(
      base.map((s) =>
        s.claveCliente === claveDef ? { ...s, cargosAdicionales: cargos } : s
      )
    );
  }

  // Cargos de una seccion concreta (cotizacion agrupada): los cargos son POR SECCION.
  function actualizarCargosSeccion(claveSeccion: string, cargos: DraftCargoAdicional[]) {
    onChange(
      secciones.map((s) =>
        s.claveCliente === claveSeccion ? { ...s, cargosAdicionales: cargos } : s
      )
    );
  }

  const mostrarGrilla = hayGrupos || totalLineasCount > 0;

  // Numeracion global continua precalculada (no mutar contadores en el render:
  // React Strict Mode invoca el render dos veces en dev y desfasaria el conteo).
  const indicePorLinea = new Map<string, number>();
  let contador = 0;
  for (const s of seccionesOrdenadas) {
    for (const l of s.lineas) indicePorLinea.set(l.claveCliente, (contador += 1));
  }

  return (
    <div className="flex flex-col gap-4">
      {mostrarGrilla ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead className="w-36">Tipo</TableHead>
                <TableHead className="min-w-[200px]">Descripcion</TableHead>
                <TableHead className="min-w-[180px]">Detalle</TableHead>
                <TableHead className="w-20 text-right">Cant.</TableHead>
                <TableHead className="w-32 text-right">P. unitario</TableHead>
                <TableHead className="w-32 text-right">Total</TableHead>
                <TableHead className="w-20 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seccionesOrdenadas.map((seccion) => {
                const errSeccion = errores.porSeccion[seccion.claveCliente] ?? {};
                const esGrupo = !seccion.esDefecto;
                // Riel de color a la izquierda: identifica las lineas de una
                // seccion con nombre; el bucket "sin agrupar" queda neutro.
                const rail = esGrupo ? "border-l-2 border-l-primary/40" : "border-l-2 border-l-transparent";
                return (
                  <React.Fragment key={seccion.claveCliente}>
                    {/* Fila-encabezado de seccion */}
                    {seccion.esDefecto ? (
                      hayGrupos ? (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell
                            colSpan={COLUMNAS}
                            className="py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            Sin agrupar
                          </TableCell>
                        </TableRow>
                      ) : null
                    ) : (
                      <TableRow className="bg-primary/5 hover:bg-primary/5">
                        <TableCell
                          colSpan={COLUMNAS}
                          className="border-l-2 border-l-primary py-2"
                        >
                          <div className="flex items-center gap-2">
                            <LayersIcon className="size-4 shrink-0 text-primary" />
                            <div className="flex flex-1 flex-col gap-0.5">
                              <Input
                                className="h-8 max-w-xs border-transparent bg-transparent px-2 text-sm font-medium shadow-none hover:border-border focus-visible:border-border"
                                value={seccion.nombre}
                                placeholder="Nombre de la seccion"
                                disabled={disabled}
                                aria-invalid={Boolean(errSeccion.nombre)}
                                onChange={(e) =>
                                  actualizarSeccion(seccion.claveCliente, {
                                    nombre: e.target.value,
                                  })
                                }
                              />
                              {errSeccion.nombre ? (
                                <p className="px-2 text-xs text-destructive">
                                  {errSeccion.nombre}
                                </p>
                              ) : null}
                            </div>
                            <span className="ml-auto font-mono text-sm font-medium tabular-nums">
                              {formatearMoneda(subtotalDeSeccion(seccion), moneda)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="size-8 text-destructive hover:text-destructive"
                              disabled={disabled}
                              onClick={() => eliminarSeccion(seccion.claveCliente)}
                              aria-label="Quitar seccion (las lineas vuelven a sin agrupar)"
                            >
                              <Trash2Icon className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Líneas de la seccion */}
                    {seccion.lineas.map((linea) => {
                      const errLinea = errores.porLinea[linea.claveCliente] ?? {};
                      return (
                        <TableRow key={linea.claveCliente} className="group align-middle">
                          <TableCell
                            className={`text-center text-xs text-muted-foreground tabular-nums ${rail}`}
                          >
                            {indicePorLinea.get(linea.claveCliente)}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`whitespace-nowrap font-medium ${claseBadgeTipo(linea.tipoLinea)}`}
                            >
                              {etiquetaTipo(linea.tipoLinea)}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <Input
                              className="h-8 border-transparent bg-transparent px-2 text-sm shadow-none hover:border-border focus-visible:border-border"
                              value={linea.descripcion}
                              placeholder="Descripcion del servicio"
                              disabled={disabled}
                              aria-invalid={Boolean(errLinea.descripcion)}
                              onChange={(e) =>
                                actualizarLinea(linea.claveCliente, {
                                  descripcion: e.target.value,
                                })
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <button
                              type="button"
                              className="line-clamp-1 text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                              onClick={() => setDrawerClave(linea.claveCliente)}
                              title="Editar detalle"
                            >
                              {resumenDetalle(linea)}
                            </button>
                          </TableCell>

                          <TableCell>
                            <Input
                              className="h-8 w-16 border-transparent bg-transparent px-2 text-right text-sm tabular-nums shadow-none hover:border-border focus-visible:border-border"
                              type="number"
                              min={1}
                              step="1"
                              value={linea.cantidad}
                              disabled={disabled}
                              aria-invalid={Boolean(errLinea.cantidad)}
                              onChange={(e) =>
                                actualizarLinea(linea.claveCliente, {
                                  cantidad: e.target.value,
                                })
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <Input
                              className="h-8 w-28 border-transparent bg-transparent px-2 text-right text-sm tabular-nums shadow-none hover:border-border focus-visible:border-border"
                              type="number"
                              min={0}
                              step="0.01"
                              value={linea.precioUnitario}
                              disabled={disabled}
                              aria-invalid={Boolean(errLinea.precioUnitario)}
                              onChange={(e) =>
                                actualizarLinea(linea.claveCliente, {
                                  precioUnitario: e.target.value,
                                })
                              }
                            />
                          </TableCell>

                          <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                            {formatearMoneda(totalLinea(linea), moneda)}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="size-8"
                                disabled={disabled}
                                onClick={() => setDrawerClave(linea.claveCliente)}
                                aria-label="Editar detalle"
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="size-8 text-destructive hover:text-destructive"
                                disabled={disabled}
                                onClick={() => eliminarLinea(linea.claveCliente)}
                                aria-label="Eliminar linea"
                              >
                                <Trash2Icon className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Agregar línea dentro de la seccion (solo secciones con
                        nombre; las lineas sueltas se agregan desde el toolbar). */}
                    {esGrupo ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMNAS} className={`py-1.5 ${rail}`}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 text-muted-foreground"
                            disabled={disabled}
                            onClick={() => agregarLinea(seccion.claveCliente)}
                          >
                            <PlusIcon data-icon="inline-start" />
                            Agregar linea
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : null}

                    {/* Cargos adicionales de la seccion. Los cargos son POR SECCION:
                        cuando la cotizacion esta agrupada, cada seccion edita los
                        suyos aca. El caso plano usa el bloque unico de abajo. */}
                    {hayGrupos ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={COLUMNAS} className={`pb-4 ${rail}`}>
                          <div className="ml-1 flex flex-col gap-1.5">
                            <p className="text-xs font-medium text-muted-foreground">
                              Cargos adicionales de la seccion
                            </p>
                            <EditorCargos
                              cargos={seccion.cargosAdicionales}
                              opcionesCatalogo={opcionesCatalogo}
                              erroresCampo={errores.porSeccionCargos[seccion.claveCliente]}
                              disabled={disabled}
                              onChange={(cargos) =>
                                actualizarCargosSeccion(seccion.claveCliente, cargos)
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todavia no agregaste lineas a esta cotizacion.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={agregarLineaDefecto}
          >
            <PlusIcon data-icon="inline-start" />
            Agregar primera linea
          </Button>
        </div>
      )}

      {/* Acciones de agrupacion (excluyentes): con lineas sueltas no se puede
          agregar seccion; con secciones no se agregan lineas sueltas. */}
      <div className="flex flex-wrap gap-2">
        {mostrarGrilla && !hayGrupos ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={agregarLineaDefecto}
          >
            <PlusIcon data-icon="inline-start" />
            Agregar linea
          </Button>
        ) : null}
        {!lineasSueltas ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={agregarSeccion}
          >
            <LayersIcon data-icon="inline-start" />
            Agregar seccion
          </Button>
        ) : null}
      </div>

      {/* Cargos adicionales del caso PLANO (sin agrupar): un solo bloque para la
          seccion por defecto. Cuando hay secciones con nombre, los cargos se editan
          por seccion dentro de la grilla (arriba), no aca. */}
      {!hayGrupos ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">Cargos adicionales</p>
            <p className="text-xs text-muted-foreground">
              Escolta, viaticos, etc. Suman al total.
            </p>
          </div>
          <EditorCargos
            cargos={seccionDefecto?.cargosAdicionales ?? []}
            opcionesCatalogo={opcionesCatalogo}
            erroresCampo={errores.cargosDefecto}
            disabled={disabled}
            onChange={actualizarCargosDefecto}
          />
        </div>
      ) : null}

      {/* Barra de totales sticky — impacto financiero siempre a la vista */}
      <div className="sticky bottom-0 z-10 mt-2 rounded-xl border border-border bg-card/95 px-5 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {totalLineasCount} {totalLineasCount === 1 ? "linea" : "lineas"}
            {hayGrupos ? ` · ${seccionesExplicitas.length} secciones` : ""}
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-4 text-xs text-muted-foreground tabular-nums">
              <span>Subtotal lineas {formatearMoneda(subtotalLineas, moneda)}</span>
              <span>Cargos {formatearMoneda(totalCargos, moneda)}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="font-mono text-lg font-semibold tabular-nums">
                {formatearMoneda(total, moneda)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-right text-xs text-muted-foreground">
        Estimado — el backend recalcula totales e impuestos al guardar.
      </p>

      <LineaDetalleDrawer
        abierto={drawerAbierto}
        linea={lineaDrawer}
        moneda={moneda}
        erroresCampo={lineaExistente ? errores.porLinea[lineaExistente.claveCliente] : undefined}
        disabled={disabled}
        onCerrar={cerrarDrawer}
        onGuardar={aplicarDrawer}
      />
    </div>
  );
}
