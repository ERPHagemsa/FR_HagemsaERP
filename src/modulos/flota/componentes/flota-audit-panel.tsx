"use client";

import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";
import { obtenerHistorialPorPlaca } from "../servicios/flota-api";
import { IconHistory, IconChevronDown, IconChevronUp } from "@tabler/icons-react";

export function FlotaAuditPanel({
  placa,
  isOpen,
  onClose,
}: {
  placa: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && placa) {
      setLoading(true);
      obtenerHistorialPorPlaca(placa).then((res) => {
        if (res?.datos) {
          setHistorial(res.datos);
          // Auto-expand the first item
          if (res.datos.length > 0) {
            setExpandedId(res.datos[0].id);
          }
        } else {
          setHistorial([]);
        }
        setLoading(false);
      });
    } else {
      setHistorial([]);
      setExpandedId(null);
    }
  }, [isOpen, placa]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <IconHistory className="h-6 w-6 text-primary" />
            Auditoría de la Unidad: {placa}
          </SheetTitle>
          <SheetDescription>
            Auditoría de datos anteriores y nuevos para el registro seleccionado.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No hay registros de auditoría para este vehículo.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {historial.map((item, index) => {
                const isExpanded = expandedId === item.id;
                const isRegistro = item.accion === "REGISTRO";
                const isEliminacion = item.accion === "ELIMINACION";
                
                // Color coding based on action
                const bgHeader = isRegistro
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : isEliminacion
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-blue-500/10 border-blue-500/20";
                
                const badgeColor = isRegistro
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : isEliminacion
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

                const borderColor = isRegistro
                  ? "border-l-emerald-500"
                  : isEliminacion
                  ? "border-l-red-500"
                  : "border-l-blue-500";

                return (
                  <div key={item.id} className="flex flex-col border border-border rounded-xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer transition-colors border-l-4 ${borderColor} ${bgHeader}`}
                      onClick={() => toggleExpand(item.id)}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-muted-foreground">#{historial.length - index}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                            {item.accion.charAt(0) + item.accion.slice(1).toLowerCase()}
                          </span>
                          <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5 bg-background">
                            Click para {isExpanded ? 'cerrar' : 'abrir'} detalle
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {new Date(item.fechaAccion).toLocaleString('es-PE', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate max-w-xs sm:max-w-sm">
                          Movimiento: {item.id}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 mt-3 sm:mt-0">
                        <div className="flex flex-col items-end bg-background px-3 py-1.5 rounded-lg border border-border shadow-sm">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Usuario</span>
                          <span className="text-sm font-medium">{item.usuarioAccion}</span>
                        </div>
                        {isExpanded ? <IconChevronUp className="h-5 w-5 text-muted-foreground" /> : <IconChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Expanded Detail (Diff) */}
                    {isExpanded && (
                      <div className="p-0 border-t border-border bg-card">
                        <div className="grid grid-cols-1 divide-y divide-border">
                          {/* We dynamically compare keys in datosAnteriores and datosNuevos */}
                          {renderDiffRow("Contrato", item.datosAnteriores?.contrato, item.datosNuevos?.contrato)}
                          {renderDiffRow("Cuenta", item.datosAnteriores?.cuenta, item.datosNuevos?.cuenta)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function renderDiffRow(label: string, oldVal: string | null | undefined, newVal: string | null | undefined) {
  const o = oldVal || "Sin asignar";
  const n = newVal || "Sin asignar";
  const changed = o !== n;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
      <div className="md:col-span-3 p-3 flex items-center bg-muted/10 border-r border-border">
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2">
        <div className={`p-3 text-sm font-mono border-b sm:border-b-0 sm:border-r border-border ${changed ? "bg-red-500/10 text-red-700 dark:text-red-400" : "text-muted-foreground"}`}>
          {changed ? `- ${o}` : o}
        </div>
        <div className={`p-3 text-sm font-mono ${changed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
          {changed ? `+ ${n}` : n}
        </div>
      </div>
    </div>
  );
}
