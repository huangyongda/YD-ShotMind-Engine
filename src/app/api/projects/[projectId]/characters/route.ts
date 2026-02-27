import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCharacterImageStats } from '@/types/character-image'

function formatCharacterWithAngleStats(character: {
  angleImages: Array<{ angle: string; filePath: string }>
  [key: string]: unknown
}) {
  const { uploadedCount, missingAngles } = getCharacterImageStats(character.angleImages)
  return {
    ...character,
    uploadedCount,
    missingAngles
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const id = parseInt(projectId)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    let characters: Array<{
      angleImages: Array<{ angle: string; filePath: string }>
      [key: string]: unknown
    }>

    try {
      characters = await prisma.character.findMany({
        where: { projectId: id },
        include: {
          angleImages: {
            orderBy: { angle: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    } catch (error) {
      console.warn('Falling back to legacy character query without angleImages:', error)
      const legacyCharacters = await prisma.character.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'asc' }
      })
      characters = legacyCharacters.map((item) => ({
        ...item,
        angleImages: []
      }))
    }

    const formattedCharacters = characters.map(formatCharacterWithAngleStats)

    return NextResponse.json({ success: true, data: formattedCharacters })
  } catch (error) {
    console.error('Error fetching characters:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch characters' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const id = parseInt(projectId)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, avatarPath, traits, voiceId } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Character name is required' }, { status: 400 })
    }

    const character = await prisma.character.create({
      data: {
        projectId: id,
        name,
        description,
        avatarPath,
        traits,
        voiceId
      }
    })

    return NextResponse.json({ success: true, data: character })
  } catch (error) {
    console.error('Error creating character:', error)
    return NextResponse.json({ success: false, error: 'Failed to create character' }, { status: 500 })
  }
}
