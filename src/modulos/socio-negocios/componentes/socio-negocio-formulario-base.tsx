"use client"

import { type FormEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Info, Search } from "lucide-react"

import { ApiError } from "@/compartido/api/axios"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { Separator } from "@/compartido/componentes/ui/separator"
import { Spinner } from "@/compartido/componentes/ui/spinner"

import { consultarSapBusinessPartnerPorDocumento } from "../servicios/socio-negocios-api"
import { useRegistrarSocioDeNegocioMutation } from "../servicios/socio-negocios-queries"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import type {
  RegistrarSocioDeNegocioRequest,
  TipoSocioDeNegocio,
} from "../tipos/socio-negocio"

function texto(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function conservarSoloDigitos(event: FormEvent<HTMLInputElement>, maxLength: number) {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, maxLength)
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) return error.message
  return error instanceof Error ? error.message : "No se pudo registrar el socio."
}

function TituloSeccion({
  descripcion,
  numero,
  titulo,
}: {
  descripcion: string
  numero: string
  titulo: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
        {numero}
      </span>
      <div>
        <h3 className="text-sm font-semibold">{titulo}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p>
      </div>
    </div>
  )
}

export function SocioNegocioFormularioBase({ tipo }: { tipo: TipoSocioDeNegocio }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const { usuario } = useSesion()
  const [buscandoSap, setBuscandoSap] = useState(false)
  const [mensajeSap, setMensajeSap] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const esPersonal = tipo === "PERSONAL"

  async function buscarEnSap() {
    const campoDocumento = formRef.current?.elements.namedItem("numeroDocumento")
    if (campoDocumento instanceof HTMLInputElement && !campoDocumento.reportValidity()) return

    const numeroDocumento = texto(new FormData(formRef.current ?? undefined), "numeroDocumento")
    if (!numeroDocumento || esPersonal) return

    try {
      setBuscandoSap(true)
      setError(null)
      const socio = await consultarSapBusinessPartnerPorDocumento(numeroDocumento, { tipo })
      if (!socio) {
        setMensajeSap("No se encontro el documento en SAP. Puedes registrarlo manualmente.")
        return
      }
      router.push(`/socio-negocios/${socio.id}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setMensajeSap("No se encontro el documento en SAP. Puedes registrarlo manualmente.")
        return
      }
      setError(obtenerMensajeError(err))
    } finally {
      setBuscandoSap(false)
    }
  }

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const primerNombre = texto(formData, "primerNombre")
    const segundoNombre = texto(formData, "segundoNombre")
    const apellidoPaterno = texto(formData, "apellidoPaterno")
    const apellidoMaterno = texto(formData, "apellidoMaterno")
    const razonSocial = esPersonal
      ? [primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(" ")
      : texto(formData, "razonSocial")
    const nombreComercial = esPersonal
      ? [primerNombre, apellidoPaterno].filter(Boolean).join(" ")
      : texto(formData, "nombreComercial")

    const payload: RegistrarSocioDeNegocioRequest = {
      tipo,
      numeroDocumento: texto(formData, "numeroDocumento"),
      razonSocial,
      nombreComercial,
      primerNombre: primerNombre || undefined,
      segundoNombre: segundoNombre || undefined,
      apellidoPaterno: apellidoPaterno || undefined,
      apellidoMaterno: apellidoMaterno || undefined,
      direccion: texto(formData, "direccion"),
      contacto: esPersonal ? nombreComercial : texto(formData, "contacto"),
      correo: texto(formData, "correo"),
      numeroCelular: texto(formData, "numeroCelular"),
      usuarioId: usuario?.nombreUsuario,
    }

    try {
      setError(null)
      const nuevo = await registrarMutation.mutateAsync(payload)
      router.push(`/socio-negocios/${nuevo.id}`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Informacion del socio</h2>
            <p className="text-sm leading-5 text-muted-foreground">
              Completa los datos requeridos para registrar al socio de negocio.
            </p>
          </div>
          <Badge variant="outline">{tipo}</Badge>
        </div>

        <form
          id={`agregar-${tipo.toLowerCase()}`}
          ref={formRef}
          className="px-5 py-5"
          onSubmit={(event) => void registrar(event)}
        >
          <FieldGroup>
            {mensajeSap ? (
              <Alert>
                <Info strokeWidth={2} />
                <AlertTitle>Resultado de SAP</AlertTitle>
                <AlertDescription>{mensajeSap}</AlertDescription>
              </Alert>
            ) : null}

            <section className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <TituloSeccion
                numero="1"
                titulo="Identificacion"
                descripcion="Documento principal del socio."
              />
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Field>
                  <FieldLabel htmlFor={`${tipo}-numeroDocumento`}>
                    {esPersonal ? "DNI" : "RUC o DNI"}
                  </FieldLabel>
                  <Input
                    id={`${tipo}-numeroDocumento`}
                    name="numeroDocumento"
                    placeholder={esPersonal ? "45678912" : "20601234567"}
                    inputMode="numeric"
                    maxLength={esPersonal ? 8 : 11}
                    minLength={8}
                    pattern={esPersonal ? "[0-9]{8}" : "([0-9]{8}|[0-9]{11})"}
                    title={
                      esPersonal
                        ? "Ingresa un DNI de 8 digitos."
                        : "Ingresa un DNI de 8 digitos o un RUC de 11 digitos."
                    }
                    onInput={(event) => conservarSoloDigitos(event, esPersonal ? 8 : 11)}
                    required
                  />
                  <FieldDescription>
                    {esPersonal
                      ? "Solo numeros. El DNI debe tener 8 digitos."
                      : "Solo numeros. DNI de 8 digitos o RUC de 11 digitos."}
                  </FieldDescription>
                </Field>
                {!esPersonal ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="self-start sm:mt-6"
                    disabled={buscandoSap}
                    onClick={() => void buscarEnSap()}
                  >
                    {buscandoSap ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <Search data-icon="inline-start" strokeWidth={2} />
                    )}
                    {buscandoSap ? "Buscando..." : "Consultar SAP"}
                  </Button>
                ) : null}
              </div>
            </section>

            <Separator />

            <section className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <TituloSeccion
                numero="2"
                titulo={esPersonal ? "Identidad personal" : "Identidad comercial"}
                descripcion={esPersonal ? "Nombres completos de la persona." : "Nombre legal y comercial del negocio."}
              />
              {esPersonal ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field><FieldLabel htmlFor="primerNombre">Primer nombre</FieldLabel><Input id="primerNombre" name="primerNombre" required /></Field>
                  <Field><FieldLabel htmlFor="segundoNombre">Segundo nombre</FieldLabel><Input id="segundoNombre" name="segundoNombre" /></Field>
                  <Field><FieldLabel htmlFor="apellidoPaterno">Apellido paterno</FieldLabel><Input id="apellidoPaterno" name="apellidoPaterno" required /></Field>
                  <Field><FieldLabel htmlFor="apellidoMaterno">Apellido materno</FieldLabel><Input id="apellidoMaterno" name="apellidoMaterno" required /></Field>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field><FieldLabel htmlFor={`${tipo}-razonSocial`}>Razon social</FieldLabel><Input id={`${tipo}-razonSocial`} name="razonSocial" required /></Field>
                  <Field><FieldLabel htmlFor={`${tipo}-nombreComercial`}>Nombre comercial</FieldLabel><Input id={`${tipo}-nombreComercial`} name="nombreComercial" required /></Field>
                </div>
              )}
            </section>

            <Separator />

            <section className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <TituloSeccion
                numero="3"
                titulo="Contacto"
                descripcion="Datos principales para comunicarse."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field className="sm:col-span-2"><FieldLabel htmlFor={`${tipo}-direccion`}>Direccion</FieldLabel><Input id={`${tipo}-direccion`} name="direccion" required /></Field>
                {!esPersonal ? <Field><FieldLabel htmlFor={`${tipo}-contacto`}>Persona de contacto</FieldLabel><Input id={`${tipo}-contacto`} name="contacto" required /></Field> : null}
                <Field><FieldLabel htmlFor={`${tipo}-correo`}>Correo</FieldLabel><Input id={`${tipo}-correo`} name="correo" type="email" required /></Field>
                <Field>
                  <FieldLabel htmlFor={`${tipo}-celular`}>Celular</FieldLabel>
                  <Input
                    id={`${tipo}-celular`}
                    name="numeroCelular"
                    inputMode="numeric"
                    maxLength={9}
                    minLength={9}
                    pattern="[0-9]{9}"
                    title="Ingresa un celular de 9 digitos."
                    onInput={(event) => conservarSoloDigitos(event, 9)}
                    required
                  />
                  <FieldDescription>Solo numeros. Debe tener 9 digitos.</FieldDescription>
                </Field>
              </div>
            </section>

          </FieldGroup>
        </form>
      </div>

      <AlertDialog open={error !== null} onOpenChange={(open) => !open && setError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No se pudo registrar</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
