import { DashboardContent } from "@/compartido/componentes/dashboard-content"
import { SiteHeader } from "@/compartido/componentes/site-header"

export default function Home() {
  return (
    <>
      <SiteHeader title="Inicio" />
      <DashboardContent />
    </>
  )
}
