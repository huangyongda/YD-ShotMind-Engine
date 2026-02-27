'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function ProjectSettingsPage() {
  const params = useParams()
  const projectId = params.id as string
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalEpisodes: 10,
    status: 'DRAFT'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        setMessage('保存成功')
      } else {
        setMessage('保存失败: ' + data.error)
      }
    } catch (error) {
      setMessage('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href={`/projects/${projectId}`} className="text-blue-600 hover:text-blue-800 text-sm mb-1 inline-block">
            ← 返回项目
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">项目设置</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  总简介
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  总集数
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.totalEpisodes}
                  onChange={(e) => setFormData({ ...formData, totalEpisodes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="DRAFT">草稿</option>
                  <option value="GENERATING">生成中</option>
                  <option value="COMPLETED">已完成</option>
                </select>
              </div>

              {message && (
                <p className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存设置'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
