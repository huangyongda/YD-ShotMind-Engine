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
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const id = parseInt(projectId)

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    let scenes: Array<{
      angleImages: Array<{ angle: string; filePath: string }>
      [key: string]: unknown
    }>

    try {
      scenes = await prisma.scene.findMany({
        where: { projectId: id },
        include: {
          angleImages: {
            orderBy: { angle: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    } catch (error) {
      console.warn('Falling back to legacy scene query without angleImages:', error)
      const legacyScenes = await prisma.scene.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'asc' }
      })
      scenes = legacyScenes.map((item) => ({
        ...item,
        angleImages: []
      }))
    }

    const formattedScenes = scenes.map(formatSceneWithAngleStats)

    return NextResponse.json({ success: true, data: formattedScenes })
  } catch (error) {
    console.error('Error fetching scenes:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch scenes' }, { status: 500 })
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
    const { name, description, backgroundPath, location, timeOfDay } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Scene name is required' }, { status: 400 })
    }

    const scene = await prisma.scene.create({
      data: {
        projectId: id,
        name,
        description,
        backgroundPath,
        location,
        timeOfDay
      }
    })

    return NextResponse.json({ success: true, data: scene })
  } catch (error) {
    console.error('Error creating scene:', error)
    return NextResponse.json({ success: false, error: 'Failed to create scene' }, { status: 500 })
  }
}
