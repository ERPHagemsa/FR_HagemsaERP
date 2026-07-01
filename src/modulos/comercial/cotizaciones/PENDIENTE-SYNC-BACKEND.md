# Pendiente — sincronizar el editor de Cotizaciones con el backend (BC03)

> Cambios de **contrato de API** ya aplicados en el backend (`BC03_Comercial`) que el
> editor de cotizaciones del frontend **todavía no refleja**. Mientras no se apliquen,
> **guardar el borrador fallará con `400`** (el backend usa `forbidNonWhitelisted: true`
> → rechaza propiedades desconocidas como `standbys`).
>
> Referencia de contrato: `BC03_Comercial/docs/api/API-Cotizaciones.md §5.4` y
> `docs/tecnico/modelo-de-dominio.md`.

---

## Stand-by: ya NO es a nivel versión — ahora es `standbyDia` por línea/cargo — ✅ HECHO (frontend 2026-06-30)

**Estado backend:** ✅ hecho y commiteado (`efcb192`, migración `20260630120000_standby_por_linea_y_cargo`).
**Estado frontend:** ✅ aplicado — tipos sin `Standby`/`PayloadStandby`; `standbyDia` en línea/cargo (read→draft→payload+validación); editor de stand-by de versión eliminado; inputs de `standbyDia` en el editor de línea (solo TRANSPORTE) y en el de cargos; pestaña Standby del notebook retirada. `npm run build` verde.

**Qué cambió en el contrato**
- Se **eliminó** el array `standbys[]` a nivel versión (tanto en request como en response).
- El stand-by es ahora el campo **`standbyDia`** (espera por día, `number | null`):
  - en cada **línea de transporte** (`lineas[].standbyDia`),
  - en cada **cargo adicional** (`...cargosAdicionales[].standbyDia`).
- Es informativo: **no suma** al subtotal ni al total. Regla: `standbyDia >= 0` o `null`.

> Nota: los **cargos adicionales a nivel sección SIGUEN EXISTIENDO** (`secciones[].cargosAdicionales`).
> Esa parte del editor no cambia; solo cambia el stand-by.

**Qué hacer en el frontend**
- `tipos/cotizaciones.tipos.ts`:
  - **Borrar** `type Standby`, `Version.standbys`, `type PayloadStandby`, `PayloadBorrador.standbys`.
  - **Agregar** `standbyDia?: number | null` a: `Linea`, `CargoAdicional`, `PayloadLinea`, `PayloadCargoAdicional`.
- `servicios/cotizaciones-editor.utils.ts`:
  - **Borrar** `DraftStandby`, `standbyVacio()`, `standbyReadADraft()`, `standbyAPayload()`, `StandbyCompat`, `DraftBorrador.standbys`, la lectura `version.standbys`, la emisión `standbys` en el payload y la validación de `standbys`.
  - **Agregar** `standbyDia` a `DraftLinea` y `DraftCargoAdicional` (read → draft → payload), con validación `>= 0` cuando esté presente.
- Componentes:
  - **Eliminar** `componentes/editor-standby.tsx` (ya no hay editor de stand-by a nivel versión) y su uso en `editor-contenido.tsx` / `editor-borrador-campos.tsx` / `cotizacion-versiones-notebook.tsx`.
  - **Agregar** un input `standbyDia` en el editor de **línea** y en el de **cargo** (`editor-cargos.tsx`, `linea-formulario.tsx` / `lineas-grid.utils.ts` según dónde se editen línea y cargo).
- Donde se **muestre** el stand-by de una versión guardada, leerlo ahora de `lineas[].standbyDia` y de los cargos, no de `version.standbys`.

---

## Checklist de verificación (standby)
- [x] No queda ninguna emisión de `standbys` en los payloads (si no, `400` por `forbidNonWhitelisted`).
- [x] Los tipos compilan sin `Standby` / `PayloadStandby`.
- [x] Editor de stand-by a nivel versión eliminado; inputs de `standbyDia` en línea y cargo.
- [x] Los cargos adicionales (línea **y sección**) siguen funcionando sin cambios.
- [ ] _(QA manual)_ Guardar un borrador con `standbyDia` → `204`, y el GET lo devuelve en `lineas[].standbyDia`.

---

## Futuro — cuando se implemente el "cargo en tarifario" (backend en pausa)

> Este bloque NO es urgente: el backend del cargo-en-tarifario está **pausado** (ver
> `BC03_Comercial/docs/ai/BACKLOG.md` · EP-03-004). Cuando se implemente, el frontend deberá:

- **Excluir la modalidad `SIN_MODALIDAD` del selector de modalidad** al crear/editar una **línea** de cotización. `SIN_MODALIDAD` (`tipoLinea = TRANSPORTE`) es un **default interno del tarifario** para los cargos de nivel sección — el ejecutivo no debe poder elegirla manualmente en una línea. Es decir: al listar modalidades para el selector, filtrar fuera `codigo === "SIN_MODALIDAD"`.
- **Ruta a nivel de sección (UX):** la captura de origen/destino se presenta a nivel de **sección**, pero se persiste en cada **línea** de la sección (el backend mantiene la ruta en `LineaCarga`). El front debe garantizar que **todas las líneas de una sección tengan el mismo origen/destino** (si no, el backend rechaza al ganar la cotización con un mensaje de "falta/inconsistente la ruta").
- Los cargos de sección **no llevan** origen/destino propios (los heredan de las líneas); no agregar ese campo al cargo de sección.
- **Cambio de contrato del preview (`GET /cotizaciones/:id/tarifario`):** antes devolvía un **arreglo** de tarifas; ahora devuelve **`{ tarifas: [...], cargos: [...] }`**. El front debe leer `respuesta.tarifas` (y `respuesta.cargos` para los cargos de la vista derivada). _(Aplicado en backend 2026-06-30.)_
- **`GET /tarifarios/:id`** ahora incluye `cargos[]` (además de `tarifas[]`): `{ id, idModalidad, concepto, unidadCobro, origen, destino, condicion, precio, tarifaStandbyDia, orden }`.
- **CRUD de cargos del tarifario** (nuevos endpoints, permiso `bc03:tarifario:escribir`): `POST /tarifarios/:id/cargos`, `PATCH /tarifarios/:id/cargos/:idCargo`, `DELETE /tarifarios/:id/cargos/:idCargo`. Sirven para editar los cargos del tarifario (incl. cambiar la modalidad por defecto `SIN_MODALIDAD`).
- **Cambio de contrato del consolidado (`GET /contratos/tarifario-consolidado/:idClienteExterno`):** antes devolvía un **arreglo** de tarifas; ahora devuelve **`{ tarifas: [...], cargos: [...] }`**. El front debe leer `respuesta.tarifas` y `respuesta.cargos`. _(Aplicado en backend 2026-06-30.)_
