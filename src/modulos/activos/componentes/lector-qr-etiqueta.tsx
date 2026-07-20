"use client";

import { useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Camera, ImageUp, LoaderCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";

export type IdentificadorQrEtiqueta =
  | { tipo: "token"; valor: string }
  | { tipo: "id"; valor: number };

/**
 * Extrae el identificador de una etiqueta desde el contenido del QR.
 * Acepta el formato legado `/e/{token}` y el formato nuevo
 * `/activo/?idactivo={idEtiqueta}`.
 */
export function extraerIdentificadorDeContenidoQr(
  contenido: string,
): IdentificadorQrEtiqueta | null {
  const texto = contenido.trim();
  const patronUuid =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  const rutaEtiqueta = texto.match(/\/e\/([^/?#\s]+)/i);
  if (rutaEtiqueta) {
    const candidato = rutaEtiqueta[1];
    return patronUuid.test(candidato) ? { tipo: "token", valor: candidato } : null;
  }

  const rutaInventario = texto.match(/\/activo\/?\?[^#\s]*idactivo=(\d+)/i);
  if (rutaInventario) {
    return { tipo: "id", valor: Number(rutaInventario[1]) };
  }

  const uuidSuelto = texto.match(patronUuid);
  if (uuidSuelto) {
    return { tipo: "token", valor: uuidSuelto[0] };
  }

  const idSuelto = texto.match(/^(\d+)$/);
  return idSuelto ? { tipo: "id", valor: Number(idSuelto[1]) } : null;
}

/**
 * Flujo movil deliberadamente basado en foto: el navegador abre la camara
 * nativa mediante `capture=environment`, luego qr-scanner analiza la imagen.
 * Evita depender del preview getUserMedia, que se bloquea en algunos telefonos.
 */
export function LectorQrEtiqueta({
  abierto,
  onCerrar,
  onTokenLeido,
  titulo = "Vincular etiqueta QR",
  descripcion = "Toma una foto clara del QR impreso. La etiqueta se analizara antes de vincularla al activo.",
}: {
  abierto: boolean;
  onCerrar: () => void;
  onTokenLeido: (identificador: IdentificadorQrEtiqueta) => void;
  titulo?: string;
  descripcion?: string;
}) {
  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  const inputCamaraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);

  async function handleArchivoSeleccionado(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    setError(null);
    setAnalizando(true);
    try {
      const resultado = await QrScanner.scanImage(archivo, {
        returnDetailedScanResult: true,
      });
      const identificador = extraerIdentificadorDeContenidoQr(resultado.data);
      if (!identificador) {
        setError("La foto no contiene una etiqueta QR de Activos valida.");
        return;
      }
      onTokenLeido(identificador);
    } catch {
      setError(
        "No se encontro un QR legible. Toma la foto de frente, con buena luz y sin recortar el codigo."
      );
    } finally {
      setAnalizando(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setAnalizando(false);
      onCerrar();
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <input
            ref={inputCamaraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void handleArchivoSeleccionado(e)}
          />
          <input
            ref={inputGaleriaRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleArchivoSeleccionado(e)}
          />

          <Button
            type="button"
            size="lg"
            disabled={analizando}
            onClick={() => inputCamaraRef.current?.click()}
          >
            {analizando ? <LoaderCircle className="animate-spin" /> : <Camera />}
            {analizando ? "Analizando QR..." : "Tomar foto del QR"}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={analizando}
            onClick={() => inputGaleriaRef.current?.click()}
          >
            <ImageUp />
            Elegir foto de galeria
          </Button>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo leer el QR</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
