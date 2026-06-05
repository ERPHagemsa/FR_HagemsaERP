"use client"

import React, { useEffect, useState } from "react";
import { obtenerVehiculos, obtenerResumen } from "../servicios/flota-api";
import { FlotaResumen } from "../componentes/flota-resumen";
import { FlotaTabla } from "../componentes/flota-tabla";
import type { ResumenFlota, VehiculoFlota } from "../tipos/flota.tipos";

export function FlotaVista() {
  const [items, setItems] = useState<VehiculoFlota[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenFlota>(null);

  useEffect(() => {
    let mounted = true;
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

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-sm font-medium text-muted-foreground">BC-04</p>
          <h1 className="text-2xl font-semibold">Flota y disponibilidad</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lista de unidades y contratos.</p>
        </section>

        <FlotaResumen resumen={resumen} vehiculos={items} />
        <FlotaTabla loading={loading} vehiculos={items} />
      </div>
    </main>
  );
}

export default FlotaVista;
