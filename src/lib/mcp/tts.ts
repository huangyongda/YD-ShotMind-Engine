import { aiConfig } from '../ai-config'
import fs from 'fs'
import path from 'path'

export interface TTSParams {
  text: string
  voiceId?: string
  outputPath?: string
}

export interface TTSResult {
  audioPath?: string
  error?: string
}

class TTSService {
  private apiKey: string

  constructor() {
    this.apiKey = aiConfig.elevenlabs.apiKey
  }

  async generateSpeech(params: TTSParams): Promise<TTSResult> {
    if (!this.apiKey) {
      return { error: 'ElevenLabs API key not configured' }
    }

    try {
      const voiceId = params.voiceId || '21m00Tcm4TlvDq8ikWAM' // 默认声音
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: params.text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`ElevenLabs API error: ${error}`)
      }

      // 保存音频文件
      const buffer = await response.arrayBuffer()
      const audioBuffer = Buffer.from(buffer)

      // 确定输出路径
      const outputDir = params.outputPath || path.join(process.cwd(), 'public', 'uploads', 'audio')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const filename = `tts_${Date.now()}.mp3`
      const filePath = path.join(outputDir, filename)

      fs.writeFileSync(filePath, audioBuffer)

      // 返回相对于 public 的路径
      const relativePath = `/uploads/audio/${filename}`

      return { audioPath: relativePath }
    } catch (error) {
      console.error('TTS generation error:', error)
      return { error: String(error) }
    }
  }

  // 获取可用的声音列表
  async getVoices(): Promise<any[]> {
    if (!this.apiKey) {
      return []
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey,
        },
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('Error fetching voices:', error)
      return []
    }
  }
}

export const ttsService = new TTSService()
export default TTSService
