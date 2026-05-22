import { AppShell } from "@/compartido/componentes/app-shell"

export default function PrivadoLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AppShell>{children}</AppShell>
}
