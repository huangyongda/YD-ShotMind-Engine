'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalEpisodes: 10
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/projects/${data.data.id}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">新建项目</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  项目名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入项目名称"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入短剧的总简介描述"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '创建中...' : '创建项目'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
