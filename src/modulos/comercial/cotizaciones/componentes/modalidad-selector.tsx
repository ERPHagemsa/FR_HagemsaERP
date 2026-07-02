"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import type { Modalidad, TipoLinea } from "../tipos/cotizaciones.tipos";
import { useListarModalidades } from "../servicios/cotizaciones-queries";

type Props = {
  name: string;
  value: string;
  tipoLinea?: TipoLinea;
  disabled?: boolean;
  // Segundo argumento: la modalidad elegida (para precargar margen/tarifa). undefined si
  // no se encuentra en la pagina cargada. Los callers que solo quieren el id lo ignoran.
  onValueChange: (id: string, modalidad?: Modalidad) => void;
};

export function ModalidadSelector({
  name,
  value,
  tipoLinea,
  disabled,
  onValueChange,
}: Props) {
  const { data, isLoading } = useListarModalidades({
    estado: "ACTIVA",
    tipoLinea,
    porPagina: 100,
  });

  const modalidades = data?.data ?? [];

  return (
    <Select
      name={name}
      value={value}
      onValueChange={(id) => onValueChange(id, modalidades.find((m) => m.id === id))}
      disabled={disabled ?? isLoading}
    >
      <SelectTrigger className="w-full" aria-label="Modalidad">
        <SelectValue placeholder={isLoading ? "Cargando..." : "Selecciona modalidad"} />
      </SelectTrigger>
      <SelectContent>
        {modalidades.length === 0 && !isLoading ? (
          <SelectItem value="__vacio__" disabled>
            Sin modalidades activas
          </SelectItem>
        ) : null}
        {modalidades.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
