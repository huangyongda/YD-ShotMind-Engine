'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Episode {
  id: number
  episodeNumber: number
  title: string | null
  synopsis: string | null
  storyOutline: string | null
  status: string
  shots: any[]
}

export default function EpisodesPage() {
  const params = useParams()
  const projectId = params.id as string
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    episodeNumber: 1,
    title: '',
    synopsis: ''
  })

  useEffect(() => {
    fetchEpisodes()
  }, [projectId])

  const fetchEpisodes = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/episodes`)
      const data = await res.json()
      if (data.success) {
        setEpisodes(data.data)
      }
    } catch (error) {
      console.error('Error fetching episodes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch(`/api/projects/${projectId}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        fetchEpisodes()
        setShowForm(false)
        setFormData({ episodeNumber: episodes.length + 2, title: '', synopsis: '' })
      } else {
        alert(data.error || '创建失败')
      }
    } catch (error) {
      console.error('Error creating episode:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这一集吗？')) return
    try {
      const res = await fetch(`/api/episodes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchEpisodes()
      }
    } catch (error) {
      console.error('Error deleting episode:', error)
    }
  }

  const statusMap: Record<string, string> = {
    PENDING: '待生成',
    GENERATING: '生成中',
    COMPLETED: '已完成',
    FAILED: '失败'
  }

  const statusColor: Record<string, string> = {
    PENDING: 'text-gray-500',
    GENERATING: 'text-yellow-600',
    COMPLETED: 'text-green-600',
    FAILED: 'text-red-600'
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href={`/projects/${projectId}`} className="text-blue-600 hover:text-blue-800 text-sm mb-1 inline-block">
              ← 返回项目
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">剧集管理</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            添加剧集
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {episodes.length === 0 && !showForm ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">暂无剧集</p>
              <button onClick={() => setShowForm(true)} className="text-blue-600 hover:text-blue-800">
                添加第一集
              </button>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">集号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">简介</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分镜数</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {episodes.map((episode) => (
                    <tr key={episode.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/projects/${projectId}/episodes/${episode.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          第 {episode.episodeNumber} 集
                        </Link>
                      </td>
                      <td className="px-6 py-4">{episode.title || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm max-w-xs truncate">{episode.synopsis || '-'}</td>
                      <td className={`px-6 py-4 whitespace-nowrap ${statusColor[episode.status]}`}>
                        {statusMap[episode.status]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{episode.shots?.length || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/projects/${projectId}/episodes/${episode.id}`} className="text-blue-600 hover:text-blue-800 text-sm mr-3">
                          查看
                        </Link>
                        <button onClick={() => handleDelete(episode.id)} className="text-red-600 hover:text-red-800 text-sm">
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">添加剧集</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">集号 *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.episodeNumber}
                      onChange={(e) => setFormData({ ...formData, episodeNumber: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                    <textarea
                      value={formData.synopsis}
                      onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      添加
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      取消
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
