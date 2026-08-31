// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { isInternalTraffic } from '~/shared/lib/attribution'

import { BUDGET_OPTIONS } from './types'
import { useContactForm } from './useContactForm'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

// --- Helpers ---

/** Crea un FormEvent mínimo con el campo honeypot "website". */
function makeFormEvent(honeypotValue = ''): React.FormEvent {
  const form = document.createElement('form')
  const input = document.createElement('input')
  input.name = 'website'
  input.value = honeypotValue
  form.appendChild(input)
  return {
    preventDefault: vi.fn(),
    currentTarget: form,
  } as unknown as React.FormEvent
}

/** Rellena nombre + email y avanza al paso 2. */
function goToStep2(
  result: ReturnType<typeof renderHook<ReturnType<typeof useContactForm>, unknown>>['result'],
) {
  act(() => {
    result.current.handleChange({
      target: { name: 'name', value: 'Ana García' },
    } as React.ChangeEvent<HTMLInputElement>)
    result.current.handleChange({
      target: { name: 'email', value: 'ana@test.es' },
    } as React.ChangeEvent<HTMLInputElement>)
  })
  act(() => {
    result.current.nextStep()
  })
  act(() => {
    result.current.handleChange({
      target: { name: 'phone', value: '666 123 456' },
    } as React.ChangeEvent<HTMLInputElement>)
  })
}

// ─────────────────────────────────────────────
// BUDGET_OPTIONS
// ─────────────────────────────────────────────
describe('BUDGET_OPTIONS', () => {
  it('tiene exactamente 4 opciones', () => {
    expect(BUDGET_OPTIONS).toHaveLength(4)
  })

  it('valores exactos del contrato con formato de moneda europeo', () => {
    expect([...BUDGET_OPTIONS]).toEqual([
      'Menos de 5.000€',
      '5.000€ - 10.000€',
      '10.000€ - 30.000€',
      'Más de 30.000€',
    ])
  })
})

describe('exclusión de tráfico interno', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/')
    window.sessionStorage.removeItem('doscientos:internal-traffic')
  })

  it('persiste la exclusión de sesión y permite desactivarla explícitamente', () => {
    window.history.replaceState({}, '', '/?internal_traffic=1')
    expect(isInternalTraffic()).toBe(true)

    window.history.replaceState({}, '', '/')
    expect(isInternalTraffic()).toBe(true)

    window.history.replaceState({}, '', '/?internal_traffic=0')
    expect(isInternalTraffic()).toBe(false)
  })
})

// ─────────────────────────────────────────────
// Estado inicial y navegación
// ─────────────────────────────────────────────
describe('useContactForm — navegación', () => {
  it('arranca en paso 1 con status idle', () => {
    const { result } = renderHook(() => useContactForm())
    expect(result.current.step).toBe(1)
    expect(result.current.status).toBe('idle')
  })

  it('nextStep no avanza si nombre o email están vacíos', () => {
    const { result } = renderHook(() => useContactForm())
    act(() => {
      result.current.nextStep()
    })
    expect(result.current.step).toBe(1)
    expect(result.current.fieldErrors.name).toBeTruthy()
    expect(result.current.fieldErrors.email).toBeTruthy()
  })

  it('avanza a paso 2 con datos válidos', () => {
    const { result } = renderHook(() => useContactForm())
    goToStep2(result)
    expect(result.current.step).toBe(2)
  })

  it('prevStep retrocede al paso 1', () => {
    const { result } = renderHook(() => useContactForm())
    goToStep2(result)
    act(() => {
      result.current.prevStep()
    })
    expect(result.current.step).toBe(1)
  })

  it('selectBudget actualiza formData.budget', () => {
    const { result } = renderHook(() => useContactForm())
    act(() => {
      result.current.selectBudget('5.000€ - 10.000€')
    })
    expect(result.current.formData.budget).toBe('5.000€ - 10.000€')
  })
})

// ─────────────────────────────────────────────
// Submit
// ─────────────────────────────────────────────
describe('useContactForm — submit', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('honeypot lleno → simula éxito sin llamar a fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useContactForm())

    await act(async () => {
      await result.current.handleSubmit(makeFormEvent('bot-relleno'))
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.status).toBe('success')
    expect(result.current.step).toBe(3)
  })

  it('payload contiene exactamente las claves del contrato', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ leadId: 'lead-1' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useContactForm())
    goToStep2(result)
    act(() => {
      result.current.handleChange({
        target: { name: 'company', value: 'Acme SL' },
      } as React.ChangeEvent<HTMLInputElement>)
      result.current.selectCompanySize('10-50 empleados')
      result.current.selectUrgency('Este mes')
      result.current.selectBudget('5.000€ - 10.000€')
    })

    await act(async () => {
      await result.current.handleSubmit(makeFormEvent())
    })

    const leadCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/api/public/leads'))
    expect(leadCall).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const sent = JSON.parse(leadCall?.[1].body as string)
    expect(Object.keys(sent).sort()).toEqual(
      [
        'budget',
        'calculator_cost',
        'calculator_hours',
        'company',
        'companySize',
        'dedupeKey',
        'email',
        'event_id',
        'visitor_id',
        'conversion_step',
        'first_landing_path',
        'first_referrer',
        'first_utm_source',
        'first_utm_medium',
        'first_utm_campaign',
        'first_utm_term',
        'first_utm_content',
        'internal_traffic',
        'landing_path',
        'landing_ref',
        'landing_subject',
        'language',
        'last_landing_path',
        'last_referrer',
        'last_utm_source',
        'last_utm_medium',
        'last_utm_campaign',
        'last_utm_term',
        'marketing_consent',
        'last_utm_content',
        'message',
        'meta_fbc',
        'meta_fbclid',
        'meta_fbp',
        'name',
        'phone',
        'referrer',
        'resource',
        'solutionType',
        'urgency',
        'utm_campaign',
        'utm_content',
        'utm_medium',
        'utm_source',
        'utm_term',
        'website',
      ].sort(),
    )
    expect(sent.name).toBe('Ana García')
    expect(sent.email).toBe('ana@test.es')
    expect(sent.phone).toBe('666 123 456')
    expect(sent.company).toBe('Acme SL')
    expect(sent.companySize).toBe('10-50 empleados')
    expect(sent.urgency).toBe('Este mes')
    expect(sent.budget).toBe('5.000€ - 10.000€')
    expect(sent.message).toBe('Lead desde formulario corto (multi-step)')
    expect(sent.website).toBe('')
    expect(result.current.submittedLeadId).toBe('lead-1')
    expect(sent.dedupeKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('dedupeKey es estable entre envíos del mismo hook', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useContactForm())
    goToStep2(result)
    await act(async () => {
      await result.current.handleSubmit(makeFormEvent())
    })
    await act(async () => {
      await result.current.handleSubmit(makeFormEvent())
    })
    const leadCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/api/public/leads'),
    )
    const key1 = JSON.parse(leadCalls[0][1].body as string).dedupeKey
    const key2 = JSON.parse(leadCalls[1][1].body as string).dedupeKey
    expect(key1).toBe(key2)
  })

  it('error de red → status error con mensaje genérico', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')))
    const { result } = renderHook(() => useContactForm())
    goToStep2(result)
    await act(async () => {
      await result.current.handleSubmit(makeFormEvent())
    })
    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toContain('conexión')
  })

  it('HTTP 429 → mensaje correcto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }))
    const { result } = renderHook(() => useContactForm())
    goToStep2(result)
    await act(async () => {
      await result.current.handleSubmit(makeFormEvent())
    })
    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toContain('Demasiados intentos')
  })
})
