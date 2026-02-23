/**
 * Formata data para exibição no padrão brasileiro DD/MM/AAAA.
 */
export function formatarDataBR(val: string | Date | null | undefined): string {
  if (val == null) return ''
  const d = typeof val === 'string' ? new Date(val) : val
  if (Number.isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Converte string DD/MM/AAAA para YYYY-MM-DD (para API e input type="date").
 */
export function parsearDataBR(str: string): string {
  const limpo = str.replace(/\D/g, '')
  if (limpo.length !== 8) return ''
  const dd = limpo.slice(0, 2)
  const mm = limpo.slice(2, 4)
  const yyyy = limpo.slice(4, 8)
  const d = parseInt(dd, 10)
  const m = parseInt(mm, 10)
  const y = parseInt(yyyy, 10)
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) return ''
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Aplica máscara DD/MM/AAAA enquanto o usuário digita.
 */
export function mascaraDataBR(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
