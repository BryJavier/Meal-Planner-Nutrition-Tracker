import client from './client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const suggestRecipe = (data) => client.post('/api/ai/suggest-recipe', data)
export const saveSuggestedRecipe = (data) => client.post('/api/ai/save-suggested', data)

export async function streamMealSuggestions(payload, onChunk, onDone) {
  const token = localStorage.getItem('access_token')
  const response = await fetch(`${BASE_URL}/api/ai/suggest-meals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) throw new Error('Stream failed')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const emitEvent = (eventText) => {
    const data = eventText
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => (line[5] === ' ' ? line.slice(6) : line.slice(5)))
      .join('\n')

    if (!data) return false
    if (data === '[DONE]') {
      onDone?.()
      return true
    }

    onChunk(data)
    return false
  }

  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const eventText of events) {
      if (emitEvent(eventText)) return
    }

    if (done) break
  }

  if (buffer.trim()) {
    if (emitEvent(buffer)) return
  }

  onDone?.()
}
