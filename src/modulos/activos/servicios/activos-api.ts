import { clienteActivos } from "@/compartido/api/clientes-backend";
import type { RespuestaPaginada } from "@/compartido/api/contrato";

import type {
  CargaMasiva,
  CargaMasivaDocumentosPayload,
  CargaMasivaDocumentosResultado,
  CargaMasivaPayload,
  TipoDocumentoMaestro,
} from "../tipos/carga-masiva.tipos";

import type {
  Activo,
  ActivoConfiguracionHistorica,
  ActivoHistorial,
  ActualizarDetalleInventarioFisicoPayload,
  ActualizarActivoPayload,
  CarroceriaReferencia,
  CerrarInventarioFisicoPayload,
  CrearConfiguracionHistoricaPayload,
  CrearActivoPayload,
  CrearDocumentoActivoPayload,
  CrearImagenActivoPayload,
  CrearInventarioFisicoPayload,
  CrearTanqueActivoPayload,
  DocumentoActivo,
  EstadoActivo,
  EstadoRegistro,
  ImagenActivo,
  InventarioFisico,
  PerfilCombustible,
  PerfilFlota,
  RegistrarRevisionInventarioFisicoPayload,
  SnapshotHistoricoActivoInventario,
  TanqueActivo,
} from "../tipos/activo.tipos";

const CARROCERIAS_REFERENCIA_FALLBACK: CarroceriaReferencia[] = [
  {
    id: -1,
    claseVehiculoReferenciaId: 4,
    nombre: "PICKUP DOBLE CABINA",
    descripcion: "Camioneta pickup para personal y carga ligera.",
    anchoSugerido: 1.85,
    longitudSugerida: 5.3,
    altoSugerido: 1.82,
    ejesSugeridos: 2,
    categoriaSugerida: "N1",
    activo: true,
  },
  {
    id: -2,
    claseVehiculoReferenciaId: 4,
    nombre: "PICKUP CABINA SIMPLE",
    descripcion: "Pickup con mayor espacio de carga.",
    anchoSugerido: 1.85,
    longitudSugerida: 5.25,
    altoSugerido: 1.8,
    ejesSugeridos: 2,
    categoriaSugerida: "N1",
    activo: true,
  },
  {
    id: -3,
    claseVehiculoReferenciaId: 4,
    nombre: "SUV / STATION WAGON",
    descripcion: "Unidad para transporte de personal.",
    anchoSugerido: 1.9,
    longitudSugerida: 4.8,
    altoSugerido: 1.75,
    ejesSugeridos: 2,
    categoriaSugerida: "M1",
    activo: true,
  },
  {
    id: -4,
    claseVehiculoReferenciaId: 1,
    nombre: "PLATAFORMA",
    descripcion: "Camion rigido para carga general.",
    anchoSugerido: 2.5,
    longitudSugerida: 8.5,
    altoSugerido: 3,
    ejesSugeridos: 2,
    categoriaSugerida: "N2",
    activo: true,
  },
  {
    id: -5,
    claseVehiculoReferenciaId: 1,
    nombre: "FURGON CERRADO",
    descripcion: "Camion para carga protegida.",
    anchoSugerido: 2.55,
    longitudSugerida: 9,
    altoSugerido: 3.6,
    ejesSugeridos: 2,
    categoriaSugerida: "N2",
    activo: true,
  },
  {
    id: -6,
    claseVehiculoReferenciaId: 2,
    nombre: "TRACTO 4X2",
    descripcion: "Remolcador para semirremolque liviano o medio.",
    anchoSugerido: 2.55,
    longitudSugerida: 6.2,
    altoSugerido: 3.6,
    ejesSugeridos: 2,
    categoriaSugerida: "N3",
    activo: true,
  },
  {
    id: -7,
    claseVehiculoReferenciaId: 2,
    nombre: "TRACTO 6X4",
    descripcion: "Remolcador para carga pesada.",
    anchoSugerido: 2.55,
    longitudSugerida: 7.2,
    altoSugerido: 3.8,
    ejesSugeridos: 3,
    categoriaSugerida: "N3",
    activo: true,
  },
  {
    id: -8,
    claseVehiculoReferenciaId: 3,
    nombre: "PLATAFORMA",
    descripcion: "Semirremolque para carga general.",
    anchoSugerido: 2.55,
    longitudSugerida: 13.5,
    altoSugerido: 1.5,
    ejesSugeridos: 3,
    categoriaSugerida: "O4",
    activo: true,
  },
  {
    id: -9,
    claseVehiculoReferenciaId: 3,
    nombre: "CISTERNA",
    descripcion: "Semirremolque para liquidos.",
    anchoSugerido: 2.55,
    longitudSugerida: 12.5,
    altoSugerido: 3.9,
    ejesSugeridos: 3,
    categoriaSugerida: "O4",
    activo: true,
  },
];

type ObtenerActivosParams = {
  estadoRegistro?: EstadoRegistro | "TODOS";
  /** Limite por defecto alto para cargas de "todo" (dashboard, inventario, etc.) */
  limite?: number;
};

export type PaginadoActivosParams = {
  pagina?: number;
  limite?: number;
  estadoRegistro?: EstadoRegistro;
  /** true = el backend lista visibles y anulados juntos (ignora estadoRegistro). */
  incluirAnulados?: boolean;
  placa?: string;
  tipoActivoReferenciaId?: number;
};

export async function obtenerActivos(
  params?: ObtenerActivosParams
): Promise<Activo[]> {
  if (params?.estadoRegistro === "TODOS") {
    const limite = params.limite ?? 500;
    const [activos, anulados] = await Promise.all([
      obtenerActivos({ estadoRegistro: true, limite }),
      obtenerActivos({ estadoRegistro: false, limite }),
    ]);
    return [...activos, ...anulados];
  }

  const queryParams: Record<string, unknown> = {
    limite: params?.limite ?? 500,
  };
  if (params?.estadoRegistro !== undefined) {
    queryParams.estadoRegistro = params.estadoRegistro;
  }

  const { data } = await clienteActivos.get<RespuestaPaginada<Activo>>(
    "/activos",
    { params: queryParams }
  );
  return [...data.datos];
}

export async function obtenerActivosPaginado(
  params?: PaginadoActivosParams
): Promise<RespuestaPaginada<Activo>> {
  const queryParams: Record<string, unknown> = {
    pagina: params?.pagina ?? 1,
    limite: params?.limite ?? 20,
  };
  if (params?.estadoRegistro !== undefined) {
    queryParams.estadoRegistro = params.estadoRegistro;
  }
  if (params?.incluirAnulados) {
    queryParams.incluirAnulados = true;
  }
  if (params?.placa) queryParams.placa = params.placa;
  if (params?.tipoActivoReferenciaId !== undefined) {
    queryParams.tipoActivoReferenciaId = params.tipoActivoReferenciaId;
  }

  const { data } = await clienteActivos.get<RespuestaPaginada<Activo>>(
    "/activos",
    { params: queryParams }
  );
  return data;
}

export async function obtenerActivoPorCodigo(codigo: string): Promise<Activo> {
  const { data } = await clienteActivos.get<Activo>(
    `/activos/codigo/${codigo}`
  );
  return data;
}

export async function obtenerActivoPorId(id: number): Promise<Activo> {
  const { data } = await clienteActivos.get<Activo>(`/activos/${id}`);
  return data;
}

export async function obtenerHistorialPorCodigo(
  codigo: string
): Promise<ActivoHistorial[]> {
  const { data } = await clienteActivos.get<ActivoHistorial[]>(
    `/activos/codigo/${codigo}/historial`
  );
  return Array.isArray(data) ? data : [];
}

export async function obtenerConfiguracionHistoricaPorCodigo(
  codigo: string
): Promise<ActivoConfiguracionHistorica[]> {
  const { data } = await clienteActivos.get<ActivoConfiguracionHistorica[]>(
    `/activos/codigo/${codigo}/configuracion-historica`
  );
  return Array.isArray(data) ? data : [];
}

export async function registrarConfiguracionHistoricaPorCodigo(
  codigo: string,
  payload: CrearConfiguracionHistoricaPayload
): Promise<ActivoConfiguracionHistorica> {
  const { data } = await clienteActivos.post<ActivoConfiguracionHistorica>(
    `/activos/codigo/${codigo}/configuracion-historica`,
    payload
  );
  return data;
}

export async function obtenerCarroceriasReferencia(
  claseVehiculoReferenciaId?: number
): Promise<CarroceriaReferencia[]> {
  const params = claseVehiculoReferenciaId ? { claseVehiculoReferenciaId } : undefined;
  try {
    const { data } = await clienteActivos.get<CarroceriaReferencia[]>(
      "/activos/carrocerias-referencia",
      { params }
    );
    const referencias = Array.isArray(data) ? data : [];
    const filtradas = claseVehiculoReferenciaId
      ? referencias.filter(
          (referencia) =>
            referencia.claseVehiculoReferenciaId === claseVehiculoReferenciaId
        )
      : referencias;

    return filtradas.length
      ? filtradas
      : obtenerCarroceriasFallback(claseVehiculoReferenciaId);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("No se pudo cargar carrocerias desde API", error);
    }
    return obtenerCarroceriasFallback(claseVehiculoReferenciaId);
  }
}

function obtenerCarroceriasFallback(claseVehiculoReferenciaId?: number) {
  return claseVehiculoReferenciaId
    ? CARROCERIAS_REFERENCIA_FALLBACK.filter(
        (referencia) => referencia.claseVehiculoReferenciaId === claseVehiculoReferenciaId
      )
    : CARROCERIAS_REFERENCIA_FALLBACK;
}

export async function crearActivo(payload: CrearActivoPayload): Promise<Activo> {
  const { data } = await clienteActivos.post<Activo>("/activos", payload);
  return data;
}

export async function procesarCargaMasiva(
  payload: CargaMasivaPayload
): Promise<CargaMasiva> {
  const { data } = await clienteActivos.post<CargaMasiva>(
    "/activos/carga-masiva",
    payload
  );
  return data;
}

export async function procesarCargaMasivaDocumentos(
  payload: CargaMasivaDocumentosPayload
): Promise<CargaMasivaDocumentosResultado> {
  const { data } = await clienteActivos.post<CargaMasivaDocumentosResultado>(
    "/activos/carga-masiva-documentos",
    payload
  );
  return data;
}

export async function obtenerTiposDocumento(): Promise<TipoDocumentoMaestro[]> {
  const { data } = await clienteActivos.get<TipoDocumentoMaestro[]>(
    "/activos/tipos-documento"
  );
  return Array.isArray(data) ? data : [];
}

export async function listarCargasMasivas(): Promise<CargaMasiva[]> {
  const { data } = await clienteActivos.get<CargaMasiva[]>(
    "/activos/cargas-masivas"
  );
  return data;
}

export async function obtenerCargaMasiva(id: number): Promise<CargaMasiva> {
  const { data } = await clienteActivos.get<CargaMasiva>(
    `/activos/cargas-masivas/${id}`
  );
  return data;
}

export async function actualizarActivo(
  id: number,
  payload: ActualizarActivoPayload
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(`/activos/${id}`, payload);
  return data;
}

export async function cambiarEstadoActivo(
  id: number,
  payload: {
    estadoActivo: EstadoActivo;
    motivo?: string;
    usuario?: string;
  }
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/estado-activo`,
    payload
  );
  return data;
}

export async function cambiarEstadoRegistro(
  id: number,
  payload: {
    estadoRegistro: EstadoRegistro;
    motivo?: string;
    usuario?: string;
  }
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/estado-registro`,
    payload
  );
  return data;
}

export async function siniestrarActivo(
  id: number,
  payload: {
    observacion?: string;
  }
): Promise<Activo> {
  const { data } = await clienteActivos.patch<Activo>(
    `/activos/${id}/siniestrar`,
    payload
  );
  return data;
}

export async function obtenerImagenesPorCodigo(
  codigo: string
): Promise<ImagenActivo[]> {
  const { data } = await clienteActivos.get<ImagenActivo[]>(
    `/activos/codigo/${codigo}/imagenes`
  );
  return data;
}

export async function crearImagenPorCodigo(
  codigo: string,
  payload: CrearImagenActivoPayload
): Promise<ImagenActivo> {
  const { data } = await clienteActivos.post<ImagenActivo>(
    `/activos/codigo/${codigo}/imagenes`,
    payload
  );
  return data;
}

export async function eliminarImagenPorCodigo(
  codigo: string,
  imagenId: number
): Promise<void> {
  await clienteActivos.delete(`/activos/codigo/${codigo}/imagenes/${imagenId}`);
}

export async function obtenerDocumentosPorCodigo(
  codigo: string
): Promise<DocumentoActivo[]> {
  const { data } = await clienteActivos.get<DocumentoActivo[]>(
    `/activos/codigo/${codigo}/documentos`
  );
  return data;
}

export async function obtenerDocumentosPorActivoId(
  id: number
): Promise<DocumentoActivo[]> {
  const { data } = await clienteActivos.get<DocumentoActivo[]>(
    `/activos/${id}/documentos`
  );
  return Array.isArray(data) ? data : [];
}

export async function crearDocumentoPorCodigo(
  codigo: string,
  payload: CrearDocumentoActivoPayload
): Promise<DocumentoActivo> {
  const { data } = await clienteActivos.post<DocumentoActivo>(
    `/activos/codigo/${codigo}/documentos`,
    payload
  );
  return data;
}

export async function eliminarDocumentoPorCodigo(
  codigo: string,
  documentoId: number
): Promise<void> {
  await clienteActivos.delete(
    `/activos/codigo/${codigo}/documentos/${documentoId}`
  );
}

/**
 * Quita la cobertura de este activo sobre un documento COMPARTIDO (poliza).
 * Si era el unico activo cubierto, el documento se borra por completo; si
 * cubre otros activos, sigue existiendo para ellos.
 */
export async function quitarCoberturaDocumentoCompartidoPorCodigo(
  codigo: string,
  documentoCompartidoId: number
): Promise<void> {
  await clienteActivos.delete(
    `/activos/codigo/${codigo}/documentos-compartidos/${documentoCompartidoId}`
  );
}

export async function obtenerTanquesPorCodigo(
  codigo: string
): Promise<TanqueActivo[]> {
  const { data } = await clienteActivos.get<TanqueActivo[]>(
    `/activos/codigo/${codigo}/tanques`
  );
  return data;
}

export async function crearTanquePorCodigo(
  codigo: string,
  payload: CrearTanqueActivoPayload
): Promise<TanqueActivo> {
  const { data } = await clienteActivos.post<TanqueActivo>(
    `/activos/codigo/${codigo}/tanques`,
    payload
  );
  return data;
}

export async function eliminarTanquePorCodigo(
  codigo: string,
  tanqueId: number
): Promise<void> {
  await clienteActivos.delete(`/activos/codigo/${codigo}/tanques/${tanqueId}`);
}

export async function obtenerInventariosFisicos(): Promise<InventarioFisico[]> {
  const { data } = await clienteActivos.get<unknown>(
    "/activos/inventarios-fisicos"
  );

  if (Array.isArray(data)) {
    return data as InventarioFisico[];
  }

  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { inventarios?: unknown }).inventarios)
  ) {
    return (data as { inventarios: InventarioFisico[] }).inventarios;
  }

  throw new Error("La API de inventario fisico no devolvio una lista.");
}

export async function obtenerInventarioFisicoPorId(
  id: number
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.get<InventarioFisico>(
    `/activos/inventarios-fisicos/${id}`
  );
  return data;
}

export async function obtenerSnapshotsHistoricosActivoInventario(
  activoId: number,
  excludeInventarioId?: number
): Promise<SnapshotHistoricoActivoInventario[]> {
  const query =
    excludeInventarioId !== undefined
      ? `?excludeInventarioId=${encodeURIComponent(excludeInventarioId)}`
      : "";
  const { data } = await clienteActivos.get<
    SnapshotHistoricoActivoInventario[]
  >(`/activos/inventarios-fisicos/activos/${activoId}/snapshots${query}`);
  return data;
}

export async function aperturarInventarioFisico(
  payload: CrearInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.post<InventarioFisico>(
    "/activos/inventarios-fisicos",
    payload
  );
  return data;
}

export async function actualizarDetalleInventarioFisico(
  inventarioId: number,
  detalleId: number,
  payload: ActualizarDetalleInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.patch<InventarioFisico>(
    `/activos/inventarios-fisicos/${inventarioId}/detalles/${detalleId}`,
    payload
  );
  return data;
}

export async function registrarRevisionInventarioFisico(
  inventarioId: number,
  payload: RegistrarRevisionInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.post<InventarioFisico>(
    `/activos/inventarios-fisicos/${inventarioId}/revisiones`,
    payload
  );
  return data;
}

export async function cerrarInventarioFisico(
  id: number,
  payload: CerrarInventarioFisicoPayload
): Promise<InventarioFisico> {
  const { data } = await clienteActivos.patch<InventarioFisico>(
    `/activos/inventarios-fisicos/${id}/cerrar`,
    payload
  );
  return data;
}

// ── Búsqueda por placa ────────────────────────────────────────────────────────

export async function buscarActivosPorPlaca(placa: string): Promise<Activo[]> {
  if (!placa.trim()) return [];
  const { data } = await clienteActivos.get<RespuestaPaginada<Activo>>(
    "/activos",
    { params: { placa: placa.trim(), limite: 50 } }
  );
  return [...data.datos];
}

/**
 * Busca activos por codigo O placa (no hay un solo filtro que cubra ambos
 * en el backend), para listas de seleccion tipo "que activos cubre este
 * documento compartido". Combina y deduplica por id.
 */
export async function buscarActivosPorCodigoOPlaca(
  texto: string
): Promise<Activo[]> {
  const limpio = texto.trim();
  if (!limpio) return [];

  const [porCodigo, porPlaca] = await Promise.all([
    clienteActivos.get<RespuestaPaginada<Activo>>("/activos", {
      params: { codigo: limpio, estadoRegistro: true, limite: 20 },
    }),
    clienteActivos.get<RespuestaPaginada<Activo>>("/activos", {
      params: { placa: limpio, estadoRegistro: true, limite: 20 },
    }),
  ]);

  const vistos = new Set<number>();
  const combinados: Activo[] = [];
  for (const activo of [...porCodigo.data.datos, ...porPlaca.data.datos]) {
    if (vistos.has(activo.id)) continue;
    vistos.add(activo.id);
    combinados.push(activo);
  }
  return combinados;
}

export type FiltrosBusquedaActivo = {
  codigo?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  anioFabricacion?: number;
  tipoActivoReferenciaId?: number;
  claseVehiculoReferenciaId?: number;
  limite?: number;
};

/**
 * Busqueda de activos para la "mesa de trabajo" de documentos: filtros
 * separados (marca/modelo/ano/tipo/clase ademas de codigo/placa), todos
 * opcionales y combinables. Solo activos vigentes (`estadoRegistro: true`).
 */
export async function buscarActivosConFiltros(
  filtros: FiltrosBusquedaActivo
): Promise<Activo[]> {
  const queryParams: Record<string, unknown> = {
    estadoRegistro: true,
    limite: filtros.limite ?? 50,
  };
  if (filtros.codigo?.trim()) queryParams.codigo = filtros.codigo.trim();
  if (filtros.placa?.trim()) queryParams.placa = filtros.placa.trim();
  if (filtros.marca?.trim()) queryParams.marca = filtros.marca.trim();
  if (filtros.modelo?.trim()) queryParams.modelo = filtros.modelo.trim();
  if (filtros.anioFabricacion) {
    queryParams.anioFabricacion = filtros.anioFabricacion;
  }
  if (filtros.tipoActivoReferenciaId) {
    queryParams.tipoActivoReferenciaId = filtros.tipoActivoReferenciaId;
  }
  if (filtros.claseVehiculoReferenciaId) {
    queryParams.claseVehiculoReferenciaId = filtros.claseVehiculoReferenciaId;
  }

  const { data } = await clienteActivos.get<RespuestaPaginada<Activo>>(
    "/activos",
    { params: queryParams }
  );
  return [...data.datos];
}

export async function obtenerPerfilFlotaPorPlaca(
  placa: string
): Promise<PerfilFlota | null> {
  try {
    const { data } = await clienteActivos.get<PerfilFlota>(
      `/activos/placa/${encodeURIComponent(placa)}/perfil-flota`
    );
    return data;
  } catch {
    return null;
  }
}

export async function obtenerPerfilCombustiblePorPlaca(
  placa: string
): Promise<PerfilCombustible | null> {
  try {
    const { data } = await clienteActivos.get<PerfilCombustible>(
      `/activos/placa/${encodeURIComponent(placa)}/perfil-combustible`
    );
    return data;
  } catch {
    return null;
  }
}
