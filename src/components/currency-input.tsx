'use client'

import { useId, useMemo, useState } from 'react'

type CurrencyInputProps = {
  name: string
  defaultValue?: number
  form?: string
  placeholder?: string
  required?: boolean
  width?: string
}

const formatCurrency = (value: string) => {
  if (!value) {
    return ''
  }

  return Number.parseInt(value, 10).toLocaleString('id-ID')
}

export default function CurrencyInput({
  name,
  defaultValue,
  form,
  placeholder,
  required,
  width = '100%',
}: CurrencyInputProps) {
  const inputId = useId()
  const initialValue = useMemo(() => (typeof defaultValue === 'number' ? String(defaultValue) : ''), [defaultValue])
  const [rawValue, setRawValue] = useState(initialValue)

  return (
    <div style={{ width, position: 'relative' }}>
      <input
        id={inputId}
        type="text"
        inputMode="numeric"
        defaultValue={formatCurrency(initialValue)}
        placeholder={placeholder}
        onChange={(event) => {
          const digitsOnly = event.target.value.replace(/\D/g, '')
          setRawValue(digitsOnly)
          event.target.value = formatCurrency(digitsOnly)
        }}
        style={{
          width: '100%',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          color: 'white',
          textAlign: 'left',
        }}
      />
      <input
        type="hidden"
        name={name}
        value={rawValue}
        form={form}
        required={required}
        readOnly
      />
    </div>
  )
}
