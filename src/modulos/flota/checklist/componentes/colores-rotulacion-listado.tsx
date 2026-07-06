"use client";

import { type FormEvent, useState } from "react";
import { Ban, Pencil, Plus } from "lucide-react";

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
import { Separator } from "@/compartido/componentes/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";
import type {
  ColorRotulacion,
  EstadoRegistroChecklist,
  FiltrosColoresRotulacion,
} from "../tipos/checklist.tipos";
import {
  useAnularColorRotulacionMutation,
  useColoresRotulacionQuery,
  useCrearColorRotulacionMutation,
  useEditarColorRotulacionMutation,
} from "../servicios/colores-rotulacion-queries";

// ---------------------------------------------------------------------------
// Helpers de color
// ---------------------------------------------------------------------------

function normalizarHex(raw: string): string {
  return raw.toUpperCase().replace(/[^#0-9A-F]/g, "");
}

function hexValido(hex: string): boolean {
  return /^#[0-9A-F]{6}$/.test(hex);
}

// ---------------------------------------------------------------------------
// Sheet — Crear / Editar
// ---------------------------------------------------------------------------

function SheetFormulario({
  item,
  modo,
  onCerrar,
  onGuardado,
}: {
  item: ColorRotulacion | null;
  modo: "crear" | "editar";
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [valorHex, setValorHex] = useState(item?.valorHex ?? "#000000");

  const crear = useCrearColorRotulacionMutation({
    onSuccess: () => { setErrorForm(null); onGuardado(); onCerrar(); },
    onError: (err) => setErrorForm(extraerMensajeError(err)),
  });

  const editar = useEditarColorRotulacionMutation(item?.id ?? "", {
    onSuccess: () => { setErrorForm(null); onGuardado(); onCerrar(); },
    onError: (err) => setErrorForm(extraerMensajeError(err)),
  });

  const mutacion = modo === "crear" ? crear : editar;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nombre = String(formData.get("nombre") ?? "").trim();
    const hex = normalizarHex(valorHex);

    if (!hexValido(hex)) {
      setErrorForm("El color debe estar en formato #RRGGBB (ej. #2ECC71).");
      return;
    }

    setErrorForm(null);
    mutacion.mutate({ nombre, valorHex: hex });
  }

  function handleHexTexto(value: string) {
    let v = value.trim().toUpperCase();
    if (!v.startsWith("#")) v = "#" + v;
    setValorHex(v.slice(0, 7));
  }

  function handleColorPicker(value: string) {
    setValorHex(value.toUpperCase());
  }

  function handleOpenChange(open: boolean) {
    if (!open) { setErrorForm(null); onCerrar(); }
  }

  const hexParaPicker = hexValido(valorHex) ? valorHex.toLowerCase() : "#000000";

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>
              {modo === "crear" ? "Nuevo color de rotulación" : "Editar color de rotulación"}
            </SheetTitle>
            <SheetDescription>
              Define el nombre y el color hexadecimal usado para identificar rotulaciones.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errorForm ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo guardar</AlertTitle>
                  <AlertDescription>{errorForm}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-1.5">
                <Label htmlFor="cr-nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cr-nombre"
                  name="nombre"
                  placeholder="Ej. Verde seguridad"
                  defaultValue={item?.nombre ?? ""}
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="cr-hex">
                  Color <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 shrink-0 rounded-md border border-border shadow-xs"
                    style={{ backgroundColor: hexParaPicker }}
                    aria-hidden
                  />
                  <Input
                    id="cr-hex"
                    value={valorHex}
                    onChange={(e) => handleHexTexto(e.target.value)}
                    placeholder="#2ECC71"
                    maxLength={7}
                    className="font-mono"
                  />
                  <input
                    type="color"
                    value={hexParaPicker}
                    onChange={(e) => handleColorPicker(e.target.value)}
                    className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                    aria-label="Selector de color"
                    title="Selector de color"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formato #RRGGBB en mayúsculas (ej. #2ECC71).
                </p>
              </div>
            </div>
          </div>

          <Separator />
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={mutacion.isPending}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={mutacion.isPending}>
              {mutacion.isPending
                ? "Guardando..."
                : modo === "crear"
                  ? "Agregar"
                  : "Actualizar"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// AlertDialog — Anular
// ---------------------------------------------------------------------------

function DialogAnular({
  item,
  onCerrar,
  onAnulado,
}: {
  item: ColorRotulacion | null;
  onCerrar: () => void;
  onAnulado: () => void;
}) {
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  const anular = useAnularColorRotulacionMutation(item?.id ?? "", {
    onSuccess: () => { setErrorAnular(null); onAnulado(); onCerrar(); },
    onError: (err) => setErrorAnular(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) { setErrorAnular(null); onCerrar(); }
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular color de rotulación</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro que desea anular &ldquo;{item?.nombre}&rdquo;? Dejará de
            estar disponible para nuevas plantillas. Tenga en cuenta que esta
            información ya no se podrá recuperar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorAnular ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo anular</AlertTitle>
            <AlertDescription>{errorAnular}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={anular.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => anular.mutate()}
            disabled={anular.isPending}
          >
            {anular.isPending ? "Anulando..." : "Anular"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

function BadgeEstado({ estado }: { estado: EstadoRegistroChecklist }) {
  return (
    <Badge variant={estado === "ACTIVO" ? "default" : "secondary"}>
      {estado === "ACTIVO" ? "Activo" : "Anulado"}
    </Badge>
  );
}

function SwatchColor({ valorHex, nombre }: { valorHex: string; nombre: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-4 w-4 shrink-0 rounded-sm border border-border/50 shadow-xs"
        style={{ backgroundColor: valorHex }}
        aria-hidden
      />
      <span className="font-mono text-xs text-muted-foreground">{valorHex}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ColoresRotulacionListado() {
  const [filtros, setFiltros] = useState<FiltrosColoresRotulacion>({
    estadoRegistro: "ACTIVO",
    pagina: 1,
    limite: 20,
  });

  const consulta = useColoresRotulacionQuery(filtros);
  const filas = consulta.data?.datos ?? [];
  const paginacion = consulta.data?.paginacion;

  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estadoRegistro ?? "ACTIVO");
  const [sheetCrearAbierto, setSheetCrearAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<ColorRotulacion | null>(null);
  const [itemAnulando, setItemAnulando] = useState<ColorRotulacion | null>(null);

  function handleRefetch() {
    void consulta.refetch();
  }

  function aplicarEstado(valor: string) {
    setEstadoLocal(valor);
    setFiltros((actual) => ({
      ...actual,
      estadoRegistro: valor === "TODOS" ? undefined : (valor as EstadoRegistroChecklist),
      pagina: 1,
    }));
  }

  function cambiarPagina(pagina: number) {
    setFiltros((actual) => ({ ...actual, pagina }));
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Colores de rotulación</CardTitle>
            <CardDescription>
              {paginacion?.total ?? 0}{" "}
              {(paginacion?.total ?? 0) === 1 ? "registro" : "registros"} encontrados
            </CardDescription>
          </div>
          <Button onClick={() => setSheetCrearAbierto(true)}>
            <Plus data-icon="inline-start" />
            Nuevo
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-5">
        {consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la información</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-44 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Registro</span>
            <Select value={estadoLocal} onValueChange={aplicarEstado}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVO">Registro: activos</SelectItem>
                <SelectItem value="ANULADO">Registro: anulados</SelectItem>
                <SelectItem value="TODOS">Registro: todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Nombre</TableHead>
                <TableHead className="w-[32%]">Color</TableHead>
                <TableHead className="w-[18%]">Estado</TableHead>
                <TableHead className="w-[20%] text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                    No hay colores de rotulación para el filtro aplicado.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((fila) => (
                  <TableRow key={fila.id}>
                    <TableCell className="truncate text-sm font-medium">
                      {fila.nombre}
                    </TableCell>
                    <TableCell>
                      <SwatchColor valorHex={fila.valorHex} nombre={fila.nombre} />
                    </TableCell>
                    <TableCell>
                      <BadgeEstado estado={fila.estadoRegistro} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => setItemEditando(fila)}
                              disabled={fila.estadoRegistro === "ANULADO"}
                              aria-label="Editar"
                            >
                              <Pencil />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setItemAnulando(fila)}
                              disabled={fila.estadoRegistro === "ANULADO"}
                              aria-label="Anular"
                            >
                              <Ban />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Anular</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {paginacion && paginacion.total > 0 ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {(paginacion.pagina - 1) * paginacion.limite + 1}-
              {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{" "}
              {paginacion.total} registros
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!paginacion.tieneAnterior}
                onClick={() => cambiarPagina(paginacion.pagina - 1)}
              >
                Anterior
              </Button>
              <span className="min-w-20 text-center">
                {paginacion.pagina} / {paginacion.totalPaginas}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!paginacion.tieneSiguiente}
                onClick={() => cambiarPagina(paginacion.pagina + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>

      {sheetCrearAbierto ? (
        <SheetFormulario
          item={null}
          modo="crear"
          onCerrar={() => setSheetCrearAbierto(false)}
          onGuardado={handleRefetch}
        />
      ) : null}

      {itemEditando ? (
        <SheetFormulario
          item={itemEditando}
          modo="editar"
          onCerrar={() => setItemEditando(null)}
          onGuardado={handleRefetch}
        />
      ) : null}

      <DialogAnular
        item={itemAnulando}
        onCerrar={() => setItemAnulando(null)}
        onAnulado={handleRefetch}
      />
    </Card>
  );
}
