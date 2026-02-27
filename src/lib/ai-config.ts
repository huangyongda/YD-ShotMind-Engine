// AI 服务配置
export const aiConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4o',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    defaultModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
  },
  comfyui: {
    url: process.env.COMFYUI_URL || 'http://localhost:8188',
  },
}

// 获取设置
export function getSettings() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('makemp4_settings')
    if (stored) {
      return JSON.parse(stored)
    }
  }
  return null
}
