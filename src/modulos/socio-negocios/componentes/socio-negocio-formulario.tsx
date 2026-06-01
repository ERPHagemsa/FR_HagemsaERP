"use client"

import { useState } from "react"

import { SocioNegocioFormularioCliente } from "./socio-negocio-formulario-cliente"
import { SocioNegocioFormularioProveedor } from "./socio-negocio-formulario-proveedor"
import { SocioNegocioFormularioPersonal } from "./socio-negocio-formulario-personal"
import type { TipoSocioDeNegocio } from "../tipos/socio-negocio"

type SocioNegocioFormularioProps = {
  tipoInicial?: TipoSocioDeNegocio
}

export function SocioNegocioFormulario({ tipoInicial }: SocioNegocioFormularioProps) {
  const [tipo] = useState<TipoSocioDeNegocio>(tipoInicial ?? "CLIENTE")

  if (tipo === "CLIENTE") {
    return <SocioNegocioFormularioCliente />
  }

  if (tipo === "PROVEEDOR") {
    return <SocioNegocioFormularioProveedor />
  }

  if (tipo === "PERSONAL") {
    return <SocioNegocioFormularioPersonal />
  }

  return null
}
