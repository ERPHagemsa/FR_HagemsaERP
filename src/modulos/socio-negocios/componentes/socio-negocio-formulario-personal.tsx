"use client"

import { type FormEvent, useState } from "react"
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

import { CatalogoSelectBuscable } from "./catalogo-select-buscable"
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

function texto(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function esTexto(valor: string | null | undefined): valor is string {
  return Boolean(valor)
}

function buscarMaestro(
  datos: MaestroConfiguracionGeneralIntegracion[],
  id?: string,
) {
  return id ? datos.find((dato) => dato.id === id) : undefined
}

function clavesMaestro(maestro?: MaestroConfiguracionGeneralIntegracion) {
  return [maestro?.id, maestro?.idExterno].filter(Boolean)
}

function etiquetaUbicacion(ubicacion: MaestroConfiguracionGeneralIntegracion) {
  const partes = [ubicacion.distrito, ubicacion.provincia, ubicacion.departamento].filter(Boolean)

  return partes.length > 0 ? `${ubicacion.nombre} - ${partes.join(", ")}` : ubicacion.nombre
}

function etiquetaContrato(contrato: MaestroConfiguracionGeneralIntegracion) {
  return contrato.nombre
}

function formarNombreCompleto({
  apellidoMaterno,
  apellidoPaterno,
  primerNombre,
  segundoNombre,
}: {
  apellidoMaterno: string
  apellidoPaterno: string
  primerNombre: string
  segundoNombre?: string
}) {
  return [primerNombre, segundoNombre, apellidoPaterno, apellidoMaterno]
    .filter(esTexto)
    .join(" ")
}

function formarNombreComercial({
  apellidoPaterno,
  primerNombre,
}: {
  apellidoPaterno: string
  primerNombre: string
}) {
  return [primerNombre, apellidoPaterno].filter(esTexto).join(" ")
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

export function SocioNegocioFormularioPersonal() {
  const router = useRouter()
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const [distritoSeleccionado, setDistritoSeleccionado] = useState<string | undefined>()
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<string | undefined>()
  const [sedeSeleccionada, setSedeSeleccionada] = useState<string | undefined>()
  const [areaSeleccionada, setAreaSeleccionada] = useState<string | undefined>()
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string | undefined>()
  const [contratosSeleccionados, setContratosSeleccionados] = useState<string[]>([])
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
  const distritos = Array.from(
    new Set(ubicaciones.map((ubicacion) => ubicacion.distrito).filter(esTexto)),
  ).sort((a, b) => a.localeCompare(b))
  const ubicacionesPorDistrito =
    distritos.length > 0 && distritoSeleccionado
      ? ubicaciones.filter((ubicacion) => ubicacion.distrito === distritoSeleccionado)
      : distritos.length > 0
        ? []
        : ubicaciones

  const sedeSeleccionadaMaestro = sedesQuery.data?.find((sede) => sede.id === sedeSeleccionada)
  const sedeSeleccionadaId = sedeSeleccionadaMaestro?.id
  const areaSeleccionadaMaestro = areasQuery.data?.find((area) => area.id === areaSeleccionada)
  const ubicacionSeleccionadaMaestro = ubicaciones.find(
    (ubicacion) => ubicacion.id === ubicacionSeleccionada,
  )
  const cuentaSeleccionadaMaestro = buscarMaestro(cuentas, cuentaSeleccionada)

  const ubicacionKeys = clavesMaestro(ubicacionSeleccionadaMaestro)
  const sedeKeys = clavesMaestro(sedeSeleccionadaMaestro)
  const areaKeys = clavesMaestro(areaSeleccionadaMaestro)

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

  const contratoPadreInicialKeys = clavesMaestro(cuentaSeleccionadaMaestro)
  const contratosNivel2 =
    contratoPadreInicialKeys.length > 0
      ? contratos.filter(
          (contrato) =>
            contrato.contratoPadreId && contratoPadreInicialKeys.includes(contrato.contratoPadreId),
        )
      : []
  const contratosPorNivel = contratosSeleccionados.reduce<
    Array<{
      contratos: MaestroConfiguracionGeneralIntegracion[]
      nivel: number
      seleccionado?: string
    }>
  >(
    (niveles, contratoId, index) => {
      const contratoPadre = buscarMaestro(contratos, contratoId)
      const contratoPadreKeys = clavesMaestro(contratoPadre)
      const contratosHijos =
        contratoPadreKeys.length > 0
          ? contratos.filter(
              (contrato) =>
                contrato.contratoPadreId && contratoPadreKeys.includes(contrato.contratoPadreId),
            )
          : []

      if (contratosHijos.length > 0) {
        niveles.push({
          contratos: contratosHijos,
          nivel: (contratoPadre?.nivelCuentaContrato ?? index + 2) + 1,
          seleccionado: contratosSeleccionados[index + 1],
        })
      }

      return niveles
    },
    contratosNivel2.length > 0
      ? [{ contratos: contratosNivel2, nivel: 2, seleccionado: contratosSeleccionados[0] }]
      : [],
  )
  const contratoFinalId = [...contratosSeleccionados].reverse().find(Boolean)

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
      areas.length === 0)

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorDialogo(null)

    const formData = new FormData(event.currentTarget)
    const ubicacionId = texto(formData, "ubicacion")
    const sedeId = texto(formData, "sede")
    const areaId = texto(formData, "area")
    const cargoId = texto(formData, "cargo")
    const contratoId = texto(formData, "contrato")
    const cuentaId = texto(formData, "cuenta")
    const primerNombre = texto(formData, "primerNombre")
    const segundoNombre = texto(formData, "segundoNombre")
    const apellidoPaterno = texto(formData, "apellidoPaterno")
    const apellidoMaterno = texto(formData, "apellidoMaterno")
    const nombreCompleto = formarNombreCompleto({
      apellidoMaterno,
      apellidoPaterno,
      primerNombre,
      segundoNombre,
    })
    const nombreComercial = formarNombreComercial({
      apellidoPaterno,
      primerNombre,
    })

    const ubicacionMaestro = buscarMaestro(ubicaciones, ubicacionId)
    const sedeMaestro = buscarMaestro(sedes, sedeId)
    const areaMaestro = buscarMaestro(areas, areaId)
    const cargoMaestro = buscarMaestro(cargos, cargoId)
    const contratoMaestro = buscarMaestro(contratos, contratoId)
    const cuentaMaestro = buscarMaestro(cuentas, cuentaId)

    if (
      !ubicacionMaestro ||
      !sedeMaestro ||
      !areaMaestro ||
      !cargoMaestro
    ) {
      setErrorDialogo({
        titulo: "Datos laborales incompletos",
        descripcion: "Selecciona ubicacion, sede, area y cargo desde el catalogo.",
      })
      return
    }

    try {
      const payload: RegistrarPersonalRequest = {
        tipo: "PERSONAL",
        codigoInternoSap: texto(formData, "numeroDocumento"),
        numeroDocumento: texto(formData, "numeroDocumento"),
        razonSocial: nombreCompleto,
        nombreComercial,
        primerNombre,
        segundoNombre: segundoNombre || undefined,
        apellidoPaterno,
        apellidoMaterno,
        direccion: texto(formData, "direccion"),
        contacto: nombreComercial,
        correo: texto(formData, "correo"),
        numeroCelular: texto(formData, "numeroCelular"),
        sedeId: sedeMaestro.id,
        sedeNombre: sedeMaestro.nombre,
        areaId: areaMaestro.id,
        areaNombre: areaMaestro.nombre,
        cargoId: cargoMaestro.id,
        cargoNombre: cargoMaestro.nombre,
        contratoId: contratoMaestro?.id,
        contratoNombre: contratoMaestro?.nombre,
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
      <section className="w-full rounded-xl border border-border/70 bg-card text-card-foreground">
        <div className="border-b border-border/70 px-5 py-4">
          <div className="flex flex-col gap-1">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Agregar personal</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra los datos personales, laborales y contractuales del colaborador.
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-5">
          <form id="agregar-personal" onSubmit={(event) => void registrar(event)}>
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
                <FieldSet className="rounded-xl border border-border/60 bg-muted/25 p-4">
                  <FieldLegend>Identificacion</FieldLegend>
                  <FieldDescription>Documento del empleado.</FieldDescription>
                  <div className="grid gap-4 md:grid-cols-1">
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

                <FieldSet className="rounded-xl border border-border/60 bg-muted/25 p-4">
                  <FieldLegend>Datos personales</FieldLegend>
                  <FieldDescription>Nombre y datos de contacto del empleado.</FieldDescription>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="primerNombre">Primer nombre</FieldLabel>
                      <Input
                        id="primerNombre"
                        name="primerNombre"
                        placeholder="Juan"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="segundoNombre">Segundo nombre</FieldLabel>
                      <Input
                        id="segundoNombre"
                        name="segundoNombre"
                        placeholder="Carlos"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="apellidoPaterno">Apellido paterno</FieldLabel>
                      <Input
                        id="apellidoPaterno"
                        name="apellidoPaterno"
                        placeholder="Perez"
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="apellidoMaterno">Apellido materno</FieldLabel>
                      <Input
                        id="apellidoMaterno"
                        name="apellidoMaterno"
                        placeholder="Gomez"
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

                  </div>
                </FieldSet>
              </div>

              <FieldSet className="rounded-xl border border-border/60 bg-muted/25 p-4">
                <FieldLegend>Datos laborales</FieldLegend>
                <FieldDescription>Estructura organizacional donde labora el empleado.</FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {distritos.length > 0 ? (
                    <Field>
                      <FieldLabel htmlFor="distrito">Distrito *</FieldLabel>
                      <Select
                        name="distrito"
                        value={distritoSeleccionado}
                        onValueChange={(value) => {
                          setDistritoSeleccionado(value)
                          setUbicacionSeleccionada(undefined)
                          setSedeSeleccionada(undefined)
                          setAreaSeleccionada(undefined)
                        }}
                        disabled={ubicacionesQuery.isLoading}
                      >
                        <SelectTrigger id="distrito" className="w-full">
                          <SelectValue
                            placeholder={
                              ubicacionesQuery.isLoading
                                ? "Cargando distritos..."
                                : "Selecciona un distrito"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {distritos.map((distrito) => (
                              <SelectItem key={distrito} value={distrito}>
                                {distrito}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}

                  <Field>
                    <FieldLabel htmlFor="ubicacion">Ubicacion *</FieldLabel>
                    <CatalogoSelectBuscable
                      datos={ubicacionesPorDistrito}
                      disabled={
                        ubicacionesQuery.isLoading ||
                        (distritos.length > 0 && !distritoSeleccionado)
                      }
                      getLabel={etiquetaUbicacion}
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
                          : distritos.length > 0 && !distritoSeleccionado
                            ? "Selecciona primero el distrito"
                            : "Selecciona una ubicacion"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="sede">Sede *</FieldLabel>
                    <CatalogoSelectBuscable
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
                    <CatalogoSelectBuscable
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
                    <CatalogoSelectBuscable
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

                </div>
              </FieldSet>

              <FieldSet className="rounded-xl border border-border/60 bg-muted/25 p-4">
                <FieldLegend>Relacion contractual</FieldLegend>
                <FieldDescription>
                  Selecciona la cuenta y el ultimo contrato asociado que corresponda.
                </FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="cuenta">Cuenta (opcional)</FieldLabel>
                    <CatalogoSelectBuscable
                      datos={cuentas}
                      disabled={cuentasQuery.isLoading}
                      getLabel={etiquetaContrato}
                      id="cuenta"
                      name="cuenta"
                      value={cuentaSeleccionada}
                      onValueChange={(value) => {
                        setCuentaSeleccionada(value)
                        setContratosSeleccionados([])
                      }}
                      placeholder={
                        cuentasQuery.isLoading ? "Cargando cuentas..." : "Selecciona una cuenta"
                      }
                    />
                  </Field>

                  {contratosPorNivel.map((nivel, index) => (
                    <Field key={`contrato-nivel-${nivel.nivel}`}>
                      <FieldLabel htmlFor={`contratoNivel${nivel.nivel}`}>
                        Contrato asociado (opcional)
                      </FieldLabel>
                      <CatalogoSelectBuscable
                        datos={nivel.contratos}
                        disabled={!cuentaSeleccionada || contratosQuery.isLoading}
                        getLabel={etiquetaContrato}
                        id={`contratoNivel${nivel.nivel}`}
                        name={`contratoNivel${nivel.nivel}`}
                        value={nivel.seleccionado}
                        onValueChange={(value) => {
                          setContratosSeleccionados((actuales) => [
                            ...actuales.slice(0, index),
                            value,
                          ])
                        }}
                        placeholder={
                          contratosQuery.isLoading
                            ? "Cargando contratos..."
                            : "Selecciona un contrato asociado"
                        }
                      />
                    </Field>
                  ))}

                  <input name="contrato" value={contratoFinalId ?? ""} readOnly hidden />
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
