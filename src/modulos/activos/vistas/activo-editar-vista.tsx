import { ActivoFormulario } from "../componentes/activo-formulario";
import {
  obtenerActivoPorCodigo,
  obtenerDocumentosPorCodigo,
  obtenerImagenesPorCodigo,
  obtenerTanquesPorCodigo,
} from "../servicios/activos-api";

type Props = {
  codigo: string;
  returnTo?: string;
};

export async function ActivoEditarVista({ codigo, returnTo }: Props) {
  const activo = await obtenerActivoPorCodigo(codigo);
  const documentos = await obtenerDocumentosPorCodigo(codigo).catch(() => []);
  const imagenes = await obtenerImagenesPorCodigo(codigo).catch(() => []);
  const tanques = await obtenerTanquesPorCodigo(codigo).catch(() => []);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <ActivoFormulario
          activo={activo}
          documentos={documentos}
          imagenes={imagenes}
          modo="editar"
          returnTo={returnTo}
          tanques={tanques}
          tituloPagina="Actualizar activo"
          subtituloPagina={activo.codigo}
        />
      </div>
    </main>
  );
}
