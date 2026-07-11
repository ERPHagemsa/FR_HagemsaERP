"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { Camera, ImageUp } from "lucide-react";

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

/**
 * Extrae el token de etiqueta del contenido de un QR. Acepta tanto la URL
 * completa que imprime el sistema (https://.../e/{token}) como un token UUID
 * pegado a secas. Devuelve null si el QR no parece de una etiqueta nuestra.
 */
export function extraerTokenDeContenidoQr(contenido: string): string | null {
  const texto = contenido.trim();
  const patronUuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  const rutaEtiqueta = texto.match(/\/e\/([^/?#\s]+)/i);
  if (rutaEtiqueta) {
    const candidato = rutaEtiqueta[1];
    return patronUuid.test(candidato) ? candidato : null;
  }

  const uuidSuelto = texto.match(patronUuid);
  return uuidSuelto ? uuidSuelto[0] : null;
}

/**
 * Lector de QR de etiquetas: camara en vivo con opcion de subir una foto
 * debajo (para cuando ya se tiene la captura o no hay camara disponible).
 * Devuelve el TOKEN extraido via onTokenLeido; la resolucion de que etiqueta
 * es y su vinculacion las hace el consumidor.
 */
export function LectorQrEtiqueta({
  abierto,
  onCerrar,
  onTokenLeido,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onTokenLeido: (token: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputArchivoRef = useRef<HTMLInputElement>(null);
  const [camaraDisponible, setCamaraDisponible] = useState<boolean | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Mantiene el callback vigente sin reiniciar la camara en cada render.
  const onTokenLeidoRef = useRef(onTokenLeido);
  onTokenLeidoRef.current = onTokenLeido;

  function procesarContenido(contenido: string) {
    const token = extraerTokenDeContenidoQr(contenido);
    if (!token) {
      setError(
        "El QR leido no es una etiqueta de activos (no contiene un token valido)."
      );
      return;
    }
    setError(null);
    onTokenLeidoRef.current(token);
  }

  useEffect(() => {
    if (!abierto) return;

    const video = videoRef.current;
    if (!video) return;
    const videoElement = video;

    setError(null);
    setCamaraDisponible(null);
    let scanner: QrScanner | null = null;
    let cancelado = false;

    async function iniciarCamara() {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelado) {
          setCamaraDisponible(false);
          setError(
            "La camara requiere abrir la aplicacion con HTTPS. En el celular no funciona desde una URL http://192.168..."
          );
        }
        return;
      }

      try {
        // Esta llamada muestra de forma explicita el dialogo nativo de permiso.
        // Se libera de inmediato: qr-scanner abre su propio stream sobre el video.
        const permiso = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        permiso.getTracks().forEach((track) => track.stop());
        if (cancelado) return;

        scanner = new QrScanner(
          videoElement,
          (resultado) => procesarContenido(resultado.data),
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: "environment",
          }
        );
        await scanner.start();
        if (!cancelado) setCamaraDisponible(true);
      } catch (causa) {
        if (cancelado) return;
        const nombre =
          causa instanceof DOMException ? causa.name : "Error de camara";
        setCamaraDisponible(false);
        setError(
          nombre === "NotAllowedError"
            ? "No se concedio permiso para usar la camara. Permitelo en los ajustes del navegador y vuelve a intentar."
            : nombre === "NotFoundError"
              ? "No se encontro una camara disponible en este dispositivo."
              : "No se pudo iniciar la camara. Puedes subir una foto del QR."
        );
      }
    }

    void iniciarCamara();

    return () => {
      cancelado = true;
      scanner?.stop();
      scanner?.destroy();
    };
    // procesarContenido usa refs; solo importa abrir/cerrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  async function handleArchivoSeleccionado(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    try {
      const resultado = await QrScanner.scanImage(archivo, {
        returnDetailedScanResult: true,
      });
      procesarContenido(resultado.data);
    } catch {
      setError(
        "No se pudo leer ningun QR en la imagen. Intenta con una foto mas nitida y de frente."
      );
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      onCerrar();
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear etiqueta QR</DialogTitle>
          <DialogDescription>
            Apunta la camara al QR impreso de la etiqueta. Si ya tienes una
            foto del QR, subela con el boton de abajo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-lg border border-border bg-black">
            {/* qr-scanner pinta el stream y el recuadro de deteccion aqui */}
            <video ref={videoRef} className="h-64 w-full object-cover" />
            {camaraDisponible === null ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/95 p-4 text-center">
                <Camera className="size-8 animate-pulse text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Solicitando permiso para usar la camara...
                </p>
              </div>
            ) : null}
            {camaraDisponible === false ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/95 p-4 text-center">
                <Camera className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No se pudo usar la camara. Revisa el mensaje o usa la opcion
                  de subir foto.
                </p>
              </div>
            ) : null}
          </div>

          <input
            ref={inputArchivoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleArchivoSeleccionado(e)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputArchivoRef.current?.click()}
          >
            <ImageUp />
            Subir foto del QR
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
