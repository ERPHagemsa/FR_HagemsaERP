"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"

import { useRegistrarSocioDeNegocioMutation } from "../servicios/socio-negocios-queries"
import type { TipoSocioDeNegocio } from "../tipos/socio-negocio"

type SocioNegocioFormularioProps = {
  tipoInicial?: TipoSocioDeNegocio
}

const rutaPorTipo = {
  CLIENTE: "/socio-negocios/clientes",
  PROVEEDOR: "/socio-negocios/proveedores",
  PERSONAL: "/socio-negocios/personal",
} satisfies Record<TipoSocioDeNegocio, string>

const USUARIO_RESPONSABLE_ID = "admin"

function texto(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function construirContacto(formData: FormData) {
  const nombre = texto(formData, "nombreContacto")
  const referencia = texto(formData, "referenciaContacto")

  return referencia ? `${nombre} - ${referencia}` : nombre
}

export function SocioNegocioFormulario({
  tipoInicial,
}: SocioNegocioFormularioProps) {
  const router = useRouter()
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const [tipo, setTipo] = useState<TipoSocioDeNegocio>(tipoInicial ?? "CLIENTE")
  const [error, setError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const esTipoFijo = Boolean(tipoInicial)

  useEffect(() => {
    setHydrated(true)
  }, [])

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    try {
      await registrarMutation.mutateAsync({
        codigoInternoSap: texto(formData, "codigoInternoSap"),
        tipo,
        numeroDocumento: texto(formData, "numeroDocumento"),
        razonSocial: texto(formData, "razonSocial"),
        nombreComercial: texto(formData, "nombreComercial"),
        direccion: texto(formData, "direccion"),
        contacto: construirContacto(formData),
        correo: texto(formData, "correo"),
        numeroCelular: texto(formData, "numeroCelular"),
        puestoTrabajo: tipo === "PERSONAL" ? texto(formData, "puestoTrabajo") : undefined,
        sede: tipo === "PERSONAL" ? texto(formData, "sede") : undefined,
        area: tipo === "PERSONAL" ? texto(formData, "area") : undefined,
        contrato: tipo === "PERSONAL" ? texto(formData, "contrato") : undefined,
        usuarioId: USUARIO_RESPONSABLE_ID,
        origenOperacion: "FRONTEND_ERP",
      })

      router.push(rutaPorTipo[tipo])
      router.refresh()
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el socio de negocio."
      )
    }
  }

  if (!hydrated) {
    return (
      <section className="w-full rounded-xl border border-border bg-card text-card-foreground">
        <div className="border-b border-border px-5 py-4">
          <div className="h-6 w-40 rounded-md bg-muted" />
          <div className="mt-2 h-4 w-96 max-w-full rounded-md bg-muted" />
        </div>
        <div className="grid gap-5 px-5 py-5 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[420px_1fr]">
          <div className="h-64 rounded-lg bg-muted" />
          <div className="h-64 rounded-lg bg-muted" />
          <div className="h-40 rounded-lg bg-muted xl:col-span-2" />
        </div>
      </section>
    )
  }

  return (
    <section className="w-full rounded-xl border border-border bg-card text-card-foreground">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold">Datos del socio</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Completa los datos que identifican al socio y permiten ubicarlo en la operacion.
        </p>
      </div>
      <div className="px-5 py-5">
        <form onSubmit={(event) => void registrar(event)}>
          <FieldGroup>
            <div className="grid w-full gap-5 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[420px_1fr]">
              <FieldSet className="rounded-lg border border-border p-4">
                <FieldLegend>Identificacion</FieldLegend>
                <FieldDescription>
                  Datos que diferencian el registro en el maestro.
                </FieldDescription>
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                  <Field>
                    <FieldLabel htmlFor="tipo">Tipo</FieldLabel>
                    <Select
                      value={tipo}
                      onValueChange={(value) => setTipo(value as TipoSocioDeNegocio)}
                      disabled={esTipoFijo}
                    >
                      <SelectTrigger id="tipo" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="CLIENTE">Cliente</SelectItem>
                          <SelectItem value="PROVEEDOR">Proveedor</SelectItem>
                          <SelectItem value="PERSONAL">Personal</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="codigoInternoSap">Codigo SAP</FieldLabel>
                    <Input
                      id="codigoInternoSap"
                      name="codigoInternoSap"
                      placeholder={
                        tipo === "CLIENTE"
                          ? "SAP-CLI-001"
                          : tipo === "PROVEEDOR"
                            ? "SAP-PRO-001"
                            : "SAP-PER-001"
                      }
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="numeroDocumento">Documento</FieldLabel>
                    <Input
                      id="numeroDocumento"
                      name="numeroDocumento"
                      placeholder={tipo === "PERSONAL" ? "45678912" : "20123456789"}
                      required
                    />
                  </Field>
                </div>
              </FieldSet>

              <FieldSet className="rounded-lg border border-border p-4">
                <FieldLegend>Informacion comercial y administrativa</FieldLegend>
                <FieldDescription>
                  Datos principales para busqueda, comunicacion y ficha del socio.
                </FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="razonSocial">Razon social o nombres</FieldLabel>
                    <Input
                      id="razonSocial"
                      name="razonSocial"
                      placeholder={tipo === "PERSONAL" ? "Juan Perez" : "Cliente Demo SAC"}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="nombreComercial">Nombre comercial</FieldLabel>
                    <Input
                      id="nombreComercial"
                      name="nombreComercial"
                      placeholder={tipo === "PERSONAL" ? "Juan Perez" : "Cliente Demo"}
                      required
                    />
                  </Field>

                  <Field className="md:col-span-2 xl:col-span-3">
                    <FieldLabel htmlFor="direccion">Direccion principal</FieldLabel>
                    <Input id="direccion" name="direccion" placeholder="Av. Principal 123" required />
                  </Field>
                </div>
              </FieldSet>
            </div>

            <FieldSet className="rounded-lg border border-border p-4">
              <FieldLegend>Datos de ubicacion y comunicacion</FieldLegend>
              <FieldDescription>
                Persona o area que atendera coordinaciones del socio.
              </FieldDescription>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field>
                  <FieldLabel htmlFor="nombreContacto">Nombre del contacto</FieldLabel>
                  <Input
                    id="nombreContacto"
                    name="nombreContacto"
                    placeholder="Juan Ramirez"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="referenciaContacto">Area o cargo</FieldLabel>
                  <Input
                    id="referenciaContacto"
                    name="referenciaContacto"
                    placeholder="Compras"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="correo">Correo</FieldLabel>
                  <Input id="correo" name="correo" type="email" placeholder="contacto@demo.pe" required />
                </Field>

                <Field>
                  <FieldLabel htmlFor="numeroCelular">Celular</FieldLabel>
                  <Input id="numeroCelular" name="numeroCelular" placeholder="999999999" required />
                </Field>
              </div>
            </FieldSet>

            {tipo === "PERSONAL" ? (
              <FieldSet className="rounded-lg border border-border p-4">
                <FieldLegend>Informacion laboral</FieldLegend>
                <FieldDescription>
                  Datos requeridos para socios tipo Personal.
                </FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Field>
                    <FieldLabel htmlFor="puestoTrabajo">Puesto de trabajo</FieldLabel>
                    <Input id="puestoTrabajo" name="puestoTrabajo" placeholder="Conductor" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sede">Sede</FieldLabel>
                    <Input id="sede" name="sede" placeholder="Arequipa" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="area">Area</FieldLabel>
                    <Input id="area" name="area" placeholder="Operaciones" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contrato">Contrato</FieldLabel>
                    <Input id="contrato" name="contrato" placeholder="Indefinido" required />
                  </Field>
                </div>
              </FieldSet>
            ) : null}

            <p className="text-sm text-muted-foreground">
              La operacion se registrara con el usuario autenticado del sistema.
            </p>

            {error ? (
              <Field data-invalid>
                <FieldError>{error}</FieldError>
              </Field>
            ) : null}

            {registrarMutation.isSuccess ? (
              <Alert>
                <AlertTitle>Socio registrado</AlertTitle>
                <AlertDescription>Redirigiendo al listado correspondiente.</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={registrarMutation.isPending}>
                {registrarMutation.isPending ? "Registrando..." : "Registrar socio"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </section>
  )
}
