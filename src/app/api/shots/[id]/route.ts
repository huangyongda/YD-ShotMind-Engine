import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shotId = parseInt(id)

    if (isNaN(shotId)) {
      return NextResponse.json({ success: false, error: 'Invalid shot ID' }, { status: 400 })
    }

    const shot = await prisma.shot.findUnique({
      where: { id: shotId },
      include: {
        character: true,
        scene: true
      }
    })

    if (!shot) {
      return NextResponse.json({ success: false, error: 'Shot not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: shot })
  } catch (error) {
    console.error('Error fetching shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch shot' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shotId = parseInt(id)

    if (isNaN(shotId)) {
      return NextResponse.json({ success: false, error: 'Invalid shot ID' }, { status: 400 })
    }

    const body = await request.json()

    const shot = await prisma.shot.update({
      where: { id: shotId },
      data: body
    })

    return NextResponse.json({ success: true, data: shot })
  } catch (error) {
    console.error('Error updating shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to update shot' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const shotId = parseInt(id)

    if (isNaN(shotId)) {
      return NextResponse.json({ success: false, error: 'Invalid shot ID' }, { status: 400 })
    }

    await prisma.shot.delete({
      where: { id: shotId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shot:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete shot' }, { status: 500 })
  }
}
