"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/compartido/componentes/ui/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/compartido/componentes/ui/toggle-group"
import { cn } from "@/compartido/utilidades/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

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
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoSocioDeNegocio>(tipoInicial ?? "CLIENTE")
  const formId = `agregar-${tipo.toLowerCase()}`
  const etiquetaAgregar =
    tipo === "CLIENTE"
      ? "Agregar cliente"
      : tipo === "PROVEEDOR"
        ? "Agregar proveedor"
        : "Agregar personal"

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-normal">
          Nuevo socio de negocio
        </h1>
        <div className="flex w-full justify-end gap-3 sm:w-auto">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" form={formId}>
            <HugeiconsIcon
              data-icon="inline-start"
              icon={Add01Icon}
              strokeWidth={2}
            />
            {etiquetaAgregar}
          </Button>
        </div>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-base font-semibold">Tipo de socio</h2>
          <p className="text-sm text-muted-foreground">Selecciona una opcion para completar el registro.</p>
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
                  "h-auto min-h-20 justify-start whitespace-normal rounded-lg p-4 text-left",
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
