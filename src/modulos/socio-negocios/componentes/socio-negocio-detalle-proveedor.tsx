import type { SocioDeNegocioResponse } from "../tipos/socio-negocio"
import { DatoVer, SeccionDetalle, formatearFecha } from "./socio-negocio-detalle-dato"

/**
 * Detalle de un socio de tipo PROVEEDOR: identidad comercial, datos SAP y
 * trazabilidad. No incluye campos de personal (nombres/apellidos).
 */
export function SocioNegocioDetalleProveedor({
  socio,
}: {
  socio: SocioDeNegocioResponse
}) {
  return (
    <SeccionDetalle
      titulo="Información del proveedor"
      descripcion="Identidad comercial, sincronización con SAP y trazabilidad del registro."
    >
      <DatoVer label="Razón social" value={socio.razonSocial} />
      <DatoVer label="Nombre comercial" value={socio.nombreComercial} />
      <DatoVer label="Código SAP" value={socio.codigoInternoSap} />
      <DatoVer label="Tipo" value={socio.tipo} />
      <DatoVer label="Origen" value={socio.origen} />
      <DatoVer label="Sincronización SAP" value={socio.estadoSincronizacionSap} />
      <DatoVer
        label="Fecha sincronización SAP"
        value={formatearFecha(socio.fechaSincronizacionSap)}
      />
      <DatoVer label="Último error SAP" value={socio.ultimoErrorSincronizacionSap} />
      <DatoVer label="Dirección" value={socio.direccion} />
      <DatoVer label="Contacto" value={socio.contacto} />
      <DatoVer label="Correo" value={socio.correo} />
      <DatoVer label="Celular" value={socio.numeroCelular} />
      <DatoVer label="Creación" value={formatearFecha(socio.fechaCreacion)} />
      <DatoVer label="Usuario creación" value={socio.usuarioCreacion} />
      <DatoVer label="Fecha baja" value={formatearFecha(socio.fechaBaja)} />
      <DatoVer label="Motivo baja" value={socio.motivoBaja} />
      <DatoVer label="Registro anterior" value={socio.registroAnteriorId} />
      <DatoVer label="ID" value={socio.id} />
    </SeccionDetalle>
  )
}
