import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import { getSceneImageStats, isSceneAngle } from '@/types/scene-image'

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
    const sceneId = parseInt(id)

    if (isNaN(sceneId)) {
      return NextResponse.json({ success: false, error: 'Invalid scene ID' }, { status: 400 })
    }

    if (!isSceneAngle(angle)) {
      return NextResponse.json({ success: false, error: 'Invalid angle' }, { status: 400 })
    }

    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      select: { id: true }
    })

    if (!scene) {
      return NextResponse.json({ success: false, error: 'Scene not found' }, { status: 404 })
    }

    const existing = await prisma.sceneAngleImage.findUnique({
      where: {
        sceneId_angle: {
          sceneId,
          angle
        }
      }
    })

    if (existing) {
      await prisma.sceneAngleImage.delete({
        where: {
          sceneId_angle: {
            sceneId,
            angle
          }
        }
      })

      await removeFile(existing.filePath)
    }

    const angleImages = await prisma.sceneAngleImage.findMany({
      where: { sceneId },
      orderBy: { angle: 'asc' },
      select: { id: true, angle: true, filePath: true, createdAt: true, updatedAt: true }
    })

    const { uploadedCount, missingAngles } = getSceneImageStats(angleImages)

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
    console.error('Error deleting scene angle image:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 })
  }
}
