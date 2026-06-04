"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Add01Icon, Cancel01Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { extraerMensajeError } from "@/compartido/api"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import {
  useAsignacionesCuenta,
  useAsignarRol,
  useCambiarScopeAsignacion,
  useRevocarAsignacion,
} from "../ganchos/use-asignaciones"
import { useRoles } from "../ganchos/use-roles"
import type {
  AsignacionResponse,
  RolResponse,
} from "../tipos/administracion.tipos"

function nombreDelRol(
  rolId: string,
  roles: ReadonlyArray<RolResponse> | undefined,
): string {
  return roles?.find((r) => r.id === rolId)?.nombre ?? rolId.slice(0, 8)
}

function esStringNoVacio(valor: unknown): boolean {
  return typeof valor === "string" && valor.trim().length > 0
}

// Parsea y valida el textarea de scope. Vacio = {} (sin restriccion). El scope
// debe ser un objeto plano donde cada valor es un texto no vacio o una lista de
// textos no vacios (mismas reglas que el backend). Devuelve el objeto o un
// mensaje de error para mostrar al usuario.
function parsearScope(
  texto: string,
): { ok: true; scope: Record<string, unknown> } | { ok: false; error: string } {
  let parseado: unknown
  try {
    parseado = texto.trim() ? JSON.parse(texto) : {}
  } catch {
    return { ok: false, error: "Scope JSON invalido." }
  }

  if (
    typeof parseado !== "object" ||
    parseado === null ||
    Array.isArray(parseado)
  ) {
    return {
      ok: false,
      error: 'El scope debe ser un objeto JSON (ej. {} o {"almacenId":"lima-1"}).',
    }
  }

  for (const [clave, valor] of Object.entries(
    parseado as Record<string, unknown>,
  )) {
    if (!esStringNoVacio(clave)) {
      return { ok: false, error: "Las claves del scope no pueden estar vacias." }
    }
    const valido =
      esStringNoVacio(valor) ||
      (Array.isArray(valor) &&
        valor.length > 0 &&
        valor.every(esStringNoVacio))
    if (!valido) {
      return {
        ok: false,
        error: `El valor de "${clave}" debe ser un texto no vacio o una lista de textos no vacios (ej. "lima-1" o ["lima-1","lima-2"]).`,
      }
    }
  }

  return { ok: true, scope: parseado as Record<string, unknown> }
}

interface PropsDialogAsignar {
  cuentaId: string
  rolesDisponibles: ReadonlyArray<RolResponse>
  rolesYaAsignados: ReadonlyArray<string>
  onActualizado: () => unknown
}

function DialogAsignarRol({
  cuentaId,
  rolesDisponibles,
  rolesYaAsignados,
  onActualizado,
}: PropsDialogAsignar) {
  const [abierto, setAbierto] = useState(false)
  const [rolId, setRolId] = useState("")
  const [scopeTexto, setScopeTexto] = useState("")
  const [expiraEn, setExpiraEn] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useAsignarRol(cuentaId, { onSuccess: onActualizado })

  const disponibles = useMemo(
    () => rolesDisponibles.filter((r) => !rolesYaAsignados.includes(r.id)),
    [rolesDisponibles, rolesYaAsignados],
  )

  function resetear() {
    setRolId("")
    setScopeTexto("")
    setExpiraEn("")
    setError(null)
  }

  async function confirmar() {
    setError(null)

    if (!rolId) {
      setError("Selecciona un rol.")
      return
    }

    const resultado = parsearScope(scopeTexto)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }

    try {
      await mutation.mutateAsync({
        rolId,
        scope: resultado.scope,
        expiraEn: expiraEn || undefined,
      })
      toast.success("Rol asignado correctamente")
      setAbierto(false)
      resetear()
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo asignar el rol.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (!v) resetear()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-none">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          Asignar rol
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>Asignar rol a la cuenta</DialogTitle>
          <DialogDescription>
            Define el rol y opcionalmente un scope (ej. limitar a un almacen) y
            una fecha de expiracion.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rolId">Rol</FieldLabel>
            <Select value={rolId} onValueChange={setRolId}>
              <SelectTrigger id="rolId" className="rounded-none">
                <SelectValue placeholder="Selecciona un rol..." />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {disponibles.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No hay roles disponibles para asignar.
                  </div>
                ) : (
                  disponibles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="scope">Scope (JSON)</FieldLabel>
            <textarea
              id="scope"
              className="min-h-[80px] w-full rounded-none border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              value={scopeTexto}
              onChange={(e) => setScopeTexto(e.target.value)}
              placeholder='{"almacenId":"lima-1"}'
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="expiraEn">
              Expira el (opcional)
            </FieldLabel>
            <Input
              id="expiraEn"
              className="rounded-none"
              type="datetime-local"
              value={expiraEn}
              onChange={(e) => setExpiraEn(e.target.value)}
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-none"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-none"
            onClick={() => void confirmar()}
            disabled={mutation.isPending || disponibles.length === 0}
          >
            {mutation.isPending ? "Asignando..." : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsDialogEditarScope {
  cuentaId: string
  asignacion: AsignacionResponse
  nombreRol: string
  onActualizado: () => unknown
}

function DialogEditarScope({
  cuentaId,
  asignacion,
  nombreRol,
  onActualizado,
}: PropsDialogEditarScope) {
  // Scope vacio => textarea vacio (se ve el placeholder); con datos => JSON
  // identado para editar comodo.
  const scopeInicial =
    Object.keys(asignacion.scope).length > 0
      ? JSON.stringify(asignacion.scope, null, 2)
      : ""
  const [abierto, setAbierto] = useState(false)
  const [scopeTexto, setScopeTexto] = useState(scopeInicial)
  const [error, setError] = useState<string | null>(null)
  const mutation = useCambiarScopeAsignacion(cuentaId, {
    onSuccess: onActualizado,
  })

  async function confirmar() {
    setError(null)

    const resultado = parsearScope(scopeTexto)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }

    try {
      await mutation.mutateAsync({
        asignacionId: asignacion.id,
        payload: { scope: resultado.scope },
      })
      toast.success("Scope actualizado")
      setAbierto(false)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo actualizar el scope.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        setAbierto(v)
        if (v) {
          setScopeTexto(scopeInicial)
          setError(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-none" title="Editar scope">
          <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>Editar scope</DialogTitle>
          <DialogDescription>
            Ajusta el scope del rol {nombreRol}. Dejalo vacio para quitar la
            restriccion (rol sin limite).
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="scope-editar">Scope (JSON)</FieldLabel>
            <textarea
              id="scope-editar"
              className="min-h-[80px] w-full rounded-none border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              value={scopeTexto}
              onChange={(e) => setScopeTexto(e.target.value)}
              placeholder='{"almacenId":"lima-1"}'
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-none"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-none"
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsDialogRevocar {
  cuentaId: string
  asignacion: AsignacionResponse
  nombreRol: string
  onActualizado: () => unknown
}

function DialogRevocarAsignacion({
  cuentaId,
  asignacion,
  nombreRol,
  onActualizado,
}: PropsDialogRevocar) {
  const [abierto, setAbierto] = useState(false)
  const [razon, setRazon] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useRevocarAsignacion(cuentaId, { onSuccess: onActualizado })

  async function confirmar() {
    if (!razon.trim()) {
      setError("La razon es obligatoria.")
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({
        asignacionId: asignacion.id,
        payload: { razon: razon.trim() },
      })
      toast.success("Asignacion revocada")
      setAbierto(false)
      setRazon("")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo revocar.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-none" title="Revocar">
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>Revocar asignacion</DialogTitle>
          <DialogDescription>
            Se revocara el rol {nombreRol} de esta cuenta.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="razon-revocacion">Razon</FieldLabel>
            <Input
              id="razon-revocacion"
              className="rounded-none"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Por que se revoca este rol"
              maxLength={500}
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-none"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="rounded-none"
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Revocando..." : "Revocar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsRolesAsignadosSeccion {
  cuentaId: string
}

export function RolesAsignadosSeccion({
  cuentaId,
}: PropsRolesAsignadosSeccion) {
  const asignaciones = useAsignacionesCuenta(cuentaId)
  const roles = useRoles()

  const items = asignaciones.data?.datos ?? []
  const activos = items.filter((a) => a.activa)
  const rolesYaAsignados = activos.map((a) => a.rolId)

  return (
    <div className="space-y-3 border-t pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Roles asignados</h3>
          <p className="text-xs text-muted-foreground">
            Roles activos de esta cuenta y sus scopes.
          </p>
        </div>
        {roles.data ? (
          <DialogAsignarRol
            cuentaId={cuentaId}
            rolesDisponibles={[...roles.data.datos]}
            rolesYaAsignados={rolesYaAsignados}
            onActualizado={asignaciones.refetch}
          />
        ) : null}
      </div>

      {asignaciones.isLoading ? (
        <Skeleton className="rounded-none h-24 w-full" />
      ) : asignaciones.isError ? (
        <p className="text-sm text-destructive">
          {extraerMensajeError(
            asignaciones.error,
            "No se pudieron cargar las asignaciones.",
          )}
        </p>
      ) : activos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Esta cuenta no tiene roles asignados.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rol</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Asignado</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activos.map((asignacion) => {
              const nombre = nombreDelRol(asignacion.rolId, roles.data?.datos)
              const scopeVacio = Object.keys(asignacion.scope).length === 0
              return (
                <TableRow key={asignacion.id}>
                  <TableCell className="font-medium">
                    <Badge variant="default" className="rounded-none">{nombre}</Badge>
                  </TableCell>
                  <TableCell>
                    {scopeVacio ? (
                      <span className="text-xs text-muted-foreground">
                        sin restriccion
                      </span>
                    ) : (
                      <code className="rounded-none bg-muted px-1.5 py-0.5 text-xs">
                        {JSON.stringify(asignacion.scope)}
                      </code>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(asignacion.asignadoEn).toLocaleDateString("es-PE")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {asignacion.expiraEn
                      ? new Date(asignacion.expiraEn).toLocaleDateString("es-PE")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <DialogEditarScope
                        cuentaId={cuentaId}
                        asignacion={asignacion}
                        nombreRol={nombre}
                        onActualizado={asignaciones.refetch}
                      />
                      <DialogRevocarAsignacion
                        cuentaId={cuentaId}
                        asignacion={asignacion}
                        nombreRol={nombre}
                        onActualizado={asignaciones.refetch}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
