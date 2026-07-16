// Roles de autorizacion compartidos del ecosistema HAGEMSA.
//
// ROLES_RESTAURAR: potestad de restaurar (revertir la baja logica / soft-delete)
// registros del BC-03 Comercial. Modelo BC-03: Jefe Comercial + Admin (ver memoria
// bc03-roles-autorizacion). Se promovio desde el pilot de prospectos a este lugar
// compartido cuando aparecio el segundo consumidor (solicitudes de cliente); hoy lo
// importan tanto prospectos como solicitudes, y quedara disponible para cotizaciones.
export const ROLES_RESTAURAR = ["BC03_JEFE_COMERCIAL", "BC03_ADMIN"] as const;
