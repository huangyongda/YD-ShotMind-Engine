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

    const episodes = await prisma.episode.findMany({
      where: { projectId: id },
      orderBy: { episodeNumber: 'asc' },
      include: {
        shots: {
          orderBy: { shotNumber: 'asc' }
        }
      }
    })

    return NextResponse.json({ success: true, data: episodes })
  } catch (error) {
    console.error('Error fetching episodes:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch episodes' }, { status: 500 })
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
    const { episodeNumber, title, synopsis } = body

    if (!episodeNumber) {
      return NextResponse.json({ success: false, error: 'Episode number is required' }, { status: 400 })
    }

    // Check if episode already exists
    const existing = await prisma.episode.findUnique({
      where: {
        projectId_episodeNumber: {
          projectId: id,
          episodeNumber
        }
      }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Episode already exists' }, { status: 400 })
    }

    const episode = await prisma.episode.create({
      data: {
        projectId: id,
        episodeNumber,
        title,
        synopsis
      }
    })

    return NextResponse.json({ success: true, data: episode })
  } catch (error) {
    console.error('Error creating episode:', error)
    return NextResponse.json({ success: false, error: 'Failed to create episode' }, { status: 500 })
  }
}
