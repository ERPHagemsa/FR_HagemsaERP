// Componente de visualizacion de contactos del prospecto.
// Slice 2: modo solo lectura. Los puntos de extension para agregar/eliminar/marcar
// principal se implementan en slice 4 (mutaciones de contactos).

import { Badge } from "@/compartido/componentes/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import type { Contacto } from "../tipos/prospecto.tipos";

type Props = {
  contactos: Contacto[];
  // esTerminal: extension point para slice 4 (acciones de contacto)
  esTerminal?: boolean;
};

export function ContactosProspecto({ contactos }: Props) {
  const activos = contactos.filter((c) => c.activo);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Contactos ({activos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este prospecto no tiene contactos registrados.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full [&_td]:px-3 [&_th]:px-3">
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Principal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activos.map((contacto) => (
                  <TableRow key={contacto.id}>
                    <TableCell className="font-medium">
                      {contacto.nombre}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contacto.cargo ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contacto.telefono ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contacto.email ?? "-"}
                    </TableCell>
                    <TableCell>
                      {contacto.esPrincipal ? (
                        <Badge variant="default">Principal</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
