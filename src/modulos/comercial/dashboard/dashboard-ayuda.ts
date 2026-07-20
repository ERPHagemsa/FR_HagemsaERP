/**
 * Copy de ayuda de cada métrica del dashboard comercial: explicaciones en
 * lenguaje llano (no técnico) mostradas en el `Popover` de `AyudaMetrica`
 * dentro de cada card. Centralizado acá para mantener un único punto de
 * verdad del texto y evitar duplicarlo entre widgets.
 */
export const DASHBOARD_AYUDA = {
  winRate:
    "ganadas ÷ (ganadas + perdidas + vencidas). Solo cuenta cotizaciones ya resueltas; una vencida (caducó sin respuesta) suma como no-ganada.",
  cicloCierre:
    "Cuántos días tarda, en promedio, una cotización desde que se crea hasta que se gana. Menos días es mejor: significa que cerrás las ventas más rápido. La variación compara contra el período anterior.",
  tendencia:
    "Cantidad de cotizaciones ganadas o perdidas a lo largo del período. Tocá 'Ganadas' o 'Perdidas' arriba para cambiar qué serie dibuja el gráfico; los números de cada botón son el total del período. Cuenta cotizaciones, no dinero (el dinero está en los KPIs y en el ranking). Se ajusta al filtro de arriba: si el rango es corto lo muestra por día y si es largo por mes, cortando siempre en la fecha de hoy.",
  ranking:
    "Compara a los ejecutivos por monto ganado en el período. Incluye el monto ganado, la utilidad y el margen (S/ y US$), el win rate, y dos divisiones (cotizados sobre el total y ganadas sobre enviadas, ver la ayuda de cada columna). Muestra siempre al equipo completo.",
  efectividadCotizadas:
    "Cuántas de las cotizaciones del ejecutivo llegaron a enviarse al cliente, sobre el 'Total': las cotizaciones que tuvieron movimiento en el período (se crearon, se enviaron o se cerraron dentro de él). Numerador y denominador se cuentan sobre ese mismo grupo.",
  efectividadCierre:
    "De las cotizaciones del ejecutivo que llegaron a enviarse al cliente, cuántas se ganaron. Incluye las enviadas que todavía no tuvieron respuesta del cliente (siguen sumando al denominador aunque aún no se resuelvan). Es distinto del 'Win rate': ese solo mira las cotizaciones ya resueltas (ganadas sobre ganadas más perdidas), por eso puede mostrar un número distinto en la misma fila sin que ninguno de los dos esté mal calculado.",
  motivosPerdida:
    "Agrupa las cotizaciones perdidas del período según el motivo registrado. Ayuda a identificar las causas más frecuentes de pérdida.",
  embudo:
    "Muestra cuántas oportunidades avanzan por cada etapa del proceso: solicitud, cotizada, enviada y ganada. La caída entre etapas indica dónde se pierden oportunidades.",
  accionesPorVencer:
    "Cotizaciones enviadas cuya validez vence en las próximas 72 horas. Conviene darles seguimiento antes de que caduquen.",
  accionesEsperandoAprobacion:
    "Cotizaciones que requieren aprobación interna antes de poder enviarse al cliente.",
  accionesSinCotizar:
    "Solicitudes de clientes que todavía no tienen una cotización. Son oportunidades pendientes de atender.",
  resumenPeriodo:
    "Resumen del período en dos partes que NO se deben mezclar: la actividad cuenta solicitudes por su fecha de creación, y el cierre mide dinero por su fecha de cierre. Son grupos distintos de cotizaciones: no dividas un número de una parte por uno de la otra.",
  actividadPeriodo:
    "Cuántas solicitudes se crearon en el período, cuántas de ellas llegaron a cotizarse y cuántas se ganaron. Se cuentan por la fecha en que se creó la solicitud, sin importar cuándo se cerraron. Son cantidades, no dinero.",
  perdidas:
    "Solicitudes que el cliente rechazó: tienen al menos una cotización marcada como perdida y ninguna ganada. No incluye cotizaciones vencidas ni canceladas, porque esas no son un \"no\" del cliente, sino que expiraron o se cancelaron internamente sin respuesta.",
  cerradoPeriodo:
    "Dinero de las cotizaciones que se cerraron dentro del período, contadas por su fecha de cierre (aunque la solicitud se haya creado antes). S/ y US$ se muestran siempre por separado: no se suman ni se convierten entre sí.",
  margen:
    "De todo lo que le cobré al cliente, cuánto fue ganancia. Si vendí S/ 100 y me quedaron S/ 23, el margen es 23%. Un margen más alto significa que el mismo monto vendido deja más utilidad. Se calcula por separado para cada moneda. Si no hubo cierres en una moneda, no se muestra margen.",
  motivosRespuestaCliente:
    'Qué respondió el CLIENTE ante nuestras cotizaciones, según el motivo que eligió de una lista fija. Se separa en Rechazo (cerró la puerta) y Negociación (sigue conversando). Es distinto de "Motivos de pérdida", que es lo que escribe el ejecutivo con sus palabras.',
} as const;
