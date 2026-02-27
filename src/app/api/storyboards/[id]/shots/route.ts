import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function parseCharacterIds(value: unknown): number[] | null {
  if (value === undefined || value === null) return null
  if (!Array.isArray(value)) return null

  const parsed: number[] = []
  for (const item of value) {
    const next = typeof item === 'number' ? item : Number(item)
    if (!Number.isInteger(next) || next <= 0) {
      return null
    }
    parsed.push(next)
  }

  return parsed
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storyboardId = parseInt(id)

    if (isNaN(storyboardId)) {
      return NextResponse.json({ success: false, error: 'Invalid storyboard ID' }, { status: 400 })
    }

    const storyboard = await prisma.storyboard.findUnique({
      where: { id: storyboardId },
      select: { id: true, episodeId: true }
    })

    if (!storyboard) {
      return NextResponse.json({ success: false, error: 'Storyboard not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      shotNumber,
      shotType,
      shotDescription,
      cameraMovement,
      dialogueText,
      videoPrompt,
      characterId,
      characterIds,
      sceneId,
      characterImage,
      sceneImage,
      duration,
      videoPath
    } = body

    if (!shotNumber) {
      return NextResponse.json({ success: false, error: 'Shot number is required' }, { status: 400 })
    }

    const parsedCharacterIds = parseCharacterIds(characterIds)
    if (characterIds !== undefined && parsedCharacterIds === null) {
      return NextResponse.json({ success: false, error: 'characterIds must be an array of numbers' }, { status: 400 })
    }

    const shot = await prisma.shot.create({
      data: {
        episodeId: storyboard.episodeId,
        storyboardId,
        shotNumber,
        shotType,
        shotDescription,
        cameraMovement,
        dialogueText,
        videoPrompt,
        characterId,
        characterIds: parsedCharacterIds,
        sceneId,
        characterImage,
        sceneImage,
        duration,
        videoPath
      },
      include: {
        storyboard: true
      }
    })

    return NextResponse.json({ success: true, data: shot })
  } catch (error) {
    console.error('Error creating shot in storyboard:', error)
    return NextResponse.json({ success: false, error: 'Failed to create shot' }, { status: 500 })
  }
}
