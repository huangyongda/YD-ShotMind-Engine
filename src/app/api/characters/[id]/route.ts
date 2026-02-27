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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const characterId = parseInt(id)

    if (isNaN(characterId)) {
      return NextResponse.json({ success: false, error: 'Invalid character ID' }, { status: 400 })
    }

    let character: {
      angleImages: Array<{ angle: string; filePath: string }>
      [key: string]: unknown
    } | null = null

    try {
      character = await prisma.character.findUnique({
        where: { id: characterId },
        include: {
          angleImages: {
            orderBy: { angle: 'asc' }
          }
        }
      })
    } catch (error) {
      console.warn('Falling back to legacy character detail query without angleImages:', error)
      const legacyCharacter = await prisma.character.findUnique({
        where: { id: characterId }
      })

      character = legacyCharacter
        ? {
            ...legacyCharacter,
            angleImages: []
          }
        : null
    }

    if (!character) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: formatCharacterWithAngleStats(character) })
  } catch (error) {
    console.error('Error fetching character:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch character' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const characterId = parseInt(id)

    if (isNaN(characterId)) {
      return NextResponse.json({ success: false, error: 'Invalid character ID' }, { status: 400 })
    }

    const body = await request.json()

    const character = await prisma.character.update({
      where: { id: characterId },
      data: body
    })

    return NextResponse.json({ success: true, data: character })
  } catch (error) {
    console.error('Error updating character:', error)
    return NextResponse.json({ success: false, error: 'Failed to update character' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const characterId = parseInt(id)

    if (isNaN(characterId)) {
      return NextResponse.json({ success: false, error: 'Invalid character ID' }, { status: 400 })
    }

    await prisma.character.delete({
      where: { id: characterId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting character:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete character' }, { status: 500 })
  }
}
