import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Building2, 
  Menu,
  X,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  Monitor
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/utils'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import toast from 'react-hot-toast'

const navigation = [
  { name: '仪表板', href: '/dashboard', icon: LayoutDashboard },
  { name: '租户管理', href: '/tenants', icon: Building2 },
  { name: '系统设置', href: '/settings', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { user, clearAuth } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  const handleLogout = () => {
    clearAuth()
    toast.success('已退出登录')
    navigate('/login')
  }

  const themeOptions = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ]

  const currentThemeOption = themeOptions.find(opt => opt.value === theme) || themeOptions[2]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 lg:flex">
      {/* Sidebar for mobile */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-gray-900/80 dark:bg-black/80 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 lg:flex-shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-primary">O365 管理系统</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-700 dark:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-300 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {navigation.find(item => item.href === location.pathname)?.name || ''}
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{user?.username || 'Guest'}</span>
              </div>
              
              {/* Theme Toggle */}
              <div className="relative">
                <button
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="flex items-center gap-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  title="切换主题"
                >
                  <currentThemeOption.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentThemeOption.label}</span>
                </button>
                
                {themeMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setThemeMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                      {themeOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setTheme(option.value)
                              setThemeMenuOpen(false)
                              toast.success(`已切换到${option.label}模式`)
                            }}
                            className={cn(
                              "w-full flex items-center gap-x-2 px-4 py-2 text-sm transition-colors",
                              theme === option.value 
                                ? "bg-primary/10 text-primary dark:bg-primary/20" 
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
