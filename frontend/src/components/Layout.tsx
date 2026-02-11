import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Menu,
  X,
  Settings,
  LogOut,
  User,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/utils/utils'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import { Breadcrumb } from '@/components/Breadcrumb'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeToggle } from '@/components/ThemeToggle'

const navigation = [
  { name: '仪表板', href: '/dashboard', icon: LayoutDashboard },
  { name: '租户管理', href: '/tenants', icon: Building2 },
  { name: '系统设置', href: '/settings', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === 'true')
  const { user, clearAuth } = useAuthStore()

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  const handleLogout = () => {
    clearAuth()
    toast.success('已退出登录')
    navigate('/login')
  }

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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 lg:flex-shrink-0',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && <h1 className="text-xl font-bold text-primary">O365 管理系统</h1>}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-700 dark:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6 px-3 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-colors',
                  sidebarCollapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5', sidebarCollapsed ? '' : 'mr-3')} />
                {!sidebarCollapsed && item.name}
              </Link>
            )
          })}
        </nav>
        <div className="hidden lg:block px-3 pb-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {sidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </button>
        </div>
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
                {navigation.find(item => location.pathname === item.href || location.pathname.startsWith(item.href + '/'))?.name || ''}
              </h2>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span>{user?.username || 'Guest'}</span>
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

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
            <Breadcrumb />
            <ErrorBoundary>
              <div className="animate-in fade-in duration-200">
                <Outlet />
              </div>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}
