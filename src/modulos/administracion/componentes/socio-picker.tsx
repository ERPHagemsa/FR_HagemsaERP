"use client"

import { useEffect, useState } from "react"

import { useConsulta } from "@/compartido/api/use-consulta"
import { Button } from "@/compartido/componentes/ui/button"
import { Input } from "@/compartido/componentes/ui/input"
import { consultarPersonalSociosDeNegocio } from "@/modulos/socio-negocios/servicios/socio-negocios-api"
import type {
  CuentaContratoResumen,
  PersonalListadoResponse,
} from "@/modulos/socio-negocios/tipos/socio-negocio"

// Socio de negocio (BC01) elegido para vincular a la cuenta. Solo guardamos el
// vinculo (personalId) + datos para mostrar; el maestro vive en BC01.
export interface SocioSeleccionado {
  readonly socioExternoId: number
  readonly nombre: string
  readonly documento: string
  // Objeto completo de BC01, se envía como snapshot al vincular.
  readonly datos: PersonalListadoResponse
}

// Las cuentas/contratos pueden venir anidadas en asignaciones[].cuentasContratos[]
// (tipo del listado) o a nivel raíz del personal (según el endpoint). Cubrimos
// ambas formas, aplanamos y deduplicamos por id.
function cuentasDe(personal: PersonalListadoResponse): CuentaContratoResumen[] {
  const anidadas = (personal.asignaciones ?? []).flatMap(
    (a) => a.cuentasContratos ?? [],
  )
  const raiz =
    (personal as { cuentasContratos?: CuentaContratoResumen[] })
      .cuentasContratos ?? []
  const vistas = new Set<number>()
  return [...anidadas, ...raiz].filter((c) => {
    if (vistas.has(c.id)) return false
    vistas.add(c.id)
    return true
  })
}

function nombreDe(personal: PersonalListadoResponse): string {
  if (personal.nombreCompleto?.trim()) return personal.nombreCompleto.trim()
  return [
    personal.primerNombre,
    personal.segundoNombre,
    personal.apellidoPaterno,
    personal.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
}

interface SocioPickerProps {
  readonly value: SocioSeleccionado | null
  readonly onChange: (socio: SocioSeleccionado | null) => void
  readonly disabled?: boolean
}

// Buscador de personal de BC01 por DNI. Reusa el servicio de socio-negocios.
// Al seleccionar, expone { socioExternoId (= personalId), nombre, documento }.
export function SocioPicker({ value, onChange, disabled }: SocioPickerProps) {
  const [termino, setTermino] = useState("")
  const [debounced, setDebounced] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebounced(termino.trim()), 300)
    return () => clearTimeout(t)
  }, [termino])

  const habilitado = debounced.length >= 3 && !value
  const query = useConsulta(
    () => consultarPersonalSociosDeNegocio({ numeroDocumento: debounced, pageSize: 8 }),
    [debounced],
    { enabled: habilitado },
  )

  const resultados = query.data?.datos ?? []

  if (value) {
    const cuentas = cuentasDe(value.datos)
    return (
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm">
            <div className="font-medium">{value.nombre || "(sin nombre)"}</div>
            <div className="text-muted-foreground">
              DNI {value.documento} · ID {value.socioExternoId}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-md"
            onClick={() => onChange(null)}
            disabled={disabled}
          >
            Cambiar
          </Button>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Cuentas / contratos
          </p>
          {cuentas.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Sin cuentas o contratos asignados.
            </p>
          ) : (
            <ul className="space-y-1">
              {cuentas.map((c) => (
                <li
                  key={c.id}
                  className="rounded-md bg-muted/50 px-2 py-1.5 text-xs"
                >
                  <div className="font-medium">
                    {c.configuracionNombre ?? c.configuracionCodigo ?? `#${c.id}`}
                    {c.configuracionCodigo ? (
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({c.configuracionCodigo})
                      </span>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground">
                    {c.tipo === "CONTRATO" ? "Contrato" : "Cuenta"}
                    {c.cuentaRaizNombre ? ` · Raíz: ${c.cuentaRaizNombre}` : ""}
                    {c.cuentaRaizCodigo ? ` (${c.cuentaRaizCodigo})` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Input
        className="rounded-md"
        placeholder="Buscar personal por DNI (mín. 3 dígitos)"
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
      />
      {habilitado ? (
        <div className="max-h-52 overflow-auto rounded-md border">
          {query.isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">Buscando…</p>
          ) : resultados.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              Sin resultados para “{debounced}”.
            </p>
          ) : (
            <ul className="divide-y">
              {resultados.map((personal) => (
                <li key={personal.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() =>
                      onChange({
                        socioExternoId: personal.id,
                        nombre: nombreDe(personal),
                        documento: personal.numeroDocumento,
                        datos: personal,
                      })
                    }
                  >
                    <span className="font-medium">
                      {nombreDe(personal) || "(sin nombre)"}
                    </span>
                    <span className="text-muted-foreground">
                      DNI {personal.numeroDocumento}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
