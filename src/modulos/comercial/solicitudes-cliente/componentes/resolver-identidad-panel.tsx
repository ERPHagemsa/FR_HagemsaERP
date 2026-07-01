"use client";

import Link from "next/link";
import * as React from "react";
import { Search } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import { FieldLegend, FieldSet } from "@/compartido/componentes/ui/field";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import { resolverIdentidad } from "../../identidad/servicios/identidad-api";
import type { RespuestaResolverIdentidad } from "../../identidad/tipos/identidad.tipos";
import { schemaResolverIdentidad } from "../../identidad/tipos/identidad.schemas";
import type { TipoOrigen } from "../tipos/solicitud-cliente.tipos";

type DatosIdentidadResuelta = {
  origenTipo: TipoOrigen;
  origenId: string;
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
};

type Props = {
  onIdentidadResuelta: (datos: DatosIdentidadResuelta) => void;
};

export function ResolverIdentidadPanel({ onIdentidadResuelta }: Props) {
  const [tipoDocumento, setTipoDocumento] = React.useState<string>("");
  const [numeroDocumento, setNumeroDocumento] = React.useState("");
  const [buscando, setBuscando] = React.useState(false);
  const [resultado, setResultado] = React.useState<RespuestaResolverIdentidad | null>(null);
  const [errorBusqueda, setErrorBusqueda] = React.useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = React.useState<Record<string, string>>({});

  async function onBuscar() {
    setErroresCampo({});
    setErrorBusqueda(null);
    setResultado(null);

    const parsed = schemaResolverIdentidad.safeParse({ tipoDocumento, numeroDocumento });
    if (!parsed.success) {
      const errores: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0]?.toString() ?? "_global";
        if (!errores[campo]) errores[campo] = issue.message;
      }
      setErroresCampo(errores);
      return;
    }

    setBuscando(true);
    try {
      const respuesta = await resolverIdentidad(
        parsed.data.tipoDocumento,
        parsed.data.numeroDocumento
      );
      setResultado(respuesta);
    } catch (err) {
      setErrorBusqueda(
        extraerMensajeError(
          err,
          "No se pudo verificar la identidad. Ingresa el origen manualmente."
        )
      );
    } finally {
      setBuscando(false);
    }
  }

  function onUsarOrigenProspecto(origenId: string, nombre: string | null) {
    onIdentidadResuelta({
      origenTipo: "PROSPECTO",
      origenId,
      nombre: nombre ?? undefined,
      tipoDocumento,
      numeroDocumento,
    });
  }

  function onUsarOrigenCliente(clienteId: string, nombre: string | null) {
    onIdentidadResuelta({
      origenTipo: "CLIENTE",
      origenId: clienteId,
      nombre: nombre ?? undefined,
      tipoDocumento,
      numeroDocumento,
    });
  }

  return (
    <FieldSet className="gap-3 rounded-lg border border-border px-4 pb-4 pt-1">
      {/* Mismo prefijo de variante para pisar el text-sm del primitivo: un text-xs
          plano no lo deduplica twMerge. */}
      <FieldLegend
        variant="label"
        className="px-1.5 font-semibold uppercase tracking-wide text-muted-foreground data-[variant=label]:text-xs"
      >
        Buscar por documento
      </FieldLegend>
      <p className="text-xs text-muted-foreground">
        Busca el prospecto o cliente por su documento (DNI / RUC / CE) para seleccionar el origen de la solicitud.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-32 gap-1.5">
          <Label htmlFor="ri-tipo-doc" className="text-xs">
            Tipo de documento
          </Label>
          <Select value={tipoDocumento} onValueChange={setTipoDocumento} disabled={buscando}>
            <SelectTrigger id="ri-tipo-doc" className="w-full" aria-invalid={Boolean(erroresCampo["tipoDocumento"])}>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RUC">RUC</SelectItem>
              <SelectItem value="DNI">DNI</SelectItem>
              <SelectItem value="CE">CE</SelectItem>
            </SelectContent>
          </Select>
          {erroresCampo["tipoDocumento"] ? (
            <p className="text-xs text-destructive">{erroresCampo["tipoDocumento"]}</p>
          ) : null}
        </div>

        <div className="grid min-w-40 flex-1 gap-1.5">
          <Label htmlFor="ri-num-doc" className="text-xs">
            Numero de documento
          </Label>
          <Input
            id="ri-num-doc"
            placeholder="Ej. 20123456789"
            value={numeroDocumento}
            onChange={(e) => setNumeroDocumento(e.target.value)}
            disabled={buscando}
            onKeyDown={(e) => e.key === "Enter" && void onBuscar()}
            aria-invalid={Boolean(erroresCampo["numeroDocumento"])}
          />
          {erroresCampo["numeroDocumento"] ? (
            <p className="text-xs text-destructive">{erroresCampo["numeroDocumento"]}</p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void onBuscar()}
          disabled={buscando}
        >
          <Search data-icon="inline-start" />
          {buscando ? "Buscando..." : "Buscar"}
        </Button>
      </div>

      {/* Error de red o 503 */}
      {errorBusqueda ? (
        <Alert variant="destructive">
          <AlertDescription>{errorBusqueda}</AlertDescription>
        </Alert>
      ) : null}

      {/* Resultado: PROSPECTO_EXISTENTE */}
      {resultado?.veredicto === "PROSPECTO_EXISTENTE" && resultado.prospecto ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-3">
          <p className="text-sm font-medium text-foreground">
            Prospecto encontrado
          </p>
          <p className="text-sm text-muted-foreground">
            {resultado.prospecto.razonSocial ?? "Sin razon social registrada"}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onUsarOrigenProspecto(
                resultado.prospecto!.prospectoId,
                resultado.prospecto!.razonSocial
              )
            }
          >
            Usar este origen
          </Button>
        </div>
      ) : null}

      {/* Resultado: CLIENTE (activo) */}
      {resultado?.veredicto === "CLIENTE" && resultado.cliente ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-background p-3">
          <p className="text-sm font-medium text-foreground">
            Cliente encontrado
          </p>
          <p className="text-sm text-muted-foreground">
            {resultado.cliente.razonSocial ?? resultado.cliente.nombreComercial ?? "Sin nombre registrado"}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onUsarOrigenCliente(
                resultado.cliente!.clienteId,
                resultado.cliente!.razonSocial ?? resultado.cliente!.nombreComercial
              )
            }
          >
            Usar este origen
          </Button>
        </div>
      ) : null}

      {/* Resultado: CLIENTE_INACTIVO — deshabilitado, no se puede usar */}
      {resultado?.veredicto === "CLIENTE_INACTIVO" ? (
        <Alert variant="destructive">
          <AlertDescription>
            El cliente encontrado esta inactivo y no puede usarse como origen de una solicitud.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Resultado: NUEVO */}
      {resultado?.veredicto === "NUEVO" ? (
        <Alert>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              No se encontro ningun prospecto con ese documento. Debes registrarlo primero.
            </span>
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/comercial/prospectos/nuevo">
                Registrar nuevo prospecto
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </FieldSet>
  );
}
