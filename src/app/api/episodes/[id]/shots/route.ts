import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
      orderBy: { shotNumber: 'asc' },
      include: {
        character: true,
        scene: true
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
    const { shotNumber, shotType, shotDescription, videoPrompt, characterId, sceneId, characterImage, sceneImage } = body

    if (!shotNumber) {
      return NextResponse.json({ success: false, error: 'Shot number is required' }, { status: 400 })
    }

    const shot = await prisma.shot.create({
      data: {
        episodeId: id,
        shotNumber,
        shotType,
        shotDescription,
        videoPrompt,
        characterId,
        sceneId,
        characterImage,
        sceneImage
      }
    })

    return NextResponse.json({ success: true, data: shot })
  } catch (error) {
    console.error('Error creating shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to create shot' }, { status: 500 })
  }
}
