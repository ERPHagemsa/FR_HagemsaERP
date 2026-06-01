"use client"

import { useState } from "react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/compartido/componentes/ui/toggle-group"
import { cn } from "@/compartido/utilidades/utils"

import { SocioNegocioFormularioCliente } from "./socio-negocio-formulario-cliente"
import { SocioNegocioFormularioProveedor } from "./socio-negocio-formulario-proveedor"
import { SocioNegocioFormularioPersonal } from "./socio-negocio-formulario-personal"
import type { TipoSocioDeNegocio } from "../tipos/socio-negocio"

type SocioNegocioFormularioProps = {
  tipoInicial?: TipoSocioDeNegocio
}

const tiposSocio = [
  {
    value: "CLIENTE",
    label: "Cliente",
    descripcion: "Persona o empresa que contrata servicios.",
  },
  {
    value: "PROVEEDOR",
    label: "Proveedor",
    descripcion: "Tercero que abastece bienes o servicios.",
  },
  {
    value: "PERSONAL",
    label: "Personal",
    descripcion: "Colaborador interno con datos laborales.",
  },
] satisfies Array<{
  value: TipoSocioDeNegocio
  label: string
  descripcion: string
}>

export function SocioNegocioFormulario({ tipoInicial }: SocioNegocioFormularioProps) {
  const [tipo, setTipo] = useState<TipoSocioDeNegocio>(tipoInicial ?? "CLIENTE")

  return (
    <div className="flex w-full flex-col gap-5">
      <section className="rounded-xl border border-border bg-card p-5 text-card-foreground">
        <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paso 1
            </p>
            <h2 className="text-lg font-semibold">Tipo de socio de negocio</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Elige el tipo y completa el formulario correspondiente.
          </p>
        </div>

        <ToggleGroup
          type="single"
          value={tipo}
          onValueChange={(value) => {
            if (value) {
              setTipo(value as TipoSocioDeNegocio)
            }
          }}
          className="grid w-full grid-cols-1 items-stretch gap-3 md:grid-cols-3"
          spacing={2}
          variant="outline"
        >
          {tiposSocio.map((opcion) => {
            const seleccionado = tipo === opcion.value

            return (
              <ToggleGroupItem
                key={opcion.value}
                value={opcion.value}
                className={cn(
                  "h-auto min-h-24 justify-start whitespace-normal rounded-lg p-4 text-left",
                  seleccionado && "border-primary bg-muted",
                )}
              >
                <span className="flex flex-col gap-1">
                  <span className="text-base font-semibold">{opcion.label}</span>
                  <span className="text-xs font-normal leading-5 text-muted-foreground">
                    {opcion.descripcion}
                  </span>
                </span>
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </section>

      <section className="min-w-0">
        {tipo === "CLIENTE" ? (
          <SocioNegocioFormularioCliente key="CLIENTE" />
        ) : null}
        {tipo === "PROVEEDOR" ? (
          <SocioNegocioFormularioProveedor key="PROVEEDOR" />
        ) : null}
        {tipo === "PERSONAL" ? (
          <SocioNegocioFormularioPersonal key="PERSONAL" />
        ) : null}
      </section>
    </div>
  )
}
