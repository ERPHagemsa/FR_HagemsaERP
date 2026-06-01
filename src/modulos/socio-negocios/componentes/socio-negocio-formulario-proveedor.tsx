"use client"

import { type FormEvent, type ReactNode, useState } from "react"
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

import {
  useMaestrosConfiguracionGeneralQuery,
  useRegistrarSocioDeNegocioMutation,
} from "../servicios/socio-negocios-queries"
import type {
  MaestroConfiguracionGeneralIntegracion,
  RegistrarProveedorRequest,
} from "../tipos/socio-negocio"

const USUARIO_RESPONSABLE_ID = "admin"

type ErrorDialogo = {
  titulo: string
  descripcion: string
}

type SocioNegocioFormularioProveedorProps = {
  selectorTipo?: ReactNode
}

function texto(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function textoOpcional(formData: FormData, name: string) {
  const valor = texto(formData, name)
  return valor || undefined
}

function buscarMaestro(
  datos: MaestroConfiguracionGeneralIntegracion[],
  id?: string,
) {
  return id ? datos.find((dato) => dato.id === id) : undefined
}

function obtenerErrorDialogo(error: unknown): ErrorDialogo {
  if (error instanceof ApiError && error.status === 409) {
    return {
      titulo: "Registro duplicado",
      descripcion:
        error.message ||
        "Ya existe un proveedor con el mismo documento o codigo SAP.",
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
    titulo: "No se pudo registrar el proveedor",
    descripcion:
      error instanceof Error
        ? error.message
        : "No se pudo registrar el proveedor.",
  }
}

function CatalogoSelect({
  datos,
  disabled,
  id,
  name,
  onValueChange,
  placeholder,
  value,
}: {
  datos: MaestroConfiguracionGeneralIntegracion[]
  disabled?: boolean
  id: string
  name: string
  onValueChange?: (value: string) => void
  placeholder: string
  value?: string
}) {
  return (
    <Select
      name={name}
      disabled={disabled}
      value={value}
      onValueChange={onValueChange}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {datos.length > 0 ? (
            datos.map((dato) => (
              <SelectItem key={dato.id} value={dato.id}>
                {dato.nombre}
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

export function SocioNegocioFormularioProveedor({
  selectorTipo,
}: SocioNegocioFormularioProveedorProps) {
  const router = useRouter()
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const [errorDialogo, setErrorDialogo] = useState<ErrorDialogo | null>(null)
  const cuentasQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "CUENTA",
  })
  const areasQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "AREA",
  })
  const cargosQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "CARGO",
  })

  const cuentas = (cuentasQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const areas = (areasQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const cargos = (cargosQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")

  const catalogosCargando =
    cuentasQuery.isLoading || areasQuery.isLoading || cargosQuery.isLoading

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorDialogo(null)

    const formData = new FormData(event.currentTarget)
    const cargoId = textoOpcional(formData, "cargo")
    const areaId = textoOpcional(formData, "area")
    const cuentaId = textoOpcional(formData, "cuenta")

    const cargoMaestro = buscarMaestro(cargos, cargoId)
    const areaMaestro = buscarMaestro(areas, areaId)
    const cuentaMaestro = buscarMaestro(cuentas, cuentaId)

    try {
      const payload: RegistrarProveedorRequest = {
        tipo: "PROVEEDOR",
        codigoInternoSap: texto(formData, "codigoInternoSap"),
        numeroDocumento: texto(formData, "numeroDocumento"),
        razonSocial: texto(formData, "razonSocial"),
        nombreComercial: texto(formData, "nombreComercial"),
        direccion: texto(formData, "direccion"),
        contacto: texto(formData, "nombreContacto"),
        correo: texto(formData, "correo"),
        numeroCelular: texto(formData, "numeroCelular"),
        areaId: areaMaestro?.id,
        areaNombre: areaMaestro?.nombre,
        cargoId: cargoMaestro?.id,
        cargoNombre: cargoMaestro?.nombre,
        cuentaId: cuentaMaestro?.id,
        cuentaNombre: cuentaMaestro?.nombre,
        usuarioId: USUARIO_RESPONSABLE_ID,
      }

      await registrarMutation.mutateAsync(payload)

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Nuevo proveedor</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra los datos comerciales y el contacto principal del proveedor.
              </p>
            </div>
            {selectorTipo ? <div className="w-full lg:max-w-xs">{selectorTipo}</div> : null}
          </div>
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
                  <div className="grid gap-4 md:grid-cols-1">
                    <Field>
                      <FieldLabel htmlFor="codigoInternoSap">Codigo SAP</FieldLabel>
                      <Input
                        id="codigoInternoSap"
                        name="codigoInternoSap"
                        placeholder="SAP-PRO-001"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="numeroDocumento">RUC</FieldLabel>
                      <Input
                        id="numeroDocumento"
                        name="numeroDocumento"
                        placeholder="20123456789"
                        required
                      />
                    </Field>
                  </div>
                </FieldSet>

                <FieldSet className="rounded-lg border border-border p-4">
                  <FieldLegend>Informacion comercial</FieldLegend>
                  <FieldDescription>
                    Datos principales para busqueda, comunicacion y ficha del proveedor.
                  </FieldDescription>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field className="md:col-span-2 xl:col-span-2">
                      <FieldLabel htmlFor="razonSocial">Razon social</FieldLabel>
                      <Input
                        id="razonSocial"
                        name="razonSocial"
                        placeholder="Proveedor Demo SAC"
                        required
                      />
                    </Field>

                    <Field className="md:col-span-2 xl:col-span-3">
                      <FieldLabel htmlFor="nombreComercial">Nombre comercial</FieldLabel>
                      <Input
                        id="nombreComercial"
                        name="nombreComercial"
                        placeholder="Proveedor Demo"
                        required
                      />
                    </Field>

                    <Field className="md:col-span-2 xl:col-span-3">
                      <FieldLabel htmlFor="direccion">Direccion principal</FieldLabel>
                      <Input
                        id="direccion"
                        name="direccion"
                        placeholder="Av. Principal 123"
                        required
                      />
                    </Field>

                    <Field className="md:col-span-2 xl:col-span-3">
                      <FieldLabel htmlFor="cuenta">Cuenta</FieldLabel>
                      <CatalogoSelect
                        datos={cuentas}
                        disabled={cuentasQuery.isLoading}
                        id="cuenta"
                        name="cuenta"
                        placeholder={
                          cuentasQuery.isLoading ? "Cargando cuentas..." : "Selecciona una cuenta"
                        }
                      />
                    </Field>
                  </div>
                </FieldSet>
              </div>

              <FieldSet className="rounded-lg border border-border p-4">
                <FieldLegend>Datos de contacto</FieldLegend>
                <FieldDescription>
                  Persona con la que se coordina por parte del proveedor.
                </FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                    <FieldLabel htmlFor="area">Departamento</FieldLabel>
                    <CatalogoSelect
                      datos={areas}
                      disabled={areasQuery.isLoading}
                      id="area"
                      name="area"
                      placeholder={
                        areasQuery.isLoading
                          ? "Cargando departamentos..."
                          : "Selecciona un departamento"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="cargo">Cargo</FieldLabel>
                    <CatalogoSelect
                      datos={cargos}
                      disabled={cargosQuery.isLoading}
                      id="cargo"
                      name="cargo"
                      placeholder={
                        cargosQuery.isLoading ? "Cargando cargos..." : "Selecciona un cargo"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="correo">Correo</FieldLabel>
                    <Input
                      id="correo"
                      name="correo"
                      type="email"
                      placeholder="contacto@demo.pe"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="numeroCelular">Celular</FieldLabel>
                    <Input
                      id="numeroCelular"
                      name="numeroCelular"
                      placeholder="999999999"
                      required
                    />
                  </Field>
                </div>
              </FieldSet>

              <p className="text-sm text-muted-foreground">
                La operacion guardara el registro con fecha y usuario responsable.
              </p>

              {registrarMutation.isSuccess ? (
                <Alert>
                  <AlertTitle>Proveedor registrado</AlertTitle>
                  <AlertDescription>Redirigiendo al listado de proveedores.</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={registrarMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={registrarMutation.isPending || catalogosCargando}>
                  {registrarMutation.isPending ? "Registrando..." : "Registrar proveedor"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </div>
      </section>

      <AlertDialog open={errorDialogo !== null} onOpenChange={() => setErrorDialogo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialogo?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>{errorDialogo?.descripcion}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
