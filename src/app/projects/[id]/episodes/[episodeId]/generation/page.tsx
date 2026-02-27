'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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
  lipSyncVideo: string | null
  status: string
  character?: { id: number; name: string; avatarPath: string | null } | null
  scene?: { id: number; name: string; backgroundPath: string | null } | null
}

export default function GenerationPage() {
  const params = useParams()
  const projectId = params.id as string
  const episodeId = params.episodeId as string
  const [shots, setShots] = useState<Shot[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingShotId, setGeneratingShotId] = useState<number | null>(null)

  useEffect(() => {
    fetchShots()
  }, [episodeId])

  const fetchShots = async () => {
    try {
      const res = await fetch(`/api/episodes/${episodeId}/shots`)
      const data = await res.json()
      if (data.success) {
        setShots(data.data)
      }
    } catch (error) {
      console.error('Error fetching shots:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateVideo = async (shotId: number) => {
    setGeneratingShotId(shotId)
    try {
      const res = await fetch('/api/generation/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotId })
      })
      const data = await res.json()
      if (data.success) {
        // 轮询检查状态
        pollShotStatus(shotId)
      } else {
        alert(data.error || '生成失败')
        setGeneratingShotId(null)
      }
    } catch (error) {
      console.error('Error generating video:', error)
      setGeneratingShotId(null)
    }
  }

  const generateTTS = async (shotId: number) => {
    setGeneratingShotId(shotId)
    try {
      const res = await fetch('/api/generation/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotId })
      })
      const data = await res.json()
      if (data.success) {
        pollShotStatus(shotId)
      } else {
        alert(data.error || '生成失败')
        setGeneratingShotId(null)
      }
    } catch (error) {
      console.error('Error generating TTS:', error)
      setGeneratingShotId(null)
    }
  }

  const lipSync = async (shotId: number) => {
    setGeneratingShotId(shotId)
    try {
      const res = await fetch('/api/generation/lip-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotId })
      })
      const data = await res.json()
      if (data.success) {
        pollShotStatus(shotId)
      } else {
        alert(data.error || '生成失败')
        setGeneratingShotId(null)
      }
    } catch (error) {
      console.error('Error generating lip sync:', error)
      setGeneratingShotId(null)
    }
  }

  const pollShotStatus = async (shotId: number) => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/shots/${shotId}`)
        const data = await res.json()
        if (data.success) {
          const shot = data.data
          setShots(prev => prev.map(s => s.id === shotId ? shot : s))
          if (shot.status !== 'GENERATING') {
            setGeneratingShotId(null)
          } else {
            setTimeout(checkStatus, 3000)
          }
        }
      } catch (error) {
        console.error('Error checking status:', error)
      }
    }
    checkStatus()
  }

  const statusMap: Record<string, string> = {
    PENDING: '待生成',
    GENERATING: '生成中',
    COMPLETED: '已完成',
    FAILED: '失败'
  }

  if (loading) return <div className="p-8 text-center">加载中...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href={`/projects/${projectId}/episodes/${episodeId}`} className="text-blue-600 hover:text-blue-800 text-sm mb-1 inline-block">
              ← 返回分镜列表
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">视频生成</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {shots.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500 text-lg">暂无分镜，请先添加分镜</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shots.map((shot) => (
                <div key={shot.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-lg">分镜 {shot.shotNumber}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          shot.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          shot.status === 'GENERATING' ? 'bg-yellow-100 text-yellow-800' :
                          shot.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusMap[shot.status]}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{shot.shotDescription || '暂无描述'}</p>

                      {/* 预览区域 */}
                      <div className="flex gap-4 mb-3">
                        {shot.characterImage && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">角色参考</p>
                            <img src={shot.characterImage} alt="角色" className="w-24 h-24 object-cover rounded" />
                          </div>
                        )}
                        {shot.sceneImage && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">场景参考</p>
                            <img src={shot.sceneImage} alt="场景" className="w-24 h-24 object-cover rounded" />
                          </div>
                        )}
                      </div>

                      {/* 生成结果 */}
                      <div className="flex gap-4">
                        {shot.ttsAudioPath && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">TTS音频</p>
                            <audio controls src={shot.ttsAudioPath} className="h-8" />
                          </div>
                        )}
                        {shot.videoPath && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">原始视频</p>
                            <video src={shot.videoPath} className="w-32 h-18 object-cover rounded" controls />
                          </div>
                        )}
                        {shot.lipSyncVideo && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">对口型视频</p>
                            <video src={shot.lipSyncVideo} className="w-32 h-18 object-cover rounded" controls />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => generateTTS(shot.id)}
                        disabled={generatingShotId !== null || !shot.shotDescription}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        {generatingShotId === shot.id ? '生成中...' : '生成TTS'}
                      </button>
                      <button
                        onClick={() => generateVideo(shot.id)}
                        disabled={generatingShotId !== null || !shot.characterImage || !shot.sceneImage}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {generatingShotId === shot.id ? '生成中...' : '生成视频'}
                      </button>
                      <button
                        onClick={() => lipSync(shot.id)}
                        disabled={generatingShotId !== null || !shot.characterImage || !shot.ttsAudioPath}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {generatingShotId === shot.id ? '生成中...' : '对口型'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
