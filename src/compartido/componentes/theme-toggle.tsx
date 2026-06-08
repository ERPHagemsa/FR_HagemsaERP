"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/compartido/componentes/ui/button"
import { cn } from "@/compartido/utilidades/utils"

export function ThemeToggle({
  className,
  showLabel = false,
}: {
  className?: string
  showLabel?: boolean
}) {
  const [mounted, setMounted] = React.useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // next-themes: marcamos "mounted" tras hidratar para evitar el mismatch del
  // icono (el server asume modo claro). El flag se setea una sola vez.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? "default" : "icon-sm"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn(
        "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        showLabel && "w-full justify-start px-2",
        // En modo riel (icon) el boton se reduce a solo icono.
        "group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className,
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
      {showLabel ? (
        <span className="group-data-[collapsible=icon]:hidden">
          {isDark ? "Modo claro" : "Modo oscuro"}
        </span>
      ) : null}
    </Button>
  )
}
