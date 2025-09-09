
function generarFolio(codigoCentro, ultimoConsecutivo) {
 const year = new Date().getFullYear()
 const consecutivo = String(ultimoConsecutivo + 1).padStart(6, "0");
 return `${codigoCentro}-${year}-${consecutivo}`;
}

module.exports = generarFolio;