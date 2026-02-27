'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    openaiApiKey: '',
    anthropicApiKey: '',
    elevenlabsApiKey: '',
    comfyuiUrl: 'http://localhost:8188',
    defaultModel: 'openai'
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    // 保存到本地存储
    localStorage.setItem('makemp4_settings', JSON.stringify(settings))
    setMessage('保存成功')
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">AI API 配置</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                  <input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anthropic API Key</label>
                  <input
                    type="password"
                    value={settings.anthropicApiKey}
                    onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="sk-ant-..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ElevenLabs API Key</label>
                  <input
                    type="password"
                    value={settings.elevenlabsApiKey}
                    onChange={(e) => setSettings({ ...settings, elevenlabsApiKey: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">ComfyUI 配置</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ComfyUI URL</label>
                  <input
                    type="text"
                    value={settings.comfyuiUrl}
                    onChange={(e) => setSettings({ ...settings, comfyuiUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="http://localhost:8188"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">默认设置</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">默认 AI 模型</label>
                  <select
                    value={settings.defaultModel}
                    onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="openai">OpenAI GPT</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>
              </div>
            </div>

            {message && (
              <p className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存设置'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
