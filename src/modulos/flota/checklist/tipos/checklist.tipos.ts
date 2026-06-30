export type TipoChecklist = {
  id: string;
  nombre: string;
  operadoresRequeridos: number;
  estadoRegistro: string;
};

export type TipoKit = {
  id: string;
  nombre: string;
  estadoRegistro: string;
};

export type ColorRotulacion = {
  id: string;
  nombre: string;
  hex: string;
  estadoRegistro: string;
};
