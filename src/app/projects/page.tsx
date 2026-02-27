import Link from 'next/link'
import { prisma } from '@/lib/db'

async function getProjects() {
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
  return projects
}

export default async function ProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">项目管理</h1>
          <Link
            href="/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            新建项目
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {projects.length === 0 ? (
            <div className="bg-white overflow-hidden shadow rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">暂无项目，点击右上角创建第一个项目</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        project.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'DRAFT' ? '草稿' :
                         project.status === 'GENERATING' ? '生成中' : '已完成'}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {project.description || '暂无描述'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>共 {project.totalEpisodes} 集</span>
                      <div className="flex gap-4">
                        <span>角色: {project._count.characters}</span>
                        <span>场景: {project._count.scenes}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
