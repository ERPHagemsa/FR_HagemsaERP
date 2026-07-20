"use client";

import * as React from "react";
import { Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { cn } from "@/compartido/utilidades/utils";
import { extraerMensajeError } from "@/compartido/api";
import { useCatalogosCondicionQuery } from "@/modulos/comercial/catalogos/condiciones/servicios/catalogos-condicion-queries";

import type {
  CatalogoCondicion,
  CategoriaCondicion,
  CondicionVersion,
  Version,
} from "../tipos/cotizaciones.tipos";
import { useActualizarCondicionesVersionMutation } from "../servicios/cotizaciones-queries";

type ItemCondicion = {
  clave: string;
  idCatalogoCondicion: string;
  categoria: CategoriaCondicion;
  titulo: string;
  texto: string;
  parametros: string[];
  valores: Record<string, string>;
};

type Props = {
  abierto: boolean;
  idCotizacion: string;
  version: Version;
  onGuardado: () => Promise<unknown>;
  onOpenChange: (abierto: boolean) => void;
};

const CATEGORIAS: CategoriaCondicion[] = [
  "CONSIDERACIONES_SERVICIO",
  "TARIFAS_INCLUYEN",
];

const ETIQUETA_CATEGORIA: Record<CategoriaCondicion, string> = {
  CONSIDERACIONES_SERVICIO: "CONSIDERACIONES DEL SERVICIO",
  TARIFAS_INCLUYEN: "NUESTRAS TARIFAS INCLUYEN",
};

const CATALOGOS_VACIOS: CatalogoCondicion[] = [];

export function DialogoCondicionesVersion({
  abierto,
  idCotizacion,
  version,
  onGuardado,
  onOpenChange,
}: Props) {
  const { data: respuesta, isLoading } = useCatalogosCondicionQuery({
    estado: "ACTIVO",
    porPagina: 100,
  });
  const catalogos = respuesta?.data ?? CATALOGOS_VACIOS;
  const guardarMutation = useActualizarCondicionesVersionMutation(idCotizacion);

  const [busqueda, setBusqueda] = React.useState<Record<CategoriaCondicion, string>>({
    CONSIDERACIONES_SERVICIO: "",
    TARIFAS_INCLUYEN: "",
  });
  const [items, setItems] = React.useState<Record<CategoriaCondicion, ItemCondicion[]>>({
    CONSIDERACIONES_SERVICIO: [],
    TARIFAS_INCLUYEN: [],
  });

  const inicializadoRef = React.useRef(false);
  React.useEffect(() => {
    if (!abierto) {
      inicializadoRef.current = false;
      return;
    }
    // Inicializa una sola vez por apertura y recién cuando el catálogo cargó,
    // para no pisar las ediciones en curso si `catalogos` cambia de referencia.
    if (isLoading || inicializadoRef.current) return;
    setItems(prepararItemsIniciales(version.condicionesVersion ?? [], catalogos));
    setBusqueda({ CONSIDERACIONES_SERVICIO: "", TARIFAS_INCLUYEN: "" });
    inicializadoRef.current = true;
  }, [abierto, isLoading, version, catalogos]);

  const idsAgregados = new Set(
    CATEGORIAS.flatMap((categoria) =>
      items[categoria].map((item) => item.idCatalogoCondicion)
    )
  );
  const faltanValores = CATEGORIAS.some((categoria) =>
    items[categoria].some((item) =>
      item.parametros.some((parametro) => !item.valores[parametro]?.trim())
    )
  );

  function agregar(categoria: CategoriaCondicion, catalogo: CatalogoCondicion) {
    const parametros = catalogo.parametros.length > 0
      ? catalogo.parametros
      : extraerParametros(catalogo.texto);

    setItems((actual) => ({
      ...actual,
      [categoria]: [
        ...actual[categoria],
        {
          clave: catalogo.id,
          idCatalogoCondicion: catalogo.id,
          categoria: catalogo.categoria,
          titulo: catalogo.titulo,
          texto: catalogo.texto,
          parametros,
          valores: Object.fromEntries(parametros.map((parametro) => [parametro, ""])),
        },
      ],
    }));
  }

  function quitar(categoria: CategoriaCondicion, clave: string) {
    setItems((actual) => ({
      ...actual,
      [categoria]: actual[categoria].filter((item) => item.clave !== clave),
    }));
  }

  function actualizarValor(
    categoria: CategoriaCondicion,
    clave: string,
    nombre: string,
    valor: string
  ) {
    setItems((actual) => ({
      ...actual,
      [categoria]: actual[categoria].map((item) =>
        item.clave === clave
          ? { ...item, valores: { ...item.valores, [nombre]: valor } }
          : item
      ),
    }));
  }

  async function guardar() {
    if (faltanValores) {
      toast.error("Completa los huecos antes de guardar.");
      return;
    }

    const condiciones = CATEGORIAS.flatMap((categoria) =>
      items[categoria].map((item, indice) => ({
        idCatalogoCondicion: item.idCatalogoCondicion,
        orden: indice,
        valores: limpiarValores(item.valores),
      }))
    );

    try {
      await guardarMutation.mutateAsync({ condiciones });
      await onGuardado();
      onOpenChange(false);
    } catch (error) {
      toast.error(extraerMensajeError(error, "No se pudieron guardar las condiciones."));
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Condiciones de la versión {version.numeroVersion}</DialogTitle>
          <DialogDescription>
            Selecciona las cláusulas que se imprimirán en el PDF de esta versión.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto md:grid-cols-2">
          {CATEGORIAS.map((categoria) => (
            <ColumnaCondiciones
              key={categoria}
              categoria={categoria}
              busqueda={busqueda[categoria]}
              catalogos={catalogos}
              cargando={isLoading}
              idsAgregados={idsAgregados}
              items={items[categoria]}
              onAgregar={(catalogo) => agregar(categoria, catalogo)}
              onBusquedaChange={(valor) =>
                setBusqueda((actual) => ({ ...actual, [categoria]: valor }))
              }
              onQuitar={(clave) => quitar(categoria, clave)}
              onValorChange={(clave, nombre, valor) =>
                actualizarValor(categoria, clave, nombre, valor)
              }
            />
          ))}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={guardarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void guardar()}
            disabled={guardarMutation.isPending || faltanValores}
          >
            {guardarMutation.isPending ? "Guardando..." : "Guardar condiciones"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColumnaCondiciones({
  categoria,
  busqueda,
  catalogos,
  cargando,
  idsAgregados,
  items,
  onAgregar,
  onBusquedaChange,
  onQuitar,
  onValorChange,
}: {
  categoria: CategoriaCondicion;
  busqueda: string;
  catalogos: CatalogoCondicion[];
  cargando: boolean;
  idsAgregados: Set<string>;
  items: ItemCondicion[];
  onAgregar: (catalogo: CatalogoCondicion) => void;
  onBusquedaChange: (valor: string) => void;
  onQuitar: (clave: string) => void;
  onValorChange: (clave: string, nombre: string, valor: string) => void;
}) {
  const [abierto, setAbierto] = React.useState(false);
  const termino = busqueda.trim().toLowerCase();
  const disponibles = catalogos
    .filter((catalogo) => catalogo.categoria === categoria)
    .filter((catalogo) => !idsAgregados.has(catalogo.id))
    .filter((catalogo) => {
      if (!termino) return true;
      return `${catalogo.titulo} ${catalogo.texto}`.toLowerCase().includes(termino);
    })
    .sort((a, b) => a.ordenSugerido - b.ordenSugerido);

  function seleccionar(catalogo: CatalogoCondicion) {
    onAgregar(catalogo);
    onBusquedaChange("");
    setAbierto(false);
  }

  return (
    <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-md border border-border">
      <div className="border-b border-border bg-muted/40 px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide">
          {ETIQUETA_CATEGORIA[categoria]}
        </h3>
      </div>

      <div className="relative border-b border-border p-2">
        <div
          className={cn(
            "relative flex h-9 w-full items-center border border-input bg-background",
            "focus-within:border-ring focus-within:ring-[2px] focus-within:ring-ring/40"
          )}
        >
          <Search className="ml-2 size-4 shrink-0 text-muted-foreground" />
          <Input
            value={busqueda}
            disabled={cargando}
            placeholder={cargando ? "Cargando catálogo..." : "Buscar y agregar cláusula..."}
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
            autoComplete="off"
            onFocus={() => setAbierto(true)}
            onBlur={() => setAbierto(false)}
            onChange={(event) => {
              onBusquedaChange(event.target.value);
              setAbierto(true);
            }}
          />
          {busqueda ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mr-1 size-7 text-muted-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onBusquedaChange("")}
            >
              <X className="size-3.5" />
              <span className="sr-only">Limpiar búsqueda</span>
            </Button>
          ) : null}
        </div>
        {abierto ? (
          <div
            className="absolute left-2 right-2 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-md"
            // Evita que el click/drag dentro del panel (incl. la barra de scroll) haga blur del input.
            onMouseDown={(event) => event.preventDefault()}
          >
            {disponibles.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Sin cláusulas disponibles.</p>
            ) : (
              disponibles.map((catalogo) => (
                <button
                  key={catalogo.id}
                  type="button"
                  className="flex w-full flex-col gap-1 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => seleccionar(catalogo)}
                >
                  <span className="font-medium leading-none">{catalogo.titulo}</span>
                  <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                    {catalogo.texto}
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="h-8 w-10 px-2 text-xs">#</TableHead>
            <TableHead className="h-8 px-2 text-xs">Cláusula</TableHead>
            <TableHead className="h-8 w-16 px-2 text-right text-xs">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                Aún no hay condiciones seleccionadas.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, indice) => (
              <TableRow key={item.clave} className="align-top hover:bg-muted/30">
                <TableCell className="px-2 py-2 text-xs tabular-nums text-muted-foreground">
                  {indice + 1}
                </TableCell>
                <TableCell className="whitespace-normal px-2 py-2">
                  <p className="text-sm font-medium leading-tight">{item.titulo}</p>
                  <TextoConInputs
                    item={item}
                    onValorChange={(nombre, valor) => onValorChange(item.clave, nombre, valor)}
                  />
                </TableCell>
                <TableCell className="px-2 py-2 text-right">
                  <Button type="button" variant="ghost" size="icon" onClick={() => onQuitar(item.clave)}>
                    <Trash2 className="size-4" />
                    <span className="sr-only">Quitar condición</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

function TextoConInputs({
  item,
  onValorChange,
}: {
  item: ItemCondicion;
  onValorChange: (nombre: string, valor: string) => void;
}) {
  const partes: React.ReactNode[] = [];
  const regex = /\{(\w+)\}/g;
  let posicion = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(item.texto)) !== null) {
    const nombre = match[1];
    const valor = item.valores[nombre] ?? "";

    if (match.index > posicion) {
      partes.push(item.texto.slice(posicion, match.index));
    }

    partes.push(
      <Input
        key={`${item.clave}-${nombre}-${match.index}`}
        value={valor}
        placeholder={nombre}
        className={cn(
          "mx-1.5 inline-flex h-6 w-24 align-middle px-2 text-xs leading-none",
          !valor.trim() && "border-destructive focus-visible:ring-destructive/30"
        )}
        onChange={(event) => onValorChange(nombre, event.target.value)}
      />
    );
    posicion = match.index + match[0].length;
  }

  if (posicion < item.texto.length) {
    partes.push(item.texto.slice(posicion));
  }

  return <p className="mt-1 text-xs leading-snug text-muted-foreground">{partes}</p>;
}

function prepararItemsIniciales(
  condiciones: CondicionVersion[],
  catalogos: CatalogoCondicion[]
): Record<CategoriaCondicion, ItemCondicion[]> {
  const inicial: Record<CategoriaCondicion, ItemCondicion[]> = {
    CONSIDERACIONES_SERVICIO: [],
    TARIFAS_INCLUYEN: [],
  };

  if (condiciones.length > 0) {
    condiciones
      .filter((condicion) => condicion.idCatalogoCondicion)
      .sort((a, b) => a.orden - b.orden)
      .forEach((condicion) => {
        const catalogo = catalogos.find(
          (item) => item.id === condicion.idCatalogoCondicion
        );
        const texto = catalogo?.texto ?? condicion.textoResuelto;
        const parametros = catalogo?.parametros?.length
          ? catalogo.parametros
          : extraerParametros(texto);

        inicial[condicion.categoria].push({
          clave: condicion.id,
          idCatalogoCondicion: condicion.idCatalogoCondicion!,
          categoria: condicion.categoria,
          titulo: catalogo?.titulo ?? "Condición del catálogo",
          texto,
          parametros,
          valores: completarValores(parametros, condicion.valores ?? {}),
        });
      });

    return inicial;
  }

  for (const catalogo of catalogos.filter((item) => item.porDefecto)) {
    const parametros = catalogo.parametros.length > 0
      ? catalogo.parametros
      : extraerParametros(catalogo.texto);
    inicial[catalogo.categoria].push({
      clave: catalogo.id,
      idCatalogoCondicion: catalogo.id,
      categoria: catalogo.categoria,
      titulo: catalogo.titulo,
      texto: catalogo.texto,
      parametros,
      valores: completarValores(parametros, {}),
    });
  }

  for (const categoria of CATEGORIAS) {
    inicial[categoria].sort((a, b) => {
      const aCatalogo = catalogos.find((catalogo) => catalogo.id === a.idCatalogoCondicion);
      const bCatalogo = catalogos.find((catalogo) => catalogo.id === b.idCatalogoCondicion);
      return (aCatalogo?.ordenSugerido ?? 0) - (bCatalogo?.ordenSugerido ?? 0);
    });
  }

  return inicial;
}

function extraerParametros(texto: string): string[] {
  return Array.from(texto.matchAll(/\{(\w+)\}/g), (match) => match[1]).filter(
    (nombre, indice, todos) => todos.indexOf(nombre) === indice
  );
}

function completarValores(parametros: string[], valores: Record<string, string>) {
  return Object.fromEntries(parametros.map((parametro) => [parametro, valores[parametro] ?? ""]));
}

function limpiarValores(valores: Record<string, string>) {
  return Object.fromEntries(Object.entries(valores).map(([nombre, valor]) => [nombre, valor.trim()]));
}
