import { NextResponse } from 'next/server'
import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import {
  getCharacterImageStats,
  isCharacterAngle
} from '@/types/character-image'

const MAX_FILE_SIZE = 10 * 1024 * 1024

type AngleImageDelegate = {
  findUnique(args: {
    where: { characterId_angle: { characterId: number; angle: string } }
  }): Promise<AngleImageRow | null>
  upsert(args: {
    where: { characterId_angle: { characterId: number; angle: string } }
    update: { filePath: string }
    create: { characterId: number; angle: string; filePath: string }
  }): Promise<AngleImageRow>
  findMany(args: {
    where: { characterId: number }
    orderBy: { angle: 'asc' }
    select: { id: true; angle: true; filePath: true; createdAt: true; updatedAt: true }
  }): Promise<Array<{ id: number; angle: string; filePath: string; createdAt: Date; updatedAt: Date }>>
}

function getAngleImageDelegate() {
  return (prisma as unknown as { characterAngleImage?: AngleImageDelegate }).characterAngleImage
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
  const { uploadedCount, missingAngles } = getCharacterImageStats(angleImages)
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
    const characterId = parseInt(id)

    if (isNaN(characterId)) {
      return NextResponse.json({ success: false, error: 'Invalid character ID' }, { status: 400 })
    }

    const formData = await request.formData()
    const angleValue = formData.get('angle')
    const file = formData.get('file')

    if (typeof angleValue !== 'string' || !isCharacterAngle(angleValue)) {
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

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      select: { id: true }
    })

    if (!character) {
      return NextResponse.json({ success: false, error: 'Character not found' }, { status: 404 })
    }

    const ext = getFileExtension(file)
    const fileName = `${angleValue}-${Date.now()}.${ext}`
    const relativePath = path.posix.join('uploads', 'characters', String(characterId), fileName)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'characters', String(characterId))
    const fullFilePath = path.join(uploadDir, fileName)

    await mkdir(uploadDir, { recursive: true })
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(fullFilePath, fileBuffer)

    const angleImageDelegate = getAngleImageDelegate()
    if (!angleImageDelegate) {
      return NextResponse.json({ success: false, error: 'Character angle image feature is not available. Please run latest migration and restart server.' }, { status: 503 })
    }

    const existing = await angleImageDelegate.findUnique({
      where: {
        characterId_angle: {
          characterId,
          angle: angleValue
        }
      }
    })

    const saved = await angleImageDelegate.upsert({
      where: {
        characterId_angle: {
          characterId,
          angle: angleValue
        }
      },
      update: {
        filePath: `/${relativePath}`
      },
      create: {
        characterId,
        angle: angleValue,
        filePath: `/${relativePath}`
      }
    })

    if (existing && existing.filePath !== saved.filePath) {
      await removeOldFile(existing.filePath)
    }

    const allImages = await angleImageDelegate.findMany({
      where: { characterId },
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
    console.error('Error uploading character angle image:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload image'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
