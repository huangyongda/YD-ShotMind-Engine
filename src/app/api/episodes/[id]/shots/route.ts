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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: episodeId } = await params
    const id = parseInt(episodeId)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid episode ID' }, { status: 400 })
    }

    const shots = await prisma.shot.findMany({
      where: { episodeId: id },
      orderBy: [
        { storyboard: { boardNumber: 'asc' } },
        { shotNumber: 'asc' }
      ],
      include: {
        character: true,
        scene: true,
        storyboard: true
      }
    })

    return NextResponse.json({ success: true, data: shots })
  } catch (error) {
    console.error('Error fetching shots:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch shots' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: episodeId } = await params
    const id = parseInt(episodeId)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid episode ID' }, { status: 400 })
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
      videoPath,
      storyboardId
    } = body

    if (!shotNumber) {
      return NextResponse.json({ success: false, error: 'Shot number is required' }, { status: 400 })
    }

    const parsedCharacterIds = parseCharacterIds(characterIds)
    if (characterIds !== undefined && parsedCharacterIds === null) {
      return NextResponse.json({ success: false, error: 'characterIds must be an array of numbers' }, { status: 400 })
    }

    let resolvedStoryboardId: number | null = null

    if (storyboardId !== undefined && storyboardId !== null) {
      const parsedStoryboardId = Number(storyboardId)
      if (!Number.isInteger(parsedStoryboardId) || parsedStoryboardId <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid storyboardId' }, { status: 400 })
      }

      const existing = await prisma.storyboard.findFirst({
        where: {
          id: parsedStoryboardId,
          episodeId: id
        },
        select: { id: true }
      })

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Storyboard not found in this episode' }, { status: 404 })
      }

      resolvedStoryboardId = existing.id
    } else {
      const existingDefaultStoryboard = await prisma.storyboard.findFirst({
        where: {
          episodeId: id,
          boardNumber: Number(shotNumber)
        },
        select: { id: true }
      })

      if (existingDefaultStoryboard) {
        resolvedStoryboardId = existingDefaultStoryboard.id
      } else {
        const defaultStoryboard = await prisma.storyboard.create({
          data: {
            episodeId: id,
            boardNumber: Number(shotNumber),
            description: shotDescription || null
          }
        })

        resolvedStoryboardId = defaultStoryboard.id
      }
    }

    const shot = await prisma.shot.create({
      data: {
        episodeId: id,
        storyboardId: resolvedStoryboardId,
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
    console.error('Error creating shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to create shot' }, { status: 500 })
  }
}
