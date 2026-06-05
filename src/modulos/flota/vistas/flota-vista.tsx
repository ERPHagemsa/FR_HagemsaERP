"use client"

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/compartido/componentes/ui/input";
import { Button } from "@/compartido/componentes/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/compartido/componentes/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/compartido/componentes/ui/table";
// Use native selects to avoid JSX parsing issues in this file
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalCircle01Icon } from "@hugeicons/core-free-icons";
import { obtenerVehiculos, obtenerResumen } from "../servicios/flota-api";
import { ChartContainer } from "@/compartido/componentes/ui/chart";
import { PieChart, Pie, Cell, Tooltip as ReTooltip } from "recharts";

export function FlotaVista() {
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [estado, setEstado] = useState("Todos");
  const [operativo, setOperativo] = useState("Todos");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    obtenerVehiculos().then((list) => {
      if (!mounted) return;
      setItems(list);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    obtenerResumen().then((r) => {
      if (!mounted) return;
      setResumen(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((v) => {
      if (q) {
        const hay = [v.id, v.placa, v.placaRodaje, v.marca, v.contrato, v.cuenta]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q));
        if (!hay) return false;
      }
      if (tipo !== "Todos" && v.tipoActivo !== tipo) return false;
      if (estado !== "Todos" && v.estadoActivo !== estado) return false;
      if (operativo !== "Todos") {
        const op = operativo === "Operativo";
        if (Boolean(v.vehiculo?.estadoOperativo) !== op) return false;
      }
      return true;
    });
  }, [items, query, tipo, estado, operativo]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">BC-04</p>
          <h1 className="text-2xl font-semibold">Flota y disponibilidad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lista de unidades y contratos.</p>
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="ID, codigo, placa, chasis, motor o unidad" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm">
              <option value="Todos">Todos</option>
              <option value="Vehiculo">Vehiculo</option>
            </select>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm">
              <option value="Todos">Todos</option>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
            <select value={operativo} onChange={(e) => setOperativo(e.target.value)} className="rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm">
              <option value="Todos">Todos</option>
              <option value="Operativo">Operativo</option>
              <option value="No operativo">No operativo</option>
            </select>

          </div>

          {/* Mini dashboard */}
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="col-span-3 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-border bg-background p-3">
                <div className="text-sm text-muted-foreground">Total unidades</div>
                <div className="mt-1 text-2xl font-semibold">{resumen?.totalVehiculos ?? items.length}</div>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <div className="text-sm text-muted-foreground">Operativos activos</div>
                <div className="mt-1 text-2xl font-semibold">{resumen?.operativosActivos ?? items.filter((x) => (x.estado === 'OPERATIVO' || x.estado === 'Operativo' || x.estado === 'Activo' || x.estado === 'ACTIVO')).length}</div>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <div className="text-sm text-muted-foreground">Registros recientes</div>
                <div className="mt-1 text-2xl font-semibold">{(resumen?.registrosRecientes?.length ?? 0)}</div>
              </div>
            </div>
            <div className="col-span-1">
              <div className="rounded-md border border-border bg-background p-3">
                <div className="text-sm text-muted-foreground mb-2">Por tipo</div>
                <div style={{ width: '100%', height: 120 }}>
                  <ChartContainer id="flota-tipos" config={{ tipos: { label: 'Por tipo', color: '#60A5FA' } }} initialDimension={{ width: 320, height: 120 }}>
                    <PieChart>
                      <Pie dataKey="value" data={
                        (resumen?.porTipo && resumen.porTipo.length > 0)
                          ? resumen.porTipo.map((t: any) => ({ name: t.tipoVehiculo, value: t.total }))
                          : (() => {
                              const map: Record<string, number> = {};
                              items.forEach((it) => { const k = it.tipoVehiculo ?? 'Otros'; map[k] = (map[k] || 0) + 1; });
                              return Object.entries(map).map(([name, value]) => ({ name, value }));
                            })()
                      } nameKey="name" cx="50%" cy="50%" outerRadius={40} innerRadius={12}>
                        {((resumen?.porTipo && resumen.porTipo.length > 0) ? resumen.porTipo : items).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={["#60A5FA", "#34D399", "#FBBF24", "#F87171"][index % 4]} />
                        ))}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ChartContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <div className="p-6">Cargando...</div>
            ) : pageItems.length === 0 ? (
              <div className="p-6">No se encontraron activos con los filtros aplicados.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-10" />
                    <TableHead>Placa</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Cuenta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Acciones">
                              <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuGroup>
                              <DropdownMenuItem>
                                <Link href={`/flota/${encodeURIComponent(v.id)}`}>Ver ficha</Link>
                              </DropdownMenuItem>
                              {/* <DropdownMenuItem>
                                <Link href={`/flota/${encodeURIComponent(v.id)}/editar`}>Modificar</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Dar de baja</DropdownMenuItem> */}
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.placa ?? v.placaRodaje ?? v.id}</TableCell>
                      <TableCell>{v.marca}</TableCell>
                      <TableCell>{v.contrato ?? "-"}</TableCell>
                      <TableCell>{v.cuenta ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>Mostrando {Math.min(total, (page - 1) * pageSize + 1)}-{Math.min(total, page * pageSize)} de {total} activos</div>
            <div className="flex items-center gap-3">
              <label>Filas</label>
              <select value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</Button>
              <div>{page} / {totalPages}</div>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default FlotaVista;
