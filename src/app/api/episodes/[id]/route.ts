import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const episodeId = parseInt(id)

    if (isNaN(episodeId)) {
      return NextResponse.json({ success: false, error: 'Invalid episode ID' }, { status: 400 })
    }

    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
      include: {
        shots: {
          orderBy: { shotNumber: 'asc' },
          include: {
            character: true,
            scene: true,
            storyboard: true
          }
        },
        storyboards: {
          orderBy: { boardNumber: 'asc' },
          include: {
            shots: {
              orderBy: { shotNumber: 'asc' },
              include: {
                character: true,
                scene: true
              }
            }
          }
        }
      }
    })

    if (!episode) {
      return NextResponse.json({ success: false, error: 'Episode not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: episode })
  } catch (error) {
    console.error('Error fetching episode:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch episode' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const episodeId = parseInt(id)

    if (isNaN(episodeId)) {
      return NextResponse.json({ success: false, error: 'Invalid episode ID' }, { status: 400 })
    }

    const body = await request.json()

    const episode = await prisma.episode.update({
      where: { id: episodeId },
      data: body
    })

    return NextResponse.json({ success: true, data: episode })
  } catch (error) {
    console.error('Error updating episode:', error)
    return NextResponse.json({ success: false, error: 'Failed to update episode' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const episodeId = parseInt(id)

    if (isNaN(episodeId)) {
      return NextResponse.json({ success: false, error: 'Invalid episode ID' }, { status: 400 })
    }

    await prisma.episode.delete({
      where: { id: episodeId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting episode:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete episode' }, { status: 500 })
  }
}
