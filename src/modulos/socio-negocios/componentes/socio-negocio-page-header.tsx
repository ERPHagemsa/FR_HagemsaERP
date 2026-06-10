import type { ReactNode } from "react"

import { cn } from "@/compartido/utilidades/utils"

type SocioNegocioPageHeaderProps = {
  actions?: ReactNode
  className?: string
  description?: string
  meta?: ReactNode
  title: ReactNode
}

export function SocioNegocioPageHeader({
  actions,
  className,
  description,
  meta,
  title,
}: SocioNegocioPageHeaderProps) {
  return (
    <section
      className={cn(
        "border-b border-border/70 pb-4 text-foreground",
        className,
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="break-words text-2xl font-semibold tracking-normal">
              {title}
            </h1>
            {meta}
          </div>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end md:w-auto">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}
