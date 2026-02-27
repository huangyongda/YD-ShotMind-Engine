import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSceneImageStats } from '@/types/scene-image'

function formatSceneWithAngleStats(scene: {
  angleImages: Array<{ angle: string; filePath: string }>
  [key: string]: unknown
}) {
  const { uploadedCount, missingAngles } = getSceneImageStats(scene.angleImages)
  return {
    ...scene,
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
    const sceneId = parseInt(id)

    if (isNaN(sceneId)) {
      return NextResponse.json({ success: false, error: 'Invalid scene ID' }, { status: 400 })
    }

    let scene: {
      angleImages: Array<{ angle: string; filePath: string }>
      [key: string]: unknown
    } | null = null

    try {
      scene = await prisma.scene.findUnique({
        where: { id: sceneId },
        include: {
          angleImages: {
            orderBy: { angle: 'asc' }
          }
        }
      })
    } catch (error) {
      console.warn('Falling back to legacy scene detail query without angleImages:', error)
      const legacyScene = await prisma.scene.findUnique({
        where: { id: sceneId }
      })

      scene = legacyScene
        ? {
            ...legacyScene,
            angleImages: []
          }
        : null
    }

    if (!scene) {
      return NextResponse.json({ success: false, error: 'Scene not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: formatSceneWithAngleStats(scene) })
  } catch (error) {
    console.error('Error fetching scene:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch scene' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sceneId = parseInt(id)

    if (isNaN(sceneId)) {
      return NextResponse.json({ success: false, error: 'Invalid scene ID' }, { status: 400 })
    }

    const body = await request.json()

    const scene = await prisma.scene.update({
      where: { id: sceneId },
      data: body
    })

    return NextResponse.json({ success: true, data: scene })
  } catch (error) {
    console.error('Error updating scene:', error)
    return NextResponse.json({ success: false, error: 'Failed to update scene' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sceneId = parseInt(id)

    if (isNaN(sceneId)) {
      return NextResponse.json({ success: false, error: 'Invalid scene ID' }, { status: 400 })
    }

    await prisma.scene.delete({
      where: { id: sceneId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scene:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete scene' }, { status: 500 })
  }
}
