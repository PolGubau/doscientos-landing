import { render } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

const { calendar } = vi.hoisted(() => ({ calendar: vi.fn() }))

vi.mock('@calcom/embed-react', () => ({
  default: (props: unknown) => {
    calendar(props)
    return null
  },
  getCalApi: vi.fn().mockResolvedValue(vi.fn()),
}))

import { CalEmbed } from './CalEmbed'

describe('CalEmbed', () => {
  it('prefills Cal.com with the validated attendee phone number', () => {
    render(
      <CalEmbed
        name="Ana García"
        email="ana@example.test"
        phone="+34666123456"
        leadId="lead-1"
        dedupeKey="dedupe-1"
      />,
    )

    expect(calendar).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ attendeePhoneNumber: '+34666123456' }),
      }),
      undefined,
    )
  })
})
