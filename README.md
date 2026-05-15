# Front DDD

Proyecto Next.js con App Router organizado por contextos funcionales.

## Estructura base

```text
src/
├── app/
│   ├── comercial/
│   ├── despacho/
│   ├── flota/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── compartido/
│   ├── componentes/
│   │   └── ui/
│   ├── constantes/
│   ├── ganchos/
│   ├── servicios/
│   ├── tipos/
│   └── utilidades/
└── modulos/
    ├── comercial/
    │   ├── componentes/
    │   ├── ganchos/
    │   ├── servicios/
    │   ├── tipos/
    │   ├── utilidades/
    │   └── vistas/
    ├── despacho/
    │   ├── componentes/
    │   ├── ganchos/
    │   ├── servicios/
    │   ├── tipos/
    │   ├── utilidades/
    │   └── vistas/
    └── flota/
        ├── componentes/
        ├── ganchos/
        ├── servicios/
        ├── tipos/
        ├── utilidades/
        └── vistas/
```

## Criterios

- `app/`: define rutas, layouts y puntos de entrada de Next.js.
- `modulos/`: agrupa la logica de negocio del frontend por feature.
- `compartido/`: concentra piezas reutilizables entre contextos.

## Desarrollo

```bash
pnpm dev
```
