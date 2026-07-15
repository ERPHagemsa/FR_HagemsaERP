'use client';

import { CircleHelp } from 'lucide-react';

import { Button } from '@/compartido/componentes/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/compartido/componentes/ui/popover';

/**
 * Ícono de ayuda para cards del dashboard: botón "?" sutil que, al hacer
 * click, abre un `Popover` con la explicación en lenguaje llano de la
 * métrica. Se usa click (no hover) para funcionar bien en mobile y con
 * teclado. Mismo `Popover` reusado por `DashboardSelectorPeriodo`.
 */
export function AyudaMetrica({ descripcion }: { descripcion: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          aria-label="Ayuda sobre esta métrica"
        >
          <CircleHelp className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-xs" align="end">
        <p className="text-xs text-muted-foreground">{descripcion}</p>
      </PopoverContent>
    </Popover>
  );
}
