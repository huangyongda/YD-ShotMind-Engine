import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storyboardId = parseInt(id)

    if (isNaN(storyboardId)) {
      return NextResponse.json({ success: false, error: 'Invalid storyboard ID' }, { status: 400 })
    }

    const storyboard = await prisma.storyboard.findUnique({
      where: { id: storyboardId },
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

    if (!storyboard) {
      return NextResponse.json({ success: false, error: 'Storyboard not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: storyboard })
  } catch (error) {
    console.error('Error fetching storyboard:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch storyboard' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storyboardId = parseInt(id)

    if (isNaN(storyboardId)) {
      return NextResponse.json({ success: false, error: 'Invalid storyboard ID' }, { status: 400 })
    }

    const body = await request.json()
    const { boardNumber, title, description } = body

    if (boardNumber !== undefined && (!Number.isInteger(Number(boardNumber)) || Number(boardNumber) <= 0)) {
      return NextResponse.json({ success: false, error: 'boardNumber must be a positive integer' }, { status: 400 })
    }

    const storyboard = await prisma.storyboard.update({
      where: { id: storyboardId },
      data: {
        boardNumber: boardNumber !== undefined ? Number(boardNumber) : undefined,
        title,
        description
      }
    })

    return NextResponse.json({ success: true, data: storyboard })
  } catch (error) {
    console.error('Error updating storyboard:', error)
    return NextResponse.json({ success: false, error: 'Failed to update storyboard' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const storyboardId = parseInt(id)

    if (isNaN(storyboardId)) {
      return NextResponse.json({ success: false, error: 'Invalid storyboard ID' }, { status: 400 })
    }

    const shotCount = await prisma.shot.count({ where: { storyboardId } })
    if (shotCount > 0) {
      return NextResponse.json({ success: false, error: 'Cannot delete storyboard with shots' }, { status: 400 })
    }

    await prisma.storyboard.delete({
      where: { id: storyboardId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting storyboard:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete storyboard' }, { status: 500 })
  }
}
