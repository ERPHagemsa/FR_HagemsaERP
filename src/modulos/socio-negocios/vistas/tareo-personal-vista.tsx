"use client"

import { Clock } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs"

import {
  ConfiguracionesLaboralesTab,
  TiposTareoTab,
} from "./tareo-personal/tabs"

export function TareoPersonalVista() {
  return (
    <>
      <SiteHeader
        title="Horarios y regímenes"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: "Horarios y regímenes" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              <h1 className="text-xl font-semibold tracking-normal">Horarios y regímenes</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Define los tipos de horario (por turno, por horario o por régimen) y sus
              configuraciones (turno, régimen 14x7, feriados, nocturnidad, horas extra y vigencia)
              que luego se eligen al asignar al personal.
            </p>
          </section>

          <Tabs defaultValue="tipos" className="gap-4">
            <TabsList variant="line">
              <TabsTrigger value="tipos">Tipos de horario</TabsTrigger>
              <TabsTrigger value="configuraciones">Configuraciones</TabsTrigger>
            </TabsList>
            <TabsContent value="tipos">
              <TiposTareoTab />
            </TabsContent>
            <TabsContent value="configuraciones">
              <ConfiguracionesLaboralesTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
