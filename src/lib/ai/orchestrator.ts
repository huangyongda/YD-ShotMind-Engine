import { aiConfig } from '../ai-config'
import { generateText as openaiGenerate } from './openai'
import { generateText as anthropicGenerate } from './anthropic'

export type AIModel = 'openai' | 'anthropic'

export interface GenerateOptions {
  model?: AIModel
  temperature?: number
  systemPrompt?: string
}

export async function generateWithAI(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const { model = 'openai', temperature, systemPrompt } = options

  // 优先使用配置的默认模型
  const defaultModel = aiConfig.openai.apiKey ? 'openai' : 'anthropic'
  const selectedModel = model || defaultModel

  try {
    if (selectedModel === 'anthropic' && aiConfig.anthropic.apiKey) {
      return await anthropicGenerate(prompt, systemPrompt, temperature)
    }

    // 默认使用 OpenAI
    if (aiConfig.openai.apiKey) {
      return await openaiGenerate(prompt, systemPrompt, temperature)
    }

    // 如果没有配置任何 API
    throw new Error('No AI API key configured')
  } catch (error) {
    console.error('AI generation error:', error)
    throw error
  }
}

// 生成短剧大纲
export async function generateOutline(
  description: string,
  totalEpisodes: number,
  characters: string,
  scenes: string
): Promise<string> {
  const systemPrompt = `你是一个专业的短剧编剧。根据以下信息生成短剧大纲。`

  const prompt = `
请根据以下信息生成一个${totalEpisodes}集的短剧大纲。

总简介：${description}

角色设定：
${characters}

场景设定：
${scenes}

请为每一集生成：
1. 集标题
2. 本集简介（100-200字）

以JSON格式输出，格式如下：
[
  {"episode": 1, "title": "标题", "synopsis": "简介"},
  ...
]
`

  return generateWithAI(prompt, { systemPrompt })
}

// 生成角色设定
export async function generateCharacters(
  description: string,
  totalEpisodes: number
): Promise<string> {
  const prompt = `
请根据以下短剧简介生成角色设定。

短剧简介：${description}
总集数：${totalEpisodes}

请生成主要角色（3-6个），每个角色包含：
1. 姓名
2. 年龄
3. 性格特点
4. 外貌描述
5. 角色背景

以JSON格式输出，格式如下：
[
  {"name": "姓名", "age": "年龄", "personality": "性格特点", "appearance": "外貌描述", "background": "角色背景"},
  ...
]
`

  return generateWithAI(prompt)
}

// 生成场景设定
export async function generateScenes(
  description: string,
  totalEpisodes: number
): Promise<string> {
  const prompt = `
请根据以下短剧简介生成场景设定。

短剧简介：${description}
总集数：${totalEpisodes}

请生成主要场景（3-8个），每个场景包含：
1. 场景名称
2. 地点描述
3. 时间段（早晨/下午/傍晚/夜晚/黎明/黄昏）
4. 场景氛围

以JSON格式输出，格式如下：
[
  {"name": "场景名称", "location": "地点", "timeOfDay": "时间段", "atmosphere": "氛围"},
  ...
]
`

  return generateWithAI(prompt)
}

// 生成分镜脚本
export async function generateShots(
  dialogueText: string,
  characters: string,
  scenes: string
): Promise<string> {
  const prompt = `
请根据以下对话文本生成分镜脚本。

对话文本：
${dialogueText}

角色设定：
${characters}

场景设定：
${scenes}

请为每个对话生成分镜，包含：
1. 分镜序号
2. 镜头类型（极远景/远景/全景/中远景/中景/中近景/近景/特写/主观镜头/双人镜头）
3. 分镜描述
4. 视频提示词（用于AI生成视频）
5. 出场角色
6. 使用场景

以JSON格式输出，格式如下：
[
  {"shotNumber": 1, "shotType": "中景", "shotDescription": "描述", "videoPrompt": "提示词", "character": "角色名", "scene": "场景名"},
  ...
]
`

  return generateWithAI(prompt)
}

// 生成对话文本
export async function generateDialogue(
  storyOutline: string,
  characters: string,
  scene: string
): Promise<string> {
  const prompt = `
请根据以下故事大纲生成本集对话文本。

故事大纲：
${storyOutline}

角色设定：
${characters}

场景：${scene}

请生成完整的对话文本，包含角色对话和场景描述。

以JSON格式输出，格式如下：
[
  {"type": "action", "content": "场景动作描述"},
  {"type": "dialogue", "character": "角色名", "content": "对话内容"},
  ...
]
`

  return generateWithAI(prompt)
}
