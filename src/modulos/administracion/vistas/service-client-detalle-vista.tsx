"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Ban,
  Copy,
  KeyRound,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react"

import { extraerMensajeError } from "@/compartido/api"
import { SiteHeader } from "@/compartido/componentes/site-header"
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
import { Field, FieldDescription, FieldLabel } from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { cn } from "@/compartido/utilidades/utils"

import { RolesChecklist } from "../componentes/roles-checklist"
import { useRoles } from "../ganchos/use-roles"
import {
  useAsignarRolesServiceClient,
  useReactivarServiceClient,
  useRevocarSecreto,
  useRotarSecreto,
  useServiceClient,
  useSuspenderServiceClient,
} from "../ganchos/use-service-clients"
import type {
  SecretoServiceClient,
  ServiceClientResponse,
} from "../tipos/administracion.tipos"

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}

function fecha(iso: string): string {
  return new Date(iso).toLocaleString("es-PE")
}

// --- Estado de un secreto (derivado de las fechas) ---
function estadoSecreto(s: SecretoServiceClient): {
  texto: string
  clase: string
} {
  if (s.revocadoEn) return { texto: "revocado", clase: "bg-red-500/10 text-red-600" }
  if (!s.activo) return { texto: "expirado", clase: "bg-zinc-500/10 text-zinc-500" }
  return { texto: "activo", clase: "bg-emerald-500/10 text-emerald-700" }
}

interface PropsAccion {
  cliente: ServiceClientResponse
  onActualizado: () => unknown
}

function DialogRotarSecreto({ cliente, onActualizado }: PropsAccion) {
  const [abierto, setAbierto] = useState(false)
  const [gracia, setGracia] = useState("")
  const [secret, setSecret] = useState<string | null>(null)
  const mutation = useRotarSecreto(cliente.id, {
    onSuccess: (data) => {
      setSecret(data.secret)
      void onActualizado()
    },
  })

  function cerrar(siguiente: boolean) {
    setAbierto(siguiente)
    if (!siguiente) {
      setSecret(null)
      setGracia("")
    }
  }

  async function rotar() {
    try {
      const graciaSegundos = gracia.trim() ? Number(gracia.trim()) : undefined
      await mutation.mutateAsync({ graciaSegundos })
      toast.success("Secreto rotado")
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo rotar el secreto."))
    }
  }

  async function copiar() {
    if (!secret) return
    await navigator.clipboard.writeText(secret)
    toast.success("Secret copiado")
  }

  return (
    <Dialog open={abierto} onOpenChange={cerrar}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <RefreshCw />
          Rotar secreto
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Rotar secreto</DialogTitle>
          <DialogDescription>
            {secret
              ? "Copiá el nuevo secret: se muestra una única vez."
              : "Genera un secreto nuevo sin invalidar el anterior (máximo 2 activos). El viejo sigue vivo hasta que lo revoques o expire."}
          </DialogDescription>
        </DialogHeader>
        {secret ? (
          <Field>
            <FieldLabel>Nuevo secret</FieldLabel>
            <div className="flex gap-2">
              <Input value={secret} readOnly className="rounded-md font-mono" />
              <Button variant="outline" size="icon" className="rounded-md" onClick={() => void copiar()}>
                <Copy />
              </Button>
            </div>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="gracia">Segundos de gracia (opcional)</FieldLabel>
            <Input
              id="gracia"
              className="rounded-md"
              value={gracia}
              onChange={(e) => setGracia(e.target.value.replace(/\D/g, ""))}
              placeholder="Ej. 3600 (1 hora)"
              inputMode="numeric"
            />
            <FieldDescription>
              Si lo indicás, el secreto viejo se programa para expirar en ese tiempo.
              Si no, queda activo hasta revocarlo.
            </FieldDescription>
          </Field>
        )}
        <DialogFooter>
          {secret ? (
            <Button className="rounded-md" onClick={() => cerrar(false)}>Cerrar</Button>
          ) : (
            <>
              <Button variant="ghost" className="rounded-md" onClick={() => cerrar(false)} disabled={mutation.isPending}>
                Cancelar
              </Button>
              <Button className="rounded-md" onClick={() => void rotar()} disabled={mutation.isPending}>
                {mutation.isPending ? "Rotando..." : "Rotar"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogRevocarSecreto({
  cliente,
  secreto,
  onActualizado,
}: PropsAccion & { secreto: SecretoServiceClient }) {
  const [abierto, setAbierto] = useState(false)
  const mutation = useRevocarSecreto(cliente.id, { onSuccess: onActualizado })

  async function revocar() {
    try {
      await mutation.mutateAsync(secreto.id)
      toast.success("Secreto revocado")
      setAbierto(false)
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo revocar el secreto."))
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-md text-destructive hover:text-destructive">
          <Trash2 />
          Revocar
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Revocar secreto</DialogTitle>
          <DialogDescription>
            El secreto deja de servir para pedir tokens de inmediato. Los backends
            que lo usen dejarán de poder autenticarse. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" className="rounded-md" onClick={() => setAbierto(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" className="rounded-md" onClick={() => void revocar()} disabled={mutation.isPending}>
            {mutation.isPending ? "Revocando..." : "Revocar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogEditarRoles({ cliente, onActualizado }: PropsAccion) {
  const [abierto, setAbierto] = useState(false)
  const [roles, setRoles] = useState<string[]>(cliente.roles.map((r) => r.rolId))
  const mutation = useAsignarRolesServiceClient(cliente.id, { onSuccess: onActualizado })

  function abrir(siguiente: boolean) {
    if (siguiente) setRoles(cliente.roles.map((r) => r.rolId))
    setAbierto(siguiente)
  }

  async function guardar() {
    try {
      await mutation.mutateAsync({ roles: roles.map((rolId) => ({ rolId, scope: {} })) })
      toast.success("Roles actualizados")
      setAbierto(false)
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudieron actualizar los roles."))
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <Pencil />
          Editar roles
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Editar roles</DialogTitle>
          <DialogDescription>
            Reemplaza el conjunto de roles del cliente. Los tokens nuevos reflejarán
            los permisos actualizados; los vigentes recién al vencer (TTL 10 min).
          </DialogDescription>
        </DialogHeader>
        <RolesChecklist seleccionados={roles} onChange={setRoles} disabled={mutation.isPending} />
        <DialogFooter>
          <Button variant="ghost" className="rounded-md" onClick={() => setAbierto(false)} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button className="rounded-md" onClick={() => void guardar()} disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BotonSuspender({ cliente, onActualizado }: PropsAccion) {
  const mutation = useSuspenderServiceClient(cliente.id, { onSuccess: onActualizado })
  async function ejecutar() {
    try {
      await mutation.mutateAsync()
      toast.success("Cliente suspendido")
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo suspender el cliente."))
    }
  }
  return (
    <Button variant="outline" size="sm" className="rounded-md" onClick={() => void ejecutar()} disabled={mutation.isPending}>
      <Ban />
      {mutation.isPending ? "Suspendiendo..." : "Suspender"}
    </Button>
  )
}

function BotonReactivar({ cliente, onActualizado }: PropsAccion) {
  const mutation = useReactivarServiceClient(cliente.id, { onSuccess: onActualizado })
  async function ejecutar() {
    try {
      await mutation.mutateAsync()
      toast.success("Cliente reactivado")
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo reactivar el cliente."))
    }
  }
  return (
    <Button size="sm" className="rounded-md" onClick={() => void ejecutar()} disabled={mutation.isPending}>
      <Play />
      {mutation.isPending ? "Reactivando..." : "Reactivar"}
    </Button>
  )
}

export function ServiceClientDetalleVista({ clienteId }: { clienteId: string }) {
  const { data, isLoading, isError, error, refetch } = useServiceClient(clienteId)
  const { data: rolesData } = useRoles({ limite: 100 })

  const nombrePorRolId = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of rolesData?.datos ?? []) m.set(r.id, r.nombre)
    return m
  }, [rolesData])

  return (
    <>
      <SiteHeader
        title="Cliente de servicio"
        breadcrumbs={[
          { title: "IAM y administración" },
          { title: "Clientes de servicio", href: "/admin/service-clients" },
          { title: "Detalle" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit rounded-md text-muted-foreground">
          <Link href="/admin/service-clients">
            <ArrowLeft />
            Volver a clientes de servicio
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-3 border p-5">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : isError ? (
          <div className="border border-destructive/30 p-5 text-sm text-destructive">
            {extraerMensajeError(error, "No se pudo cargar el cliente de servicio.")}
          </div>
        ) : data ? (
          <>
            {/* Cabecera */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="font-mono text-2xl font-semibold tracking-tight">
                    {data.clientId}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-md capitalize",
                      data.estado === "suspendido" && "border-red-500/40 text-red-600",
                    )}
                  >
                    {data.estado}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{data.nombre}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DialogRotarSecreto cliente={data} onActualizado={refetch} />
                {data.estado === "activo" ? (
                  <BotonSuspender cliente={data} onActualizado={refetch} />
                ) : (
                  <BotonReactivar cliente={data} onActualizado={refetch} />
                )}
              </div>
            </div>

            {/* Datos */}
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Dato etiqueta="Client ID">
                <span className="font-mono">{data.clientId}</span>
              </Dato>
              <Dato etiqueta="Nombre">{data.nombre}</Dato>
              <Dato etiqueta="Descripción">{data.descripcion ?? "—"}</Dato>
              <Dato etiqueta="Creado">{fecha(data.createdAt)}</Dato>
              <Dato etiqueta="Última actualización">{fecha(data.updatedAt)}</Dato>
              <Dato etiqueta="ID">
                <span className="font-mono text-xs">{data.id}</span>
              </Dato>
            </dl>

            {/* Secretos */}
            <div className="space-y-4 border p-5">
              <div>
                <h2 className="text-sm font-medium">Secretos</h2>
                <p className="text-xs text-muted-foreground">
                  Hasta 2 activos para rotación con solapamiento. El valor en claro solo
                  se muestra al crear o rotar.
                </p>
              </div>
              {data.secretos.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin secretos.</p>
              ) : (
                <ul className="space-y-2">
                  {data.secretos.map((s) => {
                    const est = estadoSecreto(s)
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <KeyRound className="size-4 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{s.id.slice(0, 8)}…</span>
                              <span className={cn("rounded px-1.5 py-0.5 text-xs capitalize", est.clase)}>
                                {est.texto}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Creado {fecha(s.createdAt)}
                              {s.expiraEn ? ` · expira ${fecha(s.expiraEn)}` : ""}
                              {s.revocadoEn ? ` · revocado ${fecha(s.revocadoEn)}` : ""}
                            </div>
                          </div>
                        </div>
                        {s.activo ? (
                          <DialogRevocarSecreto cliente={data} secreto={s} onActualizado={refetch} />
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Roles */}
            <div className="space-y-4 border p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-medium">Roles</h2>
                  <p className="text-xs text-muted-foreground">
                    Sus permisos viajan embebidos en el token del cliente.
                  </p>
                </div>
                <DialogEditarRoles cliente={data} onActualizado={refetch} />
              </div>
              {data.roles.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sin roles asignados — el cliente no podrá pasar ningún{" "}
                  <span className="font-mono">@RequirePermission</span>.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.roles.map((r) => (
                    <Badge key={r.rolId} variant="secondary" className="rounded-md">
                      {nombrePorRolId.get(r.rolId) ?? r.rolId}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  )
}
