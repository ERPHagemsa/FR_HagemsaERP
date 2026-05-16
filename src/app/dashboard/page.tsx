import { DashboardContent } from "@/compartido/componentes/dashboard-content"
import { SiteHeader } from "@/compartido/componentes/site-header"

export default function Page() {
  return (
    <>
      <SiteHeader title="Dashboard" />
      <DashboardContent />
    </>
  )
}
