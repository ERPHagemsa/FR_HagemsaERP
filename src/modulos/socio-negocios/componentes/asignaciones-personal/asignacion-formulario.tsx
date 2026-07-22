"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BriefcaseBusiness, Clock, Copy, FileText, History, MapPin, X } from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldDescription,
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
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { cn } from "@/compartido/utilidades/utils"

import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useAsignacionPersonalQuery,
  useCrearAsignacionPersonalMutation,
  useCargosConfiguracionGeneralQuery,
  useModificarAsignacionPersonalMutation,
  useOpcionesFormularioAsignacionQuery,
  useReemplazarCuentasContratosMutation,
} from "../../servicios/asignaciones-personal-queries"
import { usePersonalSociosDeNegocioQuery } from "../../servicios/socio-negocios-queries"
import { useConfiguracionesLaboralesPersonalQuery } from "../../servicios/tareo-personal-queries"
import type {
  AsignacionPersonalResponse,
  ConfiguracionGeneralOpcionResponse,
} from "../../tipos/asignacion-personal"
import type {
  ConfiguracionLaboralPersonalResponse,
  TipoTareoPersonalResponse,
} from "../../tipos/tareo-personal"
import { JerarquiaCuentasContratos } from "../jerarquia-cuentas-contratos"
import {
  EditorAprobadores,
  EditorRelacionContractual,
  FormularioOrganizacion,
} from "./editores"
import {
  type AprobadorFila,
  type CampoOrganizacion,
  type CatalogosOrganizacion,
  type RelacionCuentaContratoFila,
  type ResultadoRelacionContractual,
  type ValoresOrganizacion,
  PASOS_ASIGNACION,
  VALORES_ORGANIZACION_VACIOS,
  aprobadoresValidos,
  crearFilasAprobadorActual,
  crearFilasRelacionActual,
  fechaApi,
  firmaAprobadores,
  firmaRelaciones,
  mapearOrganizacionInicial,
  nombreOpcionSeleccionada,
  obtenerMensajeError,
  obtenerCandidatosJefe,
  obtenerEtiquetaPersonal,
  soloFecha,
  validarYConstruirCuentasContratos,
} from "./utilidades"

function AsignacionFormularioContenido({
  modo,
  asignacion,
  personalId,
  ultimaAsignacion,
  cuentasCatalogo,
  contratosCatalogo,
  catalogosOrganizacion,
  cargosCatalogo: cargosCatalogoInicial,
  cargandoCargos: cargandoCargosInicial,
  tiposTareo,
  configuracionesLaboralesCatalogo,
  onClose,
}: {
  modo: "crear" | "editar"
  asignacion?: AsignacionPersonalResponse
  personalId: string | number
  ultimaAsignacion?: AsignacionPersonalResponse
  cuentasCatalogo: ConfiguracionGeneralOpcionResponse[]
  contratosCatalogo: ConfiguracionGeneralOpcionResponse[]
  catalogosOrganizacion: CatalogosOrganizacion
  cargosCatalogo: ConfiguracionGeneralOpcionResponse[]
  cargandoCargos: boolean
  tiposTareo: TipoTareoPersonalResponse[]
  configuracionesLaboralesCatalogo: ConfiguracionLaboralPersonalResponse[]
  onClose: (actualizado: boolean) => void
}) {
  // Al editar, precargamos cargo/sede/area desde el catalogo plano para que
  // aparezcan ya seleccionados y solo se cambie lo necesario.
  const organizacionInicial =
    modo === "editar" && asignacion
      ? mapearOrganizacionInicial(asignacion, catalogosOrganizacion)
      : { ...VALORES_ORGANIZACION_VACIOS }
  const [valores, setValores] = useState<ValoresOrganizacion>(organizacionInicial)
  const cargosQuery = useCargosConfiguracionGeneralQuery(
    {
      areaId: valores.areaId || undefined,
      sedeId: valores.sedeId || undefined,
    },
    true,
  )
  const cargosCatalogo = cargosQuery.data ?? cargosCatalogoInicial
  const cargandoCargos = cargosQuery.isLoading || cargandoCargosInicial
  // Cargo elegido y a quien reporta segun la ESTRUCTURA (cargoSuperiorNombre que
  // ahora envia Configuracion General). Sirve para mostrar el jefe-posicion aunque
  // todavia no exista una persona asignada en ese cargo.
  const cargoSeleccionadoObj = cargosCatalogo.find(
    (item) => String(item.id) === String(valores.cargoId),
  )
  const jefeSegunEstructura = cargoSeleccionadoObj?.cargoSuperiorNombre ?? null
  // Cargo raiz = maximo nivel (no reporta a otro cargo). En ese caso el jefe es
  // vacio a proposito: no lleva jefe ni se autocompleta con la propia persona.
  const esCargoRaiz = Boolean(cargoSeleccionadoObj) && !jefeSegunEstructura
  // Jefe/responsable: se resuelve por area/cargo desde personal vigente.
  const [jefeCodigo, setJefeCodigo] = useState(asignacion?.jefeCodigo ?? "")
  const [jefeNombre, setJefeNombre] = useState(asignacion?.jefeNombre ?? "")
  const jefeCodigoInicial = asignacion?.jefeCodigo ?? ""
  const jefeNombreInicial = asignacion?.jefeNombre ?? ""
  const [vigenteDesde, setVigenteDesde] = useState(soloFecha(asignacion?.vigenteDesde))
  const [vigenteHasta, setVigenteHasta] = useState(soloFecha(asignacion?.vigenteHasta))
  // Tareo: maestros internos de BC-01. La configuracion laboral se filtra por el
  // tipo seleccionado; al cambiar el tipo se reinicia la configuracion elegida.
  const tipoTareoInicial = asignacion?.tipoTareoId ? String(asignacion.tipoTareoId) : ""
  const configuracionLaboralInicial = asignacion?.configuracionLaboralId
    ? String(asignacion.configuracionLaboralId)
    : ""
  const [tipoTareoId, setTipoTareoId] = useState(tipoTareoInicial)
  const [configuracionLaboralId, setConfiguracionLaboralId] = useState(configuracionLaboralInicial)
  // Las configuraciones laborales llegan en opciones-formulario (snapshot inicial),
  // pero ademas las consultamos en vivo por el tipo elegido para reflejar las
  // recien creadas/activadas sin depender solo del snapshot. Se mezclan por id.
  const configuracionesLaboralesQuery = useConfiguracionesLaboralesPersonalQuery(
    { tipoTareoId, estado: "ACTIVO" },
    Boolean(tipoTareoId),
  )
  const configuracionesLaborales = tipoTareoId
    ? (() => {
        const porId = new Map<string, ConfiguracionLaboralPersonalResponse>()
        configuracionesLaboralesCatalogo
          .filter((config) => String(config.tipoTareoId) === tipoTareoId)
          .forEach((config) => porId.set(String(config.id), config))
        ;(configuracionesLaboralesQuery.data ?? []).forEach((config) =>
          porId.set(String(config.id), config),
        )
        return [...porId.values()]
      })()
    : []
  const cargandoConfiguraciones = configuracionesLaboralesQuery.isLoading
  const personalQuery = usePersonalSociosDeNegocioQuery({
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    pageSize: 200,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const personalCatalogo = personalQuery.data?.datos ?? []
  const candidatosJefe = useMemo(
    () =>
      obtenerCandidatosJefe(
        personalCatalogo,
        catalogosOrganizacion.areas,
        catalogosOrganizacion.cargos,
        valores.areaId,
        valores.cargoId,
      ),
    [
      personalCatalogo,
      catalogosOrganizacion.areas,
      catalogosOrganizacion.cargos,
      valores.areaId,
      valores.cargoId,
    ],
  )
  const candidatosJefeClave = candidatosJefe.map((item) => String(item.personal.id)).join("|")

  useEffect(() => {
    // Cargo raiz (maximo nivel): no lleva jefe. Se limpia y no se autoresuelve
    // aunque haya personas en su area.
    if (esCargoRaiz) {
      if (jefeCodigo || jefeNombre) {
        setJefeCodigo("")
        setJefeNombre("")
      }
      return
    }

    if (candidatosJefe.length === 0) {
      if (jefeCodigo || jefeNombre) {
        setJefeCodigo("")
        setJefeNombre("")
      }
      return
    }

    if (candidatosJefe.length === 1) {
      const unico = candidatosJefe[0]
      const codigo = String(unico.personal.id)
      const nombre = obtenerEtiquetaPersonal(unico.personal)
      if (jefeCodigo !== codigo || jefeNombre !== nombre) {
        setJefeCodigo(codigo)
        setJefeNombre(nombre)
      }
      return
    }

    const sigueVigente = candidatosJefe.some((item) => String(item.personal.id) === jefeCodigo)
    if (!sigueVigente) {
      const primero = candidatosJefe[0]
      setJefeCodigo(String(primero.personal.id))
      setJefeNombre(obtenerEtiquetaPersonal(primero.personal))
    }
  }, [candidatosJefeClave, jefeCodigo, jefeNombre, esCargoRaiz])
  const [relaciones, setRelaciones] = useState<RelacionCuentaContratoFila[]>(() =>
    modo === "editar" && asignacion
      ? crearFilasRelacionActual(asignacion, cuentasCatalogo, contratosCatalogo)
      : [],
  )
  // Aprobadores (firmas) capturados manualmente; misma lista para todas las
  // cuentas/contratos. Al editar se precargan desde las firmas existentes.
  const [aprobadores, setAprobadores] = useState<AprobadorFila[]>(() =>
    modo === "editar" && asignacion ? crearFilasAprobadorActual(asignacion) : [],
  )
  const [firmaInicialAprobadores] = useState(() =>
    firmaAprobadores(
      modo === "editar" && asignacion ? crearFilasAprobadorActual(asignacion) : [],
    ),
  )
  // Preview de "usar ultima configuracion" (solo al crear, si hubo una previa).
  const [previewReutilizar, setPreviewReutilizar] = useState(false)
  const puedeReutilizar = modo === "crear" && Boolean(ultimaAsignacion)
  const relacionesUltima =
    ultimaAsignacion?.cuentasContratos.filter((item) => item.estado !== "ANULADA") ?? []

  function usarUltimaConfiguracion() {
    if (!ultimaAsignacion) return
    // Datos laborales: cargo/sede/area se resuelven por codigo/nombre contra el
    // catalogo (igual que en edicion); el area depende de la sede y puede quedar
    // para reelegir si su catalogo aun no cargo.
    setValores(mapearOrganizacionInicial(ultimaAsignacion, catalogosOrganizacion))
    setJefeCodigo(ultimaAsignacion.jefeCodigo ?? "")
    setJefeNombre(ultimaAsignacion.jefeNombre ?? "")
    // Horario/regimen: el resumen trae codigos; se resuelven a id contra los
    // maestros para dejar el tipo y la configuracion preseleccionados.
    const tipo = tiposTareo.find(
      (item) => item.codigo === ultimaAsignacion.tipoTareoCodigo,
    )
    setTipoTareoId(tipo ? String(tipo.id) : "")
    const config = configuracionesLaboralesCatalogo.find(
      (item) => item.codigo === ultimaAsignacion.configuracionLaboralCodigo,
    )
    setConfiguracionLaboralId(config ? String(config.id) : "")
    // Cuentas/contratos y aprobadores.
    setRelaciones(
      crearFilasRelacionActual(ultimaAsignacion, cuentasCatalogo, contratosCatalogo, true),
    )
    setAprobadores(crearFilasAprobadorActual(ultimaAsignacion))
    setPreviewReutilizar(false)
  }
  const [firmaInicialRelaciones] = useState(() =>
    firmaRelaciones(
      modo === "editar" && asignacion
        ? crearFilasRelacionActual(asignacion, cuentasCatalogo, contratosCatalogo)
        : [],
    ),
  )
  const [confirmarLimpieza, setConfirmarLimpieza] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasoActual, setPasoActual] = useState(0)

  const crearMutation = useCrearAsignacionPersonalMutation()
  const modificarMutation = useModificarAsignacionPersonalMutation(asignacion?.id ?? 0)
  const reemplazarMutation = useReemplazarCuentasContratosMutation(asignacion?.id ?? 0)
  const { usuario } = useSesion()
  const pendiente =
    crearMutation.isPending || modificarMutation.isPending || reemplazarMutation.isPending

  const relacionVigente = asignacion
    ? asignacion.cuentasContratos.filter((item) => item.estado === "VIGENTE")
    : []
  const relacionCambio =
    modo === "crear" ||
    firmaRelaciones(relaciones) !== firmaInicialRelaciones ||
    firmaAprobadores(aprobadores) !== firmaInicialAprobadores
  const esPrimerPaso = pasoActual === 0
  const esUltimoPaso = pasoActual === PASOS_ASIGNACION.length - 1
  const paso = PASOS_ASIGNACION[pasoActual]
  const tipoTareoSeleccionado = tiposTareo.find((tipo) => String(tipo.id) === tipoTareoId)
  const configuracionLaboralSeleccionada = configuracionesLaborales.find(
    (config) => String(config.id) === configuracionLaboralId,
  )
  // Se ofrecen todos los tipos de horario activos; el regimen (administrativo /
  // operativo) lo trae cada configuracion y lo resuelve BC-01 al guardar.
  const tiposTareoFiltrados = tiposTareo

  function avanzarPaso() {
    setError(null)
    setPasoActual((actual) => Math.min(actual + 1, PASOS_ASIGNACION.length - 1))
  }

  function retrocederPaso() {
    setError(null)
    setPasoActual((actual) => Math.max(actual - 1, 0))
  }

  function irAPaso(index: number) {
    if (pendiente) return
    setError(null)
    setPasoActual(index)
  }

  function actualizarValor(
    key: CampoOrganizacion["key"],
    item: ConfiguracionGeneralOpcionResponse | null,
  ) {
    // Guardamos SIEMPRE el id como string: los <Select> (Radix) comparan valores
    // como texto y los filtros de la cascada usan String(item.x). Si guardaramos el
    // numero, el valor elegido no calzaria y el select quedaria vacio.
    setValores((prev) => {
      const siguiente = { ...prev, [key]: item ? String(item.id) : "" }
      // Area depende de la sede: al cambiar la sede se limpia el area elegida
      // para no dejar una combinacion sede/area invalida.
      if (key === "sedeId" && siguiente.areaId) {
        siguiente.areaId = ""
      }
      return siguiente
    })
  }

  async function guardar() {
    if (!vigenteDesde) {
      setError("La vigencia inicial es obligatoria.")
      return
    }

    if (!usuario?.nombreUsuario) {
      setError("No se pudo identificar al usuario de la sesion.")
      return
    }

    if (vigenteHasta && vigenteHasta < vigenteDesde) {
      setError("La fecha final no puede ser anterior a la fecha inicial.")
      return
    }

    if (
      modo === "crear" &&
      (!valores.cargoId || !valores.sedeId || !valores.areaId)
    ) {
      setError("Selecciona sede, area y cargo.")
      return
    }

    if (modo === "editar" && valores.areaId && !valores.sedeId) {
      setError("Para cambiar el area tambien debes seleccionar la sede.")
      return
    }

    if (
      modo === "editar" &&
      relaciones.length === 0 &&
      relacionVigente.length > 0 &&
      relacionCambio &&
      !confirmarLimpieza
    ) {
      setError(
        "Confirma si deseas dejar la asignacion sin cuentas ni contratos, o vuelve a agregar una cuenta.",
      )
      return
    }

    const firmas = aprobadoresValidos(aprobadores)
    let resultadoRelacion: ResultadoRelacionContractual | null = null
    if (relaciones.length > 0) {
      resultadoRelacion = validarYConstruirCuentasContratos(
        relaciones,
        { vigenteDesde, vigenteHasta },
        contratosCatalogo,
        firmas,
      )

      if (!resultadoRelacion.ok) {
        setError(resultadoRelacion.error)
        return
      }
    } else if (modo === "crear") {
      setError("Agrega al menos una cuenta o un contrato.")
      return
    }

    try {
      setError(null)

      if (modo === "crear") {
        await crearMutation.mutateAsync({
          personalId,
          cargoId: valores.cargoId || undefined,
          sedeId: valores.sedeId || undefined,
          areaId: valores.areaId || undefined,
          jefeCodigo: jefeCodigo.trim() || undefined,
          jefeNombre: jefeNombre.trim() || undefined,
          tipoTareoId: tipoTareoId ? Number(tipoTareoId) : undefined,
          configuracionLaboralId: configuracionLaboralId
            ? Number(configuracionLaboralId)
            : undefined,
          vigenteDesde: fechaApi(vigenteDesde),
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : undefined,
          usuarioId: usuario.nombreUsuario,
          cuentasContratos: resultadoRelacion?.ok ? resultadoRelacion.cuentasContratos : [],
        })
        onClose(true)
        return
      }

      // Como los campos arrancan preseleccionados al editar, comparamos contra el
      // valor inicial para enviar solo lo que cambio (y no marcar cambios falsos).
      const cargoCambio = valores.cargoId !== organizacionInicial.cargoId
      const sedeCambio = valores.sedeId !== organizacionInicial.sedeId
      const areaCambio = valores.areaId !== organizacionInicial.areaId
      const cambiaEstructura = sedeCambio || areaCambio
      const jefeCambio =
        jefeCodigo.trim() !== jefeCodigoInicial.trim() ||
        jefeNombre.trim() !== jefeNombreInicial.trim()
      const tipoTareoCambio = tipoTareoId !== tipoTareoInicial
      const configLaboralCambio = configuracionLaboralId !== configuracionLaboralInicial
      const tareoCambio = tipoTareoCambio || configLaboralCambio
      const vigenciaCambio =
        vigenteDesde !== soloFecha(asignacion?.vigenteDesde) ||
        vigenteHasta !== soloFecha(asignacion?.vigenteHasta)
      const datosLaboralesCambiaron =
        cargoCambio || cambiaEstructura || jefeCambio || tareoCambio || vigenciaCambio

      if (!datosLaboralesCambiaron && !relacionCambio) {
        setError("No hay cambios para guardar.")
        return
      }

      if (datosLaboralesCambiaron) {
        await modificarMutation.mutateAsync({
          ...(cargoCambio && valores.cargoId ? { cargoId: valores.cargoId } : {}),
          ...(cambiaEstructura
            ? {
                sedeId: valores.sedeId,
                areaId: valores.areaId || null,
              }
            : {}),
          ...(jefeCambio
            ? {
                jefeCodigo: jefeCodigo.trim() || null,
                jefeNombre: jefeNombre.trim() || null,
              }
            : {}),
          // `null` limpia el tareo; un id lo asigna. Solo se envia si cambio.
          ...(tipoTareoCambio
            ? { tipoTareoId: tipoTareoId ? Number(tipoTareoId) : null }
            : {}),
          ...(configLaboralCambio
            ? {
                configuracionLaboralId: configuracionLaboralId
                  ? Number(configuracionLaboralId)
                  : null,
              }
            : {}),
          vigenteDesde: fechaApi(vigenteDesde),
          vigenteHasta: vigenteHasta ? fechaApi(vigenteHasta) : null,
          usuarioId: usuario.nombreUsuario,
        })
      }

      if (relacionCambio) {
        await reemplazarMutation.mutateAsync({
          usuarioId: usuario.nombreUsuario,
          cuentasContratos: resultadoRelacion?.ok ? resultadoRelacion.cuentasContratos : [],
        })
      }

      onClose(true)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">
            {modo === "crear" ? "Configurar nueva asignacion" : "Editar asignacion"}
          </h3>
          <p className="text-sm text-muted-foreground">
            Sigue el orden: cargo y vigencia, cuenta y contrato, horario de trabajo y, al final, quien aprueba.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onClose(false)} disabled={pendiente}>
          <X data-icon="inline-start" />
          Cerrar
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo guardar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-4 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap gap-2">
          {PASOS_ASIGNACION.map((item, index) => {
            const activo = index === pasoActual
            const completado = index < pasoActual
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  activo && "border-primary bg-primary text-primary-foreground",
                  completado && !activo && "border-primary/30 bg-primary/10 text-primary",
                  !activo && !completado && "border-border bg-background text-muted-foreground",
                )}
                onClick={() => irAPaso(index)}
                disabled={pendiente}
              >
                <span className="flex size-5 items-center justify-center rounded-full bg-background/80 text-[11px] text-foreground">
                  {index + 1}
                </span>
                {item.titulo}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Paso {pasoActual + 1} de {PASOS_ASIGNACION.length}: {paso.titulo}.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {puedeReutilizar && ultimaAsignacion ? (
          (() => {
            const horarioPrevio =
              ultimaAsignacion.configuracionLaboralNombre ??
              ultimaAsignacion.regimenNombre ??
              ultimaAsignacion.horarioNombre ??
              ultimaAsignacion.turnoNombre
            const totalCuentas = relacionesUltima.filter((item) => item.tipo === "CUENTA").length
            const totalContratos = relacionesUltima.filter(
              (item) => item.tipo === "CONTRATO",
            ).length
            const chips = [
              { icon: BriefcaseBusiness, texto: ultimaAsignacion.cargoNombre },
              { icon: MapPin, texto: ultimaAsignacion.sedeNombre },
              { icon: Clock, texto: horarioPrevio },
            ].filter((chip) => Boolean(chip.texto))

            return (
              <div className="overflow-hidden rounded-xl border border-primary/30 bg-primary/5">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <History className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Reutilizar configuracion anterior</p>
                      <p className="text-xs text-muted-foreground">
                        Este trabajador ya tuvo una asignacion. Copiala completa (cargo, sede,
                        horario, jefe y cuentas/contratos) en un clic y ajusta lo que cambie.
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {chips.map((chip) => {
                          const Icono = chip.icon
                          return (
                            <Badge key={chip.texto} variant="secondary" className="gap-1 font-normal">
                              <Icono className="size-3" />
                              {chip.texto}
                            </Badge>
                          )
                        })}
                        {totalCuentas + totalContratos > 0 ? (
                          <Badge variant="secondary" className="gap-1 font-normal">
                            <FileText className="size-3" />
                            {totalCuentas} cuenta(s) · {totalContratos} contrato(s)
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" size="sm" onClick={usarUltimaConfiguracion}>
                      <Copy data-icon="inline-start" />
                      Usar esta configuracion
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewReutilizar((prev) => !prev)}
                    >
                      {previewReutilizar ? "Ocultar detalle" : "Ver detalle"}
                    </Button>
                  </div>
                </div>

                {previewReutilizar ? (
                  <div className="flex flex-col gap-3 border-t border-primary/20 bg-card p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Última asignación ({ultimaAsignacion.estado})
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: "Cargo", value: ultimaAsignacion.cargoNombre },
                        { label: "Sede", value: ultimaAsignacion.sedeNombre },
                        { label: "Area", value: ultimaAsignacion.areaNombre },
                        { label: "Horario", value: horarioPrevio },
                        { label: "Jefe", value: ultimaAsignacion.jefeNombre },
                      ]
                        .filter((item) => Boolean(item.value))
                        .map((item) => (
                          <div
                            key={item.label}
                            className="rounded-md border border-border bg-background p-3"
                          >
                            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="mt-1 text-sm font-medium">{item.value}</p>
                          </div>
                        ))}
                    </div>
                    {relacionesUltima.length > 0 ? (
                      <JerarquiaCuentasContratos items={relacionesUltima} />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No tenia cuentas ni contratos registrados.
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      El area puede requerir reeleccion segun la sede; revisa cada paso antes de
                      guardar.
                    </p>
                  </div>
                ) : null}
              </div>
            )
          })()
        ) : null}

        <div className={paso.id === "datos" ? "contents" : "hidden"}>
          <FormularioOrganizacion
            valores={valores}
            onChange={actualizarValor}
            habilitado
            catalogos={{ ...catalogosOrganizacion, cargos: cargosCatalogo }}
            cargandoCargos={cargandoCargos}
            actuales={
              modo === "editar" && asignacion
                ? {
                    cargo: asignacion.cargoNombre,
                    sede: asignacion.sedeNombre,
                    area: asignacion.areaNombre,
                  }
                : undefined
            }
          />

            <FieldSet className="rounded-lg border border-border p-4">
            <FieldLegend>Jefe o responsable</FieldLegend>
            <FieldDescription>
              Se resuelve por area y jerarquia de gerencia. El cargo solo acompaña como dato de la
              asignacion.
            </FieldDescription>
            {jefeSegunEstructura ? (
              <p className="text-xs text-muted-foreground">
                Segun la estructura, este cargo reporta a{" "}
                <span className="font-medium text-foreground">{jefeSegunEstructura}</span>.
                {candidatosJefe.length === 0
                  ? " Aun no hay una persona asignada en ese cargo o area superior: asignala primero para autocompletar el jefe."
                  : ""}
              </p>
            ) : cargoSeleccionadoObj ? (
              <p className="text-xs text-muted-foreground">
                Este cargo es el nivel mas alto (no reporta a otro cargo).
              </p>
            ) : null}
            {esCargoRaiz ? null : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel>Jefe sugerido *</FieldLabel>
                <Select
                  value={jefeCodigo || "__none"}
                  disabled={esCargoRaiz || candidatosJefe.length === 0 || personalQuery.isLoading}
                  onValueChange={(value) => {
                    const candidato = candidatosJefe.find((item) => String(item.personal.id) === value)
                    if (!candidato) return
                    setJefeCodigo(String(candidato.personal.id))
                    setJefeNombre(obtenerEtiquetaPersonal(candidato.personal))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        esCargoRaiz
                          ? "Sin jefe (maximo nivel)"
                          : personalQuery.isLoading
                            ? "Cargando jefes..."
                            : candidatosJefe.length === 0
                              ? "Sin jefe disponible"
                              : "Selecciona jefe"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none" disabled>
                        {personalQuery.isLoading ? "Cargando jefes..." : "Selecciona jefe"}
                      </SelectItem>
                      {candidatosJefe.map(({ personal, asignacion }) => (
                        <SelectItem key={personal.id} value={String(personal.id)}>
                          {obtenerEtiquetaPersonal(personal)} · {asignacion?.cargoNombre ?? "Cargo"}
                          {asignacion?.areaNombre ? ` · ${asignacion.areaNombre}` : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {esCargoRaiz
                    ? "Este cargo es el maximo nivel: no lleva jefe (se deja vacio)."
                    : "Dinamico por cargo y area. Si cambias cargo o area, el jefe se recalcula."}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Codigo del jefe</FieldLabel>
                <Input
                  value={jefeCodigo}
                  readOnly
                  placeholder={esCargoRaiz ? "Sin jefe" : "Auto"}
                />
              </Field>
              <Field>
                <FieldLabel>Nombre del jefe</FieldLabel>
                <Input
                  value={jefeNombre}
                  readOnly
                  placeholder={esCargoRaiz ? "Sin jefe" : "Auto"}
                />
              </Field>
            </div>
            )}
          </FieldSet>
        </div>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "laboral" && "hidden")}>
          <FieldLegend>Horario de trabajo</FieldLegend>
          <FieldDescription>
            Define como trabaja la persona: por turno, por horario o por regimen. Primero elige el
            tipo y luego la configuracion correspondiente. Es opcional.
          </FieldDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Tipo de horario</FieldLabel>
              <Select
                value={tipoTareoId || "__none"}
                onValueChange={(v) => {
                  setTipoTareoId(v === "__none" ? "" : v)
                  setConfiguracionLaboralId("")
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona tipo de horario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none">Sin asignar</SelectItem>
                    {tiposTareoFiltrados.map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.codigo} - {tipo.nombre}
                      </SelectItem>
                    ))}
                    {tiposTareoFiltrados.length === 0 ? (
                      <SelectItem value="__vacio" disabled>
                        No hay tipos de horario para este tipo de personal
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Configuracion del horario</FieldLabel>
              <Select
                value={configuracionLaboralId || "__none"}
                disabled={!tipoTareoId}
                onValueChange={(v) =>
                  setConfiguracionLaboralId(v === "__none" ? "" : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      tipoTareoId
                        ? "Selecciona configuracion"
                        : "Primero elige un tipo de horario"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none">Sin asignar</SelectItem>
                    {configuracionesLaborales.map((config) => (
                      <SelectItem key={config.id} value={String(config.id)}>
                        {config.codigo} - {config.nombre}
                      </SelectItem>
                    ))}
                    {tipoTareoId &&
                    configuracionesLaborales.length === 0 &&
                    cargandoConfiguraciones ? (
                      <SelectItem value="__cargando" disabled>
                        Cargando configuraciones...
                      </SelectItem>
                    ) : null}
                    {tipoTareoId &&
                    configuracionesLaborales.length === 0 &&
                    !cargandoConfiguraciones ? (
                      <SelectItem value="__vacio" disabled>
                        No hay configuraciones de horario para este tipo
                      </SelectItem>
                    ) : null}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {tipoTareoId &&
          configuracionesLaborales.length === 0 &&
          !cargandoConfiguraciones ? (
            <Alert className="mt-3">
              <AlertTitle>Este tipo de horario aun no tiene configuraciones</AlertTitle>
              <AlertDescription>
                La configuracion del horario (turno, horario o regimen, dias y horas) se crea en el
                catalogo de tareo. Crea una configuracion activa para este tipo y vuelve a esta
                pantalla.{" "}
                <Link
                  href="/socio-negocios/tareo"
                  target="_blank"
                  className="font-medium underline underline-offset-2"
                >
                  Abrir catalogo de tareo
                </Link>
              </AlertDescription>
            </Alert>
          ) : null}

          {configuracionLaboralSeleccionada ? (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold">
                  {configuracionLaboralSeleccionada.codigo} - {configuracionLaboralSeleccionada.nombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  Detalle que se copiara a la asignacion al guardar.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Turno", value: configuracionLaboralSeleccionada.turnoNombre },
                  { label: "Horario", value: configuracionLaboralSeleccionada.horarioNombre },
                  { label: "Hora entrada", value: configuracionLaboralSeleccionada.horaInicio },
                  { label: "Hora salida", value: configuracionLaboralSeleccionada.horaFin },
                  { label: "Regimen", value: configuracionLaboralSeleccionada.regimenNombre },
                  { label: "Patron", value: configuracionLaboralSeleccionada.regimenPatron },
                  {
                    label: "Dias trabajo",
                    value: configuracionLaboralSeleccionada.diasTrabajo?.toString(),
                  },
                  {
                    label: "Dias descanso",
                    value: configuracionLaboralSeleccionada.diasDescanso?.toString(),
                  },
                  {
                    label: "Horas por dia",
                    value: configuracionLaboralSeleccionada.horasPorDia?.toString(),
                  },
                  {
                    label: "Turno nocturno",
                    value: configuracionLaboralSeleccionada.esTurnoNocturno ? "Si" : "No",
                  },
                  {
                    label: "Horas extra",
                    value: configuracionLaboralSeleccionada.permiteHorasExtra ? "Permite" : "No permite",
                  },
                  {
                    label: "Trabajo feriado",
                    value: configuracionLaboralSeleccionada.permiteTrabajoFeriado
                      ? "Permite"
                      : "No permite",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-border bg-card p-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold">{item.value || "-"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : tipoTareoId ? (
            <Alert>
              <AlertTitle>Elige la configuracion del horario</AlertTitle>
              <AlertDescription>
                Ya elegiste el tipo. Ahora elige la configuracion, que tiene el detalle de horario,
                turno, regimen, dias y horas.
              </AlertDescription>
            </Alert>
          ) : null}
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "cuentas" && "hidden")}>
          <FieldLegend>{modo === "editar" ? "Editar cuenta y contrato" : "Cuenta y contrato"}</FieldLegend>
          <FieldDescription>
            Agrega las cuentas y contratos de la persona. Lo que dejes aqui al guardar reemplaza las
            cuentas y contratos actuales.
          </FieldDescription>

          <EditorRelacionContractual
            filas={relaciones}
            onChange={setRelaciones}
            cuentasCatalogo={cuentasCatalogo}
            contratosCatalogo={contratosCatalogo}
          />

          {modo === "editar" && relacionVigente.length > 0 && relaciones.length === 0 ? (
            <Field orientation="horizontal">
              <input
                id={`confirmar-limpieza-${asignacion?.id}`}
                type="checkbox"
                checked={confirmarLimpieza}
                onChange={(event) => setConfirmarLimpieza(event.target.checked)}
              />
              <FieldLabel htmlFor={`confirmar-limpieza-${asignacion?.id}`}>
                Confirmo que la asignacion quedara sin cuentas ni contratos
              </FieldLabel>
            </Field>
          ) : null}
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "aprobadores" && "hidden")}>
          <FieldLegend>Quien aprueba</FieldLegend>
          <FieldDescription>
            Indica quien debe aprobar las cuentas y contratos. Aprueban en el orden en que los
            agregas, y la misma lista se aplica a todas las cuentas y contratos.
          </FieldDescription>

          <EditorAprobadores
            filas={aprobadores}
            onChange={setAprobadores}
            cargosCatalogo={cargosCatalogo}
            cargandoCargos={cargandoCargos}
          />
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "datos" && "hidden")}>
          <FieldLegend>Vigencia en la posicion</FieldLegend>
          <FieldDescription>
            Indica desde cuando empieza a operar en este cargo, con su contrato, en esa area y esa
            sede. Es la fecha que responde &quot;desde cuando inicio en esta asignacion&quot;.
          </FieldDescription>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Inicio en la posicion *</FieldLabel>
              <Input
                type="date"
                value={vigenteDesde}
                onChange={(event) => setVigenteDesde(event.target.value)}
              />
              <FieldDescription>
                Desde cuando opera en este cargo, con su contrato, area y sede.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Fin de la posicion</FieldLabel>
              <Input
                type="date"
                value={vigenteHasta}
                min={vigenteDesde || undefined}
                onChange={(event) => setVigenteHasta(event.target.value)}
              />
              <FieldDescription>Dejalo vacio si continua vigente.</FieldDescription>
            </Field>
          </div>
        </FieldSet>

        <FieldSet className={cn("rounded-lg border border-border p-4", paso.id !== "confirmacion" && "hidden")}>
          <FieldLegend>Confirmacion</FieldLegend>
          <FieldDescription>
            Revisa que todo este correcto antes de guardar la asignacion.
          </FieldDescription>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                label: "Cargo",
                value: nombreOpcionSeleccionada(
                  valores.cargoId,
                  catalogosOrganizacion.cargos,
                  asignacion?.cargoNombre,
                ),
              },
              {
                label: "Sede",
                value: nombreOpcionSeleccionada(
                  valores.sedeId,
                  catalogosOrganizacion.sedes,
                  asignacion?.sedeNombre,
                ),
              },
              {
                label: "Area",
                value: nombreOpcionSeleccionada(
                  valores.areaId,
                  catalogosOrganizacion.areas,
                  asignacion?.areaNombre,
                ),
              },
              { label: "Cuentas", value: `${relaciones.filter((item) => item.cuenta).length}` },
              {
                label: "Contratos",
                value: `${relaciones.filter((item) => item.contrato).length}`,
              },
              { label: "Aprobadores", value: `${aprobadoresValidos(aprobadores).length}` },
              { label: "Tipo de horario", value: tipoTareoSeleccionado?.nombre || "Sin asignar" },
              {
                label: "Configuracion del horario",
                value: configuracionLaboralSeleccionada?.nombre || "Sin asignar",
              },
              { label: "Disponibilidad", value: "Disponible" },
              { label: "Inicio", value: vigenteDesde || "Pendiente" },
              { label: "Fin", value: vigenteHasta || "Sin fecha fin" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-sm font-semibold">{item.value || "Sin definir"}</p>
              </div>
            ))}
          </div>
        </FieldSet>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={retrocederPaso} disabled={pendiente || esPrimerPaso}>
            Anterior
          </Button>
          {esUltimoPaso ? (
            <Button type="button" onClick={() => void guardar()} disabled={pendiente}>
              {pendiente ? "Guardando..." : modo === "crear" ? "Crear asignacion" : "Guardar cambios"}
            </Button>
          ) : (
            <Button type="button" onClick={avanzarPaso} disabled={pendiente}>
              Siguiente
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={pendiente}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AsignacionFormulario({
  modo,
  asignacion,
  personalId,
  ultimaAsignacion,
  onClose,
}: {
  modo: "crear" | "editar"
  asignacion?: AsignacionPersonalResponse
  personalId: string | number
  ultimaAsignacion?: AsignacionPersonalResponse
  onClose: (actualizado: boolean) => void
}) {
  // Cargos salen directo de BC14. El resto de catalogos sigue saliendo por el
  // formulario consolidado de BC-01.
  const opcionesQuery = useOpcionesFormularioAsignacionQuery()
  const cargosQuery = useCargosConfiguracionGeneralQuery({}, true)
  const asignacionDetalleQuery = useAsignacionPersonalQuery(
    asignacion?.id ?? "",
    modo === "editar" && Boolean(asignacion?.id),
  )

  const cargando = opcionesQuery.isLoading || cargosQuery.isLoading || asignacionDetalleQuery.isLoading
  const errorCarga = opcionesQuery.error || cargosQuery.error
  const opciones = opcionesQuery.data
  const cargosCatalogo = cargosQuery.data ?? []
  const asignacionEfectiva = asignacionDetalleQuery.data ?? asignacion

  if (cargando) {
    return (
      <div className="rounded-xl border border-border p-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (errorCarga || !opciones) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo preparar el formulario</AlertTitle>
        <AlertDescription>
          {errorCarga
            ? obtenerMensajeError(errorCarga)
            : "No se pudieron cargar las opciones del formulario."}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <AsignacionFormularioContenido
      modo={modo}
      asignacion={asignacionEfectiva}
      personalId={personalId}
      ultimaAsignacion={ultimaAsignacion}
      cuentasCatalogo={opciones.cuentas}
      contratosCatalogo={opciones.contratos}
      catalogosOrganizacion={{
        cargos: cargosCatalogo,
        sedes: opciones.sedes,
        areas: opciones.areas,
      }}
      cargosCatalogo={cargosCatalogo}
      cargandoCargos={cargosQuery.isLoading}
      tiposTareo={opciones.tiposTareo}
      configuracionesLaboralesCatalogo={opciones.configuracionesLaborales}
      onClose={onClose}
    />
  )
}
