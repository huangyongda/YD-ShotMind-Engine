import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'

async function getProject(id: string) {
  const projectId = parseInt(id)
  if (isNaN(projectId)) return null

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      characters: true,
      scenes: true,
      episodes: {
        orderBy: { episodeNumber: 'asc' },
        include: {
          shots: true
        }
      }
    }
  })
  return project
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href="/projects" className="text-blue-600 hover:text-blue-800 text-sm mb-1 inline-block">
              ← 返回项目列表
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          </div>
          <div className="flex gap-4">
            <span className={`px-3 py-1 text-sm rounded-full ${
              project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              project.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {project.status === 'DRAFT' ? '草稿' :
               project.status === 'GENERATING' ? '生成中' : '已完成'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* 项目概览 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">项目概览</h2>
            <p className="text-gray-600 mb-4">{project.description || '暂无描述'}</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">总集数:</span>
                <span className="ml-2 font-medium">{project.totalEpisodes}</span>
              </div>
              <div>
                <span className="text-gray-500">角色数:</span>
                <span className="ml-2 font-medium">{project.characters.length}</span>
              </div>
              <div>
                <span className="text-gray-500">场景数:</span>
                <span className="ml-2 font-medium">{project.scenes.length}</span>
              </div>
            </div>
          </div>

          {/* 快捷导航 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Link href={`/projects/${project.id}/characters`} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">角色管理</h3>
              <p className="text-gray-500 text-sm">{project.characters.length} 个角色</p>
            </Link>
            <Link href={`/projects/${project.id}/scenes`} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">场景管理</h3>
              <p className="text-gray-500 text-sm">{project.scenes.length} 个场景</p>
            </Link>
            <Link href={`/projects/${project.id}/episodes`} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">剧集管理</h3>
              <p className="text-gray-500 text-sm">{project.episodes.length} 集</p>
            </Link>
            <Link href={`/projects/${project.id}/settings`} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-2">项目设置</h3>
              <p className="text-gray-500 text-sm">配置与设置</p>
            </Link>
          </div>

          {/* 剧集列表 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">剧集列表</h2>
              <Link href={`/projects/${project.id}/episodes`} className="text-blue-600 hover:text-blue-800">
                查看全部 →
              </Link>
            </div>
            {project.episodes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无剧集</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {project.episodes.map((episode) => (
                  <Link
                    key={episode.id}
                    href={`/projects/${project.id}/episodes/${episode.id}`}
                    className="border rounded-lg p-4 hover:border-blue-500 hover:shadow transition-all"
                  >
                    <div className="font-medium">第 {episode.episodeNumber} 集</div>
                    <div className={`text-xs mt-1 ${
                      episode.status === 'COMPLETED' ? 'text-green-600' :
                      episode.status === 'FAILED' ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {episode.status === 'PENDING' ? '待生成' :
                       episode.status === 'GENERATING' ? '生成中' :
                       episode.status === 'COMPLETED' ? '已完成' : '失败'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {episode.shots.length} 个分镜
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
