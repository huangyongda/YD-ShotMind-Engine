'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Scene {
  id: number
  name: string
  description: string | null
  backgroundPath: string | null
  location: string | null
  timeOfDay: string | null
}

export default function ScenesPage() {
  const params = useParams()
  const projectId = params.id as string
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    backgroundPath: '',
    location: '',
    timeOfDay: 'MORNING'
  })

  useEffect(() => {
    fetchScenes()
  }, [projectId])

  const fetchScenes = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/scenes`)
      const data = await res.json()
      if (data.success) {
        setScenes(data.data)
      }
    } catch (error) {
      console.error('Error fetching scenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    const url = editingId
      ? `/api/scenes/${editingId}`
      : `/api/projects/${projectId}/scenes`
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        fetchScenes()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving scene:', error)
    }
  }

  const handleEdit = (scene: Scene) => {
    setFormData({
      name: scene.name,
      description: scene.description || '',
      backgroundPath: scene.backgroundPath || '',
      location: scene.location || '',
      timeOfDay: scene.timeOfDay || 'MORNING'
    })
    setEditingId(scene.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个场景吗？')) return
    try {
      const res = await fetch(`/api/scenes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchScenes()
      }
    } catch (error) {
      console.error('Error deleting scene:', error)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', backgroundPath: '', location: '', timeOfDay: 'MORNING' })
    setEditingId(null)
    setShowForm(false)
  }

  const timeOfDayMap: Record<string, string> = {
    MORNING: '早晨',
    AFTERNOON: '下午',
    EVENING: '傍晚',
    NIGHT: '夜晚',
    DAWN: '黎明',
    DUSK: '黄昏'
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
            <h1 className="text-3xl font-bold text-gray-900">场景管理</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            添加场景
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {scenes.length === 0 && !showForm ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">暂无场景</p>
              <button onClick={() => setShowForm(true)} className="text-blue-600 hover:text-blue-800">
                添加第一个场景
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenes.map((scene) => (
                <div key={scene.id} className="bg-white shadow rounded-lg overflow-hidden">
                  {scene.backgroundPath ? (
                    <img src={scene.backgroundPath} alt={scene.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                      <span className="text-4xl text-gray-400">🏞️</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{scene.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mt-1">{scene.description || '暂无描述'}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {scene.location && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{scene.location}</span>
                      )}
                      {scene.timeOfDay && (
                        <span className="px-2 py-1 bg-blue-100 rounded text-xs">{timeOfDayMap[scene.timeOfDay] || scene.timeOfDay}</span>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleEdit(scene)} className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                      <button onClick={() => handleDelete(scene.id)} className="text-red-600 hover:text-red-800 text-sm">删除</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">{editingId ? '编辑场景' : '添加场景'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">名称 *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">背景图URL</label>
                    <input
                      type="text"
                      value={formData.backgroundPath}
                      onChange={(e) => setFormData({ ...formData, backgroundPath: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时间段</label>
                    <select
                      value={formData.timeOfDay}
                      onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="MORNING">早晨</option>
                      <option value="AFTERNOON">下午</option>
                      <option value="EVENING">傍晚</option>
                      <option value="NIGHT">夜晚</option>
                      <option value="DAWN">黎明</option>
                      <option value="DUSK">黄昏</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      {editingId ? '保存' : '添加'}
                    </button>
                    <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
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
