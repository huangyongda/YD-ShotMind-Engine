import { aiConfig } from '../ai-config'

export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function anthropicChat(
  messages: AnthropicMessage[],
  model?: string,
  temperature?: number,
  maxTokens?: number
): Promise<string> {
  const apiKey = aiConfig.anthropic.apiKey
  if (!apiKey) {
    throw new Error('Anthropic API key not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || aiConfig.anthropic.defaultModel,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens || 4096,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()
  return data.content[0]?.text || ''
}

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  temperature?: number
): Promise<string> {
  const messages: AnthropicMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'user', content: `System: ${systemPrompt}\n\nUser: ${prompt}` })
  } else {
    messages.push({ role: 'user', content: prompt })
  }

  return anthropicChat(messages, undefined, temperature)
}
