/**
 * Copy de ayuda de cada métrica del dashboard comercial: explicaciones en
 * lenguaje llano (no técnico) mostradas en el `Popover` de `AyudaMetrica`
 * dentro de cada card. Centralizado acá para mantener un único punto de
 * verdad del texto y evitar duplicarlo entre widgets.
 */
export const DASHBOARD_AYUDA = {
  kpisMonetarios:
    "Ganado: monto ya cerrado en cotizaciones ganadas. Pipeline: monto en cotizaciones abiertas (aún en negociación). Ticket promedio: valor promedio de una cotización ganada. Todo se muestra separado por moneda (S/ y US$); las monedas no se suman ni se convierten entre sí.",
  winRate:
    "Porcentaje de cotizaciones cerradas que se ganaron. Se calcula sobre las ganadas y perdidas del período; las que siguen abiertas no se cuentan. Un valor más alto indica mejor conversión. La variación compara contra el período anterior.",
  cicloCierre:
    "Promedio de días desde que se crea una cotización hasta que se gana. Menos días indica un cierre más rápido. La variación compara contra el período anterior.",
  tendencia:
    "Monto ganado y perdido mes a mes durante los últimos meses. Permite ver la evolución del cierre en el tiempo. Este gráfico siempre muestra los últimos meses y no depende del período seleccionado.",
  ranking:
    "Compara a los ejecutivos por monto ganado en el período. Incluye el monto ganado (S/ y US$), la cantidad de cotizaciones cerradas y el win rate de cada uno. Muestra siempre al equipo completo.",
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
  cerradoPeriodo:
    "Dinero de las cotizaciones que se cerraron dentro del período, contadas por su fecha de cierre (aunque la solicitud se haya creado antes). S/ y US$ se muestran siempre por separado: no se suman ni se convierten entre sí.",
  margen:
    "De todo lo que le cobré al cliente, cuánto fue ganancia. Si vendí S/ 100 y me quedaron S/ 23, el margen es 23%. Un margen más alto significa que el mismo monto vendido deja más utilidad. Se calcula por separado para cada moneda. Si no hubo cierres en una moneda, no se muestra margen.",
  motivosRespuestaCliente:
    'Qué respondió el CLIENTE ante nuestras cotizaciones, según el motivo que eligió de una lista fija. Se separa en Rechazo (cerró la puerta) y Negociación (sigue conversando). Es distinto de "Motivos de pérdida", que es lo que escribe el ejecutivo con sus palabras.',
} as const;
