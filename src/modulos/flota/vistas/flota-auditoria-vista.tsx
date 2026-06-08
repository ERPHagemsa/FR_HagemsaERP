"use client";

import React, { useState } from "react";
import { IconArrowLeft, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import Link from "next/link";
import { Card } from "@/compartido/componentes/ui/card";

type Props = {
  placa: string;
  historial: any[];
};

export function FlotaAuditoriaVista({ placa, historial }: Props) {
  const [pagina, setPagina] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const totalRegistros = historial.length;
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

  const inicio = (pagina - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const registrosPaginados = historial.slice(inicio, fin);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        
        {/* Encabezado Principal al estilo de la imagen */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Unidad {placa}
              <Badge variant="secondary">VEHÍCULO</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              Auditoria de datos anteriores y nuevos para el registro seleccionado.
            </p>
          </div>
          <div>
            <Button variant="outline" asChild className="rounded-full">
              <Link href="/flota/unidades">
                Volver al listado
              </Link>
            </Button>
          </div>
        </section>

        {/* Lista de Registros */}
        {historial.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground border border-border rounded-xl bg-card">
            No se encontraron registros de auditoría para este vehículo.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {registrosPaginados.map((item, index) => {
              const isRegistro = item.accion === "REGISTRO";
              const isEliminacion = item.accion === "ELIMINACION";
              const isExpanded = !!expandedIds[item.id];
              const reverseIndex = totalRegistros - (inicio + index);
              
              const headerColor = isRegistro 
                ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50" 
                : isEliminacion
                ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50"
                : "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50";

              const badgeVariant = isRegistro 
                ? "default" 
                : isEliminacion 
                ? "destructive" 
                : "outline"; // outline or default depending on exact UI theme

              return (
                <div key={item.id} className={`border rounded-xl overflow-hidden ${headerColor}`}>
                  {/* Cabecera del Movimiento Clickable */}
                  <div 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm">#{reverseIndex}</span>
                        <Badge variant={badgeVariant} className="text-xs font-medium">
                          {item.accion}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-normal text-muted-foreground bg-white dark:bg-black/20">
                          Click para {isExpanded ? "cerrar" : "abrir"} detalle
                        </Badge>
                      </div>
                      <div className="text-sm font-semibold mt-1 text-foreground/90">
                        {new Date(item.fechaAccion).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        Movimiento {item.id}
                      </div>
                    </div>
                    
                    <div className="mt-3 sm:mt-0 flex items-center gap-4">
                      <div className="flex flex-col items-center bg-white dark:bg-background/50 px-4 py-2 rounded-lg border border-border/50">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Usuario</span>
                        <span className="text-sm font-bold">{item.usuarioAccion}</span>
                      </div>
                      <div className="text-muted-foreground">
                        {isExpanded ? <IconChevronUp className="h-5 w-5" /> : <IconChevronDown className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Diff (Acordeón) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 bg-card border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col gap-3">
                        <DiffRow label="Contrato" oldVal={item.datosAnteriores?.contrato} newVal={item.datosNuevos?.contrato} />
                        <DiffRow label="Cuenta" oldVal={item.datosAnteriores?.cuenta} newVal={item.datosNuevos?.cuenta} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Paginación similar a flota-tabla */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Registros por pagina:</span>
                <select
                  value={registrosPorPagina}
                  onChange={(e) => {
                    setRegistrosPorPagina(Number(e.target.value));
                    setPagina(1);
                  }}
                  className="h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="ml-4 text-sm text-muted-foreground">
                  Mostrando {Math.min(inicio + 1, totalRegistros)} a {Math.min(fin, totalRegistros)} de {totalRegistros} registros
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  {"< Previous"}
                </Button>
                <div className="flex items-center gap-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-medium">
                    {pagina}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={pagina === totalPaginas || totalPaginas === 0}
                >
                  {"Next >"}
                </Button>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

function DiffRow({ label, oldVal, newVal }: { label: string, oldVal: string | null | undefined, newVal: string | null | undefined }) {
  const o = oldVal || "Sin asignar";
  const n = newVal || "Sin asignar";
  const changed = o !== n;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border border-border rounded-lg overflow-hidden">
      <div className="md:col-span-3 p-4 flex items-center bg-muted/30 border-r border-border">
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2">
        <div className={`p-4 text-sm font-medium border-b sm:border-b-0 sm:border-r border-border ${
          changed 
            ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" 
            : "text-muted-foreground bg-background"
        }`}>
          {changed ? `- ${o}` : o}
        </div>
        <div className={`p-4 text-sm font-medium ${
          changed 
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
            : "text-muted-foreground bg-background"
        }`}>
          {changed ? `+ ${n}` : n}
        </div>
      </div>
    </div>
  );
}
