"use client";

import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Truck, UserRound } from "lucide-react";

import { useConsulta } from "@/compartido/api/use-consulta";
import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { Separator } from "@/compartido/componentes/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import { obtenerUnidades } from "@/modulos/flota/asignaciones/servicios/asignaciones-api";
import type { VehiculoFlota } from "@/modulos/flota/asignaciones/tipos/asignaciones.tipos";
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion";
import { useTiposChecklistQuery } from "../servicios/tipos-checklist-queries";
import { useColoresRotulacionQuery } from "../servicios/colores-rotulacion-queries";
import { consultarDisponibilidadAcido } from "../servicios/checklist-api";
import { useIniciarInspeccionMutation } from "../servicios/inspecciones-queries";
import { obtenerTodoPersonal } from "../servicios/personal-api";
import type { Inspeccion } from "../tipos/inspeccion.tipos";
import type { Persona } from "../tipos/personal.tipos";
import { BuscadorPersona } from "./buscador-persona";

function aNumeroONull(valor: FormDataEntryValue | null): number | null {
  const s = String(valor ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function aTextoONull(valor: FormDataEntryValue | null): string | null {
  const s = String(valor ?? "").trim();
  return s.length > 0 ? s : null;
}

// Clase complementaria del acople remolcador<->semirremolque (aplica a ambas
// direcciones). Mismo criterio que IniciarInspeccionUseCase (backend).
function claseAcopleAplicable(clase: string | null): string | null {
  const normal = clase?.trim().toLowerCase();
  if (normal === "remolcador") return "Semirremolque";
  if (normal === "semirremolque") return "Remolcador";
  return null;
}

// El remolcador tiene motor y puede circular solo (el semirremolque es
// opcional para él); el semirremolque NO tiene motor y no anda solo, así que
// si la unidad principal es el semirremolque, el remolcador es obligatorio.
function acopleEsObligatorio(clase: string | null): boolean {
  return clase?.trim().toLowerCase() === "semirremolque";
}

export function IniciarInspeccionSheet({
  unidad,
  onCerrar,
  onIniciada,
}: {
  unidad: VehiculoFlota;
  onCerrar: () => void;
  onIniciada: (inspeccion: Inspeccion) => void;
}) {
  const { usuario } = useSesion();
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [tipoId, setTipoId] = useState<string>("");
  const [colorId, setColorId] = useState<string>("");
  const [acopleId, setAcopleId] = useState<string>("");
  const [busquedaAcople, setBusquedaAcople] = useState("");
  const [operadoresSel, setOperadoresSel] = useState<(Persona | null)[]>([null]);
  const [acido, setAcido] = useState(false);

  // Operadores: personal OPERATIVO de BC01_SocioDeNegocio. Se trae TODO una
  // sola vez al abrir el sheet (el API no filtra por tipoRegimen server-side)
  // y se filtra en cliente, igual que los combobox de contrato/cuenta.
  const personalConsulta = useConsulta(obtenerTodoPersonal, []);
  const personalOperativo = useMemo(
    () => (personalConsulta.data ?? []).filter((p) => p.tipoRegimen === "OPERATIVO"),
    [personalConsulta.data],
  );

  const placa = unidad.placa ?? unidad.placaRodaje ?? unidad.codigo ?? unidad.id;
  const clase = unidad.clase ?? null;
  const claseAcople = claseAcopleAplicable(clase);
  const acopleObligatorio = acopleEsObligatorio(clase);

  // ¿Hay una plantilla ácido publicada para esta clase? Fuente de verdad en
  // el backend (PlantillaVersion.criterioAplicabilidad) — no se hardcodea la
  // lista de clases acá, para no desincronizarse si se agrega/quita una
  // plantilla ácido más adelante.
  const disponibilidadAcidoConsulta = useConsulta(
    () => (clase ? consultarDisponibilidadAcido(clase) : Promise.resolve(false)),
    [clase],
    { enabled: Boolean(clase) },
  );
  const mostrarCheckAcido = disponibilidadAcidoConsulta.data ?? false;

  // Solo se pide cuando la unidad es Remolcador o Semirremolque: un
  // semirremolque no anda solo, hay que emparejarlo con su complementaria.
  const unidadesConsulta = useConsulta(
    () => (claseAcople ? obtenerUnidades() : Promise.resolve([])),
    [claseAcople],
    { enabled: Boolean(claseAcople) },
  );
  const candidatosAcople = useMemo(() => {
    if (!claseAcople) return [];
    const termino = busquedaAcople.trim().toUpperCase();
    return (unidadesConsulta.data ?? [])
      .filter((u) => u.id !== unidad.id)
      .filter((u) => (u.clase ?? "").trim().toLowerCase() === claseAcople.toLowerCase())
      .filter((u) => {
        if (!termino) return true;
        const texto = `${u.placa ?? ""} ${u.placaRodaje ?? ""} ${u.codigo ?? ""}`.toUpperCase();
        return texto.includes(termino);
      })
      .slice(0, 20);
  }, [unidadesConsulta.data, claseAcople, busquedaAcople, unidad.id]);
  const acopleSel = useMemo(
    () => (unidadesConsulta.data ?? []).find((u) => u.id === acopleId) ?? null,
    [unidadesConsulta.data, acopleId],
  );

  // Solo se ofrecen los tipos con una plantilla publicada aplicable a la
  // clase de esta unidad — evita elegir uno que luego falle al iniciar.
  const tiposConsulta = useTiposChecklistQuery({
    estadoRegistro: "ACTIVO",
    limite: 100,
    clase: clase ?? undefined,
  });
  const tipos = useMemo(() => tiposConsulta.data?.datos ?? [], [tiposConsulta.data?.datos]);

  const coloresConsulta = useColoresRotulacionQuery({ estadoRegistro: "ACTIVO", limite: 100 });
  const colores = coloresConsulta.data?.datos ?? [];

  const tipoSel = useMemo(
    () => tipos.find((t) => String(t.id) === tipoId) ?? null,
    [tipos, tipoId],
  );
  const operadoresRequeridos = tipoSel?.operadoresRequeridos ?? 1;

  // El tipo elegido decide cuántos operadores se piden (1 normal, 2 relevo);
  // se ajusta el array (conservando selecciones ya hechas) en el propio
  // handler de selección, no en un efecto separado.
  function seleccionarTipo(id: string) {
    setTipoId(id);
    const requeridos = tipos.find((t) => String(t.id) === id)?.operadoresRequeridos ?? 1;
    setOperadoresSel((actual) => {
      if (actual.length === requeridos) return actual;
      const nuevo = actual.slice(0, requeridos);
      while (nuevo.length < requeridos) nuevo.push(null);
      return nuevo;
    });
  }

  const iniciar = useIniciarInspeccionMutation({
    onSuccess: (inspeccion) => {
      setErrorForm(null);
      toast.success("Inspección iniciada", {
        description: "Se resolvió la plantilla según la clase de la unidad.",
      });
      onIniciada(inspeccion);
    },
    onError: (err) => setErrorForm(extraerMensajeError(err)),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!tipoId) {
      setErrorForm("Seleccione un tipo de checklist.");
      return;
    }
    if (!unidad.id) {
      setErrorForm(
        "Esta unidad no tiene un identificador valido; no se puede iniciar la inspeccion.",
      );
      return;
    }
    if (claseAcople && acopleObligatorio && !acopleId) {
      setErrorForm(
        `Esta unidad es de clase "${clase}"; seleccione la unidad ${claseAcople} complementaria.`,
      );
      return;
    }

    const operadoresDocumentos = operadoresSel
      .filter((p): p is Persona => p !== null)
      .map((p) => p.numeroDocumento);
    if (operadoresDocumentos.length !== operadoresRequeridos) {
      setErrorForm(
        `Este tipo exige ${operadoresRequeridos} ${
          operadoresRequeridos === 1 ? "operador" : "operadores"
        }; falta seleccionar.`,
      );
      return;
    }

    setErrorForm(null);
    iniciar.mutate({
      tipoChecklistId: Number(tipoId),
      unidadId: unidad.id,
      unidadAcopleId: acopleId || null,
      acido: mostrarCheckAcido ? acido : false,
      horometro: aNumeroONull(formData.get("horometro")),
      hubodometro: aNumeroONull(formData.get("hubodometro")),
      kilometraje: aNumeroONull(formData.get("kilometraje")),
      destino: aTextoONull(formData.get("destino")),
      colorRotulacionId: colorId ? Number(colorId) : null,
      // El inspector es el usuario logueado; la asociación usuario->empleado
      // (que dará el documento real) todavía no existe, así que por ahora no
      // se envía documento — el backend lo deja sin snapshot de inspector.
      inspectorDocumento: null,
      operadoresDocumentos,
      observaciones: aTextoONull(formData.get("observaciones")),
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrorForm(null);
      onCerrar();
    }
  }

  return (
    <Sheet open onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border">
            <SheetTitle>Iniciar checklist</SheetTitle>
            <SheetDescription>
              Elija el tipo de checklist. El sistema resuelve automáticamente la
              plantilla según la clase de la unidad.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-5">
              {errorForm ? (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo iniciar</AlertTitle>
                  <AlertDescription>{errorForm}</AlertDescription>
                </Alert>
              ) : null}

              {/* Unidad (contexto, solo lectura) */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background">
                  <Truck className="size-4 text-muted-foreground" />
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{placa}</span>
                  <span className="text-xs text-muted-foreground">
                    {clase ? `Clase: ${clase}` : "Clase no definida"}
                    {" — resuelve la plantilla y los tipos ofrecidos."}
                  </span>
                </div>
              </div>

              {/* Acople (remolcador <-> semirremolque): obligatorio solo desde el
                  semirremolque (no anda solo); desde el remolcador es opcional. */}
              {claseAcople ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-acople">
                    Unidad {claseAcople} complementaria{" "}
                    {acopleObligatorio ? (
                      <span className="text-destructive">*</span>
                    ) : (
                      <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="ins-acople"
                      className="pl-8"
                      placeholder={`Buscar ${claseAcople.toLowerCase()} por placa...`}
                      value={acopleSel ? (acopleSel.placa ?? acopleSel.placaRodaje ?? acopleSel.id) : busquedaAcople}
                      onChange={(e) => {
                        setAcopleId("");
                        setBusquedaAcople(e.target.value);
                      }}
                    />
                  </div>
                  {!acopleSel && busquedaAcople.trim() ? (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                      {unidadesConsulta.isLoading ? (
                        <p className="p-3 text-sm text-muted-foreground">Cargando unidades...</p>
                      ) : candidatosAcople.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          Sin resultados para &ldquo;{busquedaAcople}&rdquo;.
                        </p>
                      ) : (
                        candidatosAcople.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/50"
                            onClick={() => {
                              setAcopleId(u.id);
                              setBusquedaAcople("");
                            }}
                          >
                            <span className="font-medium">{u.placa ?? u.placaRodaje ?? u.id}</span>
                            <span className="text-xs text-muted-foreground">
                              {u.marca} {u.modelo}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                  {acopleSel ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <span className="text-sm">
                        <span className="font-medium">
                          {acopleSel.placa ?? acopleSel.placaRodaje ?? acopleSel.id}
                        </span>
                        {" — "}
                        {acopleSel.marca} {acopleSel.modelo}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAcopleId("")}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Tipo de checklist */}
              <div className="grid gap-1.5">
                <Label htmlFor="ins-tipo">
                  Tipo de checklist <span className="text-destructive">*</span>
                </Label>
                <Select value={tipoId} onValueChange={seleccionarTipo}>
                  <SelectTrigger id="ins-tipo" className="w-full">
                    <SelectValue
                      placeholder={
                        tiposConsulta.isLoading ? "Cargando tipos..." : "Seleccione un tipo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.nombre} · {t.operadoresRequeridos === 2 ? "Relevo" : "Normal"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mostrarCheckAcido ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <Checkbox
                    id="ins-acido"
                    checked={acido}
                    onCheckedChange={(valor) => setAcido(valor === true)}
                  />
                  <Label htmlFor="ins-acido" className="cursor-pointer font-normal">
                    ¿Transporta ácido / material peligroso?
                  </Label>
                </div>
              ) : null}

              <Separator />

              {/* Datos de operación */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-horometro">Horómetro</Label>
                  <Input id="ins-horometro" name="horometro" type="number" step="any" inputMode="decimal" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-hubodometro">Hubodómetro</Label>
                  <Input id="ins-hubodometro" name="hubodometro" type="number" step="any" inputMode="decimal" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-kilometraje">Kilometraje</Label>
                  <Input id="ins-kilometraje" name="kilometraje" type="number" step="any" inputMode="decimal" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-destino">Destino de carga</Label>
                  <Input id="ins-destino" name="destino" placeholder="Ej. Mina Antapaccay" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ins-color">Color de rotulación</Label>
                  <Select value={colorId} onValueChange={setColorId}>
                    <SelectTrigger id="ins-color" className="w-full">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {colores.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          <span
                            className="mr-2 inline-block size-3 rounded-sm border border-border/50 align-middle"
                            style={{ backgroundColor: c.valorHex }}
                          />
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Inspector: el usuario logueado (solo lectura). La asociación
                  usuario->empleado real la implementan después. */}
              <div className="grid gap-1.5">
                <Label>Inspector</Label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {usuario?.nombre ?? "Usuario en sesión"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Es quien inició sesión.
                </p>
              </div>

              <div className="grid gap-2">
                <Label>
                  {operadoresRequeridos === 2 ? "Operadores (relevo)" : "Operador"}
                </Label>
                {operadoresSel.map((sel, i) => (
                  <div key={i} className="grid gap-1">
                    {operadoresRequeridos === 2 ? (
                      <span className="text-xs text-muted-foreground">
                        Operador {i === 0 ? "A (recepción)" : "B (asignación)"}
                      </span>
                    ) : null}
                    <BuscadorPersona
                      items={personalOperativo}
                      cargando={personalConsulta.isLoading}
                      seleccionada={sel}
                      onSeleccionar={(p) =>
                        setOperadoresSel((actual) =>
                          actual.map((o, idx) => (idx === i ? p : o)),
                        )
                      }
                      placeholder="Buscar por nombre o documento..."
                    />
                  </div>
                ))}
                {tipoSel ? (
                  <p className="text-xs text-muted-foreground">
                    Este tipo exige {operadoresRequeridos}{" "}
                    {operadoresRequeridos === 1 ? "operador" : "operadores"}.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="ins-observaciones">Observaciones</Label>
                <Textarea id="ins-observaciones" name="observaciones" rows={3} maxLength={1000} />
              </div>
            </div>
          </div>

          <Separator />
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline" disabled={iniciar.isPending}>
                Cancelar
              </Button>
            </SheetClose>
            <Button type="submit" disabled={iniciar.isPending}>
              {iniciar.isPending ? "Iniciando..." : "Iniciar checklist"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
