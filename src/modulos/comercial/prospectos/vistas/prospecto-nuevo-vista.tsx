import { ProspectoFormulario } from "../componentes/prospecto-formulario";

export function ProspectoNuevoVista() {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <ProspectoFormulario modo="nuevo" />
      </div>
    </main>
  );
}
