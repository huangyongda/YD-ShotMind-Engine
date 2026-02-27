import { NextResponse } from 'next/server'
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import {
  getSceneImageStats,
  isSceneAngle
} from '@/types/scene-image'

const MAX_FILE_SIZE = 10 * 1024 * 1024

type AngleImageRow = {
  id: number
  sceneId: number
  angle: string
  filePath: string
  createdAt: Date
  updatedAt: Date
}

type SceneAngleImageDelegate = {
  findUnique(args: {
    where: { sceneId_angle: { sceneId: number; angle: string } }
  }): Promise<AngleImageRow | null>
  upsert(args: {
    where: { sceneId_angle: { sceneId: number; angle: string } }
    update: { filePath: string }
    create: { sceneId: number; angle: string; filePath: string }
  }): Promise<AngleImageRow>
  findMany(args: {
    where: { sceneId: number }
    orderBy: { angle: 'asc' }
    select: { id: true; angle: true; filePath: true; createdAt: true; updatedAt: true }
  }): Promise<Array<{ id: number; angle: string; filePath: string; createdAt: Date; updatedAt: Date }>>
}

function getSceneAngleImageDelegate() {
  return (prisma as unknown as { sceneAngleImage?: SceneAngleImageDelegate }).sceneAngleImage
}

function getFileExtension(file: File) {
  const extFromName = file.name.split('.').pop()?.toLowerCase()
  if (extFromName && /^[a-z0-9]+$/.test(extFromName)) {
    return extFromName
  }

  const extFromType = file.type.split('/')[1]?.toLowerCase()
  if (extFromType && /^[a-z0-9]+$/.test(extFromType)) {
    return extFromType
  }

  return 'png'
}

function buildStatsResponse(angleImages: Array<{ angle: string; filePath: string }>) {
  const { uploadedCount, missingAngles } = getSceneImageStats(angleImages)
  return {
    uploadedCount,
    missingAngles
  }
}

async function removeOldFile(filePath: string | null) {
  if (!filePath) {
    return
  }

  const normalizedPath = filePath.replace(/^\/+/, '')
  const fullPath = path.join(process.cwd(), 'public', normalizedPath)

  try {
    await unlink(fullPath)
  } catch {
    // ignore missing file to keep operation idempotent
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sceneId = parseInt(id)

    if (isNaN(sceneId)) {
      return NextResponse.json({ success: false, error: 'Invalid scene ID' }, { status: 400 })
    }

    const formData = await request.formData()
    const angleValue = formData.get('angle')
    const file = formData.get('file')

    if (typeof angleValue !== 'string' || !isSceneAngle(angleValue)) {
      return NextResponse.json({ success: false, error: 'Invalid angle' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Only image files are supported' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Image size exceeds 10MB limit' }, { status: 400 })
    }

    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      select: { id: true }
    })

    if (!scene) {
      return NextResponse.json({ success: false, error: 'Scene not found' }, { status: 404 })
    }

    const ext = getFileExtension(file)
    const fileName = `${angleValue}-${Date.now()}.${ext}`
    const relativePath = path.posix.join('uploads', 'scenes', String(sceneId), fileName)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'scenes', String(sceneId))
    const fullFilePath = path.join(uploadDir, fileName)

    await mkdir(uploadDir, { recursive: true })
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(fullFilePath, fileBuffer)

    const angleImageDelegate = getSceneAngleImageDelegate()
    if (!angleImageDelegate) {
      return NextResponse.json({ success: false, error: 'Scene angle image feature is not available. Please run latest migration and restart server.' }, { status: 503 })
    }

    const existing = await angleImageDelegate.findUnique({
      where: {
        sceneId_angle: {
          sceneId,
          angle: angleValue
        }
      }
    })

    const saved = await angleImageDelegate.upsert({
      where: {
        sceneId_angle: {
          sceneId,
          angle: angleValue
        }
      },
      update: {
        filePath: `/${relativePath}`
      },
      create: {
        sceneId,
        angle: angleValue,
        filePath: `/${relativePath}`
      }
    })

    if (existing && existing.filePath !== saved.filePath) {
      await removeOldFile(existing.filePath)
    }

    const allImages = await angleImageDelegate.findMany({
      where: { sceneId },
      orderBy: { angle: 'asc' },
      select: { id: true, angle: true, filePath: true, createdAt: true, updatedAt: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        image: saved,
        angleImages: allImages,
        ...buildStatsResponse(allImages)
      }
    })
  } catch (error) {
    console.error('Error uploading scene angle image:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload image'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
