import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store'
import { Button } from '../../shared/components/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../shared/components/Card'
import { Coffee } from 'lucide-react'

export function LoginPage() {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(state => state.login)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      navigate(user.role === 'BARTENDER' ? '/kds' : '/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-50 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

      <Card className="w-full max-w-md mx-4 relative z-10 glass-panel border-none shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-600/30">
            <Coffee size={32} className="text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-brand-900">Bom Coffee POS</CardTitle>
          <CardDescription>Đăng nhập để vào hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-900">Tên đăng nhập (admin / kds / waiter / cashier)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-900">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-brand-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all outline-none"
                placeholder="••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold mt-6 shadow-md shadow-brand-600/20">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
