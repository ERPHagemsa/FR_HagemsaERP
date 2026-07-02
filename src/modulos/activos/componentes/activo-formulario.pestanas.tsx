// Contenido de las pestanas "simples" del formulario de activos (solo dependen
// de `activo` y `catalogos`; los inputs son no controlados y el padre los lee
// por el DOM via formularioRef). Extraidas de activo-formulario.tsx.

import {
  IconClipboardText,
  IconReceipt2,
  IconRulerMeasure,
  IconSettings,
  IconShieldCheck,
  IconTruck,
} from "@tabler/icons-react";

import {
  TIPO_ACTIVO_VEHICULO_ID,
  type CatalogosActivos,
} from "../ganchos/use-catalogos-activos";
import type { Activo, CarroceriaReferencia } from "../tipos/activo.tipos";
import {
  EstadoActivoSelector,
  Field,
  SectionIntro,
  SelectField,
} from "./activo-formulario.campos";
import { formatLabel, toDateInputValue } from "./activo-formulario.utilidades";

export function TabVehiculo({
  activo,
  catalogos,
  claseVehiculoSeleccionadaId,
  onClaseChange,
  selectedCarroceriaReferenciaId,
  carroceriaTexto,
  carroceriasReferencia,
  onCarroceriaChange,
}: {
  activo?: Activo;
  catalogos: CatalogosActivos;
  claseVehiculoSeleccionadaId: number | null;
  onClaseChange: (nuevaClaseId: number | null) => void;
  selectedCarroceriaReferenciaId: string;
  carroceriaTexto: string;
  carroceriasReferencia: CarroceriaReferencia[];
  onCarroceriaChange: (referenciaId: string) => void;
}) {
  return (
    <>
      <SectionIntro
        icon={IconTruck}
        title="Datos vehiculares"
        description="Placa, marca, modelo y datos propios de la unidad."
      />
      <div className="grid gap-4 lg:grid-cols-[260px_180px_1fr_1fr]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-foreground">
            Clase
            <span className="ml-1 text-destructive">*</span>
          </span>
          <select
            name="claseVehiculoReferenciaId"
            value={
              claseVehiculoSeleccionadaId !== null
                ? String(claseVehiculoSeleccionadaId)
                : ""
            }
            required
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            onInput={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation();
              onClaseChange(
                event.target.value ? Number(event.target.value) : null
              );
            }}
          >
            <option value="">Seleccionar clase</option>
            {catalogos.clasesVehiculo.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </select>
        </label>
        <Field name="placa" label="Placa" placeholder="BTZ-750" defaultValue={activo?.vehiculo?.placa ?? undefined} />
        <Field name="marca" label="Marca" placeholder="TOYOTA" defaultValue={activo?.vehiculo?.marca ?? undefined} />
        <Field name="modelo" label="Modelo" placeholder="HILUX" defaultValue={activo?.vehiculo?.modelo ?? undefined} />
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-5">
        <Field name="anioFabricacion" label="Ano fabricacion" type="number" defaultValue={activo?.vehiculo?.anioFabricacion ?? undefined} />
        <Field name="color" label="Color" defaultValue={activo?.vehiculo?.color ?? undefined} />
        <label className="grid gap-2">
          <span
            id="carroceria-referencia-label"
            className="text-sm font-medium text-foreground"
          >
            Carroceria
          </span>
          <input
            type="hidden"
            name="carroceriaReferenciaId"
            value={selectedCarroceriaReferenciaId}
            readOnly
          />
          <select
            id="carroceriaReferenciaSelect"
            name="carroceriaReferenciaSelect"
            aria-labelledby="carroceria-referencia-label"
            value={selectedCarroceriaReferenciaId}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            // El div contenedor tiene onChange/onInput que disparan un
            // re-render en cada interaccion. Si esos eventos burbujean
            // desde este select controlado, lo re-renderizan con el
            // value viejo antes de que la seleccion se confirme y la
            // revierten (sintoma: con flechas cambia pero al soltar/
            // Enter vuelve al valor anterior). Cortamos la propagacion
            // de ambos eventos; aplicarCarroceriaReferencia ya actualiza
            // el estado y el resumen.
            onInput={(event) => event.stopPropagation()}
            onChange={(event) => {
              event.stopPropagation();
              onCarroceriaChange(event.target.value);
            }}
          >
            <option value="">Seleccionar referencia</option>
            {carroceriasReferencia.map((referencia) => (
              <option key={referencia.id} value={referencia.id}>
                {formatLabel(referencia.nombre)}
              </option>
            ))}
          </select>
        </label>
        <input
          name="carroceria"
          type="hidden"
          value={carroceriaTexto}
          readOnly
        />
        <Field
          name="ejes"
          label="Ejes"
          type="number"
          defaultValue={activo?.vehiculo?.ejes ?? undefined}
        />
        <Field
          name="categoria"
          label="Categoria"
          defaultValue={activo?.vehiculo?.categoria ?? undefined}
        />
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-2">
        <Field name="serieChasis" label="Serie de chasis" defaultValue={activo?.vehiculo?.serieChasis ?? undefined} required />
        <Field name="serieMotor" label="Serie y marca de motor" defaultValue={activo?.vehiculo?.serieMotor ?? undefined} required />
      </div>
    </>
  );
}

export function TabBase({
  activo,
  isEdit,
  catalogos,
  estadoActivoGrupo,
  onEstadoActivoChange,
  causaBaja,
  onCausaBajaChange,
  onTipoActivoChange,
}: {
  activo?: Activo;
  isEdit: boolean;
  catalogos: CatalogosActivos;
  estadoActivoGrupo: "ACTIVO" | "BAJA";
  onEstadoActivoChange: (estado: "ACTIVO" | "BAJA") => void;
  causaBaja: "SINIESTRADO" | "INACTIVO";
  onCausaBajaChange: (causa: "SINIESTRADO" | "INACTIVO") => void;
  onTipoActivoChange: (tipoActivoReferenciaId: number) => void;
}) {
  return (
    <>
      <SectionIntro
        icon={IconClipboardText}
        title="Datos base"
        description="Identificacion administrativa del activo."
      />
      <div className="grid gap-4 lg:grid-cols-[220px_1fr_220px]">
        <Field
          name="codigo"
          label="Codigo"
          placeholder="ACT-000864"
          defaultValue={activo?.codigo}
          disabled={isEdit}
          required
        />
        <Field
          name="descripcion"
          label="Descripcion"
          placeholder="Camioneta Toyota Hilux"
          defaultValue={activo?.descripcion}
          required
        />
        <input
          name="estadoActivo"
          type="hidden"
          value={estadoActivoGrupo === "ACTIVO" ? "ACTIVO" : causaBaja}
          readOnly
        />
        <EstadoActivoSelector
          estado={estadoActivoGrupo}
          onChange={onEstadoActivoChange}
        />
      </div>
      {estadoActivoGrupo === "BAJA" ? (
        <div className="grid gap-4 pt-4 md:grid-cols-2">
          <SelectField
            name="causaBaja"
            label="Causa de baja"
            defaultValue={causaBaja}
            values={["SINIESTRADO", "INACTIVO"]}
            onChange={(value) =>
              onCausaBajaChange(value as "SINIESTRADO" | "INACTIVO")
            }
            labels={{
              SINIESTRADO: "Siniestro",
              INACTIVO: "De baja",
            }}
            required
          />
        </div>
      ) : null}
      <div className="grid gap-4 pt-4 md:grid-cols-2">
        <SelectField
          name="tipoActivo"
          label="Tipo de activo"
          defaultValue={String(
            activo?.tipoActivoReferenciaId ?? TIPO_ACTIVO_VEHICULO_ID
          )}
          opciones={catalogos.tiposActivo}
          onChange={(value) => onTipoActivoChange(Number(value))}
          required
        />
        <Field
          name="ubicacion"
          label="Ubicacion"
          placeholder="Arequipa - Base principal"
          defaultValue={activo?.ubicacion}
          required
        />
      </div>
    </>
  );
}

export function TabAdquisicion({ activo }: { activo?: Activo }) {
  return (
    <>
      <SectionIntro
        icon={IconReceipt2}
        title="Datos economicos y adquisicion"
        description="Valor de unidad, proveedor y datos de factura."
      />
      <div className="grid gap-4 md:grid-cols-[1fr_140px]">
        <Field
          name="valorUnidad"
          label="Valor de unidad"
          min="0"
          placeholder="0.00"
          step="0.01"
          type="number"
          defaultValue={activo?.valorUnidad ?? undefined}
        />
        <SelectField
          name="moneda"
          label="Moneda"
          defaultValue={activo?.moneda ?? "PEN"}
          values={["PEN", "USD"]}
        />
      </div>
      <div className="grid gap-4 pt-4 md:grid-cols-3">
        <Field
          name="proveedor"
          label="Proveedor"
          placeholder="Proveedor o razon social"
          defaultValue={activo?.proveedor ?? undefined}
        />
        <Field
          name="numeroFactura"
          label="Numero de factura"
          placeholder="F001-000123"
          defaultValue={activo?.numeroFactura ?? undefined}
        />
        <Field
          name="fechaFactura"
          label="Fecha de factura"
          type="date"
          defaultValue={toDateInputValue(activo?.fechaFactura)}
        />
      </div>
    </>
  );
}

export function TabEquipamiento({ activo }: { activo?: Activo }) {
  return (
    <>
      <SectionIntro
        icon={IconSettings}
        title="Equipamiento e implementacion"
        description="Accesorios, implementos y elementos instalados."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field name="radioComunicacion" label="Radio de comunicacion" defaultValue={activo?.vehiculo?.radioComunicacion ?? undefined} />
        <Field name="autorradio" label="Autorradio" defaultValue={activo?.vehiculo?.autorradio ?? undefined} />
        <Field name="llantasRepuesto" label="Llantas de repuesto" defaultValue={activo?.vehiculo?.llantasRepuesto ?? undefined} />
        <Field name="camara" label="Camara" defaultValue={activo?.vehiculo?.camara ?? undefined} />
        <Field name="tablet" label="Tablet" defaultValue={activo?.vehiculo?.tablet ?? undefined} />
        <Field name="dispositivosSeguridad" label="Dispositivos de seguridad" defaultValue={activo?.vehiculo?.dispositivosSeguridad ?? undefined} />
        <Field name="cajaHerramientas" label="Caja de herramientas" defaultValue={activo?.vehiculo?.cajaHerramientas ?? undefined} />
        <Field name="jaulaAntivuelco" label="Jaula antivuelco" defaultValue={activo?.vehiculo?.jaulaAntivuelco ?? undefined} />
        <Field name="carriboy" label="Carriboy" defaultValue={activo?.vehiculo?.carriboy ?? undefined} />
        <Field name="baranda" label="Baranda" defaultValue={activo?.vehiculo?.baranda ?? undefined} />
        <Field name="mamparon" label="Mamparon" defaultValue={activo?.vehiculo?.mamparon ?? undefined} />
      </div>
    </>
  );
}

export function TabDimensiones({
  activo,
  catalogos,
}: {
  activo?: Activo;
  catalogos: CatalogosActivos;
}) {
  return (
    <>
      <SectionIntro
        icon={IconRulerMeasure}
        title="Dimensiones y configuracion"
        description="Medidas, suspension y tornamesa."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Field
          name="ancho"
          label="Ancho"
          type="number"
          step="0.001"
          defaultValue={activo?.vehiculo?.ancho ?? undefined}
        />
        <Field
          name="longitud"
          label="Longitud"
          type="number"
          step="0.001"
          defaultValue={activo?.vehiculo?.longitud ?? undefined}
        />
        <Field
          name="alto"
          label="Alto"
          type="number"
          step="0.001"
          defaultValue={activo?.vehiculo?.alto ?? undefined}
        />
        <Field name="tipoSuspension" label="Tipo de suspension" defaultValue={activo?.vehiculo?.tipoSuspension ?? undefined} />
        <Field name="tipoTornamesa" label="Tipo de tornamesa" defaultValue={activo?.vehiculo?.tipoTornamesa ?? undefined} />
        <SelectField
          name="claseEuroReferenciaId"
          label="Clase Euro / NEC"
          defaultValue={
            activo?.vehiculo?.claseEuroReferenciaId != null
              ? String(activo.vehiculo.claseEuroReferenciaId)
              : ""
          }
          opciones={catalogos.clasesEuro}
        />
        <Field
          name="ratioCorona"
          label="Ratio de corona"
          max="9.99"
          min="0"
          placeholder="0.00"
          step="0.01"
          type="number"
          defaultValue={activo?.vehiculo?.ratioCorona ?? undefined}
        />
        <SelectField
          name="tipoTransmisionReferenciaId"
          label="Tipo transmision"
          defaultValue={
            activo?.vehiculo?.tipoTransmisionReferenciaId != null
              ? String(activo.vehiculo.tipoTransmisionReferenciaId)
              : ""
          }
          opciones={catalogos.tiposTransmision}
        />
      </div>
    </>
  );
}

export function TabControl({
  activo,
  catalogos,
}: {
  activo?: Activo;
  catalogos: CatalogosActivos;
}) {
  return (
    <>
      <SectionIntro
        icon={IconShieldCheck}
        title="Control operativo"
        description="Condicion del activo, calibracion y observaciones."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField name="estadoOperativo" label="Condicion activo" defaultValue={activo?.vehiculo?.estadoOperativo ?? "OPERATIVO"} values={["OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"]} />
        <SelectField
          name="estadoCalibracionReferenciaId"
          label="Estado calibracion"
          defaultValue={
            activo?.vehiculo?.estadoCalibracionReferenciaId != null
              ? String(activo.vehiculo.estadoCalibracionReferenciaId)
              : String(
                  catalogos.idPorNombre("ESTADO_CALIBRACION", "Pendiente") ?? ""
                )
          }
          opciones={catalogos.estadosCalibracion}
          required
        />
      </div>
      <div className="pt-4">
        <Field name="observacion" label="Observacion" defaultValue={activo?.observacion ?? undefined} />
      </div>
    </>
  );
}
