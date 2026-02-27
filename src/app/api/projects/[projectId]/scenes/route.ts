import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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

    const scenes = await prisma.scene.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, data: scenes })
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
