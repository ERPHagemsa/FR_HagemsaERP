"use client";

import Link from "next/link";
import * as React from "react";
import { Search } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import { resolverIdentidad } from "../servicios/solicitudes-cliente-api";
import type { RespuestaResolverIdentidad, TipoOrigen } from "../tipos/solicitud-cliente.tipos";
import { schemaResolverIdentidad } from "../tipos/solicitud-cliente.schemas";

type Props = {
  onIdentidadResuelta: (datos: { origenTipo: TipoOrigen; origenId: string }) => void;
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

  function onUsarOrigen(origenId: string) {
    onIdentidadResuelta({ origenTipo: "PROSPECTO", origenId });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold">Buscar por documento</p>
      <p className="text-xs text-muted-foreground">
        Opcional: busca el prospecto por documento para pre-rellenar los datos de origen.
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
            onClick={() => onUsarOrigen(resultado.prospecto!.prospectoId)}
          >
            Usar este origen
          </Button>
        </div>
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

      {/* Resultado: CLIENTE / CLIENTE_INACTIVO (V1 — deshabilitado) */}
      {resultado?.veredicto === "CLIENTE" || resultado?.veredicto === "CLIENTE_INACTIVO" ? (
        <Alert>
          <AlertDescription>
            Resolucion de clientes no disponible en esta version. Ingresa el origen manualmente.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
