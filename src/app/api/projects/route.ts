import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            characters: true,
            scenes: true,
            episodes: true
          }
        }
      }
    })
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, totalEpisodes } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Project name is required' }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        totalEpisodes: totalEpisodes || 10
      }
    })

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ success: false, error: 'Failed to create project' }, { status: 500 })
  }
}
