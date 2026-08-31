import { describe, expect, it } from 'vitest'

import { calEmbedConfig } from './CalEmbed'

describe('CalEmbed', () => {
  it('prefills Cal.com with the validated attendee phone number', () => {
    expect(
      calEmbedConfig({
        name: 'Ana García',
        email: 'ana@example.test',
        phone: '+34666123456',
        leadId: 'lead-1',
        dedupeKey: 'dedupe-1',
      }),
    ).toMatchObject({
      attendeePhoneNumber: '+34666123456',
      metadata: { leadId: 'lead-1', landingDedupeKey: 'dedupe-1' },
    })
  })
})
