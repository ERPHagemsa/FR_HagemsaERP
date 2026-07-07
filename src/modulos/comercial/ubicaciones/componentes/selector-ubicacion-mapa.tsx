"use client";

import * as React from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

import { resolverDistritoPorPunto } from "../servicios/geo-api";
import type { DatosUbicacionGeo } from "../tipos/ubicaciones.tipos";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

// Centro por defecto: Lima, Perú (cuando no hay coordenada inicial).
const CENTRO_PERU = { lat: -12.0464, lng: -77.0428 };

type Props = {
  valorInicial?: { latitud: number | null; longitud: number | null };
  onSeleccion: (datos: DatosUbicacionGeo) => void;
};

/**
 * Selector de ubicación con mapa interactivo: autocompletado de Google Places
 * (API New) + pin arrastrable. Al elegir un lugar o mover el pin, extrae los
 * componentes de dirección (niveles administrativos de Perú) y emite onSeleccion.
 *
 * La clave se lee de NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (expuesta al navegador por
 * diseño; DEBE estar restringida por HTTP referrer + API en Google Cloud).
 * Si falta la clave, degrada a un aviso y el formulario sigue usable a mano.
 */
export function SelectorUbicacionMapa({ valorInicial, onSeleccion }: Props) {
  if (!API_KEY) {
    return (
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        Mapa no disponible: falta configurar{" "}
        <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>. Podés completar los campos
        a mano.
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <MapaConPin valorInicial={valorInicial} onSeleccion={onSeleccion} />
    </APIProvider>
  );
}

function MapaConPin({ valorInicial, onSeleccion }: Props) {
  const map = useMap();
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");
  const contenedorInput = React.useRef<HTMLDivElement>(null);

  const inicial =
    valorInicial?.latitud != null && valorInicial?.longitud != null
      ? { lat: valorInicial.latitud, lng: valorInicial.longitud }
      : CENTRO_PERU;

  const [posicion, setPosicion] = React.useState(inicial);

  const geocoder = React.useMemo(
    () => (geocoding ? new geocoding.Geocoder() : null),
    [geocoding]
  );

  // Emite la selección resolviendo departamento/provincia/distrito con la
  // geo-api (point-in-polygon sobre límites INEI, exacto en Perú). De Google
  // se toman país, dirección, coordenadas y nombre. Si el punto cae fuera de
  // Perú (o la geo-api falla), se usan los niveles administrativos de Google.
  const emitirConGeo = React.useCallback(
    async (
      lat: number,
      lng: number,
      origen: { nombre?: string; direccion: string; admin: AdminGeo }
    ) => {
      let { pais, departamento, provincia, distrito } = origen.admin;
      try {
        const geo = await resolverDistritoPorPunto(lat, lng);
        if (geo) {
          pais = "Peru";
          departamento = geo.departamento;
          provincia = geo.provincia;
          distrito = geo.distrito;
        }
      } catch {
        // geo-api caída → se cae a los niveles de Google (ya en las variables).
      }
      onSeleccion({
        nombre: origen.nombre,
        pais,
        departamento,
        provincia,
        distrito,
        direccion: origen.direccion,
        latitud: lat,
        longitud: lng,
      });
    },
    [onSeleccion]
  );

  // Reverse geocoding al mover el pin: Google resuelve la dirección; la geo-api
  // el distrito/provincia/departamento.
  const resolverPorCoordenada = React.useCallback(
    async (lat: number, lng: number) => {
      if (!geocoder) return;
      try {
        const { results } = await geocoder.geocode({ location: { lat, lng } });
        const r = results[0];
        if (!r) return;
        await emitirConGeo(lat, lng, {
          direccion: r.formatted_address,
          admin: extraerDeGeocoder(r.address_components),
        });
      } catch {
        // Silencioso: si falla el geocoder, el usuario ajusta a mano.
      }
    },
    [geocoder, emitirConGeo]
  );

  // Autocomplete de Places (API New): PlaceAutocompleteElement embebido.
  React.useEffect(() => {
    if (!places || !contenedorInput.current) return;
    const contenedor = contenedorInput.current;

    const pae = new places.PlaceAutocompleteElement({
      includedRegionCodes: ["pe"],
    });
    contenedor.appendChild(pae as unknown as Node);

    const alElegir = async (evento: Event) => {
      const prediccion = (evento as unknown as GmpSelectEvent).placePrediction;
      const lugar = prediccion.toPlace();
      await lugar.fetchFields({
        fields: [
          "displayName",
          "formattedAddress",
          "location",
          "addressComponents",
        ],
      });
      const loc = lugar.location;
      if (!loc) return;
      const lat = loc.lat();
      const lng = loc.lng();
      setPosicion({ lat, lng });
      map?.panTo({ lat, lng });
      map?.setZoom(15);
      await emitirConGeo(lat, lng, {
        nombre: lugar.displayName ?? undefined,
        direccion: lugar.formattedAddress ?? "",
        admin: extraerDePlace(lugar.addressComponents ?? []),
      });
    };

    pae.addEventListener("gmp-select", alElegir as EventListener);
    return () => {
      pae.removeEventListener("gmp-select", alElegir as EventListener);
      pae.remove();
    };
  }, [places, map, emitirConGeo]);

  return (
    <div className="grid gap-2">
      <div ref={contenedorInput} />
      <div className="h-72 w-full overflow-hidden rounded-md border md:h-104">
        <Map
          defaultCenter={inicial}
          defaultZoom={valorInicial?.latitud != null ? 15 : 11}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
        >
          <Marker
            position={posicion}
            draggable
            onDragEnd={(e) => {
              const lat = e.latLng?.lat();
              const lng = e.latLng?.lng();
              if (lat == null || lng == null) return;
              setPosicion({ lat, lng });
              void resolverPorCoordenada(lat, lng);
            }}
          />
        </Map>
      </div>
      <p className="text-xs text-muted-foreground">
        Buscá el lugar o arrastrá el pin para ajustar. Los campos de abajo se
        completan solos y podés editarlos.
      </p>
    </div>
  );
}

// El evento `gmp-select` del PlaceAutocompleteElement (API New) no está tipado
// en @types/google.maps: se describe el shape mínimo que se usa.
interface GmpSelectEvent extends Event {
  placePrediction: {
    toPlace: () => google.maps.places.Place;
  };
}

interface AdminGeo {
  pais: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

// Estos son los niveles administrativos de Google. Se usan SOLO como respaldo
// (fallback) cuando el punto cae fuera de Perú o la geo-api no responde: para
// puntos en Perú, departamento/provincia/distrito los resuelve la geo-api por
// point-in-polygon (más exacto; Google en Perú omite el distrito o trae la
// urbanización en sublocality). Ver emitirConGeo / resolverDistritoPorPunto.
function elegir(
  componentes: { types: string[]; valor: string }[],
  tipo: string
): string {
  return componentes.find((c) => c.types.includes(tipo))?.valor ?? "";
}

function extraerDePlace(
  comps: google.maps.places.AddressComponent[]
): AdminGeo {
  const norm = comps.map((c) => ({
    types: c.types,
    valor: c.longText ?? c.shortText ?? "",
  }));
  return {
    pais: elegir(norm, "country"),
    departamento: elegir(norm, "administrative_area_level_1"),
    provincia: elegir(norm, "administrative_area_level_2"),
    distrito: elegir(norm, "administrative_area_level_3"),
  };
}

function extraerDeGeocoder(
  comps: google.maps.GeocoderAddressComponent[]
): AdminGeo {
  const norm = comps.map((c) => ({ types: c.types, valor: c.long_name }));
  return {
    pais: elegir(norm, "country"),
    departamento: elegir(norm, "administrative_area_level_1"),
    provincia: elegir(norm, "administrative_area_level_2"),
    distrito: elegir(norm, "administrative_area_level_3"),
  };
}
