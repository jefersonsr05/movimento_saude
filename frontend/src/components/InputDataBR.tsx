import { useState, useEffect } from 'react'
import { formatarDataBR, parsearDataBR, mascaraDataBR } from '../utils/date'

type Props = {
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  id?: string
}

/**
 * Input de data no padrão brasileiro DD/MM/AAAA.
 * O valor interno (value/onChange) continua em YYYY-MM-DD para a API.
 */
export function InputDataBR({ value, onChange, required, placeholder = 'DD/MM/AAAA', id }: Props) {
  const [display, setDisplay] = useState(() => (value ? formatarDataBR(value) : ''))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDisplay(value ? formatarDataBR(value) : '')
    }
  }, [value, focused])

  const handleFocus = () => {
    setFocused(true)
    setDisplay(value ? formatarDataBR(value) : '')
  }

  const handleBlur = () => {
    setFocused(false)
    const parsed = parsearDataBR(display)
    if (parsed) {
      onChange(parsed)
      setDisplay(formatarDataBR(parsed))
    } else if (display.trim() === '') {
      onChange('')
      setDisplay('')
    } else {
      setDisplay(value ? formatarDataBR(value) : '')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = mascaraDataBR(e.target.value)
    setDisplay(masked)
    const parsed = parsearDataBR(masked)
    if (parsed) onChange(parsed)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      id={id}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      maxLength={10}
      autoComplete="off"
    />
  )
}
