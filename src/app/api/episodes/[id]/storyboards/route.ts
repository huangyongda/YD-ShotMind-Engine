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

    const storyboards = await prisma.storyboard.findMany({
      where: { episodeId },
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
    })

    return NextResponse.json({ success: true, data: storyboards })
  } catch (error) {
    console.error('Error fetching storyboards:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch storyboards' }, { status: 500 })
  }
}

export async function POST(
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
    const { boardNumber, title, description } = body

    if (!boardNumber || !Number.isInteger(Number(boardNumber)) || Number(boardNumber) <= 0) {
      return NextResponse.json({ success: false, error: 'boardNumber must be a positive integer' }, { status: 400 })
    }

    const storyboard = await prisma.storyboard.create({
      data: {
        episodeId,
        boardNumber: Number(boardNumber),
        title,
        description
      }
    })

    return NextResponse.json({ success: true, data: storyboard })
  } catch (error) {
    console.error('Error creating storyboard:', error)
    return NextResponse.json({ success: false, error: 'Failed to create storyboard' }, { status: 500 })
  }
}
