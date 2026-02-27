export interface ComfyUIConfig {
  url: string
}

export interface WorkflowNode {
  id: string
  type: string
  inputs: Record<string, any>
}

export interface Workflow {
  nodes: WorkflowNode[]
  links: [number, string, string, any][]
}

export interface GenerationResult {
  images?: string[]
  video?: string
  error?: string
}

export interface ImageToVideoParams {
  imageUrl: string
  prompt: string
  workflow?: string
}

export interface LipSyncParams {
  imageUrl: string
  audioUrl: string
  prompt?: string
}

export interface FirstLastFrameParams {
  firstFrameUrl: string
  lastFrameUrl: string
  prompt: string
}

class ComfyUIService {
  private url: string

  constructor(config?: ComfyUIConfig) {
    this.url = config?.url || process.env.COMFYUI_URL || 'http://localhost:8188'
  }

  private async queueWorkflow(workflow: Workflow): Promise<string> {
    const response = await fetch(`${this.url}/api/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow }),
    })

    if (!response.ok) {
      throw new Error(`Failed to queue workflow: ${response.statusText}`)
    }

    const data = await response.json()
    return data.prompt_id
  }

  private async getHistory(promptId: string): Promise<any> {
    const response = await fetch(`${this.url}/api/history/${promptId}`)
    if (!response.ok) {
      return null
    }
    return response.json()
  }

  private async getStatus(): Promise<any> {
    const response = await fetch(`${this.url}/api/status`)
    return response.json()
  }

  private async waitForCompletion(promptId: string, maxAttempts = 300): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const history = await this.getHistory(promptId)
      if (history && history[promptId]) {
        const status = history[promptId].status
        if (status?.completed) {
          return history[promptId]
        }
        if (status?.errored) {
          throw new Error(`Workflow failed: ${status?.error_message}`)
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error('Timeout waiting for workflow completion')
  }

  private getOutputImages(result: any): string[] {
    const images: string[] = []

    if (!result?.outputs) return images

    for (const nodeId of Object.keys(result.outputs)) {
      const node = result.outputs[nodeId]
      if (node.images) {
        for (const img of node.images) {
          images.push(`${this.url}/view?filename=${img.filename}&type=${img.type}&subfolder=${img.subfolder || ''}`)
        }
      }
    }

    return images
  }

  private getOutputVideo(result: any): string | null {
    if (!result?.outputs) return null

    for (const nodeId of Object.keys(result.outputs)) {
      const node = result.outputs[nodeId]
      if (node.images && node.images[0]) {
        const img = node.images[0]
        // 对于视频输出，通常会有 video 字段
        return `${this.url}/view?filename=${img.filename}&type=${img.type}`
      }
    }

    return null
  }

  async runWorkflow(workflow: Workflow): Promise<GenerationResult> {
    try {
      const promptId = await this.queueWorkflow(workflow)
      const result = await this.waitForCompletion(promptId)

      const images = this.getOutputImages(result)
      const video = this.getOutputVideo(result)

      return { images, video }
    } catch (error) {
      console.error('ComfyUI workflow error:', error)
      return { error: String(error) }
    }
  }

  // Wan2.2 Image to Video
  async imageToVideo(params: ImageToVideoParams): Promise<GenerationResult> {
    const workflow = this.getWan22ImageToVideoWorkflow(params)
    return this.runWorkflow(workflow)
  }

  // Wan2.2 Lip Sync
  async lipSync(params: LipSyncParams): Promise<GenerationResult> {
    const workflow = this.getWan22LipSyncWorkflow(params)
    return this.runWorkflow(workflow)
  }

  // Wan2.2 First Last Frame
  async firstLastFrame(params: FirstLastFrameParams): Promise<GenerationResult> {
    const workflow = this.getWan22FirstLastFrameWorkflow(params)
    return this.runWorkflow(workflow)
  }

  private getWan22ImageToVideoWorkflow(params: ImageToVideoParams): Workflow {
    // 这是一个简化的 workflow，实际需要根据具体的 ComfyUI 节点调整
    return {
      nodes: [
        {
          id: '1',
          type: 'LoadImage',
          inputs: { image: params.imageUrl }
        },
        {
          id: '2',
          type: 'WanImageToVideo',
          inputs: { image: '1', prompt: params.prompt }
        }
      ],
      links: [
        [1, 'LoadImage', 'IMAGE', ['2', 'image']]
      ]
    }
  }

  private getWan22LipSyncWorkflow(params: LipSyncParams): Workflow {
    return {
      nodes: [
        {
          id: '1',
          type: 'LoadImage',
          inputs: { image: params.imageUrl }
        },
        {
          id: '2',
          type: 'LoadAudio',
          inputs: { audio: params.audioUrl }
        },
        {
          id: '3',
          type: 'WanLipSync',
          inputs: { image: '1', audio: '2', prompt: params.prompt || '' }
        }
      ],
      links: [
        [1, 'LoadImage', 'IMAGE', ['3', 'image']],
        [2, 'LoadAudio', 'AUDIO', ['3', 'audio']]
      ]
    }
  }

  private getWan22FirstLastFrameWorkflow(params: FirstLastFrameParams): Workflow {
    return {
      nodes: [
        {
          id: '1',
          type: 'LoadImage',
          inputs: { image: params.firstFrameUrl }
        },
        {
          id: '2',
          type: 'LoadImage',
          inputs: { image: params.lastFrameUrl }
        },
        {
          id: '3',
          type: 'WanFirstLastFrame',
          inputs: { first_frame: '1', last_frame: '2', prompt: params.prompt }
        }
      ],
      links: [
        [1, 'LoadImage', 'IMAGE', ['3', 'first_frame']],
        [2, 'LoadImage', 'IMAGE', ['3', 'last_frame']]
      ]
    }
  }
}

export const comfyUIService = new ComfyUIService()
export default ComfyUIService
