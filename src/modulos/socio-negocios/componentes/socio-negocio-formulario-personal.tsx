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
  RegistrarPersonalRequest,
} from "../tipos/socio-negocio"

const USUARIO_RESPONSABLE_ID = "admin"

type ErrorDialogo = {
  titulo: string
  descripcion: string
}

type SocioNegocioFormularioPersonalProps = {
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
        "Ya existe un empleado con el mismo documento.",
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
    titulo: "No se pudo registrar el personal",
    descripcion:
      error instanceof Error
        ? error.message
        : "No se pudo registrar el personal.",
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

export function SocioNegocioFormularioPersonal({
  selectorTipo,
}: SocioNegocioFormularioPersonalProps) {
  const router = useRouter()
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string | undefined>()
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string | undefined>()
  const [areaSeleccionada, setAreaSeleccionada] = useState<string | undefined>()
  const [errorDialogo, setErrorDialogo] = useState<ErrorDialogo | null>(null)

  const ubicacionesQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "UBICACION",
  })
  const sedesQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "SEDE",
  })
  const areasQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "AREA",
  })
  const cargosQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "CARGO",
  })
  const contratosQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "CONTRATO",
  })
  const cuentasQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "CUENTA",
  })

  const ubicaciones = (ubicacionesQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const sedes = (sedesQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const areas = (areasQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const cargos = (cargosQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const contratos = (contratosQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const cuentas = (cuentasQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")

  const sedeSeleccionadaMaestro = sedesQuery.data?.find((sede) => sede.id === sedeSeleccionada)
  const sedeSeleccionadaId = sedeSeleccionadaMaestro?.id
  const areaSeleccionadaMaestro = areasQuery.data?.find((area) => area.id === areaSeleccionada)
  const ubicacionSeleccionadaMaestro = ubicaciones.find(
    (ubicacion) => ubicacion.id === ubicacionSeleccionada,
  )

  const ubicacionKeys = [
    ubicacionSeleccionadaMaestro?.id,
    ubicacionSeleccionadaMaestro?.idExterno,
  ].filter(Boolean)

  const sedeKeys = [sedeSeleccionadaMaestro?.id, sedeSeleccionadaMaestro?.idExterno].filter(
    Boolean,
  )
  const areaKeys = [areaSeleccionadaMaestro?.id, areaSeleccionadaMaestro?.idExterno].filter(
    Boolean,
  )

  const sedesPorUbicacion =
    ubicacionKeys.length > 0
      ? sedes.filter((sede) => sede.ubicacionId && ubicacionKeys.includes(sede.ubicacionId))
      : []

  const areasPorSede =
    sedeKeys.length > 0
      ? areas.filter((area) => area.sedeId && sedeKeys.includes(area.sedeId))
      : []

  const cargoTieneArea = cargos.some((cargo) => Boolean(cargo.areaId))
  const cargoTieneSede = cargos.some((cargo) => Boolean(cargo.sedeId))
  const cargoTieneUbicacion = cargos.some((cargo) => Boolean(cargo.ubicacionId))

  const cargosPorSeleccion =
    areaKeys.length > 0 && cargoTieneArea
      ? cargos.filter((cargo) => cargo.areaId && areaKeys.includes(cargo.areaId))
      : sedeKeys.length > 0 && cargoTieneSede
        ? cargos.filter((cargo) => cargo.sedeId && sedeKeys.includes(cargo.sedeId))
        : ubicacionKeys.length > 0 && cargoTieneUbicacion
          ? cargos.filter((cargo) => cargo.ubicacionId && ubicacionKeys.includes(cargo.ubicacionId))
          : cargos

  const catalogosCargando =
    ubicacionesQuery.isLoading ||
    sedesQuery.isLoading ||
    areasQuery.isLoading ||
    cargosQuery.isLoading ||
    contratosQuery.isLoading ||
    cuentasQuery.isLoading

  const maestrosConsultados =
    ubicacionesQuery.isSuccess &&
    sedesQuery.isSuccess &&
    areasQuery.isSuccess &&
    cargosQuery.isSuccess &&
    contratosQuery.isSuccess &&
    cuentasQuery.isSuccess

  const faltanMaestros =
    maestrosConsultados &&
    (ubicaciones.length === 0 ||
      cargos.length === 0 ||
      sedes.length === 0 ||
      areas.length === 0 ||
      contratos.length === 0 ||
      cuentas.length === 0)

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorDialogo(null)

    const formData = new FormData(event.currentTarget)
    const ubicacionId = texto(formData, "ubicacion")
    const sedeId = texto(formData, "sede")
    const areaId = texto(formData, "area")
    const cargoId = texto(formData, "cargo")
    const contratoId = texto(formData, "contrato")
    const cuentaId = textoOpcional(formData, "cuenta")

    const ubicacionMaestro = buscarMaestro(ubicaciones, ubicacionId)
    const sedeMaestro = buscarMaestro(sedes, sedeId)
    const areaMaestro = buscarMaestro(areas, areaId)
    const cargoMaestro = buscarMaestro(cargos, cargoId)
    const contratoMaestro = buscarMaestro(contratos, contratoId)
    const cuentaMaestro = buscarMaestro(cuentas, cuentaId)

    if (!ubicacionMaestro || !sedeMaestro || !areaMaestro || !cargoMaestro || !contratoMaestro) {
      setErrorDialogo({
        titulo: "Datos laborales incompletos",
        descripcion: "Selecciona ubicacion, sede, area, cargo y contrato desde el catalogo.",
      })
      return
    }

    try {
      const payload: RegistrarPersonalRequest = {
        tipo: "PERSONAL",
        codigoInternoSap: texto(formData, "codigoInternoSap"),
        numeroDocumento: texto(formData, "numeroDocumento"),
        razonSocial: texto(formData, "nombresApellidos"),
        nombreComercial: texto(formData, "nombresApellidos"),
        direccion: texto(formData, "direccion"),
        contacto: `${texto(formData, "nombresApellidos")} - ${cargoMaestro.nombre}`,
        correo: texto(formData, "correo"),
        numeroCelular: texto(formData, "numeroCelular"),
        ubicacionId: ubicacionMaestro.id,
        ubicacionNombre: ubicacionMaestro.nombre,
        sedeId: sedeMaestro.id,
        sedeNombre: sedeMaestro.nombre,
        areaId: areaMaestro.id,
        areaNombre: areaMaestro.nombre,
        cargoId: cargoMaestro.id,
        cargoNombre: cargoMaestro.nombre,
        contratoId: contratoMaestro.id,
        contratoNombre: contratoMaestro.nombre,
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
              <h2 className="text-lg font-semibold">Nuevo personal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra los datos personales, laborales y contractuales del colaborador.
              </p>
            </div>
            {selectorTipo ? <div className="w-full lg:max-w-xs">{selectorTipo}</div> : null}
          </div>
        </div>
        <div className="px-5 py-5">
          <form onSubmit={(event) => void registrar(event)}>
            <FieldGroup>
              {faltanMaestros ? (
                <Alert variant="destructive">
                  <AlertTitle>Maestros no sincronizados</AlertTitle>
                  <AlertDescription>
                    BC01 no devolvio todos los maestros requeridos para registrar personal. Verifica
                    que CS haya enviado eventos y que la proyeccion local de BC01 este actualizada.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid w-full gap-5 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[420px_1fr]">
                <FieldSet className="rounded-lg border border-border p-4">
                  <FieldLegend>Identificacion</FieldLegend>
                  <FieldDescription>Documento y codigo del empleado.</FieldDescription>
                  <div className="grid gap-4 md:grid-cols-1">
                    <Field>
                      <FieldLabel htmlFor="codigoInternoSap">Codigo SAP</FieldLabel>
                      <Input
                        id="codigoInternoSap"
                        name="codigoInternoSap"
                        placeholder="SAP-PER-001"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="numeroDocumento">DNI</FieldLabel>
                      <Input
                        id="numeroDocumento"
                        name="numeroDocumento"
                        placeholder="45678912"
                        required
                      />
                    </Field>
                  </div>
                </FieldSet>

                <FieldSet className="rounded-lg border border-border p-4">
                  <FieldLegend>Datos personales</FieldLegend>
                  <FieldDescription>Nombre y datos de contacto del empleado.</FieldDescription>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field className="md:col-span-2 xl:col-span-2">
                      <FieldLabel htmlFor="nombresApellidos">Nombres y apellidos</FieldLabel>
                      <Input
                        id="nombresApellidos"
                        name="nombresApellidos"
                        placeholder="Juan Perez Garcia"
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

                    <Field>
                      <FieldLabel htmlFor="correo">Correo</FieldLabel>
                      <Input
                        id="correo"
                        name="correo"
                        type="email"
                        placeholder="juan.perez@hagemsa.pe"
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

                    <Field>
                      <FieldLabel htmlFor="cuenta">Cuenta (opcional)</FieldLabel>
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
                <FieldLegend>Datos laborales</FieldLegend>
                <FieldDescription>Estructura organizacional donde labora el empleado.</FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <Field>
                    <FieldLabel htmlFor="ubicacion">Ubicacion *</FieldLabel>
                    <CatalogoSelect
                      datos={ubicaciones}
                      disabled={ubicacionesQuery.isLoading}
                      id="ubicacion"
                      name="ubicacion"
                      value={ubicacionSeleccionada}
                      onValueChange={(value) => {
                        setUbicacionSeleccionada(value)
                        setSedeSeleccionada(undefined)
                        setAreaSeleccionada(undefined)
                      }}
                      placeholder={
                        ubicacionesQuery.isLoading
                          ? "Cargando ubicaciones..."
                          : "Selecciona una ubicacion"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sede">Sede *</FieldLabel>
                    <CatalogoSelect
                      key={`sede-${ubicacionSeleccionada ?? "sin-ubicacion"}`}
                      datos={sedesPorUbicacion}
                      disabled={sedesQuery.isLoading || !ubicacionSeleccionada}
                      id="sede"
                      name="sede"
                      value={sedeSeleccionada}
                      onValueChange={(value) => {
                        setSedeSeleccionada(value)
                        setAreaSeleccionada(undefined)
                      }}
                      placeholder={
                        sedesQuery.isLoading
                          ? "Cargando sedes..."
                          : ubicacionSeleccionada
                            ? "Selecciona una sede"
                            : "Selecciona primero la ubicacion"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="area">Area *</FieldLabel>
                    <CatalogoSelect
                      key={`area-${sedeSeleccionadaId ?? "sin-sede"}`}
                      datos={areasPorSede}
                      disabled={areasQuery.isLoading || !sedeSeleccionada}
                      id="area"
                      name="area"
                      value={areaSeleccionada}
                      onValueChange={setAreaSeleccionada}
                      placeholder={
                        areasQuery.isLoading
                          ? "Cargando areas..."
                          : sedeSeleccionadaId
                            ? "Selecciona un area"
                            : "Selecciona primero la sede"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="cargo">Cargo *</FieldLabel>
                    <CatalogoSelect
                      key={`cargo-${areaSeleccionada ?? sedeSeleccionada ?? ubicacionSeleccionada ?? "sin-area"}`}
                      datos={cargosPorSeleccion}
                      disabled={cargosQuery.isLoading || !areaSeleccionada}
                      id="cargo"
                      name="cargo"
                      placeholder={
                        cargosQuery.isLoading
                          ? "Cargando cargos..."
                          : areaSeleccionada
                            ? "Selecciona un cargo"
                            : "Selecciona primero el area"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="contrato">Contrato *</FieldLabel>
                    <CatalogoSelect
                      datos={contratos}
                      disabled={contratosQuery.isLoading}
                      id="contrato"
                      name="contrato"
                      placeholder={
                        contratosQuery.isLoading ? "Cargando contratos..." : "Selecciona un contrato"
                      }
                    />
                  </Field>
                </div>
              </FieldSet>

              <p className="text-sm text-muted-foreground">
                La operacion guardara el registro con fecha y usuario responsable.
              </p>

              {registrarMutation.isSuccess ? (
                <Alert>
                  <AlertTitle>Personal registrado</AlertTitle>
                  <AlertDescription>Redirigiendo al listado de personal.</AlertDescription>
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
                  {registrarMutation.isPending ? "Registrando..." : "Registrar personal"}
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
