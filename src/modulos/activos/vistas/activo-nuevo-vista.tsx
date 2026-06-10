import Link from "next/link";
import { FileText, GitCompareArrows } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { ActivoFormulario } from "../componentes/activo-formulario";
import {
  obtenerActivoPorId,
  obtenerDocumentosPorActivoId,
} from "../servicios/activos-api";
import type { Activo, DocumentoActivo } from "../tipos/activo.tipos";

type Props = {
  origenId?: string;
};

export async function ActivoNuevoVista({ origenId }: Props) {
  const { activo: activoOrigen, documentos: documentosOrigen } =
    await obtenerActivoOrigen(origenId);
  const esAcople = Boolean(origenId);
  const activoBaseAcople = activoOrigen
    ? crearActivoBaseAcople(activoOrigen)
    : undefined;

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">
        <section className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-normal">
              {esAcople ? "Replaqueo" : "Nuevo activo"}
            </h1>
            {esAcople ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Registra la nueva ficha conservando la referencia de la unidad
                de baja.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {esAcople ? (
              <Button asChild variant="outline">
                <Link href="/activos/nuevo-acople">Cambiar unidad</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href="/activos">Volver</Link>
            </Button>
          </div>
        </section>

        <ActivoFormulario activo={activoBaseAcople} />

        {origenId ? (
          activoOrigen ? (
            <ActivoOrigenCard
              activo={activoOrigen}
              documentos={documentosOrigen}
            />
          ) : (
            <Card className="border-destructive/40 bg-destructive/10">
              <CardContent className="py-4 text-sm text-destructive">
                No se pudo cargar el activo anterior seleccionado. Vuelve a
                elegirlo desde Replaqueo.
              </CardContent>
            </Card>
          )
        ) : null}
      </div>
    </main>
  );
}

async function obtenerActivoOrigen(origenId?: string) {
  if (!origenId) {
    return { activo: null, documentos: [] as DocumentoActivo[] };
  }

  const id = Number(origenId);
  if (!Number.isInteger(id) || id <= 0) {
    return { activo: null, documentos: [] as DocumentoActivo[] };
  }

  const activo = await obtenerActivoPorId(id).catch(() => null);
  const documentos = activo
    ? await obtenerDocumentosPorActivoId(id).catch(() => [])
    : [];

  return { activo, documentos };
}

function crearActivoBaseAcople(activo: Activo): Activo {
  return {
    ...activo,
    codigo: activo.codigo,
    estadoActivo: "ACTIVO",
    estadoRegistro: true,
    activoOrigenId: activo.id,
    vehiculo: activo.vehiculo ? { ...activo.vehiculo } : null,
  };
}

function ActivoOrigenCard({
  activo,
  documentos,
}: {
  activo: Activo;
  documentos: DocumentoActivo[];
}) {
  const vehiculo = activo.vehiculo;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary">
              <GitCompareArrows className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle>Datos del activo anterior</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Estos datos quedan como referencia historica del replaqueo.
              </p>
            </div>
          </div>
          <Badge variant="outline">Unidad de baja</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DatoOrigen etiqueta="ID inventario" valor={activo.id} />
          <DatoOrigen etiqueta="Codigo anterior" valor={activo.codigo} />
          <DatoOrigen etiqueta="Unidad anterior" valor={activo.descripcion} />
          <DatoOrigen etiqueta="Ubicacion anterior" valor={activo.ubicacion} />
          <DatoOrigen etiqueta="Placa anterior" valor={vehiculo?.placa} />
          <DatoOrigen
            etiqueta="Carroceria anterior"
            valor={vehiculo?.carroceria}
          />
          <DatoOrigen etiqueta="Marca anterior" valor={vehiculo?.marca} />
          <DatoOrigen etiqueta="Modelo anterior" valor={vehiculo?.modelo} />
        </div>

        <div className="rounded-xl border border-border bg-card/70">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold">Documentos del activo anterior</p>
                <p className="text-xs text-muted-foreground">
                  Referencia para revisar que sustento se renueva o se conserva.
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {documentos.length} documento{documentos.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {documentos.length ? (
            <div className="divide-y divide-border">
              {documentos.map((documento) => (
                <div
                  key={documento.id}
                  className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1.2fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="font-semibold">
                      {formatearEtiqueta(documento.tipoDocumento)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Numero: {formatearValor(documento.numero)}
                    </p>
                  </div>
                  <DatoDocumento
                    etiqueta="Emision"
                    valor={formatearFecha(documento.fechaEmision)}
                  />
                  <DatoDocumento
                    etiqueta="Vencimiento"
                    valor={formatearFecha(documento.fechaVencimiento)}
                  />
                  {documento.archivoUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={documento.archivoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver archivo
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Sin archivo
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              El activo anterior no tiene documentos registrados.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DatoOrigen({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor?: string | number | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {etiqueta}
      </p>
      <p className="mt-1 font-semibold">{formatearValor(valor)}</p>
    </div>
  );
}

function formatearValor(valor?: string | number | null) {
  if (valor === null || valor === undefined || valor === "") {
    return "-";
  }

  return String(valor);
}

function DatoDocumento({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{etiqueta}</p>
      <p className="font-medium">{valor}</p>
    </div>
  );
}

function formatearEtiqueta(valor: string) {
  return valor
    .toLowerCase()
    .split("_")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function formatearFecha(valor?: string | null) {
  if (!valor) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(valor));
}
