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

function resolveCharacterIds(rawCharacterIds: unknown, fallbackCharacterId: number | null): number[] {
  if (Array.isArray(rawCharacterIds)) {
    const parsed = rawCharacterIds
      .map((item) => (typeof item === 'number' ? item : Number(item)))
      .filter((item) => Number.isInteger(item) && item > 0)

    if (parsed.length > 0) {
      return parsed
    }
  }

  return fallbackCharacterId ? [fallbackCharacterId] : []
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shotId = parseInt(id)

    if (isNaN(shotId)) {
      return NextResponse.json({ success: false, error: 'Invalid shot ID' }, { status: 400 })
    }

    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        character: true,
        scene: true,
        storyboard: true,
        episode: {
          select: { projectId: true }
        }
      }
    })

    if (!shot) {
      return NextResponse.json({ success: false, error: 'Shot not found' }, { status: 404 })
    }

    const characterIds = resolveCharacterIds(shot.characterIds, shot.characterId)
    const characters = characterIds.length > 0
      ? await prisma.character.findMany({
          where: {
            projectId: shot.episode.projectId,
            id: { in: characterIds }
          },
          orderBy: { id: 'asc' }
        })
      : []

    return NextResponse.json({
      success: true,
      data: {
        ...shot,
        characters
      }
    })
  } catch (error) {
    console.error('Error fetching shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch shot' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shotId = parseInt(id)

    if (isNaN(shotId)) {
      return NextResponse.json({ success: false, error: 'Invalid shot ID' }, { status: 400 })
    }

    const body = await request.json()
    const {
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
      videoPath,
      status
    } = body

    const parsedCharacterIds = parseCharacterIds(characterIds)
    if (characterIds !== undefined && parsedCharacterIds === null) {
      return NextResponse.json({ success: false, error: 'characterIds must be an array of numbers' }, { status: 400 })
    }

    const updateData: {
      shotType?: string
      shotDescription?: string | null
      cameraMovement?: string | null
      dialogueText?: string | null
      videoPrompt?: string | null
      characterId?: number | null
      characterIds?: number[] | null
      sceneId?: number | null
      characterImage?: string | null
      sceneImage?: string | null
      duration?: number | null
      videoPath?: string | null
      status?: string
    } = {
      shotType,
      shotDescription,
      cameraMovement,
      dialogueText,
      videoPrompt,
      characterId,
      sceneId,
      characterImage,
      sceneImage,
      duration,
      videoPath,
      status
    }

    if (characterIds !== undefined) {
      updateData.characterIds = parsedCharacterIds
    }

    const shot = await prisma.shot.update({
      where: { id: shotId },
      data: updateData,
      include: {
        storyboard: true
      }
    })

    return NextResponse.json({ success: true, data: shot })
  } catch (error) {
    console.error('Error updating shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to update shot' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shotId = parseInt(id)

    if (isNaN(shotId)) {
      return NextResponse.json({ success: false, error: 'Invalid shot ID' }, { status: 400 })
    }

    await prisma.shot.delete({
      where: { id: shotId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete shot' }, { status: 500 })
  }
}
