import type { TipoCatalogoMaestro } from "../../tipos/maestros.tipos";

export interface ConfiguracionCatalogoMaestro {
  tipoCatalogo: TipoCatalogoMaestro;
  titulo: string;
  grupo: "Base" | "Vehiculo" | "Dimensiones" | "Control operativo";
  permiteCrear: boolean;
  notaSoloLectura?: string;
}

export const CATALOGOS_MAESTROS: ConfiguracionCatalogoMaestro[] = [
  {
    tipoCatalogo: "TIPO_ACTIVO",
    titulo: "Tipo de Activo",
    grupo: "Base",
    permiteCrear: true,
  },
  {
    tipoCatalogo: "CLASE_VEHICULO",
    titulo: "Clase",
    grupo: "Vehiculo",
    permiteCrear: true,
  },
  {
    tipoCatalogo: "CARROCERIA",
    titulo: "Carroceria",
    grupo: "Vehiculo",
    permiteCrear: false,
    notaSoloLectura: "las carrocerias nuevas se registran junto con sus dimensiones sugeridas",
  },
  {
    tipoCatalogo: "CLASE_EURO",
    titulo: "Clase Euro / NEC",
    grupo: "Dimensiones",
    permiteCrear: true,
  },
  {
    tipoCatalogo: "TIPO_TRANSMISION",
    titulo: "Tipo de Transmision",
    grupo: "Dimensiones",
    permiteCrear: true,
  },
  {
    tipoCatalogo: "ESTADO_CALIBRACION",
    titulo: "Estado de Calibracion",
    grupo: "Control operativo",
    permiteCrear: true,
  },
];
