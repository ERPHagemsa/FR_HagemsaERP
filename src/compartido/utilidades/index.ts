import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { formatearMoneda } from "./formato-moneda";
export { aISODate, desdeISODate } from "./formato-fecha";
