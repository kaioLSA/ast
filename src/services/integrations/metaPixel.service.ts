type MetaEventPayload = {
  eventName: 'Lead' | 'CompleteRegistration' | 'Purchase' | 'Contact'
  email?: string
  phone?: string
  leadId?: string
  value?: number
  currency?: string
}

export async function sendMetaEvent(payload: MetaEventPayload): Promise<void> {
  try {
    await fetch('/api/meta/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error('[Meta Pixel] Falha ao enviar evento:', err)
  }
}
