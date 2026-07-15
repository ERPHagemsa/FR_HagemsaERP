"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";

/**
 * Entrada de múltiples correos como "chips". El usuario escribe un correo y lo
 * confirma con Enter, coma o punto y coma (o al perder el foco / pegar una lista
 * separada por comas o espacios). Cada correo válido se agrega como chip
 * removible; los inválidos o duplicados no se agregan y muestran un aviso. La
 * validación de forma es local (feedback inmediato); la fuente de verdad al
 * enviar es el schema zod del formulario que lo usa.
 *
 * Con `sugerencias`, además ofrece los correos conocidos para agregarlos con un
 * clic y muestra el nombre de la persona en lugar de la dirección: una lista de
 * direcciones sueltas no dice a quién se le está escribiendo. El valor que sale
 * por `onChange` sigue siendo siempre la lista de correos.
 */
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Correo conocido: la etiqueta es lo que se muestra en vez de la dirección. */
export type SugerenciaCorreo = {
  email: string;
  etiqueta: string;
  /** Dato secundario para desambiguar homónimos (ej. el usuario). */
  detalle?: string;
};

type Props = {
  id?: string;
  value: string[];
  onChange: (correos: string[]) => void;
  disabled?: boolean;
  /** Tope de correos (por defecto 20, alineado al backend). */
  max?: number;
  placeholder?: string;
  "aria-invalid"?: boolean;
  /** Correos conocidos que se ofrecen para agregar con un clic. */
  sugerencias?: SugerenciaCorreo[];
  /** Rótulo de la lista de sugerencias. */
  etiquetaSugerencias?: string;
};

export function EntradaCorreos({
  id,
  value,
  onChange,
  disabled,
  max = 20,
  placeholder = "correo@empresa.com",
  "aria-invalid": ariaInvalid,
  sugerencias = [],
  etiquetaSugerencias = "Sugeridos",
}: Props) {
  const [texto, setTexto] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const lleno = value.length >= max;

  // Los correos se guardan en minúsculas (ver agregar()); las sugerencias se
  // indexan igual para que el chip reconozca al conocido venga de donde venga
  // (clic en la sugerencia o tecleado a mano con otra capitalización).
  const porEmail = React.useMemo(() => {
    const mapa = new Map<string, SugerenciaCorreo>();
    for (const s of sugerencias) mapa.set(s.email.trim().toLowerCase(), s);
    return mapa;
  }, [sugerencias]);

  const pendientes = React.useMemo(
    () =>
      sugerencias.filter((s) => !value.includes(s.email.trim().toLowerCase())),
    [sugerencias, value],
  );

  function agregar(tokens: string[]) {
    const acumulado = [...value];
    let aviso: string | null = null;
    for (const bruto of tokens) {
      const email = bruto.trim().toLowerCase();
      if (!email) continue;
      if (!RE_EMAIL.test(email)) {
        aviso = `"${bruto.trim()}" no es un correo válido.`;
        continue;
      }
      if (acumulado.includes(email)) continue;
      if (acumulado.length >= max) {
        aviso = `Máximo ${max} correos.`;
        break;
      }
      acumulado.push(email);
    }
    if (acumulado.length !== value.length) onChange(acumulado);
    setError(aviso);
  }

  function confirmar() {
    if (texto.trim()) {
      agregar(texto.split(/[,;\s]+/));
      setTexto("");
    }
  }

  function onKeyDown(evento: React.KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Enter" || evento.key === "," || evento.key === ";") {
      evento.preventDefault();
      confirmar();
    } else if (evento.key === "Backspace" && texto === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function onPaste(evento: React.ClipboardEvent<HTMLInputElement>) {
    const pegado = evento.clipboardData.getData("text");
    if (/[,;\s]/.test(pegado)) {
      evento.preventDefault();
      agregar(pegado.split(/[,;\s]+/));
      setTexto("");
    }
  }

  function quitar(email: string) {
    onChange(value.filter((c) => c !== email));
    if (error) setError(null);
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 aria-invalid:border-destructive"
        aria-invalid={ariaInvalid}
      >
        {value.map((email) => {
          const conocido = porEmail.get(email);
          return (
            <Badge key={email} variant="secondary" className="gap-1 font-normal">
              {/* Del conocido se muestra el nombre; el correo queda en el title
                  para poder verificarlo sin sacar el chip. */}
              <span title={conocido ? email : undefined}>
                {conocido ? conocido.etiqueta : email}
              </span>
              <button
                type="button"
                onClick={() => quitar(email)}
                disabled={disabled}
                aria-label={`Quitar ${conocido ? `${conocido.etiqueta} (${email})` : email}`}
                className="rounded-full outline-none hover:text-destructive focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none"
              >
                <X className="size-3" />
              </button>
            </Badge>
          );
        })}
        <input
          id={id}
          type="email"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
          onBlur={confirmar}
          onPaste={onPaste}
          disabled={disabled || lleno}
          placeholder={lleno ? `Máximo ${max} correos` : placeholder}
          className="flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed min-w-[12ch]"
        />
      </div>
      {pendientes.length > 0 && !lleno ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs text-muted-foreground">
            {etiquetaSugerencias}:
          </span>
          {pendientes.map((s) => (
            <button
              key={s.email}
              type="button"
              onClick={() => agregar([s.email])}
              disabled={disabled}
              title={s.email}
              className="rounded-full border border-dashed border-input px-2 py-0.5 text-xs text-muted-foreground outline-none transition hover:border-solid hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              + {s.etiqueta}
              {s.detalle ? (
                <span className="ml-1 opacity-60">{s.detalle}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Enter o coma para agregar cada correo.
        </p>
        <span className="text-xs text-muted-foreground">
          {value.length}/{max}
        </span>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
