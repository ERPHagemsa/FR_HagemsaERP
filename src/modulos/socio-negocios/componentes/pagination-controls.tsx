import React from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/compartido/componentes/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import type { PaginationMeta } from "@/modulos/socio-negocios/tipos/socio-negocio"

type PaginationControlsProps = {
  meta: PaginationMeta
  registrosPorPagina: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export function PaginationControls({
  meta,
  registrosPorPagina,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const generarNumerosPaginas = () => {
    const paginas: (number | string)[] = []
    const maxPaginasVisibles = 5

    if (meta.totalPaginas <= maxPaginasVisibles) {
      for (let i = 1; i <= meta.totalPaginas; i++) {
        paginas.push(i)
      }
    } else {
      // Siempre mostrar primera pagina
      paginas.push(1)

      // Calcular rango de paginas alrededor de la actual
      let inicio = Math.max(2, meta.pagina - 1)
      let fin = Math.min(meta.totalPaginas - 1, meta.pagina + 1)

      if (meta.pagina <= 2) {
        fin = Math.min(meta.totalPaginas - 1, 4)
      } else if (meta.pagina >= meta.totalPaginas - 1) {
        inicio = Math.max(2, meta.totalPaginas - 3)
      }

      if (inicio > 2) {
        paginas.push("...")
      }

      for (let i = inicio; i <= fin; i++) {
        paginas.push(i)
      }

      if (fin < meta.totalPaginas - 1) {
        paginas.push("...")
      }

      // Siempre mostrar ultima pagina
      paginas.push(meta.totalPaginas)
    }

    return paginas
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border px-4 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Registros por pagina:</span>
        <Select
          value={String(registrosPorPagina)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">
          Mostrando {(meta.pagina - 1) * meta.limite + 1} a{" "}
          {Math.min(meta.pagina * meta.limite, meta.total)} de{" "}
          {meta.total} registros
        </span>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => meta.tieneAnterior && onPageChange(meta.pagina - 1)}
              className={!meta.tieneAnterior ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          {generarNumerosPaginas().map((pageNum, index) => (
            <PaginationItem key={`${pageNum}-${index}`}>
              {pageNum === "..." ? (
                <span className="flex h-9 w-9 items-center justify-center text-muted-foreground">
                  ...
                </span>
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(Number(pageNum))}
                  isActive={pageNum === meta.pagina}
                  className={Number(pageNum) === meta.pagina ? "" : "cursor-pointer"}
                  size="icon"
                >
                  {pageNum}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={() => meta.tieneSiguiente && onPageChange(meta.pagina + 1)}
              className={!meta.tieneSiguiente ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
