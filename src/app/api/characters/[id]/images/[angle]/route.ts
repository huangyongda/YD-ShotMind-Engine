import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import { getCharacterImageStats, isCharacterAngle } from '@/types/character-image'

async function removeFile(filePath: string) {
  const normalizedPath = filePath.replace(/^\/+/, '')
  const fullPath = path.join(process.cwd(), 'public', normalizedPath)

  try {
    await unlink(fullPath)
  } catch {
    // ignore missing file to keep delete idempotent
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; angle: string }> }
) {
  try {
    const { id, angle } = await params
    const characterId = parseInt(id)

    if (isNaN(characterId)) {
      return NextResponse.json({ success: false, error: 'Invalid character ID' }, { status: 400 })
    }

    if (!isCharacterAngle(angle)) {
      return NextResponse.json({ success: false, error: 'Invalid angle' }, { status: 400 })
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true }
    })

    if (!character) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 })
    }

    const existing = await prisma.characterAngleImage.findUnique({
      where: {
        characterId_angle: {
          characterId,
          angle
        }
      }
    })

    if (existing) {
      await prisma.characterAngleImage.delete({
        where: {
          characterId_angle: {
            characterId,
            angle
          }
        }
      })

      await removeFile(existing.filePath)
    }

    const angleImages = await prisma.characterAngleImage.findMany({
      where: { characterId },
      orderBy: { angle: 'asc' },
      select: { id: true, angle: true, filePath: true, createdAt: true, updatedAt: true }
    })

    const { uploadedCount, missingAngles } = getCharacterImageStats(angleImages)

    return NextResponse.json({
      success: true,
      data: {
        deletedAngle: angle,
        angleImages,
        uploadedCount,
        missingAngles
      }
    })
  } catch (error) {
    console.error('Error deleting character angle image:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 })
  }
}
