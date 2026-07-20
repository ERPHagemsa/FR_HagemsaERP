// Normalizadores de correo y nombre de usuario. Se aplican en el propio input
// (onChange) para que lo que se ve sea exactamente lo que viaja al backend, en
// vez de depender de que quien carga escriba bien.

// Marcas combinantes Unicode (U+0300-U+036F): lo que NFD separa de la letra
// base. Se arma con fromCharCode para no dejar caracteres invisibles en el
// fuente. El target del proyecto es ES2017, que no admite \p{Diacritic}.
const DIACRITICOS = new RegExp(
  "[" + String.fromCharCode(0x300) + "-" + String.fromCharCode(0x36f) + "]",
  "g",
)

// Convierte tildes y diacriticos a su letra base: "José" -> "Jose", "ñ" -> "n".
// Se transforma en vez de borrar el caracter para no mutilar lo escrito: si se
// eliminara, "josé" quedaria "jos".
function quitarDiacriticos(valor: string): string {
  return valor.normalize("NFD").replace(DIACRITICOS, "")
}

// Correo: minusculas, sin espacios ni tildes. Conserva solo los caracteres que
// una direccion admite (letras, digitos y @ . _ - +); el resto se descarta.
export function normalizarEmail(valor: string): string {
  return quitarDiacriticos(valor)
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]/g, "")
    .slice(0, 255)
}

// Nombre de usuario: minusculas, sin espacios ni tildes. Refleja la regla del
// dominio (^[a-z][a-z0-9._-]{2,29}$), que admite guion bajo, punto y guion.
export function normalizarNombreUsuario(valor: string): string {
  return quitarDiacriticos(valor)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 30)
}
