import { Car, Cog, Leaf, ShieldCheck, Tag, Truck, type LucideIcon } from "lucide-react";

import type { TipoCatalogoMaestro } from "../tipos/maestros.tipos";

export interface ConfiguracionCatalogoMaestro {
  tipoCatalogo: TipoCatalogoMaestro;
  titulo: string;
  grupo: "Base" | "Vehiculo" | "Dimensiones" | "Control operativo";
  icono: LucideIcon;
  permiteCrear: boolean;
  notaSoloLectura?: string;
}

export const CATALOGOS_MAESTROS: ConfiguracionCatalogoMaestro[] = [
  {
    tipoCatalogo: "TIPO_ACTIVO",
    titulo: "Tipo de Activo",
    grupo: "Base",
    icono: Tag,
    permiteCrear: true,
  },
  {
    tipoCatalogo: "CLASE_VEHICULO",
    titulo: "Clase",
    grupo: "Vehiculo",
    icono: Car,
    permiteCrear: true,
  },
  {
    tipoCatalogo: "CARROCERIA",
    titulo: "Carroceria",
    grupo: "Vehiculo",
    icono: Truck,
    permiteCrear: true,
    notaSoloLectura: "cada carroceria requiere una clase de vehiculo asignada",
  },
  {
    tipoCatalogo: "CLASE_EURO",
    titulo: "Clase Euro / NEC",
    grupo: "Dimensiones",
    icono: Leaf,
    permiteCrear: true,
  },
  {
    tipoCatalogo: "TIPO_TRANSMISION",
    titulo: "Tipo de Transmision",
    grupo: "Dimensiones",
    icono: Cog,
    permiteCrear: true,
  },
  {
    tipoCatalogo: "ESTADO_CALIBRACION",
    titulo: "Estado de Calibracion",
    grupo: "Control operativo",
    icono: ShieldCheck,
    permiteCrear: true,
  },
];
