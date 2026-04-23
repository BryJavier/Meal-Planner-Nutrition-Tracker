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

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const text = decoder.decode(value)
    for (const line of text.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') { onDone?.(); return }
        onChunk(data)
      }
    }
  }
  onDone?.()
}
