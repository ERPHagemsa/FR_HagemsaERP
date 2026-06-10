"use client"

import * as React from "react"

const variablesPublicas = {
  NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL,
  NEXT_PUBLIC_ACTIVOS_API_URL: process.env.NEXT_PUBLIC_ACTIVOS_API_URL,
  NEXT_PUBLIC_COMBUSTIBLE_API_URL: process.env.NEXT_PUBLIC_COMBUSTIBLE_API_URL,
}

export function EnvDebugLogger() {
  React.useEffect(() => {
    console.group("[env] Variables publicas Next.js")
    console.table(variablesPublicas)
    console.groupEnd()
  }, [])

  return null
}
