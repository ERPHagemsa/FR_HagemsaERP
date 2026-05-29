"use client";

// Componente de gestion de contactos del prospecto (Slice 4).
// CRUD completo: agregar (Dialog), eliminar (AlertDialog), marcar principal.
// Guards: no eliminar el unico activo, no eliminar el principal directamente.
// Terminal-state gating: si esTerminal todas las acciones se deshabilitan.
// Tras cada mutacion exitosa se llama router.refresh() para refrescar los
// Server Components padre y obtener la lista de contactos actualizada.

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { extraerMensajeError } from "@/compartido/api";
import { BotonIconoAccion } from "@/compartido/componentes/ui/boton-icono-accion";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/compartido/componentes/ui/alert-dialog";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
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

import {
  useAgregarContactoMutation,
  useCambiarContactoPrincipalMutation,
  useEliminarContactoMutation,
} from "../servicios/prospectos-queries";
import {
  issuesAErroresCampo,
  schemaAgregarContacto,
} from "../tipos/prospecto.schemas";
import type { Contacto } from "../tipos/prospecto.tipos";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  idProspecto: number;
  contactos: Contacto[];
  esTerminal?: boolean;
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ContactosProspecto({
  idProspecto,
  contactos,
  esTerminal = false,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Contactos ({contactos.length})</CardTitle>
        {esTerminal ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button size="sm" disabled>
                  Agregar contacto
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              El prospecto esta en estado terminal y no admite cambios
            </TooltipContent>
          </Tooltip>
        ) : (
          <DialogAgregarContacto idProspecto={idProspecto} />
        )}
      </CardHeader>
      <CardContent>
        {contactos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este prospecto no tiene contactos registrados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full [&_td]:px-3 [&_th]:px-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactos.map((contacto) => (
                  <FilaContacto
                    key={contacto.id}
                    contacto={contacto}
                    totalActivos={contactos.length}
                    idProspecto={idProspecto}
                    esTerminal={esTerminal}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Fila de contacto con acciones
// ---------------------------------------------------------------------------

type FilaContactoProps = {
  contacto: Contacto;
  totalActivos: number;
  idProspecto: number;
  esTerminal: boolean;
};

function FilaContacto({
  contacto,
  totalActivos,
  idProspecto,
  esTerminal,
}: FilaContactoProps) {
  const esUnicoActivo = totalActivos === 1;
  const puedeEliminar = !esTerminal && !contacto.esPrincipal && !esUnicoActivo;
  const puedeCambiarPrincipal = !esTerminal && !contacto.esPrincipal;

  // Razon por la que no se puede eliminar (para el tooltip)
  const motivoNoEliminar = esTerminal
    ? "El prospecto esta en estado terminal"
    : contacto.esPrincipal
      ? "Primero asigna otro contacto como principal"
      : esUnicoActivo
        ? "No se puede eliminar el unico contacto activo"
        : null;

  return (
    <TableRow>
      <TableCell className="font-medium">{contacto.nombre}</TableCell>
      <TableCell className="text-muted-foreground">
        {contacto.cargo ?? "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {contacto.telefono ?? "-"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        <span className="block max-w-[240px] break-words">
          {contacto.email ?? "-"}
        </span>
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          {/* Estrella: rellena dorada si es principal; contorno (clickeable) si no */}
          {contacto.esPrincipal ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex size-8 items-center justify-center rounded-4xl bg-amber-400/15">
                  <Star
                    className="size-4 fill-amber-400 text-amber-400"
                    aria-label="Contacto principal"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>Contacto principal</TooltipContent>
            </Tooltip>
          ) : puedeCambiarPrincipal ? (
            <BotonMarcarPrincipal
              idProspecto={idProspecto}
              idContacto={contacto.id}
            />
          ) : null}

          {/* Eliminar contacto */}
          {!puedeEliminar ? (
            <BotonIconoAccion
              icono={Trash2}
              etiqueta={motivoNoEliminar ?? "No se puede eliminar"}
              tono="destructivo"
              disabled
            />
          ) : (
            <DialogEliminarContacto
              idProspecto={idProspecto}
              idContacto={contacto.id}
              nombreContacto={contacto.nombre}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Dialog: Agregar contacto
// ---------------------------------------------------------------------------

type DialogAgregarContactoProps = {
  idProspecto: number;
};

function DialogAgregarContacto({ idProspecto }: DialogAgregarContactoProps) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [erroresCampo, setErroresCampo] = React.useState<
    Record<string, string>
  >({});
  const [isPending, setIsPending] = React.useState(false);
  const [esPrincipal, setEsPrincipal] = React.useState(false);

  const formRef = React.useRef<HTMLFormElement>(null);
  const agregarMutation = useAgregarContactoMutation(idProspecto);

  function resetearEstado() {
    setErroresCampo({});
    setIsPending(false);
    setEsPrincipal(false);
    formRef.current?.reset();
  }

  function handleOpenChange(open: boolean) {
    if (!open) resetearEstado();
    setAbierto(open);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErroresCampo({});

    const form = event.currentTarget;
    const datos = {
      nombre: (
        form.querySelector<HTMLInputElement>("[name=nombre]")?.value ?? ""
      ).trim(),
      cargo:
        (
          form.querySelector<HTMLInputElement>("[name=cargo]")?.value ?? ""
        ).trim() || undefined,
      telefono:
        (
          form.querySelector<HTMLInputElement>("[name=telefono]")?.value ?? ""
        ).trim() || undefined,
      email:
        (
          form.querySelector<HTMLInputElement>("[name=email]")?.value ?? ""
        ).trim() || undefined,
      esPrincipal,
    };

    const resultado = schemaAgregarContacto.safeParse(datos);
    if (!resultado.success) {
      setErroresCampo(issuesAErroresCampo(resultado.error));
      return;
    }

    setIsPending(true);
    try {
      await agregarMutation.mutateAsync(resultado.data);
      setAbierto(false);
      resetearEstado();
      toast.success("Contacto agregado", {
        description: "El contacto fue agregado al prospecto.",
      });
      router.refresh();
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo agregar el contacto"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Agregar contacto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar contacto</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo contacto. Se requiere al menos telefono
            o email.
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="flex flex-col gap-4"
        >
          {/* Nombre */}
          <div className="grid gap-1.5">
            <Label htmlFor="contacto-nombre">
              Nombre
              <span className="ml-1 text-destructive">*</span>
            </Label>
            <Input
              id="contacto-nombre"
              name="nombre"
              placeholder="Nombre completo"
              disabled={isPending}
              aria-invalid={Boolean(erroresCampo.nombre)}
            />
            {erroresCampo.nombre ? (
              <p className="text-xs text-destructive">{erroresCampo.nombre}</p>
            ) : null}
          </div>

          {/* Cargo */}
          <div className="grid gap-1.5">
            <Label htmlFor="contacto-cargo">Cargo</Label>
            <Input
              id="contacto-cargo"
              name="cargo"
              placeholder="Cargo o puesto"
              disabled={isPending}
            />
          </div>

          {/* Telefono y Email en fila */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="contacto-telefono">Telefono</Label>
              <Input
                id="contacto-telefono"
                name="telefono"
                placeholder="+51 999 000 000"
                disabled={isPending}
                aria-invalid={Boolean(erroresCampo.telefono)}
              />
              {erroresCampo.telefono ? (
                <p className="text-xs text-destructive">
                  {erroresCampo.telefono}
                </p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="contacto-email">Email</Label>
              <Input
                id="contacto-email"
                name="email"
                type="email"
                placeholder="correo@empresa.com"
                disabled={isPending}
                aria-invalid={Boolean(erroresCampo.email)}
              />
              {erroresCampo.email ? (
                <p className="text-xs text-destructive">
                  {erroresCampo.email}
                </p>
              ) : null}
            </div>
          </div>

          {/* esPrincipal */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="contacto-es-principal"
              checked={esPrincipal}
              onCheckedChange={(checked) => setEsPrincipal(checked === true)}
              disabled={isPending}
            />
            <Label
              htmlFor="contacto-es-principal"
              className="cursor-pointer font-normal"
            >
              Marcar como contacto principal
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Agregar contacto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// AlertDialog: Eliminar contacto
// ---------------------------------------------------------------------------

type DialogEliminarContactoProps = {
  idProspecto: number;
  idContacto: number;
  nombreContacto: string;
};

function DialogEliminarContacto({
  idProspecto,
  idContacto,
  nombreContacto,
}: DialogEliminarContactoProps) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const eliminarMutation = useEliminarContactoMutation(idProspecto);

  function handleOpenChange(open: boolean) {
    if (!open) {
      setIsPending(false);
    }
    setAbierto(open);
  }

  async function onConfirmar(event: React.MouseEvent) {
    // Prevenir que AlertDialogAction cierre el dialog automaticamente
    event.preventDefault();
    setIsPending(true);
    try {
      await eliminarMutation.mutateAsync(idContacto);
      setAbierto(false);
      toast.success("Contacto eliminado", {
        description: "El contacto fue eliminado del prospecto.",
      });
      router.refresh();
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo eliminar el contacto"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={abierto} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <BotonIconoAccion
          icono={Trash2}
          etiqueta="Eliminar contacto"
          tono="destructivo"
        />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar contacto</AlertDialogTitle>
          <AlertDialogDescription>
            Esta accion eliminara el contacto{" "}
            <strong>{nombreContacto}</strong> del prospecto. Esta operacion no
            se puede deshacer desde esta interfaz.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirmar}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Confirmar eliminacion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Boton: Marcar como principal
// ---------------------------------------------------------------------------

type BotonMarcarPrincipalProps = {
  idProspecto: number;
  idContacto: number;
};

function BotonMarcarPrincipal({
  idProspecto,
  idContacto,
}: BotonMarcarPrincipalProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const cambiarPrincipalMutation =
    useCambiarContactoPrincipalMutation(idProspecto);

  async function onClick() {
    setIsPending(true);
    try {
      await cambiarPrincipalMutation.mutateAsync(idContacto);
      toast.success("Contacto principal actualizado", {
        description: "Se asigno el nuevo contacto principal del prospecto.",
      });
      router.refresh();
    } catch (err) {
      toast.error(
        extraerMensajeError(err, "No se pudo cambiar el contacto principal")
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <BotonIconoAccion
      icono={Star}
      etiqueta="Marcar como principal"
      tono="advertencia"
      onClick={onClick}
      disabled={isPending}
    />
  );
}
