'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Shot {
  id: number
  shotNumber: number
  shotType: string
  shotDescription: string | null
  cameraMovement: string | null
  dialogueText: string | null
  videoPrompt: string | null
  characterId: number | null
  characterIds?: number[] | null
  sceneId: number | null
  characterImage: string | null
  sceneImage: string | null
  videoPath: string | null
  duration: number | null
  status: string
  character?: { id: number; name: string; avatarPath: string | null } | null
  scene?: { id: number; name: string; backgroundPath: string | null } | null
}

interface Storyboard {
  id: number
  boardNumber: number
  title: string | null
  description: string | null
  shots: Shot[]
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
  storyboards: Storyboard[]
}

export default function EpisodeDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const episodeId = params.episodeId as string
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingEpisode, setSavingEpisode] = useState(false)
  const [episodeForm, setEpisodeForm] = useState({
    synopsis: '',
    storyOutline: '',
    dialogueText: ''
  })
  const [episodeSaveMessage, setEpisodeSaveMessage] = useState<string | null>(null)

  const [showStoryboardForm, setShowStoryboardForm] = useState(false)
  const [storyboardForm, setStoryboardForm] = useState({
    boardNumber: 1,
    title: '',
    description: ''
  })

  useEffect(() => {
    fetchData()
  }, [episodeId])

  const fetchData = async () => {
    try {
      const epRes = await fetch(`/api/episodes/${episodeId}`)
      const epData = await epRes.json()

      if (epData.success) {
        setEpisode(epData.data)
        setEpisodeForm({
          synopsis: epData.data.synopsis || '',
          storyOutline: epData.data.storyOutline || '',
          dialogueText: epData.data.dialogueText || ''
        })
        setStoryboardForm((prev) => ({
          ...prev,
          boardNumber: (epData.data.storyboards?.length || 0) + 1
        }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEpisodeContent = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEpisode(true)
    setEpisodeSaveMessage(null)

    try {
      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          synopsis: episodeForm.synopsis || null,
          storyOutline: episodeForm.storyOutline || null,
          dialogueText: episodeForm.dialogueText || null
        })
      })

      const data = await res.json()
      if (!data.success) {
        setEpisodeSaveMessage(data.error || '保存剧集内容失败')
        return
      }

      setEpisode((prev) => prev ? {
        ...prev,
        synopsis: data.data.synopsis,
        storyOutline: data.data.storyOutline,
        dialogueText: data.data.dialogueText
      } : prev)
      setEpisodeSaveMessage('已保存')
    } catch (error) {
      console.error('Error saving episode content:', error)
      setEpisodeSaveMessage('保存剧集内容失败')
    } finally {
      setSavingEpisode(false)
    }
  }

  const handleCreateStoryboard = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch(`/api/episodes/${episodeId}/storyboards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardNumber: storyboardForm.boardNumber,
          title: storyboardForm.title || null,
          description: storyboardForm.description || null
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowStoryboardForm(false)
        setStoryboardForm({
          boardNumber: (episode?.storyboards.length || 0) + 2,
          title: '',
          description: ''
        })
        fetchData()
      } else {
        alert(data.error || '创建分镜失败')
      }
    } catch (error) {
      console.error('Error creating storyboard:', error)
    }
  }

  const handleDeleteShot = async (id: number) => {
    if (!confirm('确定要删除这个镜头吗？')) return
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

  const handleDeleteStoryboard = async (id: number) => {
    if (!confirm('确定要删除这个分镜吗？（必须先删除其下所有镜头）')) return
    try {
      const res = await fetch(`/api/storyboards/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.error || '删除分镜失败')
      }
    } catch (error) {
      console.error('Error deleting storyboard:', error)
    }
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
              onClick={() => setShowStoryboardForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              添加分镜
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">剧集信息</h2>
            <form onSubmit={handleSaveEpisodeContent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                <textarea
                  value={episodeForm.synopsis}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, synopsis: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">完整内容</label>
                <textarea
                  value={episodeForm.storyOutline}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, storyOutline: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">对白内容</label>
                <textarea
                  value={episodeForm.dialogueText}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, dialogueText: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">状态:</span>
                  <span className="ml-2">{statusMap[episode.status]}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingEpisode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingEpisode ? '保存中...' : '保存剧集内容'}
                </button>
                {episodeSaveMessage && <span className="text-sm text-gray-600">{episodeSaveMessage}</span>}
              </div>
            </form>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">分镜列表</h2>
              <span className="text-gray-500 text-sm">共 {episode.storyboards.length} 个分镜 / {episode.shots.length} 个镜头</span>
            </div>

            {episode.storyboards.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无分镜</p>
            ) : (
              <div className="space-y-5">
                {episode.storyboards.map((storyboard) => (
                  <div key={storyboard.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">分镜 {storyboard.boardNumber}</span>
                          {storyboard.title && <span className="text-sm text-gray-600">{storyboard.title}</span>}
                        </div>
                        {storyboard.description && <p className="text-sm text-gray-600 mt-1">{storyboard.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/projects/${projectId}/episodes/${episodeId}/shots/new?storyboardId=${storyboard.id}&boardNumber=${storyboard.boardNumber}&shotNumber=${storyboard.shots.length + 1}`}
                          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          添加镜头
                        </Link>
                        <button
                          onClick={() => handleDeleteStoryboard(storyboard.id)}
                          className="text-sm px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
                        >
                          删除分镜
                        </button>
                      </div>
                    </div>

                    {storyboard.shots.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4">暂无镜头</p>
                    ) : (
                      <div className="space-y-3">
                        {storyboard.shots.map((shot) => (
                          <div key={shot.id} className="border rounded p-3 bg-white">
                            <div className="flex items-start justify-between gap-4">
                              <Link
                                href={`/projects/${projectId}/episodes/${episodeId}/shots/${shot.id}`}
                                className="flex-1 min-w-0"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">镜头 {shot.shotNumber}</span>
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
                                <p className="text-gray-600 text-sm mb-1">{shot.shotDescription || '暂无描述'}</p>
                                <div className="flex gap-4 text-xs text-gray-500">
                                  {shot.character && <span>角色: {shot.character.name}</span>}
                                  {shot.scene && <span>场景: {shot.scene.name}</span>}
                                  {typeof shot.duration === 'number' && <span>时长: {shot.duration} 秒</span>}
                                </div>
                              </Link>
                              <button
                                onClick={() => handleDeleteShot(shot.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                删除
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {showStoryboardForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-xl">
                <h2 className="text-xl font-semibold mb-4">添加分镜</h2>
                <form onSubmit={handleCreateStoryboard} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分镜序号 *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={storyboardForm.boardNumber}
                      onChange={(e) => setStoryboardForm({ ...storyboardForm, boardNumber: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                    <input
                      type="text"
                      value={storyboardForm.title}
                      onChange={(e) => setStoryboardForm({ ...storyboardForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={storyboardForm.description}
                      onChange={(e) => setStoryboardForm({ ...storyboardForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">创建</button>
                    <button type="button" onClick={() => setShowStoryboardForm(false)} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">取消</button>
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
