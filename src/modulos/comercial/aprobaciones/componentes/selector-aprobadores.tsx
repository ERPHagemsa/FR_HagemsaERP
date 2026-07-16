"use client";

import { Checkbox } from "@/compartido/componentes/ui/checkbox";

import type { AprobadorCuenta } from "../tipos/aprobadores-cuentas.tipos";

/**
 * Selector de los aprobadores a los que se les manda la cotización. La lista sale
 * del servicio de autenticación (cuentas marcadas como aprobadoras) y NO admite
 * carga manual: quién puede aprobar una cotización lo define auth, no quien la
 * envía. Al abrir el diálogo vienen todos marcados, que es el caso normal.
 *
 * Al no haber escritura a mano, la lista es una dependencia dura: sin ella no se
 * puede solicitar aprobación. Por eso los estados de carga y de error se muestran
 * explícitos en vez de dejar el campo vacío — un formulario que no deja avanzar
 * sin decir por qué es peor que uno que falla claro. El endpoint exige el permiso
 * `auth:account:read-emails`; sin él responde 403 y cae en el estado de error.
 */
type Props = {
  cuentas: AprobadorCuenta[] | null;
  cargando: boolean;
  error: boolean;
  seleccionados: string[];
  onChange: (correos: string[]) => void;
  disabled?: boolean;
};

export function SelectorAprobadores({
  cuentas,
  cargando,
  error,
  seleccionados,
  onChange,
  disabled,
}: Props) {
  if (cargando) {
    return (
      <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
        Cargando aprobadores…
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        No se pudo obtener la lista de aprobadores. Sin ella no se puede
        solicitar la aprobación: revisa que tu cuenta tenga permiso para
        consultarlos y vuelve a intentar.
      </p>
    );
  }

  if (!cuentas || cuentas.length === 0) {
    return (
      <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        No hay aprobadores configurados. Pide que marquen al menos una cuenta
        como aprobadora de cotizaciones antes de enviar.
      </p>
    );
  }

  function alternar(email: string, marcado: boolean) {
    if (marcado) {
      if (!seleccionados.includes(email)) onChange([...seleccionados, email]);
      return;
    }
    onChange(seleccionados.filter((c) => c !== email));
  }

  return (
    <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
      {cuentas.map((cuenta) => {
        const nombreCompleto = cuenta.nombreCompleto?.trim();
        const nombreUsuario = cuenta.nombreUsuario?.trim();
        // Igual que en el selector de correos: la etiqueta cae al usuario y luego
        // al correo, y el usuario solo acompaña cuando hay nombre completo (si no,
        // se leería "jperez @jperez").
        const etiqueta = nombreCompleto || nombreUsuario || cuenta.email;
        const marcado = seleccionados.includes(cuenta.email);
        return (
          <label
            key={cuenta.email}
            className="flex cursor-pointer items-center gap-2.5 rounded-md border px-2.5 py-1.5 transition hover:bg-accent has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
          >
            <Checkbox
              checked={marcado}
              onCheckedChange={(v) => alternar(cuenta.email, v === true)}
              disabled={disabled}
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-baseline gap-1.5">
                <span className="truncate text-sm text-foreground">
                  {etiqueta}
                </span>
                {nombreCompleto && nombreUsuario ? (
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    @{nombreUsuario}
                  </span>
                ) : null}
              </span>
              {cuenta.email !== etiqueta ? (
                <span className="truncate text-xs text-muted-foreground">
                  {cuenta.email}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
