"use client";

import { Badge } from "@/compartido/componentes/ui/badge";
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
import { useCatalogosCondicionQuery } from "@/modulos/comercial/catalogos/condiciones/servicios/catalogos-condicion-queries";

import type {
  CatalogoCondicion,
  CategoriaCondicion,
  ParametroCondicion,
} from "../tipos/cotizaciones.tipos";
import type { DraftCondicion } from "../servicios/cotizaciones-editor.utils";

// ---------------------------------------------------------------------------
// Constantes de presentacion
// ---------------------------------------------------------------------------

const ETIQUETA_CATEGORIA: Record<CategoriaCondicion, string> = {
  CONSIDERACIONES_SERVICIO: "Consideraciones del servicio",
  TARIFAS_INCLUYEN: "Nuestras tarifas incluyen",
};

// Orden de impresion: CONSIDERACIONES_SERVICIO antes que TARIFAS_INCLUYEN (spec S10).
const ORDEN_CATEGORIA: CategoriaCondicion[] = [
  "CONSIDERACIONES_SERVICIO",
  "TARIFAS_INCLUYEN",
];

// Etiquetas legibles para los placeholders MANUAL conocidos.
const ETIQUETA_PARAMETRO: Record<string, string> = {
  dias_validez: "Dias de validez",
  lugar: "Lugar",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parametrosManualesDeClausula(
  clausula: CatalogoCondicion
): ParametroCondicion[] {
  return clausula.parametros.filter((p) => p.fuente === "MANUAL");
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  condiciones: DraftCondicion[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (condiciones: DraftCondicion[]) => void;
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * EditorCondiciones — checklist de condiciones del contrato agrupado por categoria.
 *
 * Carga las clausulas ACTIVAS del catalogo maestro y las muestra con un checkbox
 * por cada una. Las clausulas marcadas se almacenan en `condiciones` (DraftBorrador).
 * Los parametros MANUAL (dias_validez, lugar) se capturan inline bajo la clausula
 * correspondiente cuando esta seleccionada. Los AUTO (cliente, moneda) los resuelve
 * el backend al guardar.
 *
 * Pattern: presentacional puro. No llama mutaciones — solo notifica cambios a traves
 * de `onChange` (igual que EditorStandby / EditorLeadtimes).
 */
export function EditorCondiciones({
  condiciones,
  erroresCampo = {},
  disabled,
  onChange,
}: Props) {
  // Cargamos todas las clausulas ACTIVAS (sin paginacion visible: porPagina alto).
  const { data: respuesta, isLoading } = useCatalogosCondicionQuery({
    estado: "ACTIVO",
    porPagina: 100,
  });

  const clausulas = respuesta?.data ?? [];

  // Agrupar por categoria en el orden de impresion.
  const porCategoria = ORDEN_CATEGORIA.map((cat) => ({
    categoria: cat,
    clausulas: clausulas
      .filter((c) => c.categoria === cat)
      .sort((a, b) => a.ordenSugerido - b.ordenSugerido),
  })).filter((grupo) => grupo.clausulas.length > 0);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function estaSeleccionada(idCatalogoCondicion: string): boolean {
    return condiciones.some((c) => c.idCatalogoCondicion === idCatalogoCondicion);
  }

  function obtenerDraft(idCatalogoCondicion: string): DraftCondicion | undefined {
    return condiciones.find((c) => c.idCatalogoCondicion === idCatalogoCondicion);
  }

  function toggleClausula(clausula: CatalogoCondicion, checked: boolean) {
    if (checked) {
      const manuales = parametrosManualesDeClausula(clausula);
      const nuevaCondicion: DraftCondicion = {
        idCatalogoCondicion: clausula.id,
        parametrosManual: Object.fromEntries(manuales.map((p) => [p.nombre, ""])),
        orden: clausula.ordenSugerido,
        _parametrosManuales: manuales.map((p) => p.nombre),
      };
      onChange([...condiciones, nuevaCondicion]);
    } else {
      onChange(condiciones.filter((c) => c.idCatalogoCondicion !== clausula.id));
    }
  }

  function actualizarParametro(
    idCatalogoCondicion: string,
    nombre: string,
    valor: string
  ) {
    onChange(
      condiciones.map((c) =>
        c.idCatalogoCondicion === idCatalogoCondicion
          ? {
              ...c,
              parametrosManual: { ...c.parametrosManual, [nombre]: valor },
            }
          : c
      )
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Cargando condiciones del catalogo...
      </p>
    );
  }

  if (clausulas.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        No hay condiciones activas en el catalogo. Agrega clausulas desde{" "}
        <span className="font-medium">Catalogos / Condiciones</span>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {porCategoria.map(({ categoria, clausulas: items }) => (
        <div key={categoria} className="flex flex-col gap-2">
          {/* Cabecera de categoria */}
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {ETIQUETA_CATEGORIA[categoria]}
          </p>

          {/* Lista de clausulas */}
          <div className="flex flex-col gap-1.5">
            {items.map((clausula) => {
              const seleccionada = estaSeleccionada(clausula.id);
              const draft = obtenerDraft(clausula.id);
              const manuales = parametrosManualesDeClausula(clausula);
              const indiceDraft = condiciones.findIndex(
                (c) => c.idCatalogoCondicion === clausula.id
              );

              return (
                <div
                  key={clausula.id}
                  className={`rounded-lg border border-border p-3 transition-colors ${
                    seleccionada ? "bg-muted/30" : "hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`cond-${clausula.id}`}
                      checked={seleccionada}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        toggleClausula(clausula, Boolean(checked))
                      }
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex flex-1 flex-col gap-1">
                      {/* Titulo + badge constante */}
                      <Label
                        htmlFor={`cond-${clausula.id}`}
                        className="cursor-pointer text-sm font-medium leading-tight"
                      >
                        {clausula.titulo}
                        {clausula.esConstante && (
                          <Badge
                            variant="secondary"
                            className="ml-2 text-[10px]"
                          >
                            Constante
                          </Badge>
                        )}
                      </Label>

                      {/* Preview del texto con placeholders */}
                      <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                        {clausula.texto}
                      </p>

                      {/* Campos MANUAL — solo cuando la clausula esta seleccionada */}
                      {seleccionada && manuales.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-4">
                          {manuales.map((param) => {
                            const valor =
                              draft?.parametrosManual[param.nombre] ?? "";
                            const errorKey = `condiciones.${indiceDraft}.${param.nombre}`;
                            const mensajeError = erroresCampo[errorKey];

                            return (
                              <div
                                key={param.nombre}
                                className="flex flex-col gap-1"
                              >
                                <Label className="text-xs font-medium text-muted-foreground">
                                  {ETIQUETA_PARAMETRO[param.nombre] ?? param.nombre}
                                  <span className="ml-0.5 text-destructive">*</span>
                                </Label>

                                {param.tipoEntrada === "ENUM" &&
                                param.opciones &&
                                param.opciones.length > 0 ? (
                                  // ENUM: select con las opciones del catalogo
                                  <Select
                                    value={valor}
                                    disabled={disabled}
                                    onValueChange={(v) =>
                                      actualizarParametro(
                                        clausula.id,
                                        param.nombre,
                                        v
                                      )
                                    }
                                  >
                                    <SelectTrigger
                                      className="h-8 w-32 text-xs"
                                      aria-invalid={Boolean(mensajeError)}
                                    >
                                      <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {param.opciones.map((op) => (
                                        <SelectItem
                                          key={op}
                                          value={op}
                                          className="text-xs"
                                        >
                                          {op} dias
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  // TEXTO: input libre
                                  <Input
                                    className="h-8 w-44 text-xs"
                                    value={valor}
                                    disabled={disabled}
                                    placeholder={`Ingresa ${ETIQUETA_PARAMETRO[param.nombre] ?? param.nombre}`}
                                    aria-invalid={Boolean(mensajeError)}
                                    onChange={(e) =>
                                      actualizarParametro(
                                        clausula.id,
                                        param.nombre,
                                        e.target.value
                                      )
                                    }
                                  />
                                )}

                                {mensajeError ? (
                                  <p className="text-xs text-destructive">
                                    {mensajeError}
                                  </p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
