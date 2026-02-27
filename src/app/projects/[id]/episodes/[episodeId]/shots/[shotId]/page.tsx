'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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

interface Storyboard {
  id: number
  boardNumber: number
  title: string | null
}

interface ShotData {
  id: number
  shotNumber: number
  shotType: string
  shotDescription: string | null
  cameraMovement: string | null
  dialogueText: string | null
  videoPrompt: string | null
  characterId: number | null
  characterIds: unknown
  sceneId: number | null
  duration: number | null
  videoPath: string | null
  status: string
  storyboard?: Storyboard | null
  characters?: Character[]
}

function getInitialCharacterIds(shot: ShotData): number[] {
  if (Array.isArray(shot.characterIds)) {
    const ids = shot.characterIds
      .map((item) => (typeof item === 'number' ? item : Number(item)))
      .filter((item) => Number.isInteger(item) && item > 0)

    if (ids.length > 0) return ids
  }

  if (shot.characterId) return [shot.characterId]
  return []
}

export default function ShotDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string
  const episodeId = params.episodeId as string
  const shotId = params.shotId as string
  const isCreateMode = shotId === 'new'
  const initialStoryboardId = searchParams.get('storyboardId')
  const initialBoardNumber = searchParams.get('boardNumber')
  const initialShotNumber = searchParams.get('shotNumber')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [formData, setFormData] = useState({
    shotType: 'MEDIUM_SHOT',
    shotDescription: '',
    cameraMovement: '',
    dialogueText: '',
    videoPrompt: '',
    characterIds: [] as number[],
    sceneId: '',
    createSceneName: '',
    duration: '',
    videoPath: '',
    status: 'PENDING'
  })
  const [shotInfo, setShotInfo] = useState<{ shotNumber: number; boardNumber?: number } | null>(null)

  useEffect(() => {
    fetchData()
  }, [projectId, shotId, initialBoardNumber, initialShotNumber, isCreateMode])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [charRes, sceneRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/characters`),
        fetch(`/api/projects/${projectId}/scenes`)
      ])

      const [charData, sceneData] = await Promise.all([
        charRes.json(),
        sceneRes.json()
      ])

      if (charData.success) setCharacters(charData.data)
      if (sceneData.success) setScenes(sceneData.data)

      if (isCreateMode) {
        setShotInfo({
          shotNumber: Number(initialShotNumber || '1'),
          boardNumber: initialBoardNumber ? Number(initialBoardNumber) : undefined
        })
        return
      }

      const shotRes = await fetch(`/api/shots/${shotId}`)
      const shotData = await shotRes.json()

      if (!shotData.success) {
        setError(shotData.error || '加载镜头失败')
        return
      }

      const shot = shotData.data as ShotData
      setShotInfo({ shotNumber: shot.shotNumber, boardNumber: shot.storyboard?.boardNumber })
      setFormData({
        shotType: shot.shotType || 'MEDIUM_SHOT',
        shotDescription: shot.shotDescription || '',
        cameraMovement: shot.cameraMovement || '',
        dialogueText: shot.dialogueText || '',
        videoPrompt: shot.videoPrompt || '',
        characterIds: getInitialCharacterIds(shot),
        sceneId: shot.sceneId ? String(shot.sceneId) : '',
        createSceneName: '',
        duration: shot.duration != null ? String(shot.duration) : '',
        videoPath: shot.videoPath || '',
        status: shot.status || 'PENDING'
      })
    } catch (err) {
      console.error('Error fetching shot detail:', err)
      setError('加载镜头失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCharacterToggle = (characterId: number) => {
    setFormData((prev) => {
      const exists = prev.characterIds.includes(characterId)
      return {
        ...prev,
        characterIds: exists
          ? prev.characterIds.filter((id) => id !== characterId)
          : [...prev.characterIds, characterId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (formData.characterIds.length === 0) {
        setError('请至少选择一个角色')
        return
      }

      let resolvedSceneId: number | null = formData.sceneId ? parseInt(formData.sceneId) : null

      if (!resolvedSceneId && formData.createSceneName.trim()) {
        const createSceneRes = await fetch(`/api/projects/${projectId}/scenes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.createSceneName.trim() })
        })

        const createSceneData = await createSceneRes.json()
        if (!createSceneData.success) {
          setError(createSceneData.error || '新建场景失败')
          return
        }

        resolvedSceneId = createSceneData.data.id
      }

      if (!resolvedSceneId) {
        setError('请选择场景，或新建一个场景')
        return
      }

      const payload = {
        shotType: formData.shotType,
        shotDescription: formData.shotDescription || null,
        cameraMovement: formData.cameraMovement || null,
        dialogueText: formData.dialogueText || null,
        videoPrompt: formData.videoPrompt || null,
        characterIds: formData.characterIds,
        characterId: formData.characterIds[0],
        sceneId: resolvedSceneId,
        duration: formData.duration ? Number(formData.duration) : null,
        videoPath: formData.videoPath || null
      }

      if (isCreateMode) {
        const storyboardId = initialStoryboardId ? Number(initialStoryboardId) : NaN
        if (!Number.isInteger(storyboardId) || storyboardId <= 0) {
          setError('缺少 storyboardId，无法创建镜头')
          return
        }

        const res = await fetch(`/api/storyboards/${storyboardId}/shots`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            shotNumber: shotInfo?.shotNumber || Number(initialShotNumber || '1')
          })
        })

        const data = await res.json()
        if (!data.success) {
          setError(data.error || '创建失败')
          return
        }

        router.push(`/projects/${projectId}/episodes/${episodeId}`)
        return
      }

      const res = await fetch(`/api/shots/${shotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || '保存失败')
        return
      }

      await fetchData()
    } catch (err) {
      console.error('Error saving shot:', err)
      setError(isCreateMode ? '创建失败' : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const statusLabel = useMemo(() => {
    return formData.status === 'COMPLETED' ? '已生成' : '未生成'
  }, [formData.status])

  if (loading) {
    return <div className="p-8 text-center">加载中...</div>
  }

  if (error && !shotInfo) {
    return <div className="p-8 text-center text-red-600">{error}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href={`/projects/${projectId}/episodes/${episodeId}`} className="text-blue-600 hover:text-blue-800 text-sm inline-block mb-2">
            ← 返回分镜列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {shotInfo?.boardNumber ? `分镜 ${shotInfo.boardNumber} / ` : ''}镜头 {shotInfo?.shotNumber || ''} {isCreateMode ? '创建' : '详情'}
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-sm text-gray-500">当前状态：</span>
            <span className={`px-2 py-0.5 rounded text-xs ${formData.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {statusLabel}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">镜头类型</label>
              <select
                value={formData.shotType}
                onChange={(e) => setFormData((prev) => ({ ...prev, shotType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="EXTREME_WIDE_SHOT">极远景</option>
                <option value="WIDE_SHOT">远景</option>
                <option value="FULL_SHOT">全景</option>
                <option value="MEDIUM_WIDE_SHOT">中远景</option>
                <option value="MEDIUM_SHOT">中景</option>
                <option value="MEDIUM_CLOSE_UP">中近景</option>
                <option value="CLOSE_UP">近景</option>
                <option value="EXTREME_CLOSE_UP">特写</option>
                <option value="POV">主观镜头</option>
                <option value="TWO_SHOT">双人镜头</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">运镜方式</label>
              <input
                type="text"
                value={formData.cameraMovement}
                onChange={(e) => setFormData((prev) => ({ ...prev, cameraMovement: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="如：推镜、摇镜、跟拍"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色（多选，至少选择一个）</label>
              <div className="grid grid-cols-2 gap-2">
                {characters.map((character) => {
                  const checked = formData.characterIds.includes(character.id)
                  return (
                    <label key={character.id} className="flex items-center gap-2 text-sm border rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleCharacterToggle(character.id)}
                      />
                      <span>{character.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">说话内容</label>
              <textarea
                value={formData.dialogueText}
                onChange={(e) => setFormData((prev) => ({ ...prev, dialogueText: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分镜描述</label>
              <textarea
                value={formData.shotDescription}
                onChange={(e) => setFormData((prev) => ({ ...prev, shotDescription: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">视频提示词</label>
              <textarea
                value={formData.videoPrompt}
                onChange={(e) => setFormData((prev) => ({ ...prev, videoPrompt: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">镜头时长（秒）</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">场景（必选）</label>
                <select
                  value={formData.sceneId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sceneId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">请选择已有场景</option>
                  {scenes.map((scene) => (
                    <option key={scene.id} value={scene.id}>{scene.name}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">若没有合适场景，可在下方直接新建</p>
                <input
                  type="text"
                  value={formData.createSceneName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, createSceneName: e.target.value }))}
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="输入新场景名称（留空则不新建）"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">视频 URL</label>
              <input
                type="text"
                value={formData.videoPath}
                onChange={(e) => setFormData((prev) => ({ ...prev, videoPath: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="填写生成后的视频地址"
              />
            </div>

            {formData.videoPath && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">视频预览</label>
                <video src={formData.videoPath} controls className="w-full max-w-xl rounded border" />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (isCreateMode ? '创建中...' : '保存中...') : (isCreateMode ? '创建' : '保存')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
