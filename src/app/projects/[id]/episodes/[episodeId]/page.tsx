'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Character {
  id: number
  name: string
  avatarPath: string | null
}

interface Scene {
  id: number
  name: string
  backgroundPath: string | null
}

interface Shot {
  id: number
  shotNumber: number
  shotType: string
  shotDescription: string | null
  videoPrompt: string | null
  characterId: number | null
  sceneId: number | null
  characterImage: string | null
  sceneImage: string | null
  videoPath: string | null
  ttsAudioPath: string | null
  status: string
  character?: Character | null
  scene?: Scene | null
}

interface Episode {
  id: number
  episodeNumber: number
  title: string | null
  synopsis: string | null
  storyOutline: string | null
  dialogueText: string | null
  status: string
  shots: Shot[]
}

export default function EpisodeDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const episodeId = params.episodeId as string
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    shotNumber: 1,
    shotType: 'MEDIUM_SHOT',
    shotDescription: '',
    videoPrompt: '',
    characterId: '',
    sceneId: '',
    characterImage: '',
    sceneImage: ''
  })

  useEffect(() => {
    fetchData()
  }, [projectId, episodeId])

  const fetchData = async () => {
    try {
      const [epRes, charRes, sceneRes] = await Promise.all([
        fetch(`/api/episodes/${episodeId}`),
        fetch(`/api/projects/${projectId}/characters`),
        fetch(`/api/projects/${projectId}/scenes`)
      ])
      const epData = await epRes.json()
      const charData = await charRes.json()
      const sceneData = await sceneRes.json()

      if (epData.success) setEpisode(epData.data)
      if (charData.success) setCharacters(charData.data)
      if (sceneData.success) setScenes(sceneData.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...formData,
      characterId: formData.characterId ? parseInt(formData.characterId) : null,
      sceneId: formData.sceneId ? parseInt(formData.sceneId) : null
    }

    const url = editingId
      ? `/api/shots/${editingId}`
      : `/api/episodes/${episodeId}/shots`
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        fetchData()
        resetForm()
      }
    } catch (error) {
      console.error('Error saving shot:', error)
    }
  }

  const handleEdit = (shot: Shot) => {
    setFormData({
      shotNumber: shot.shotNumber,
      shotType: shot.shotType,
      shotDescription: shot.shotDescription || '',
      videoPrompt: shot.videoPrompt || '',
      characterId: shot.characterId?.toString() || '',
      sceneId: shot.sceneId?.toString() || '',
      characterImage: shot.characterImage || '',
      sceneImage: shot.sceneImage || ''
    })
    setEditingId(shot.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个分镜吗？')) return
    try {
      const res = await fetch(`/api/shots/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting shot:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      shotNumber: (episode?.shots.length || 0) + 1,
      shotType: 'MEDIUM_SHOT',
      shotDescription: '',
      videoPrompt: '',
      characterId: '',
      sceneId: '',
      characterImage: '',
      sceneImage: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const shotTypeMap: Record<string, string> = {
    EXTREME_WIDE_SHOT: '极远景',
    WIDE_SHOT: '远景',
    FULL_SHOT: '全景',
    MEDIUM_WIDE_SHOT: '中远景',
    MEDIUM_SHOT: '中景',
    MEDIUM_CLOSE_UP: '中近景',
    CLOSE_UP: '近景',
    EXTREME_CLOSE_UP: '特写',
    POV: '主观镜头',
    TWO_SHOT: '双人镜头'
  }

  const statusMap: Record<string, string> = {
    PENDING: '待生成',
    GENERATING: '生成中',
    COMPLETED: '已完成',
    FAILED: '失败'
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>
  if (!episode) return <div className="p-8 text-center">剧集不存在</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href={`/projects/${projectId}/episodes`} className="text-blue-600 hover:text-blue-800 text-sm mb-1 inline-block">
              ← 返回剧集列表
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">第 {episode.episodeNumber} 集</h1>
            {episode.title && <p className="text-gray-500">{episode.title}</p>}
          </div>
          <div className="flex gap-4">
            <Link
              href={`/projects/${projectId}/episodes/${episodeId}/generation`}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              视频生成
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              添加分镜
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* 剧集信息 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">剧集信息</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">简介:</span>
                <p className="mt-1">{episode.synopsis || '暂无'}</p>
              </div>
              <div>
                <span className="text-gray-500">状态:</span>
                <span className="ml-2">{statusMap[episode.status]}</span>
              </div>
            </div>
          </div>

          {/* 分镜列表 */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">分镜列表</h2>
              <span className="text-gray-500 text-sm">共 {episode.shots.length} 个分镜</span>
            </div>

            {episode.shots.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无分镜</p>
            ) : (
              <div className="space-y-4">
                {episode.shots.map((shot) => (
                  <div key={shot.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">分镜 {shot.shotNumber}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{shotTypeMap[shot.shotType]}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            shot.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            shot.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-800' :
                            shot.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusMap[shot.status]}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{shot.shotDescription || '暂无描述'}</p>
                        {shot.videoPrompt && (
                          <p className="text-gray-500 text-xs mb-2">提示词: {shot.videoPrompt}</p>
                        )}
                        <div className="flex gap-4 text-xs text-gray-500">
                          {shot.character && <span>角色: {shot.character.name}</span>}
                          {shot.scene && <span>场景: {shot.scene.name}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => handleEdit(shot)} className="text-blue-600 hover:text-blue-800 text-sm">编辑</button>
                        <button onClick={() => handleDelete(shot.id)} className="text-red-600 hover:text-red-800 text-sm">删除</button>
                      </div>
                    </div>
                    {/* 预览图 */}
                    <div className="flex gap-2 mt-3">
                      {shot.characterImage && (
                        <img src={shot.characterImage} alt="角色" className="w-20 h-20 object-cover rounded" />
                      )}
                      {shot.sceneImage && (
                        <img src={shot.sceneImage} alt="场景" className="w-20 h-20 object-cover rounded" />
                      )}
                      {shot.videoPath && (
                        <video src={shot.videoPath} className="w-32 h-20 object-cover rounded" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 分镜表单 */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">{editingId ? '编辑分镜' : '添加分镜'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">分镜序号 *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.shotNumber}
                        onChange={(e) => setFormData({ ...formData, shotNumber: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">镜头类型</label>
                      <select
                        value={formData.shotType}
                        onChange={(e) => setFormData({ ...formData, shotType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {Object.entries(shotTypeMap).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分镜描述</label>
                    <textarea
                      value={formData.shotDescription}
                      onChange={(e) => setFormData({ ...formData, shotDescription: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">视频提示词</label>
                    <textarea
                      value={formData.videoPrompt}
                      onChange={(e) => setFormData({ ...formData, videoPrompt: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="用于生成视频的提示词"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">出场角色</label>
                      <select
                        value={formData.characterId}
                        onChange={(e) => setFormData({ ...formData, characterId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">无</option>
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">使用场景</label>
                      <select
                        value={formData.sceneId}
                        onChange={(e) => setFormData({ ...formData, sceneId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">无</option>
                        {scenes.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">角色参考图URL</label>
                      <input
                        type="text"
                        value={formData.characterImage}
                        onChange={(e) => setFormData({ ...formData, characterImage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">场景参考图URL</label>
                      <input
                        type="text"
                        value={formData.sceneImage}
                        onChange={(e) => setFormData({ ...formData, sceneImage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
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
