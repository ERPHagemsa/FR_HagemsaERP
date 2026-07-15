"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

/**
 * Aviso para acciones que tardan de verdad: solicitar aprobación y aprobar
 * generan el PDF de la cotización y encolan el correo dentro de la misma
 * operación, así que la respuesta puede demorar decenas de segundos — más aún si
 * el motor de PDF estaba apagado y tiene que arrancar.
 *
 * Sin un aviso explícito el usuario cree que se colgó y vuelve a intentar, que es
 * justo lo que no conviene (termina con dos solicitudes).
 */
const SEGUNDOS_PACIENCIA = 12;

export function AvisoEnvioCorreo({ visible }: { visible: boolean }) {
  // El contenido vive aparte para que montarlo/desmontarlo resetee su contador:
  // así cada intento vuelve a empezar desde el mensaje inicial, sin tener que
  // limpiar el estado a mano en un efecto.
  if (!visible) return null;
  return <AvisoEnCurso />;
}

function AvisoEnCurso() {
  const [demorando, setDemorando] = React.useState(false);

  // A los SEGUNDOS_PACIENCIA el texto se refuerza: llegar a ese punto ya no es lo
  // normal y conviene decirlo antes de que la persona saque conclusiones.
  React.useEffect(() => {
    const id = setTimeout(() => setDemorando(true), SEGUNDOS_PACIENCIA * 1000);
    return () => clearTimeout(id);
  }, []);

  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-start gap-2 rounded-md bg-muted px-3 py-2.5 text-xs text-muted-foreground"
    >
      <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin" />
      <span>
        {demorando
          ? "Sigue en curso: el generador de PDF estaba inactivo y tarda más la primera vez. No cierres esta ventana ni vuelvas a enviar."
          : "Generando el PDF y enviando el correo. Puede tardar hasta un minuto; no cierres esta ventana."}
      </span>
    </p>
  );
}
