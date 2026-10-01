// Funcoes de validacao reutilizadas pelos controllers

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Verifica se o valor e um UUID valido
// (formato usado nos ids das tabelas)
function isUuid(valor: unknown): boolean {
  return typeof valor === "string" && UUID_REGEX.test(valor);
}

// Campo opcional de texto:
// pode nao ser enviado, ser null ou ser uma string
function isTextoOpcional(valor: unknown): boolean {
  return (
    valor === undefined ||
    valor === null ||
    typeof valor === "string"
  );
}

// Campo opcional booleano:
// pode nao ser enviado ou ser true/false
function isBooleanOpcional(valor: unknown): boolean {
  return valor === undefined || typeof valor === "boolean";
}

// Codigo do Postgres para violacao de chave estrangeira
// ex: excluir uma marca que tem veiculos,
// ou usar um marca_id que nao existe
function isErroChaveEstrangeira(error: any): boolean {
  return error?.code === "23503";
}

export default {
  isUuid,
  isTextoOpcional,
  isBooleanOpcional,
  isErroChaveEstrangeira,
};