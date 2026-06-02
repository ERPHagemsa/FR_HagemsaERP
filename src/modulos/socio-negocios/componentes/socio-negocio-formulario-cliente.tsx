"use client"

import { type FormEvent, type ReactNode, useRef, useState } from "react"
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
import { consultarSapBusinessPartnerPorDocumento } from "../servicios/socio-negocios-api"
import type {
  MaestroConfiguracionGeneralIntegracion,
  RegistrarClienteRequest,
  SapBusinessPartnerResumenResponse,
} from "../tipos/socio-negocio"

const USUARIO_RESPONSABLE_ID = "admin"

type ErrorDialogo = {
  titulo: string
  descripcion: string
}

type SocioNegocioFormularioClienteProps = {
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
    titulo: "No se pudo registrar el cliente",
    descripcion:
      error instanceof Error
        ? error.message
        : "No se pudo registrar el cliente.",
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

export function SocioNegocioFormularioCliente({
  selectorTipo,
}: SocioNegocioFormularioClienteProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const registrarMutation = useRegistrarSocioDeNegocioMutation()
  const [errorDialogo, setErrorDialogo] = useState<ErrorDialogo | null>(null)
  const [sapEncontrado, setSapEncontrado] =
    useState<SapBusinessPartnerResumenResponse | null>(null)
  const [sapMensaje, setSapMensaje] = useState<string | null>(null)
  const [buscandoSap, setBuscandoSap] = useState(false)
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

  async function buscarEnSap() {
    setErrorDialogo(null)
    setSapMensaje(null)
    setSapEncontrado(null)

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
        { tipo: "CLIENTE" },
      )

      if (!datos) {
        setSapMensaje(
          "No se encontro este cliente en SAP. Puedes completar el formulario y el backend generara el codigo.",
        )
        return
      }

      setSapEncontrado(datos)
      setSapMensaje("Datos encontrados en SAP como cliente. Revisa y confirma el registro.")
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

    const cargoMaestro = buscarMaestro(cargos, cargoId)
    const areaMaestro = buscarMaestro(areas, areaId)
    const cuentaMaestro = buscarMaestro(cuentas, cuentaId)

    try {
      const payload: RegistrarClienteRequest = {
        tipo: "CLIENTE",
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
              <h2 className="text-lg font-semibold">Nuevo cliente</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registra los datos comerciales y el contacto principal del cliente.
              </p>
            </div>
            {selectorTipo ? <div className="w-full lg:max-w-xs">{selectorTipo}</div> : null}
          </div>
        </div>
        <div className="px-5 py-5">
          <form ref={formRef} onSubmit={(event) => void registrar(event)}>
            <FieldGroup>
              <div className="grid w-full gap-5 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[420px_1fr]">
                <FieldSet className="rounded-lg border border-border p-4">
                  <FieldLegend>Identificacion</FieldLegend>
                  <FieldDescription>
                    Ingresa el RUC. El backend consultara SAP y registrara el cliente localmente.
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
                      {buscandoSap ? "Buscando..." : "Buscar en SAP"}
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
                        Puedes usar "Buscar en SAP" para previsualizar los datos antes de registrar.
                      </p>
                    )}
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
                <FieldLegend>Clasificacion interna</FieldLegend>
                <FieldDescription>
                  Datos locales opcionales para clasificar al cliente en BC-01.
                </FieldDescription>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

                </div>
              </FieldSet>

              <p className="text-sm text-muted-foreground">
                La operacion guardara el registro con fecha y usuario responsable.
              </p>

              {sapMensaje ? (
                <Alert>
                  <AlertTitle>Consulta SAP</AlertTitle>
                  <AlertDescription>{sapMensaje}</AlertDescription>
                </Alert>
              ) : null}

              {registrarMutation.isSuccess ? (
                <Alert>
                  <AlertTitle>Cliente registrado</AlertTitle>
                  <AlertDescription>Redirigiendo al listado de clientes.</AlertDescription>
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
                  {registrarMutation.isPending ? "Registrando..." : "Registrar cliente"}
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
