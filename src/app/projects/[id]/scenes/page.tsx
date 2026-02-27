'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  SCENE_ANGLES,
  SCENE_ANGLE_LABELS,
  type SceneAngle
} from '@/types/scene-image'

interface SceneAngleImage {
  id: number
  angle: string
  filePath: string
  createdAt: string
  updatedAt: string
}

interface Scene {
  id: number
  name: string
  description: string | null
  backgroundPath: string | null
  location: string | null
  timeOfDay: string | null
  angleImages: SceneAngleImage[]
  uploadedCount: number
  missingAngles: string[]
}

function createEmptyAngleMap(): Record<SceneAngle, SceneAngleImage | null> {
  return SCENE_ANGLES.reduce((acc, angle) => {
    acc[angle] = null
    return acc
  }, {} as Record<SceneAngle, SceneAngleImage | null>)
}

function buildAngleMap(images: SceneAngleImage[] = []) {
  const map = createEmptyAngleMap()
  for (const image of images) {
    if ((SCENE_ANGLES as readonly string[]).includes(image.angle)) {
      map[image.angle as SceneAngle] = image
    }
  }
  return map
}

function getPreviewImage(scene: Scene) {
  const front = scene.angleImages?.find((item) => item.angle === 'front')
  return front?.filePath || scene.angleImages?.[0]?.filePath || scene.backgroundPath || null
}

export default function ScenesPage() {
  const params = useParams()
  const projectId = params.id as string
  const [scenes, setScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [angleMap, setAngleMap] = useState<Record<SceneAngle, SceneAngleImage | null>>(createEmptyAngleMap())
  const [uploadingAngles, setUploadingAngles] = useState<Partial<Record<SceneAngle, boolean>>>({})
  const [uploadedCount, setUploadedCount] = useState(0)
  const [missingAngles, setMissingAngles] = useState<SceneAngle[]>([...SCENE_ANGLES])
  const [angleMessage, setAngleMessage] = useState<string | null>(null)
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

  const openCreateForm = () => {
    setFormData({
      name: '',
      description: '',
      backgroundPath: '',
      location: '',
      timeOfDay: 'MORNING'
    })
    setEditingId(null)
    setAngleMap(createEmptyAngleMap())
    setUploadedCount(0)
    setMissingAngles([...SCENE_ANGLES])
    setUploadingAngles({})
    setAngleMessage(null)
    setShowForm(true)
  }

  const applyAngleData = (sceneId: number, data: { angleImages: SceneAngleImage[]; uploadedCount: number; missingAngles: string[] }) => {
    const nextImages = data.angleImages || []
    setAngleMap(buildAngleMap(nextImages))
    setUploadedCount(data.uploadedCount)
    setMissingAngles((data.missingAngles || []).filter((angle): angle is SceneAngle => (SCENE_ANGLES as readonly string[]).includes(angle)))

    setScenes((prev) =>
      prev.map((item) =>
        item.id === sceneId
          ? {
              ...item,
              angleImages: nextImages,
              uploadedCount: data.uploadedCount,
              missingAngles: data.missingAngles
            }
          : item
      )
    )
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
    setAngleMap(buildAngleMap(scene.angleImages || []))
    setUploadedCount(scene.uploadedCount ?? (scene.angleImages?.length || 0))
    setMissingAngles(
      (scene.missingAngles || []).filter((angle): angle is SceneAngle =>
        (SCENE_ANGLES as readonly string[]).includes(angle)
      )
    )
    setUploadingAngles({})
    setAngleMessage(null)
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

  const handleAngleUpload = async (angle: SceneAngle, file: File) => {
    if (!editingId) {
      setAngleMessage('请先保存场景基础信息，再上传多视角图片。')
      return
    }

    setAngleMessage(null)
    setUploadingAngles((prev) => ({ ...prev, [angle]: true }))

    try {
      const body = new FormData()
      body.append('angle', angle)
      body.append('file', file)

      const res = await fetch(`/api/scenes/${editingId}/images`, {
        method: 'POST',
        body
      })

      const data = await res.json()
      if (data.success) {
        applyAngleData(editingId, data.data)
      } else {
        setAngleMessage(data.error || '上传失败')
      }
    } catch (error) {
      console.error('Error uploading angle image:', error)
      setAngleMessage('上传失败，请稍后重试。')
    } finally {
      setUploadingAngles((prev) => ({ ...prev, [angle]: false }))
    }
  }

  const handleAngleDelete = async (angle: SceneAngle) => {
    if (!editingId) return

    setAngleMessage(null)
    setUploadingAngles((prev) => ({ ...prev, [angle]: true }))

    try {
      const res = await fetch(`/api/scenes/${editingId}/images/${angle}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.success) {
        applyAngleData(editingId, data.data)
      } else {
        setAngleMessage(data.error || '删除失败')
      }
    } catch (error) {
      console.error('Error deleting angle image:', error)
      setAngleMessage('删除失败，请稍后重试。')
    } finally {
      setUploadingAngles((prev) => ({ ...prev, [angle]: false }))
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', backgroundPath: '', location: '', timeOfDay: 'MORNING' })
    setEditingId(null)
    setAngleMap(createEmptyAngleMap())
    setUploadedCount(0)
    setMissingAngles([...SCENE_ANGLES])
    setUploadingAngles({})
    setAngleMessage(null)
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
            onClick={openCreateForm}
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
              <button onClick={openCreateForm} className="text-blue-600 hover:text-blue-800">
                添加第一个场景
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenes.map((scene) => {
                const previewImage = getPreviewImage(scene)
                return (
                  <div key={scene.id} className="bg-white shadow rounded-lg overflow-hidden">
                    {previewImage ? (
                      <img src={previewImage} alt={scene.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl text-gray-400">场景</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{scene.name}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 mt-1">{scene.description || '暂无描述'}</p>
                      <p className="text-xs text-gray-500 mt-1">多视角：{scene.uploadedCount || 0}/10</p>
                      {(!scene.angleImages || scene.angleImages.length === 0) && scene.backgroundPath && (
                        <p className="text-xs text-amber-600 mt-1">当前使用旧背景图URL，可补充多视角图片。</p>
                      )}
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
                )
              })}
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">旧背景图URL（兼容）</label>
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

                  <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">10 视角图片管理</h3>
                      <span className="text-sm text-gray-600">已上传 {uploadedCount}/10</span>
                    </div>

                    {editingId ? (
                      <>
                        {uploadedCount === 0 && formData.backgroundPath && (
                          <p className="text-xs text-gray-600">当前场景仅有旧背景图URL，可继续补充多视角图片。</p>
                        )}

                        {missingAngles.length > 0 && (
                          <p className="text-xs text-gray-600">
                            缺失视角（可少于10张）：{missingAngles.map((angle) => SCENE_ANGLE_LABELS[angle]).join('、')}
                          </p>
                        )}

                        {angleMessage && <p className="text-xs text-red-600">{angleMessage}</p>}

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {SCENE_ANGLES.map((angle) => {
                            const image = angleMap[angle]
                            const isUploading = Boolean(uploadingAngles[angle])

                            return (
                              <div key={angle} className="border border-gray-200 rounded-md p-2 space-y-2">
                                <div className="text-xs font-medium text-gray-700">{SCENE_ANGLE_LABELS[angle]}</div>

                                {image ? (
                                  <img
                                    src={image.filePath}
                                    alt={`${formData.name || '场景'}-${SCENE_ANGLE_LABELS[angle]}`}
                                    className="w-full h-24 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-full h-24 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                    未上传
                                  </div>
                                )}

                                <label className="block text-center px-2 py-1 text-xs bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
                                  {isUploading ? '上传中...' : image ? '替换' : '上传'}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) {
                                        handleAngleUpload(angle, file)
                                      }
                                      e.currentTarget.value = ''
                                    }}
                                  />
                                </label>

                                <button
                                  type="button"
                                  disabled={!image || isUploading}
                                  onClick={() => handleAngleDelete(angle)}
                                  className="w-full px-2 py-1 text-xs border border-red-200 text-red-600 rounded disabled:opacity-50"
                                >
                                  删除
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600">请先保存场景基础信息，再上传多视角图片。</p>
                    )}
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
