import Cal, { getCalApi } from '@calcom/embed-react'
import { Check } from 'lucide-react'
import { useEffect } from 'react'

import { branding } from '~/config/branding'
import { trackEvent } from '~/shared/lib/attribution'

const CAL_LINK = branding.contact.calCom.path
const CAL_ORIGIN = new URL(branding.contact.calCom.bookingUrl).origin // "https://cal.eu"

type CalEmbedProps = {
  name: string
  email: string
  phone: string
  leadId: string | null
  dedupeKey: string
}

export function CalEmbed({ name, email, phone, leadId, dedupeKey }: CalEmbedProps) {
  useEffect(() => {
    trackEvent('calendar_viewed', { conversionStep: 'contact_form' })
    ;(async () => {
      const cal = await getCalApi({
        embedJsUrl: `${CAL_ORIGIN}/embed/embed.js`,
      })
      cal('ui', { hideEventTypeDetails: false, layout: 'month_view' })
    })()
  }, [])

  return (
    <div className="motion-fade-in motion-duration-500 space-y-6">
      <div className="space-y-2 text-center">
        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-foreground text-2xl font-bold">¡Datos recibidos!</h3>
        <p className="text-muted-foreground">
          Elige el día y la hora que mejor te vaya para que te llamemos. Si no ves tu zona horaria
          correcta, ajústala en la esquina inferior izquierda del calendario.
        </p>
      </div>

      <Cal
        calLink={CAL_LINK}
        calOrigin={CAL_ORIGIN}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
        config={{
          name,
          email,
          attendeePhoneNumber: phone,
          layout: 'month_view',
          metadata: { leadId: leadId ?? '', landingDedupeKey: dedupeKey },
        }}
      />
    </div>
  )
}
