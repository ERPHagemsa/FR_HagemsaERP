"use client"

import { useConsulta } from "@/compartido/api/use-consulta"

import { consultarPersonalChecklist } from "./personal-checklist-api"
import type { ConsultarPersonalChecklistQuery } from "../tipos/personal-checklist"

export function usePersonalChecklistQuery(
  query?: ConsultarPersonalChecklistQuery,
  enabled = true,
) {
  return useConsulta(
    () => consultarPersonalChecklist(query),
    [JSON.stringify(query ?? {})],
    { enabled },
  )
}
