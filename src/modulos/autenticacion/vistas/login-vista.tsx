"use client";

import { FormEvent, KeyboardEvent, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, TriangleAlert } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api";
import { clienteHttp } from "@/compartido/api/cliente-http";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field";
import { Input } from "@/compartido/componentes/ui/input";

export function LoginVista() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const motivo = searchParams.get("motivo");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCargando(true);
    setError(null);

    try {
      await clienteHttp.post("/api/auth/login", { nombreUsuario, password });
      router.replace(searchParams.get("next") || "/");
      router.refresh();
    } catch (err) {
      setError(extraerMensajeError(err, "No se pudo iniciar sesión."));
    } finally {
      setCargando(false);
    }
  }

  // Bloq Mayus es la causa mas comun de "mi clave no funciona" en un sistema que
  // usa toda la empresa. Solo se puede detectar desde el evento de teclado.
  function revisarMayusculas(event: KeyboardEvent<HTMLInputElement>) {
    setMayusculas(event.getModifierState?.("CapsLock") ?? false);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Zona de marca: ocupa la parte alta para que quede claro a que sistema
          se esta entrando antes de pedir credenciales. */}
      <header className="relative flex h-[44vh] min-h-[17rem] items-center justify-center overflow-hidden px-5">
        <div className="relative flex flex-col items-center gap-5 pb-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <Image
            src="/logo/logo.svg"
            alt="Transportes Hagemsa"
            width={420}
            height={283}
            priority
            className="h-20 w-auto object-contain sm:h-28"
          />
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-muted-foreground">
            ERP
            <span className="mx-2.5 text-primary">·</span>
            Sistema interno
          </p>
        </div>
      </header>

      {/* La tarjeta sube sobre la zona de marca para que ambas lean como una
          sola pieza y el formulario quede cerca del centro optico. */}
      <div className="flex flex-1 flex-col items-center px-5 pb-12">
        <div className="-mt-12 w-full max-w-md">
          <div className="relative overflow-hidden rounded-lg border border-border bg-card p-7 shadow-xl sm:p-9">
            {/* Señal roja: el unico golpe de color fuera del boton. */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] origin-left animate-in slide-in-from-left duration-700 bg-primary motion-reduce:animate-none"
            />

            <h1 className="text-2xl font-semibold tracking-tight">
              Ingresa a tu cuenta
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Usa el nombre de usuario que te asignó el administrador.
            </p>

            {motivo === "sesion_expirada" ? (
              <p className="mt-6 border-l-2 border-primary bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                Tu sesión expiró por seguridad. Vuelve a ingresar para
                continuar.
              </p>
            ) : null}

            <form
              onSubmit={(event) => void iniciarSesion(event)}
              className="mt-7"
            >
              <FieldGroup>
                <Field>
                  {/* Solo nombre de usuario: el correo dejo de ser unico y no
                      identifica una cuenta. */}
                  <FieldLabel
                    htmlFor="nombreUsuario"
                    className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    Usuario
                  </FieldLabel>
                  <Input
                    id="nombreUsuario"
                    autoComplete="username"
                    type="text"
                    maxLength={30}
                    autoFocus
                    value={nombreUsuario}
                    onChange={(event) => setNombreUsuario(event.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="password"
                    className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    Contraseña
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      autoComplete="current-password"
                      type={verPassword ? "text" : "password"}
                      className="pr-11"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyUp={revisarMayusculas}
                      onBlur={() => setMayusculas(false)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword((v) => !v)}
                      aria-label={
                        verPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      aria-pressed={verPassword}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {verPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {mayusculas ? (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TriangleAlert className="size-3.5 text-amber-600" />
                      Bloq Mayús está activado.
                    </p>
                  ) : null}
                </Field>

                <Button type="submit" disabled={cargando} className="w-full">
                  {cargando ? "Ingresando..." : "Ingresar"}
                </Button>

                {/* aria-live: quien usa lector de pantalla se entera del fallo
                    sin volver a recorrer el formulario. */}
                <div aria-live="polite">
                  {error ? (
                    <Field data-invalid>
                      <FieldError>{error}</FieldError>
                    </Field>
                  ) : null}
                </div>
              </FieldGroup>
            </form>
          </div>

          <div className="mt-8 space-y-2 text-center">
            <p className="text-xs text-muted-foreground/70">
              Uso exclusivo del personal autorizado.
            </p>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              TRANSPORTES HAGEMSA S.A.C 2026
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
