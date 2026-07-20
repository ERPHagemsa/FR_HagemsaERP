"use client"

import { TriangleAlert } from "lucide-react"

import type { AvisoCorreoDuplicado } from "../ganchos/use-aviso-correo-duplicado"

/**
 * Advertencia de que el correo ya lo usa otra cuenta. Es informativa: el correo
 * no es unico y compartir casilla puede ser intencional, asi que no impide
 * guardar. Se listan las cuentas para que se vea con cuales choca.
 */
export function AvisoCorreoDuplicado({ cuentas }: AvisoCorreoDuplicado) {
  if (cuentas.length === 0) return null

  return (
    <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="space-y-1">
        <p className="font-medium text-amber-700 dark:text-amber-500">
          {cuentas.length === 1
            ? "Este correo ya esta asignado a otra cuenta"
            : `Este correo ya esta asignado a ${cuentas.length} cuentas`}
        </p>
        <ul className="space-y-0.5 text-muted-foreground">
          {cuentas.map((c) => (
            <li key={c.id}>
              <span className="font-mono">{c.nombreUsuario}</span>
              {" — "}
              {c.nombreCompleto}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground">
          Podes continuar igual: el correo puede repetirse. Cada persona entra
          con su nombre de usuario.
        </p>
      </div>
    </div>
  )
}
