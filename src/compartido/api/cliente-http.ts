import { crearClienteHttp } from "@/compartido/api/axios"

// Cliente HTTP para el NAVEGADOR.
// Pega a rutas relativas del propio Next (`/api/...`). Las cookies httpOnly
// viajan solas porque son same-origin. NO inyecta Authorization: el bearer
// token vive en cookies httpOnly y los Route Handlers de Next lo reenvian al
// backend correspondiente.
//
// Para llamadas desde Route Handlers o middleware (server-side), crear una
// instancia propia con crearClienteHttp({ baseURL: ... }).
export const clienteHttp = crearClienteHttp({
  baseURL: "",
  timeoutMs: 8000,
})
