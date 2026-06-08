"use client"

import { type FormEvent, useRef, useState } from "react"
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
import { Spinner } from "@/compartido/componentes/ui/spinner"
import { ApiError } from "@/compartido/api/axios"

import { CatalogoSelectBuscable } from "./catalogo-select-buscable"
import {
  useMaestrosConfiguracionGeneralQuery,
  useRegistrarSocioDeNegocioMutation,
} from "../servicios/socio-negocios-queries"
import { consultarSapBusinessPartnerPorDocumento } from "../servicios/socio-negocios-api"
import type {
  MaestroConfiguracionGeneralIntegracion,
  RegistrarProveedorRequest,
  SapBusinessPartnerResumenResponse,
} from "../tipos/socio-negocio"

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

function buscarMaestro(
  datos: MaestroConfiguracionGeneralIntegracion[],
  id?: string,
) {
  return id ? datos.find((dato) => dato.id === id) : undefined
}

function clavesMaestro(maestro?: MaestroConfiguracionGeneralIntegracion) {
  return [maestro?.id, maestro?.idExterno].filter(Boolean)
}

function etiquetaCuentaContrato(dato: MaestroConfiguracionGeneralIntegracion) {
  return dato.nombre
}

function normalizarTexto(valor?: string | null) {
  return valor?.trim().toLocaleLowerCase("es-PE") ?? ""
}

function buscarMaestroPorReferencia(
  datos: MaestroConfiguracionGeneralIntegracion[],
  id?: string,
  nombre?: string,
) {
  if (id) {
    const porId = datos.find((dato) => dato.id === id)
    if (porId) return porId
  }

  const nombreNormalizado = normalizarTexto(nombre)
  return nombreNormalizado
    ? datos.find((dato) => normalizarTexto(dato.nombre) === nombreNormalizado)
    : undefined
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

export function SocioNegocioFormularioProveedor() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const [errorDialogo, setErrorDialogo] = useState<ErrorDialogo | null>(null)
  const [sapEncontrado, setSapEncontrado] =
    useState<SapBusinessPartnerResumenResponse | null>(null)
  const [sapMensaje, setSapMensaje] = useState<string | null>(null)
  const [buscandoSap, setBuscandoSap] = useState(false)
  const [areaSeleccionada, setAreaSeleccionada] = useState<string | undefined>()
  const [cargoSeleccionado, setCargoSeleccionado] = useState<string | undefined>()
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<string | undefined>()
  const [contratosSeleccionados, setContratosSeleccionados] = useState<string[]>([])
  const cuentasQuery = useMaestrosConfiguracionGeneralQuery({
    tipoDatoMaestro: "CUENTA",
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

  const cuentas = (cuentasQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const areas = (areasQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const cargos = (cargosQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const contratos = (contratosQuery.data ?? []).filter((dato) => dato.estado === "ACTIVO")
  const cuentaSeleccionadaMaestro = buscarMaestro(cuentas, cuentaSeleccionada)
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

  const catalogosCargando =
    cuentasQuery.isLoading ||
    areasQuery.isLoading ||
    cargosQuery.isLoading ||
    contratosQuery.isLoading

  async function buscarEnSap() {
    setErrorDialogo(null)
    setSapMensaje(null)
    setSapEncontrado(null)
    setAreaSeleccionada(undefined)
    setCargoSeleccionado(undefined)
    setCuentaSeleccionada(undefined)
    setContratosSeleccionados([])

    const formData = new FormData(formRef.current ?? undefined)
    const numeroDocumento = texto(formData, "numeroDocumento")

    if (!numeroDocumento) {
      setSapMensaje("Ingresa el RUC para buscar en SAP.")
      return
    }

    try {
      setBuscandoSap(true)
      const datos = await consultarSapBusinessPartnerPorDocumento(
        numeroDocumento,
        { tipo: "PROVEEDOR" },
      )

      if (!datos) {
        setSapMensaje(
          "No se encontro este proveedor en SAP. Puedes completar el formulario y el backend generara el codigo.",
        )
        return
      }

      setSapEncontrado(datos)
      setAreaSeleccionada(
        buscarMaestroPorReferencia(areas, datos.areaId, datos.areaNombre)?.id,
      )
      setCargoSeleccionado(
        buscarMaestroPorReferencia(cargos, datos.cargoId, datos.cargoNombre)?.id,
      )
      setCuentaSeleccionada(
        buscarMaestroPorReferencia(cuentas, datos.cuentaId, datos.cuentaNombre)?.id,
      )
      setSapMensaje("Datos encontrados en SAP como proveedor. Revisa y confirma el registro.")
    } catch (err: unknown) {
      setErrorDialogo(obtenerErrorDialogo(err))
    } finally {
      setBuscandoSap(false)
    }
  }

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorDialogo(null)

    const formData = new FormData(event.currentTarget)
    const cargoId = textoOpcional(formData, "cargo")
    const areaId = textoOpcional(formData, "area")
    const cuentaId = textoOpcional(formData, "cuenta")
    const contratoId = textoOpcional(formData, "contrato")

    const cargoMaestro = buscarMaestro(cargos, cargoId)
    const areaMaestro = buscarMaestro(areas, areaId)
    const cuentaMaestro = buscarMaestro(cuentas, cuentaId)
    const contratoMaestro = buscarMaestro(contratos, contratoId)

    try {
      const payload: RegistrarProveedorRequest = {
        tipo: "PROVEEDOR",
        codigoInternoSap: sapEncontrado?.codigoInternoSap,
        numeroDocumento: texto(formData, "numeroDocumento"),
        razonSocial: texto(formData, "razonSocial"),
        nombreComercial: texto(formData, "nombreComercial"),
        direccion: texto(formData, "direccion"),
        contacto: texto(formData, "contacto"),
        correo: texto(formData, "correo"),
        numeroCelular: texto(formData, "numeroCelular"),
        areaId: areaMaestro?.id,
        areaNombre: areaMaestro?.nombre,
        cargoId: cargoMaestro?.id,
        cargoNombre: cargoMaestro?.nombre,
        cuentaId: cuentaMaestro?.id,
        cuentaNombre: cuentaMaestro?.nombre,
        contratoId: contratoMaestro?.id,
        contratoNombre: contratoMaestro?.nombre,
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
          <div className="flex flex-col gap-1">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Agregar proveedor</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra los datos comerciales y el contacto principal del proveedor.
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-5">
          <form id="agregar-proveedor" ref={formRef} onSubmit={(event) => void registrar(event)}>
            <FieldGroup>
              <div className="grid w-full gap-5 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[420px_1fr]">
                <FieldSet className="rounded-lg border border-border p-4">
                  <FieldLegend>Identificacion</FieldLegend>
                  <FieldDescription>
                    Ingresa el RUC. El backend consultara SAP y registrara el proveedor localmente.
                  </FieldDescription>
                  <div className="grid gap-4 md:grid-cols-1">
                    <Field>
                      <FieldLabel htmlFor="numeroDocumento">RUC</FieldLabel>
                      <Input
                        key={`doc-${sapEncontrado?.numeroDocumento ?? "manual"}`}
                        id="numeroDocumento"
                        name="numeroDocumento"
                        placeholder="20123456789"
                        defaultValue={sapEncontrado?.numeroDocumento}
                        required
                      />
                    </Field>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void buscarEnSap()}
                      disabled={buscandoSap}
                    >
                      {buscandoSap ? (
                        <>
                          <Spinner data-icon="inline-start" />
                          Buscando...
                        </>
                      ) : (
                        "Buscar en SAP"
                      )}
                    </Button>

                    {sapEncontrado ? (
                      <Field>
                        <FieldLabel htmlFor="codigoInternoSapVista">Codigo SAP encontrado</FieldLabel>
                        <Input
                          id="codigoInternoSapVista"
                          value={sapEncontrado.codigoInternoSap}
                          readOnly
                        />
                      </Field>
                    ) : null}
                  </div>
                </FieldSet>

                <FieldSet className="rounded-lg border border-border p-4">
                  <FieldLegend>Datos comerciales</FieldLegend>
                  <FieldDescription>
                    Completa la razon social. SAP puede precargar los datos si encuentra el RUC.
                  </FieldDescription>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor="razonSocial">Razon social</FieldLabel>
                      <Input
                        key={`razon-${sapEncontrado?.razonSocial ?? "manual"}`}
                        id="razonSocial"
                        name="razonSocial"
                        defaultValue={sapEncontrado?.razonSocial}
                        placeholder="Razon social o nombres"
                        required
                      />
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor="nombreComercial">Nombre comercial</FieldLabel>
                      <Input
                        key={`nombre-${sapEncontrado?.razonSocial ?? "manual"}`}
                        id="nombreComercial"
                        name="nombreComercial"
                        defaultValue={sapEncontrado?.razonSocial}
                        placeholder="Nombre comercial"
                        required
                      />
                    </Field>
                    <Field className="md:col-span-2 xl:col-span-3">
                      <FieldLabel htmlFor="direccion">Direccion</FieldLabel>
                      <Input
                        key={`direccion-${sapEncontrado?.direccion ?? "manual"}`}
                        id="direccion"
                        name="direccion"
                        defaultValue={sapEncontrado?.direccion}
                        placeholder="Direccion principal"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="contacto">Contacto</FieldLabel>
                      <Input
                        key={`contacto-${sapEncontrado?.contacto ?? "manual"}`}
                        id="contacto"
                        name="contacto"
                        defaultValue={sapEncontrado?.contacto}
                        placeholder="Nombre del contacto"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="correo">Correo</FieldLabel>
                      <Input
                        key={`correo-${sapEncontrado?.correo ?? "manual"}`}
                        id="correo"
                        name="correo"
                        type="email"
                        defaultValue={sapEncontrado?.correo}
                        placeholder="contacto@empresa.com"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="numeroCelular">Celular</FieldLabel>
                      <Input
                        key={`celular-${sapEncontrado?.numeroCelular ?? "manual"}`}
                        id="numeroCelular"
                        name="numeroCelular"
                        defaultValue={sapEncontrado?.numeroCelular}
                        placeholder="999999999"
                        required
                      />
                    </Field>
                    {sapEncontrado ? (
                      null
                    ) : (
                      <p className="text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                        Puedes usar &quot;Buscar en SAP&quot; para previsualizar los datos antes de registrar.
                      </p>
                    )}
                    <Field className="md:col-span-2 xl:col-span-3">
                      <FieldLabel htmlFor="cuenta">Cuenta (opcional)</FieldLabel>
                      <CatalogoSelectBuscable
                        datos={cuentas}
                        disabled={cuentasQuery.isLoading}
                        getLabel={etiquetaCuentaContrato}
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
                          getLabel={etiquetaCuentaContrato}
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
              </div>

              <FieldSet className="rounded-lg border border-border p-4">
                <FieldLegend>Clasificación interna</FieldLegend>
                <FieldDescription>
                  Datos internos opcionales para asignar el proveedor a un área responsable.
                </FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="area">Área responsable</FieldLabel>
                    <CatalogoSelectBuscable
                      datos={areas}
                      disabled={areasQuery.isLoading}
                      id="area"
                      name="area"
                      value={areaSeleccionada}
                      onValueChange={setAreaSeleccionada}
                      placeholder={
                        areasQuery.isLoading
                          ? "Cargando áreas..."
                          : "Selecciona un área"
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="cargo">Cargo</FieldLabel>
                    <CatalogoSelectBuscable
                      datos={cargos}
                      disabled={cargosQuery.isLoading}
                      id="cargo"
                      name="cargo"
                      value={cargoSeleccionado}
                      onValueChange={setCargoSeleccionado}
                      placeholder={
                        cargosQuery.isLoading ? "Cargando cargos..." : "Selecciona un cargo"
                      }
                    />
                  </Field>

                </div>
              </FieldSet>

              <p className="text-sm text-muted-foreground">
                {catalogosCargando ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Cargando catalogos activos...
                  </span>
                ) : (
                  "La operacion guardara el registro con fecha y usuario responsable."
                )}
              </p>

              {sapMensaje ? (
                <Alert>
                  <AlertTitle>Consulta SAP</AlertTitle>
                  <AlertDescription>{sapMensaje}</AlertDescription>
                </Alert>
              ) : null}

              {registrarMutation.isSuccess ? (
                <Alert>
                  <AlertTitle>Proveedor registrado</AlertTitle>
                  <AlertDescription>Redirigiendo al listado de proveedores.</AlertDescription>
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
