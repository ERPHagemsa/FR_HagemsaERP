"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

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
import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { ApiError } from "@/compartido/api/axios"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"

import { useCatalogoConfiguracionGeneralQuery } from "@/modulos/configuracion-general/servicios/configuracion-general-queries"
import type { ConfiguracionGeneralResponse } from "@/modulos/configuracion-general/tipos/configuracion-general"
import { useRegistrarSocioDeNegocioMutation } from "../servicios/socio-negocios-queries"
import type { TipoSocioDeNegocio } from "../tipos/socio-negocio"

type SocioNegocioFormularioProps = {
  tipoInicial?: TipoSocioDeNegocio
}

const USUARIO_RESPONSABLE_ID = "admin"

type ErrorDialogo = {
  titulo: string
  descripcion: string
}

function texto(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function textoOpcional(formData: FormData, name: string) {
  const valor = texto(formData, name)
  return valor || undefined
}

function construirContacto(formData: FormData) {
  const nombre = texto(formData, "nombreContacto")
  const referencia = texto(formData, "referenciaContacto")

  return referencia ? `${nombre} - ${referencia}` : nombre
}

function obtenerErrorDialogo(error: unknown): ErrorDialogo {
  if (error instanceof ApiError && error.status === 409) {
    return {
      titulo: "Registro duplicado",
      descripcion:
        error.message ||
        "Ya existe un socio de negocio con el mismo documento o codigo SAP.",
    }
  }

  if (error instanceof ApiError && (error.status === 400 || error.status === 422)) {
    return {
      titulo: "Datos incompletos o invalidos",
      descripcion: error.message,
    }
  }

  if (error instanceof ApiError && error.status === 0) {
    return {
      titulo: "Sin conexion con el servidor",
      descripcion: error.message,
    }
  }

  return {
    titulo: "No se pudo registrar el socio",
    descripcion:
      error instanceof Error
        ? error.message
        : "No se pudo registrar el socio de negocio.",
  }
}

function CatalogoSelect({
  datos,
  disabled,
  id,
  name,
  placeholder,
}: {
  datos: ConfiguracionGeneralResponse[]
  disabled?: boolean
  id: string
  name: string
  placeholder: string
}) {
  return (
    <Select name={name} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {datos.length > 0 ? (
            datos.map((dato) => (
              <SelectItem key={dato.id} value={dato.nombre}>
                {dato.codigo} - {dato.nombre}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="__sin_datos__" disabled>
              Sin registros disponibles
            </SelectItem>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function SocioNegocioFormulario({
  tipoInicial,
}: SocioNegocioFormularioProps) {
  const router = useRouter()
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const cargosQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "CARGO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const sedesQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "SEDE",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const areasQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "AREA",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const cuentasQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "CUENTA",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const contratosQuery = useCatalogoConfiguracionGeneralQuery({
    tipoDatoMaestro: "CONTRATO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  })
  const [tipo, setTipo] = useState<TipoSocioDeNegocio>(tipoInicial ?? "CLIENTE")
  const [errorDialogo, setErrorDialogo] = useState<ErrorDialogo | null>(null)
  const esTipoFijo = Boolean(tipoInicial)
  const catalogosCargando =
    cargosQuery.isLoading ||
    sedesQuery.isLoading ||
    areasQuery.isLoading ||
    cuentasQuery.isLoading ||
    contratosQuery.isLoading
  const cargos = cargosQuery.data?.datos ?? []
  const sedes = sedesQuery.data?.datos ?? []
  const areas = areasQuery.data?.datos ?? []
  const cuentas = cuentasQuery.data?.datos ?? []
  const contratos = contratosQuery.data?.datos ?? []
  const referenciasContacto = [...areas, ...cargos]

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorDialogo(null)

    const formData = new FormData(event.currentTarget)
    const cargo = textoOpcional(formData, "cargo")
    const sede = textoOpcional(formData, "sede")
    const area = textoOpcional(formData, "area")
    const contrato = textoOpcional(formData, "contrato")
    const nombrePrincipal = texto(formData, "razonSocial")

    if (tipo === "PERSONAL" && (!cargo || !sede || !area || !contrato)) {
      setErrorDialogo({
        titulo: "Datos laborales incompletos",
        descripcion: "Selecciona cargo, sede, area y contrato desde el catalogo.",
      })
      return
    }

    try {
      await registrarMutation.mutateAsync({
        codigoInternoSap: texto(formData, "codigoInternoSap"),
        tipo,
        numeroDocumento: texto(formData, "numeroDocumento"),
        razonSocial: nombrePrincipal,
        nombreComercial: tipo === "PERSONAL" ? nombrePrincipal : texto(formData, "nombreComercial"),
        direccion: texto(formData, "direccion"),
        contacto: construirContacto(formData),
        correo: texto(formData, "correo"),
        numeroCelular: texto(formData, "numeroCelular"),
        cargo: tipo === "PERSONAL" ? cargo : undefined,
        sede: tipo === "PERSONAL" ? sede : undefined,
        area: tipo === "PERSONAL" ? area : undefined,
        contrato: tipo === "PERSONAL" ? contrato : undefined,
        cuenta: textoOpcional(formData, "cuenta"),
        usuarioId: USUARIO_RESPONSABLE_ID,
      })

      router.push("/socio-negocios")
      router.refresh()
    } catch (err: unknown) {
      setErrorDialogo(obtenerErrorDialogo(err))
    }
  }

  return (
    <>
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
                    <FieldLabel htmlFor="razonSocial">
                      {tipo === "PERSONAL" ? "Nombres y apellidos" : "Razon social"}
                    </FieldLabel>
                    <Input
                      id="razonSocial"
                      name="razonSocial"
                      placeholder={tipo === "PERSONAL" ? "Juan Perez" : "Cliente Demo SAC"}
                      required
                    />
                  </Field>

                  {tipo !== "PERSONAL" ? (
                    <Field>
                      <FieldLabel htmlFor="nombreComercial">Nombre comercial</FieldLabel>
                      <Input
                        id="nombreComercial"
                        name="nombreComercial"
                        placeholder="Cliente Demo"
                        required
                      />
                    </Field>
                  ) : null}

                  <Field className="md:col-span-2 xl:col-span-3">
                    <FieldLabel htmlFor="direccion">Direccion principal</FieldLabel>
                    <Input id="direccion" name="direccion" placeholder="Av. Principal 123" required />
                  </Field>

                  <Field className="md:col-span-2 xl:col-span-3">
                    <FieldLabel htmlFor="cuenta">Cuenta</FieldLabel>
                    <CatalogoSelect
                      datos={cuentas}
                      disabled={cuentasQuery.isLoading}
                      id="cuenta"
                      name="cuenta"
                      placeholder={cuentasQuery.isLoading ? "Cargando cuentas..." : "Selecciona una cuenta"}
                    />
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
                  <CatalogoSelect
                    datos={referenciasContacto}
                    disabled={areasQuery.isLoading || cargosQuery.isLoading}
                    id="referenciaContacto"
                    name="referenciaContacto"
                    placeholder={
                      areasQuery.isLoading || cargosQuery.isLoading
                        ? "Cargando catalogo..."
                        : "Selecciona area o cargo"
                    }
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
                    <FieldLabel htmlFor="cargo">Cargo</FieldLabel>
                    <CatalogoSelect
                      datos={cargos}
                      disabled={cargosQuery.isLoading}
                      id="cargo"
                      name="cargo"
                      placeholder={cargosQuery.isLoading ? "Cargando cargos..." : "Selecciona un cargo"}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="sede">Sede</FieldLabel>
                    <CatalogoSelect
                      datos={sedes}
                      disabled={sedesQuery.isLoading}
                      id="sede"
                      name="sede"
                      placeholder={sedesQuery.isLoading ? "Cargando sedes..." : "Selecciona una sede"}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="area">Area</FieldLabel>
                    <CatalogoSelect
                      datos={areas}
                      disabled={areasQuery.isLoading}
                      id="area"
                      name="area"
                      placeholder={areasQuery.isLoading ? "Cargando areas..." : "Selecciona un area"}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contrato">Contrato</FieldLabel>
                    <CatalogoSelect
                      datos={contratos}
                      disabled={contratosQuery.isLoading}
                      id="contrato"
                      name="contrato"
                      placeholder={contratosQuery.isLoading ? "Cargando contratos..." : "Selecciona un contrato"}
                    />
                  </Field>
                </div>
              </FieldSet>
            ) : null}

            <p className="text-sm text-muted-foreground">
              La operacion guardara el registro con fecha y usuario responsable.
            </p>

            {registrarMutation.isSuccess ? (
              <Alert>
                <AlertTitle>Socio registrado</AlertTitle>
                <AlertDescription>Redirigiendo al listado correspondiente.</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex justify-end">
              <Button type="submit" disabled={registrarMutation.isPending || catalogosCargando}>
                {registrarMutation.isPending ? "Registrando..." : "Registrar socio"}
              </Button>
            </div>
            </FieldGroup>
          </form>
        </div>
      </section>

      <AlertDialog
        open={errorDialogo !== null}
        onOpenChange={(open) => !open && setErrorDialogo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialogo?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialogo?.descripcion}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogo(null)}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
