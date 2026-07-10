"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { SiteHeader } from "@/compartido/componentes/site-header";

import { extraerMensajeError } from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import {
  SocioPicker,
  type SocioSeleccionado,
} from "../componentes/socio-picker";
import { useCrearCuenta } from "../ganchos/use-mutaciones-cuenta";
import type { TipoCuenta } from "../tipos/administracion.tipos";

// Normaliza un codigo de socio/cuenta: mayusculas, solo alfanumericos, max 20.
// Refleja la regla del dominio (^[A-Z0-9]{1,20}$) directamente en el input.
function normalizarCodigo(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 20);
}

export function CrearCuentaVista() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>("interno");
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  // Vinculo opcional con un socio de negocio (BC01). Independiente de los codigos.
  const [socio, setSocio] = useState<SocioSeleccionado | null>(null);
  const [codigoSocio, setCodigoSocio] = useState("");
  // "Código de cuenta" se captura en dos inputs: prefijo (por defecto "TH",
  // Transportes Hagemsa) + sufijo (en blanco). Al backend viaja como un solo
  // código: la concatenación normalizada de ambos.
  const [codigoCuentaPrefijo, setCodigoCuentaPrefijo] = useState("TH");
  const [codigoCuentaSufijo, setCodigoCuentaSufijo] = useState("");
  const codigoCuenta = normalizarCodigo(
    `${codigoCuentaPrefijo}${codigoCuentaSufijo}`,
  );
  const [error, setError] = useState<string | null>(null);

  const crearMutation = useCrearCuenta();

  // Al elegir un socio, su DNI ya viene de BC01: lo tomamos y bloqueamos el
  // campo manual. Al quitar el socio, se libera para carga manual.
  function manejarCambioSocio(nuevo: SocioSeleccionado | null) {
    setSocio(nuevo);
    setDocumentoIdentidad(nuevo?.documento ?? "");
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Codigos internos: opcionales e independientes del socio. Son "todo o nada":
    // ambos o ninguno, y distintos entre si.
    const tocoCodigos = codigoSocio !== "" || codigoCuenta !== "";
    if (tocoCodigos) {
      if (codigoSocio.length === 0 || codigoCuenta.length === 0) {
        const mensaje =
          "Completa ambos códigos internos o deja los dos vacíos.";
        setError(mensaje);
        toast.error(mensaje);
        return;
      }
      if (codigoSocio === codigoCuenta) {
        const mensaje =
          "El código de socio y el de cuenta deben ser distintos.";
        setError(mensaje);
        toast.error(mensaje);
        return;
      }
    }

    try {
      const respuesta = await crearMutation.mutateAsync({
        email: email.trim(),
        nombreUsuario: nombreUsuario.trim(),
        nombreCompleto: nombreCompleto.trim(),
        tipoCuenta,
        documentoIdentidad: documentoIdentidad.trim() || undefined,
        // Codigos y socio viajan por separado: pueden ir juntos, solo uno, o ninguno.
        ...(tocoCodigos ? { codigoSocio, codigoCuenta } : {}),
        ...(socio
          ? {
              socioExternoId: socio.socioExternoId,
              tipoSocio: "empleado" as const,
              socioSnapshot: socio.datos as unknown as Record<string, unknown>,
            }
          : {}),
      });
      toast.success("Cuenta creada correctamente");
      router.push(`/admin/cuentas/${respuesta.id}`);
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo crear la cuenta.");
      setError(mensaje);
      toast.error(mensaje);
    }
  }

  return (
    <>
      <SiteHeader
        title="Nuevo"
        breadcrumbs={[
          { title: "IAM y administración" },
          { title: "Cuentas", href: "/admin/cuentas" },
          { title: "Nuevo" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-md -ml-2 w-fit text-muted-foreground"
        >
          <Link href="/admin/cuentas">
            <ArrowLeft />
            Volver a cuentas
          </Link>
        </Button>

        <div className="max-w-2xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Nuevo</h1>
            <p className="text-sm text-muted-foreground">
              Crea una nueva cuenta. Después podrás asignarle roles desde el
              detalle.
            </p>
          </div>

          <form onSubmit={(event) => void manejarSubmit(event)}>
            <div className="border p-6">
              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="email">Correo</FieldLabel>
                  <Input
                    id="email"
                    className="rounded-md"
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="nombreUsuario">
                    Nombre de usuario
                  </FieldLabel>
                  <Input
                    id="nombreUsuario"
                    className="rounded-md"
                    type="text"
                    autoComplete="off"
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[A-Za-z][A-Za-z0-9._\-]{2,29}"
                    title="3 a 30 caracteres, empieza con letra y solo letras, digitos, punto, guion o guion bajo"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="nombreCompleto">
                    Nombre completo
                  </FieldLabel>
                  <Input
                    id="nombreCompleto"
                    className="rounded-md"
                    type="text"
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    required
                    maxLength={255}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tipoCuenta">Tipo de cuenta</FieldLabel>
                  <Select
                    value={tipoCuenta}
                    onValueChange={(v) => setTipoCuenta(v as TipoCuenta)}
                  >
                    <SelectTrigger
                      id="tipoCuenta"
                      className="rounded-md w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      <SelectItem value="interno" className="rounded-md">
                        Interno
                      </SelectItem>
                      <SelectItem value="cliente" className="rounded-md">
                        Cliente
                      </SelectItem>
                      <SelectItem value="proveedor" className="rounded-md">
                        Proveedor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="sm:col-span-2">
                  <FieldLabel htmlFor="documentoIdentidad">
                    {socio
                      ? "Documento de identidad (del socio de negocio)"
                      : "Documento de identidad (opcional)"}
                  </FieldLabel>
                  <Input
                    id="documentoIdentidad"
                    className="rounded-md"
                    type="text"
                    value={documentoIdentidad}
                    onChange={(e) => setDocumentoIdentidad(e.target.value)}
                    maxLength={50}
                    disabled={socio !== null}
                    aria-readonly={socio !== null}
                  />
                  {socio ? (
                    <p className="text-xs text-muted-foreground">
                      Se toma automáticamente del socio seleccionado.
                    </p>
                  ) : null}
                </Field>

                <div className="space-y-4 border-t pt-4 sm:col-span-2">
                  <div className="space-y-1">
                    <h2 className="text-sm font-medium">
                      Códigos internos (opcional)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Códigos para la generación de códigos en PDFs (hasta 20
                      caracteres alfanuméricos, distintos entre sí). Son "todo o
                      nada": ambos o ninguno. Son independientes del socio.
                    </p>
                  </div>

                  <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="codigoCuentaSufijo">
                        Código de cuenta
                      </FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id="codigoCuentaPrefijo"
                          aria-label="Prefijo del código de cuenta"
                          title="Prefijo (por defecto TH, Transportes Hagemsa)"
                          className="rounded-md uppercase w-16 shrink-0 text-center"
                          type="text"
                          autoComplete="off"
                          value={codigoCuentaPrefijo}
                          onChange={(e) =>
                            setCodigoCuentaPrefijo(
                              normalizarCodigo(e.target.value),
                            )
                          }
                          maxLength={4}
                        />
                        <Input
                          id="codigoCuentaSufijo"
                          className="rounded-md uppercase"
                          type="text"
                          autoComplete="off"
                          inputMode="text"
                          value={codigoCuentaSufijo}
                          onChange={(e) =>
                            setCodigoCuentaSufijo(
                              normalizarCodigo(e.target.value),
                            )
                          }
                          maxLength={16}
                          placeholder="Ej. C1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se envía como un solo código: {codigoCuenta || "—"}.
                      </p>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="codigoSocio">
                        Código de socio
                      </FieldLabel>
                      <Input
                        id="codigoSocio"
                        className="rounded-md uppercase"
                        type="text"
                        autoComplete="off"
                        inputMode="text"
                        value={codigoSocio}
                        onChange={(e) =>
                          setCodigoSocio(normalizarCodigo(e.target.value))
                        }
                        maxLength={20}
                        placeholder="Ej. BA"
                      />
                    </Field>
                  </FieldGroup>
                </div>

                <div className="space-y-4 border-t pt-4 sm:col-span-2">
                  <div className="space-y-1">
                    <h2 className="text-sm font-medium">
                      Socio de negocio (opcional)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Vincula la cuenta a un socio de BC01. El documento de
                      identidad se toma del socio seleccionado.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel>Socio</FieldLabel>
                    <SocioPicker value={socio} onChange={manejarCambioSocio} />
                  </Field>
                </div>

                {error ? (
                  <Field data-invalid className="sm:col-span-2">
                    <FieldError>{error}</FieldError>
                  </Field>
                ) : null}
              </FieldGroup>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                asChild
                variant="ghost"
                type="button"
                className="rounded-md"
              >
                <Link href="/admin/cuentas">Cancelar</Link>
              </Button>
              <Button
                type="submit"
                className="rounded-md"
                disabled={crearMutation.isPending}
              >
                {crearMutation.isPending ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
