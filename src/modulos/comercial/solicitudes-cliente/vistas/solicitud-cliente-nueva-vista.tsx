import { SolicitudClienteFormulario } from "../componentes/solicitud-cliente-formulario";

export function SolicitudClienteNuevaVista() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <SolicitudClienteFormulario />
      </div>
    </main>
  );
}
