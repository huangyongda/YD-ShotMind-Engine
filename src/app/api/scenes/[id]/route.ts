import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    const scene = await prisma.scene.findUnique({
      where: { id: sceneId }
    })

    if (!scene) {
      return NextResponse.json({ success: false, error: 'Scene not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: scene })
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
