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
import { Label } from "@/compartido/componentes/ui/label";
import { Input } from "@/compartido/componentes/ui/input";
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
  EstadoRegistroChecklist,
  FiltrosTiposChecklist,
  TipoChecklist,
} from "../tipos/mantenedores.tipos";
import {
  useAnularTipoChecklistMutation,
  useCrearTipoChecklistMutation,
  useEditarTipoChecklistMutation,
  useTiposChecklistQuery,
} from "../servicios/tipos-checklist-queries";

// ---------------------------------------------------------------------------
// Sheet — Crear / Editar (mismo formulario, distinto modo)
// ---------------------------------------------------------------------------

function SheetFormulario({
  item,
  modo,
  onCerrar,
  onGuardado,
}: {
  item: TipoChecklist | null;
  modo: "crear" | "editar";
  onCerrar: () => void
  onGuardado: () => void
}) {
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [operadoresRequeridos, setOperadoresRequeridos] = useState(
    String(item?.operadoresRequeridos ?? 1),
  );

  const crear = useCrearTipoChecklistMutation({
    onSuccess: () => {
      setErrorForm(null);
      onGuardado();
      onCerrar();
    },
    onError: (err) => setErrorForm(extraerMensajeError(err)),
  });

  const editar = useEditarTipoChecklistMutation(item?.id ?? 0, {
    onSuccess: () => {
      setErrorForm(null);
      onGuardado();
      onCerrar();
    },
    onError: (err) => setErrorForm(extraerMensajeError(err)),
  });

  const mutacion = modo === "crear" ? crear : editar;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nombre = String(formData.get("nombre") ?? "").trim();

    setErrorForm(null);
    mutacion.mutate({ nombre, operadoresRequeridos: Number(operadoresRequeridos) });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorForm(null);
      onCerrar();
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>
              {modo === "crear" ? "Nuevo tipo de checklist" : "Editar tipo de checklist"}
            </SheetTitle>
            <SheetDescription>
              Define el nombre y la cantidad de operadores que exige este tipo de
              checklist (1 normal, 2 relevo).
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
                <Label htmlFor="tc-nombre">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tc-nombre"
                  name="nombre"
                  placeholder="Ej. Pre-uso volquete"
                  defaultValue={item?.nombre ?? ""}
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="tc-operadores">
                  Operadores requeridos <span className="text-destructive">*</span>
                </Label>
                <Select value={operadoresRequeridos} onValueChange={setOperadoresRequeridos}>
                  <SelectTrigger id="tc-operadores" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 — Normal</SelectItem>
                    <SelectItem value="2">2 — Relevo</SelectItem>
                  </SelectContent>
                </Select>
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
  item: TipoChecklist | null;
  onCerrar: () => void;
  onAnulado: () => void;
}) {
  const [errorAnular, setErrorAnular] = useState<string | null>(null);

  const anular = useAnularTipoChecklistMutation(item?.id ?? 0, {
    onSuccess: () => {
      setErrorAnular(null);
      onAnulado();
      onCerrar();
    },
    onError: (err) => setErrorAnular(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorAnular(null);
      onCerrar();
    }
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Anular tipo de checklist</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Está seguro que desea anular &ldquo;{item?.nombre}&rdquo;? Dejará de
            ofrecerse para nuevas plantillas. Tenga en cuenta que esta información
            ya no se podrá recuperar.
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

function BadgeOperadores({ operadoresRequeridos }: { operadoresRequeridos: number }) {
  return (
    <Badge
      variant="outline"
      className="h-6 rounded-full border-border/70 bg-card px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {operadoresRequeridos} — {operadoresRequeridos === 2 ? "Relevo" : "Normal"}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function TiposChecklistListado() {
  const [filtros, setFiltros] = useState<FiltrosTiposChecklist>({
    estadoRegistro: "ACTIVO",
    pagina: 1,
    limite: 20,
  });

  const consulta = useTiposChecklistQuery(filtros);
  const filas = consulta.data?.datos ?? [];
  const paginacion = consulta.data?.paginacion;

  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estadoRegistro ?? "ACTIVO");

  const [sheetCrearAbierto, setSheetCrearAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<TipoChecklist | null>(null);
  const [itemAnulando, setItemAnulando] = useState<TipoChecklist | null>(null);

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
            <CardTitle>Tipos de checklist</CardTitle>
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
                <TableHead className="w-[40%]">Nombre</TableHead>
                <TableHead className="w-[22%]">Operadores</TableHead>
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
                    No hay tipos de checklist para el filtro aplicado.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="truncate text-sm font-medium">
                      {item.nombre}
                    </TableCell>
                    <TableCell>
                      <BadgeOperadores operadoresRequeridos={item.operadoresRequeridos} />
                    </TableCell>
                    <TableCell>
                      <BadgeEstado estado={item.estadoRegistro} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => setItemEditando(item)}
                              disabled={item.estadoRegistro === "ANULADO"}
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
                              onClick={() => setItemAnulando(item)}
                              disabled={item.estadoRegistro === "ANULADO"}
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
