"use client"

import * as React from "react"
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
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

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? "default" : "icon-sm"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={cn(
        "rounded-xl bg-background/70 shadow-none",
        showLabel && "w-full justify-start px-3",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <HugeiconsIcon
        icon={isDark ? Sun03Icon : Moon02Icon}
        strokeWidth={2}
        data-icon={showLabel ? "inline-start" : undefined}
      />
      {showLabel ? (
        <span>{isDark ? "Modo claro" : "Modo oscuro"}</span>
      ) : null}
    </Button>
  )
}
