"use client"

import React, { useState } from "react";
import { obtenerConfiguracionApi } from "@/compartido/api/config";

export default function DetalleVehiculoClient({ initialData, id }: any) {
  const [vehiculo, setVehiculo] = useState(initialData ?? null);
  const [contrato, setContrato] = useState(initialData?.contrato ?? "");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const cfg = obtenerConfiguracionApi("flota");

  React.useEffect(() => {
    if (initialData) {
      setVehiculo(initialData);
      setContrato(initialData.contrato ?? "");
      return;
    }

    if (!id) return;

    let mounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    async function fetchVeh() {
      setLoadingData(true);
      try {
        const res = await fetch(`${cfg.baseUrl}/vehiculos/${encodeURIComponent(id)}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setVehiculo(data);
          setContrato(data.contrato ?? "");
          setBackendAvailable(true);
        } else {
          setBackendAvailable(false);
        }
      } catch (e) {
        setBackendAvailable(false);
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    fetchVeh();

    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [initialData, id, cfg.baseUrl]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!vehiculo) return alert("No hay vehículo cargado");
    setLoading(true);
    const body = { contrato: contrato || null, usuario_modificacion: "web-user" };
    try {
      const res = await fetch(`${cfg.baseUrl}/vehiculos/${encodeURIComponent(vehiculo.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setVehiculo(updated);
        setContrato(updated.contrato ?? "");
        alert("Contrato actualizado");
      } else {
        alert("Error al actualizar contrato");
      }
    } catch (e) {
      alert("No se pudo conectar al servicio para actualizar");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Detalle de vehículo</h2>
        <div className="mt-4">Cargando vehículo...</div>
      </section>
    );
  }

  if (!vehiculo) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Vehículo</h2>
        <div className="mt-4">{backendAvailable ? 'Vehículo no encontrado' : 'Servicio de Flota no disponible'}</div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <h2 className="text-xl font-semibold">Detalle de vehículo</h2>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Placa</label>
          <div className="font-medium">{vehiculo.placa ?? vehiculo.id}</div>
        </div>
        <div>
          <label className="text-sm text-slate-600">Marca</label>
          <div className="font-medium">{vehiculo.marca}</div>
        </div>
        <div>
          <label className="text-sm text-slate-600">Contrato</label>
          <div className="font-medium">{vehiculo.contrato ?? "-"}</div>
        </div>
        <div>
          <label className="text-sm text-slate-600">Cuenta</label>
          <div className="font-medium">{vehiculo.cuenta ?? "-"}</div>
        </div>
      </div>

      <form onSubmit={onSave} className="mt-6 grid gap-3">
        <label className="text-sm">Editar contrato (code)</label>
        <input
          value={contrato}
          onChange={(e) => setContrato(e.target.value)}
          placeholder="Ej: CON-001"
          className="w-48 rounded border px-3 py-2"
        />
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="rounded bg-sky-600 px-4 py-2 text-white"
            disabled={loading || !backendAvailable}
          >
            {loading ? "Guardando..." : "Guardar contrato"}
          </button>
        </div>
      </form>
    </section>
  );
}
