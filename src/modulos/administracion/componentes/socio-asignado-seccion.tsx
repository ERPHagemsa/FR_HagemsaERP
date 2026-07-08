"use client"

import type {
  CuentaContratoResumen,
  PersonalListadoResponse,
} from "@/modulos/socio-negocios/tipos/socio-negocio"

import type { SocioAsignado } from "../tipos/administracion.tipos"

// El snapshot es el objeto de BC01 (PersonalListadoResponse). Las cuentas pueden
// venir anidadas en asignaciones[].cuentasContratos[] o a nivel raíz; cubrimos
// ambas, aplanamos y deduplicamos por id.
function cuentasDeSnapshot(
  snapshot: Record<string, unknown> | null,
): CuentaContratoResumen[] {
  if (!snapshot) return []
  const p = snapshot as unknown as PersonalListadoResponse & {
    cuentasContratos?: CuentaContratoResumen[]
  }
  const anidadas = (p.asignaciones ?? []).flatMap(
    (a) => a.cuentasContratos ?? [],
  )
  const raiz = p.cuentasContratos ?? []
  const vistas = new Set<number>()
  return [...anidadas, ...raiz].filter((c) => {
    if (vistas.has(c.id)) return false
    vistas.add(c.id)
    return true
  })
}

function textoOpcional(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}

export function SocioAsignadoSeccion({ socio }: { socio: SocioAsignado }) {
  const cuentas = cuentasDeSnapshot(socio.snapshot)
  const snap = (socio.snapshot ?? {}) as Record<string, unknown>
  const estado = textoOpcional(snap.estado)
  const correo = textoOpcional(snap.correo)
  const celular = textoOpcional(snap.numeroCelular)
  const contacto = textoOpcional(snap.contacto)
  const direccion = textoOpcional(snap.direccion)

  return (
    <div className="space-y-4 border p-5">
      <div>
        <h2 className="text-sm font-medium">Socio de negocio</h2>
        <p className="text-xs text-muted-foreground">
          Datos del socio vinculado (BC01), capturados al asignarlo a la cuenta.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <Dato etiqueta="Nombre">{socio.nombre ?? "—"}</Dato>
        <Dato etiqueta="Documento">{socio.documento ?? "—"}</Dato>
        <Dato etiqueta="ID externo (BC01)">{socio.socioExternoId}</Dato>
        <Dato etiqueta="Código de socio">
          <span className="font-mono">{socio.codigoSocio}</span>
        </Dato>
        <Dato etiqueta="Código de cuenta">
          <span className="font-mono">{socio.codigoCuenta}</span>
        </Dato>
        <Dato etiqueta="Tipo">
          <span className="capitalize">{socio.tipo}</span>
        </Dato>
        {estado ? <Dato etiqueta="Estado en BC01">{estado}</Dato> : null}
        {correo ? <Dato etiqueta="Correo">{correo}</Dato> : null}
        {celular ? <Dato etiqueta="Celular">{celular}</Dato> : null}
        {contacto ? <Dato etiqueta="Contacto">{contacto}</Dato> : null}
        {direccion ? <Dato etiqueta="Dirección">{direccion}</Dato> : null}
      </dl>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Cuentas / contratos
        </p>
        {cuentas.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Sin cuentas o contratos asignados.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {cuentas.map((c) => (
              <li
                key={c.id}
                className="rounded-md bg-muted/50 px-3 py-2 text-xs"
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
