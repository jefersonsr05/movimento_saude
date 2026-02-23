/**
 * Valida CPF (apenas dígitos, 11 caracteres e dígitos verificadores).
 */
export function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, "");
  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false; // todos iguais
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(limpo[i], 10) * (10 - i);
  let dig1 = (soma * 10) % 11;
  if (dig1 === 10) dig1 = 0;
  if (dig1 !== parseInt(limpo[9], 10)) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(limpo[i], 10) * (11 - i);
  let dig2 = (soma * 10) % 11;
  if (dig2 === 10) dig2 = 0;
  if (dig2 !== parseInt(limpo[10], 10)) return false;
  return true;
}
