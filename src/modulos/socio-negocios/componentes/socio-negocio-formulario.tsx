"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/compartido/componentes/ui/button"
import { Badge } from "@/compartido/componentes/ui/badge"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/compartido/componentes/ui/toggle-group"
import { cn } from "@/compartido/utilidades/utils"
import { Building2, type LucideIcon, Package, Plus, User } from "lucide-react"

import { SocioNegocioFormularioCliente } from "./socio-negocio-formulario-cliente"
import { SocioNegocioFormularioProveedor } from "./socio-negocio-formulario-proveedor"
import { SocioNegocioFormularioPersonal } from "./socio-negocio-formulario-personal"
import { SocioNegocioPageHeader } from "./socio-negocio-page-header"
import type { TipoSocioDeNegocio } from "../tipos/socio-negocio"

type SocioNegocioFormularioProps = {
  tipoInicial?: TipoSocioDeNegocio
}

const tiposSocio = [
  {
    value: "CLIENTE",
    label: "Cliente",
    descripcion: "Persona o empresa que contrata servicios.",
    icon: Building2,
  },
  {
    value: "PROVEEDOR",
    label: "Proveedor",
    descripcion: "Tercero que abastece bienes o servicios.",
    icon: Package,
  },
  {
    value: "PERSONAL",
    label: "Personal",
    descripcion: "Persona natural registrada como socio.",
    icon: User,
  },
] satisfies Array<{
  value: TipoSocioDeNegocio
  label: string
  descripcion: string
  icon: LucideIcon
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
      <SocioNegocioPageHeader
        title="Nuevo socio de negocio"
        description="Crea un registro limpio, revisable y listo para el flujo de aprobacion."
        meta={<Badge variant="secondary">Nuevo registro</Badge>}
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" form={formId}>
              <Plus data-icon="inline-start" strokeWidth={2} />
              {etiquetaAgregar}
            </Button>
          </>
        }
      />

      <section className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
          <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Tipo de socio</h2>
            <p className="text-sm leading-5 text-muted-foreground">
              Selecciona la categoria antes de completar el registro.
            </p>
          </div>
          <div className="px-5 py-5">
          <ToggleGroup
            type="single"
            value={tipo}
            onValueChange={(value) => {
              if (value) {
                setTipo(value as TipoSocioDeNegocio)
              }
            }}
            className="grid w-full max-w-3xl grid-cols-1 items-stretch gap-1 rounded-lg bg-muted p-1 sm:grid-cols-3"
            spacing={0}
            variant="outline"
          >
            {tiposSocio.map((opcion) => {
              const seleccionado = tipo === opcion.value
              const Icon = opcion.icon

              return (
                <ToggleGroupItem
                  key={opcion.value}
                  value={opcion.value}
                  className={cn(
                    "h-11 justify-center whitespace-normal border-transparent bg-background px-4 text-left shadow-none transition-all hover:border-primary/20 hover:bg-background hover:text-primary hover:shadow-xs",
                    seleccionado && "border-primary/25 bg-background text-primary shadow-xs ring-1 ring-primary/10",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center text-muted-foreground",
                        seleccionado && "text-primary",
                      )}
                    >
                      <Icon strokeWidth={2} />
                    </span>
                    <span className="text-sm font-medium">{opcion.label}</span>
                  </span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
          </div>
        </div>
      </section>

      <section className="min-w-0" aria-label="Datos del socio">
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
