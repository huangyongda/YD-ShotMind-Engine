import OpenAI from 'openai'
import { aiConfig } from '../ai-config'

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: aiConfig.openai.apiKey,
      baseURL: aiConfig.openai.baseUrl,
    })
  }
  return openaiClient
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chatCompletion(
  messages: ChatMessage[],
  model?: string,
  temperature?: number
): Promise<string> {
  const client = getOpenAIClient()

  const response = await client.chat.completions.create({
    model: model || aiConfig.openai.defaultModel,
    messages,
    temperature: temperature ?? 0.7,
  })

  return response.choices[0]?.message?.content || ''
}

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  temperature?: number
): Promise<string> {
  const messages: ChatMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: prompt })

  return chatCompletion(messages, undefined, temperature)
}
