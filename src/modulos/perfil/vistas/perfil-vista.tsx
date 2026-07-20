'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { extraerMensajeError } from '@/compartido/api';
import { useMutar } from '@/compartido/api';
import { useSesion } from '@/modulos/autenticacion/ganchos/use-sesion';
import type { UsuarioSesion } from '@/compartido/autenticacion/sesion';
import { SiteHeader } from '@/compartido/componentes/site-header';
import { Avatar, AvatarFallback } from '@/compartido/componentes/ui/avatar';
import { Badge } from '@/compartido/componentes/ui/badge';
import { Button } from '@/compartido/componentes/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/compartido/componentes/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/compartido/componentes/ui/field';
import { Input } from '@/compartido/componentes/ui/input';
import { Skeleton } from '@/compartido/componentes/ui/skeleton';

import { cambiarCodigos, cambiarPassword } from '../servicios/perfil-api';

// Normaliza un código: mayúsculas, solo alfanuméricos, máx 20 (regla del dominio).
function normalizarCodigo(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20);
}

// Separa un código de cuenta almacenado en prefijo + sufijo para editarlo en dos
// inputs. El prefijo por defecto es "TH" (Transportes Hagemsa); si el código no
// empieza en "TH" se respeta tal cual en el sufijo (no se altera lo existente).
function separarCodigoCuenta(valor: string): {
  prefijo: string;
  sufijo: string;
} {
  const v = normalizarCodigo(valor);
  if (v === '') return { prefijo: 'TH', sufijo: '' };
  if (v.startsWith('TH')) return { prefijo: 'TH', sufijo: v.slice(2) };
  return { prefijo: '', sufijo: v };
}

function calcularIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'HG';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export function PerfilVista() {
  const { usuario, estaCargando, recargar } = useSesion();

  return (
    <>
      <SiteHeader title="Mi perfil" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 lg:p-6">
        <BannerIdentidad usuario={usuario} cargando={estaCargando} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SeccionCodigos
            key={`${usuario?.codigoSocio ?? ''}-${usuario?.codigoCuenta ?? ''}`}
            codigoSocioInicial={usuario?.codigoSocio ?? ''}
            codigoCuentaInicial={usuario?.codigoCuenta ?? ''}
            cargando={estaCargando}
            onCambio={recargar}
          />
          <SeccionPassword />
        </div>
      </div>
    </>
  );
}

function BannerIdentidad({
  usuario,
  cargando,
}: {
  usuario: UsuarioSesion | null | undefined;
  cargando: boolean;
}) {
  if (cargando || !usuario) {
    return (
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <Skeleton className="size-16 rounded-2xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const iniciales = calcularIniciales(usuario.nombre || usuario.email);

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-6 py-6 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Avatar className="size-16 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-red-100 text-lg font-semibold text-red-700">
              {iniciales}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold">{usuario.nombre}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {usuario.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="capitalize">
                {usuario.tipo}
              </Badge>
              {usuario.nombreUsuario ? (
                <span className="text-xs text-muted-foreground">
                  @{usuario.nombreUsuario}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:min-w-64 md:border-l md:pl-6">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Roles
            </span>
            <div className="flex flex-wrap gap-1">
              {usuario.roles.length > 0 ? (
                usuario.roles.map((rol) => (
                  <Badge key={rol} variant="secondary">
                    {rol}
                  </Badge>
                ))
              ) : (
                <span className="text-sm">—</span>
              )}
            </div>
          </div>
          {usuario.socioNombre ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-muted-foreground">
                Socio de negocio (BC01)
              </span>
              <span className="text-sm font-medium">{usuario.socioNombre}</span>
              {usuario.socioDocumento ? (
                <span className="text-xs text-muted-foreground">
                  Doc. {usuario.socioDocumento}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function SeccionCodigos({
  codigoSocioInicial,
  codigoCuentaInicial,
  cargando,
  onCambio,
}: {
  codigoSocioInicial: string;
  codigoCuentaInicial: string;
  cargando: boolean;
  onCambio: () => void;
}) {
  const [codigoSocio, setCodigoSocio] = useState(codigoSocioInicial);
  // "Código de cuenta" se edita en dos inputs (prefijo "TH" + sufijo) y se guarda
  // como un solo código: la concatenación normalizada de ambos.
  const [codigoCuentaPrefijo, setCodigoCuentaPrefijo] = useState(
    () => separarCodigoCuenta(codigoCuentaInicial).prefijo,
  );
  const [codigoCuentaSufijo, setCodigoCuentaSufijo] = useState(
    () => separarCodigoCuenta(codigoCuentaInicial).sufijo,
  );
  // Sin sufijo NO hay código de cuenta: el prefijo por sí solo es la marca de la
  // empresa, no un código. Si se concatenara igual, "TH" contaría como código
  // cargado y `ambosVacios` nunca sería true, así que no se podrían quitar.
  const codigoCuenta =
    codigoCuentaSufijo.trim() === ''
      ? ''
      : normalizarCodigo(`${codigoCuentaPrefijo}${codigoCuentaSufijo}`);

  // Vista previa del código de negocio de la cotización. Debe reflejar el formato
  // real del backend: `${codigoCuenta}-${codigoSocio}-${numero(4)}-${anio(4)}`
  // (ver codigo-cotizacion.mapper.ts). El correlativo reinicia cada año.
  const anioActual = new Date().getFullYear();
  const muestraCuenta = codigoCuenta || 'XX';
  const muestraSocio = codigoSocio || 'XX';

  // El reseteo tras cargar/guardar lo maneja el padre remontando este componente
  // vía `key` (ver PerfilVista). Así el estado local se re-inicializa solo, sin
  // copiar props al estado dentro de un efecto (evita renders en cascada).

  const mutacion = useMutar<
    { codigoSocio: string | null; codigoCuenta: string | null },
    unknown
  >({
    fn: ({ codigoSocio, codigoCuenta }) =>
      cambiarCodigos(codigoSocio, codigoCuenta),
    onSuccess: () => {
      toast.success('Códigos actualizados.');
      onCambio();
    },
    onError: (error) => toast.error(extraerMensajeError(error)),
  });

  const ambosVacios = codigoSocio === '' && codigoCuenta === '';
  const ambosCompletos = codigoSocio.length > 0 && codigoCuenta.length > 0;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ambosVacios && !ambosCompletos) {
      toast.error(
        'Completa ambos códigos o deja los dos vacíos para quitarlos.',
      );
      return;
    }
    if (ambosCompletos && codigoSocio === codigoCuenta) {
      toast.error('El código de socio y el de cuenta deben ser distintos.');
      return;
    }
    mutacion.mutate({
      codigoSocio: ambosVacios ? null : codigoSocio,
      codigoCuenta: ambosVacios ? null : codigoCuenta,
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Códigos internos</CardTitle>
        <CardDescription>
          Dos códigos alfanuméricos (hasta 20 caracteres).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form onSubmit={onSubmit} className="flex h-full flex-col">
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
                  className="rounded-md font-mono uppercase w-16 shrink-0 text-center"
                  autoComplete="off"
                  value={codigoCuentaPrefijo}
                  onChange={(e) =>
                    setCodigoCuentaPrefijo(normalizarCodigo(e.target.value))
                  }
                  maxLength={4}
                  disabled={cargando || mutacion.isPending}
                />
                <Input
                  id="codigoCuentaSufijo"
                  className="rounded-md font-mono uppercase"
                  autoComplete="off"
                  value={codigoCuentaSufijo}
                  onChange={(e) =>
                    setCodigoCuentaSufijo(normalizarCodigo(e.target.value))
                  }
                  maxLength={16}
                  disabled={cargando || mutacion.isPending}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="codigoSocio">Código de socio</FieldLabel>
              <Input
                id="codigoSocio"
                className="rounded-md font-mono uppercase"
                autoComplete="off"
                value={codigoSocio}
                onChange={(e) =>
                  setCodigoSocio(normalizarCodigo(e.target.value))
                }
                maxLength={20}
                disabled={cargando || mutacion.isPending}
              />
            </Field>
          </FieldGroup>

          <div className="mt-4 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">
              Así se numerarán tus cotizaciones
            </p>
            <p className="mt-2 font-mono text-lg tracking-tight">
              <span className="text-muted-foreground">{muestraCuenta}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-muted-foreground">{muestraSocio}</span>
              <span className="text-muted-foreground">-0001-{anioActual}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Código de cuenta · código de socio · correlativo (reinicia cada
              año) · año. Las revisiones de una misma cotización añaden una
              letra al correlativo (0001A, 0001B…).
            </p>
          </div>

          <div className="mt-auto pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={cargando || mutacion.isPending}
            >
              {mutacion.isPending ? 'Guardando…' : 'Guardar códigos'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SeccionPassword() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const mutacion = useMutar<{ actual: string; nueva: string }, unknown>({
    fn: ({ actual, nueva }) => cambiarPassword(actual, nueva),
    onSuccess: () => {
      toast.success('Contraseña actualizada.');
      setActual('');
      setNueva('');
      setConfirmar('');
    },
    onError: (error) => toast.error(extraerMensajeError(error)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (nueva.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      toast.error('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    mutacion.mutate({ actual, nueva });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>
          Ingresa tu contraseña actual y la nueva (mínimo 8 caracteres).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form onSubmit={onSubmit} className="flex h-full flex-col">
          <FieldGroup className="grid grid-cols-1 gap-4">
            <Field>
              <FieldLabel htmlFor="passwordActual">
                Contraseña actual
              </FieldLabel>
              <Input
                id="passwordActual"
                type="password"
                autoComplete="current-password"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                disabled={mutacion.isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="passwordNueva">Nueva contraseña</FieldLabel>
              <Input
                id="passwordNueva"
                type="password"
                autoComplete="new-password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                disabled={mutacion.isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="passwordConfirmar">
                Repetir nueva contraseña
              </FieldLabel>
              <Input
                id="passwordConfirmar"
                type="password"
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                disabled={mutacion.isPending}
              />
            </Field>
          </FieldGroup>
          <div className="mt-auto pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={mutacion.isPending || !actual || !nueva || !confirmar}
            >
              {mutacion.isPending ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
