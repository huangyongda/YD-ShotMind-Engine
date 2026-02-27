import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ttsService } from '@/lib/mcp/tts'
import path from 'path'
import fs from 'fs'

// 确保上传目录存在
function ensureUploadDir(projectId: number, type: 'images' | 'videos' | 'audio') {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', String(projectId), type)
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  return uploadDir
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { shotId, text, voiceId } = body

    if (!shotId) {
      return NextResponse.json({ success: false, error: 'Shot ID is required' }, { status: 400 })
    }

    // 获取分镜信息
    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        episode: {
          include: {
            project: true
          }
        }
      }
    })

    if (!shot) {
      return NextResponse.json({ success: false, error: 'Shot not found' }, { status: 404 })
    }

    // 如果没有提供文本，使用分镜描述
    const ttsText = text || shot.shotDescription || 'Hello'

    // 更新状态为生成中
    await prisma.shot.update({
      where: { id: shotId },
      data: { status: 'GENERATING' }
    })

    try {
      // 生成 TTS
      const projectId = shot.episode.projectId
      const outputDir = ensureUploadDir(projectId, 'audio')

      const result = await ttsService.generateSpeech({
        text: ttsText,
        voiceId: voiceId || shot.episode.project.settings?.defaultVoiceId,
        outputPath: outputDir
      })

      if (result.error) {
        await prisma.shot.update({
          where: { id: shotId },
          data: { status: 'FAILED' }
        })
        return NextResponse.json({ success: false, error: result.error }, { status: 500 })
      }

      // 更新分镜记录
      const updatedShot = await prisma.shot.update({
        where: { id: shotId },
        data: {
          ttsAudioPath: result.audioPath,
          status: 'COMPLETED'
        }
      })

      return NextResponse.json({ success: true, data: updatedShot })
    } catch (error) {
      await prisma.shot.update({
        where: { id: shotId },
        data: { status: 'FAILED' }
      })
      throw error
    }
  } catch (error) {
    console.error('Error generating TTS:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
