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
        "border-b border-border pb-5 text-foreground",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {meta ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {meta}
            </div>
          ) : null}
          <div>
            <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:max-w-xl lg:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}
