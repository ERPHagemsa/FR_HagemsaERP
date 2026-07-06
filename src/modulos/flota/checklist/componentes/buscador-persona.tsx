"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/compartido/componentes/ui/input";
import { Button } from "@/compartido/componentes/ui/button";
import type { Persona } from "../tipos/personal.tipos";

const MAX_RESULTADOS = 50;

/**
 * Combobox de personal (BC01_SocioDeNegocio): recibe la lista COMPLETA ya
 * cargada (mismo patrón que los combobox de contrato/cuenta) y filtra en
 * cliente por nombre/apellido/documento. No hace fetch por tecla.
 */
export function BuscadorPersona({
  items,
  cargando,
  seleccionada,
  onSeleccionar,
  placeholder,
}: {
  items: Persona[];
  cargando?: boolean;
  seleccionada: Persona | null;
  onSeleccionar: (persona: Persona | null) => void;
  placeholder: string;
}) {
  const [termino, setTermino] = useState("");
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resultados = useMemo(() => {
    const q = termino.trim().toLowerCase();
    const filtrados = items.filter((p) => {
      if (!q) return true;
      const texto = `${p.nombres} ${p.apellidos} ${p.numeroDocumento}`.toLowerCase();
      return texto.includes(q);
    });
    return filtrados.slice(0, MAX_RESULTADOS);
  }, [items, termino]);

  if (seleccionada) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
        <span className="text-sm">
          <span className="font-medium">
            {seleccionada.nombres} {seleccionada.apellidos}
          </span>
          {" — "}
          {seleccionada.numeroDocumento}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onSeleccionar(null);
            setTermino("");
          }}
        >
          Cambiar
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={placeholder}
          value={termino}
          onFocus={() => setAbierto(true)}
          onChange={(e) => {
            setTermino(e.target.value);
            setAbierto(true);
          }}
        />
        {cargando ? (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      {abierto ? (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
          {cargando ? (
            <p className="p-3 text-sm text-muted-foreground">Cargando personal...</p>
          ) : resultados.length === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">
              {termino.trim() ? `Sin resultados para "${termino}".` : "Sin personal disponible."}
            </p>
          ) : (
            resultados.map((p) => (
              <button
                key={p.idExterno}
                type="button"
                className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
                onClick={() => {
                  onSeleccionar(p);
                  setTermino("");
                  setAbierto(false);
                }}
              >
                <span className="font-medium">
                  {p.nombres} {p.apellidos}
                </span>
                <span className="text-xs text-muted-foreground">{p.numeroDocumento}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
