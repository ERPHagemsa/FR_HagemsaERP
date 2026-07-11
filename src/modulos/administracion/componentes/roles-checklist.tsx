"use client"

import { Checkbox } from "@/compartido/componentes/ui/checkbox"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"

import { useRoles } from "../ganchos/use-roles"

interface Props {
  // rolIds seleccionados
  readonly seleccionados: ReadonlyArray<string>
  readonly onChange: (rolIds: string[]) => void
  readonly disabled?: boolean
}

// Lista de roles con checkboxes para asignar a un cliente de servicio. Los roles
// se asignan con scope global ({}); scopes por rol se gestionan por API si hace
// falta. Los permisos del rol son los que terminan embebidos en el token.
export function RolesChecklist({ seleccionados, onChange, disabled }: Props) {
  const { data, isLoading, isError } = useRoles({ limite: 100 })
  const roles = data?.datos ?? []

  function toggle(rolId: string) {
    onChange(
      seleccionados.includes(rolId)
        ? seleccionados.filter((r) => r !== rolId)
        : [...seleccionados, rolId],
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-md" />
        ))}
      </div>
    )
  }

  if (isError || roles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No se pudieron cargar los roles.
      </p>
    )
  }

  return (
    <div className="max-h-64 space-y-1 overflow-auto rounded-md border p-1">
      {roles.map((rol) => {
        const marcado = seleccionados.includes(rol.id)
        return (
          <label
            key={rol.id}
            className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
          >
            <Checkbox
              checked={marcado}
              onCheckedChange={() => toggle(rol.id)}
              disabled={disabled}
              className="mt-0.5"
            />
            <span className="min-w-0 text-sm">
              <span className="font-medium">{rol.nombre}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {rol.permisos.length} permiso{rol.permisos.length === 1 ? "" : "s"}
              </span>
              {rol.descripcion ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {rol.descripcion}
                </span>
              ) : null}
            </span>
          </label>
        )
      })}
    </div>
  )
}
