import { useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/utils/utils'
import { useThemeStore } from '@/store/theme'
import toast from 'react-hot-toast'

const themeOptions = [
  { value: 'light' as const, label: '浅色', icon: Sun },
  { value: 'dark' as const, label: '深色', icon: Moon },
  { value: 'system' as const, label: '跟随系统', icon: Monitor },
]

export function ThemeToggle() {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { theme, setTheme } = useThemeStore()

  const currentThemeOption = themeOptions.find(opt => opt.value === theme) || themeOptions[2]

  return (
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
  )
}
