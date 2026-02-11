import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Key, User, Sun, Moon, Monitor } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/PageHeader'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { cn } from '@/utils/utils'

export function Settings() {
  const { user } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authApi.changePassword({
        old_password: formData.old_password,
        new_password: formData.new_password,
      }),
    onSuccess: () => {
      toast.success('密码修改成功')
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      toast.error('请填写所有字段')
      return
    }

    if (formData.new_password.length < 6) {
      toast.error('新密码至少需要6个字符')
      return
    }

    if (formData.new_password !== formData.confirm_password) {
      toast.error('两次输入的新密码不一致')
      return
    }

    changePasswordMutation.mutate()
  }

  const themeOptions = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        subtitle="管理您的账户和安全设置"
      />

      {/* Profile Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>个人信息</CardTitle>
          </div>
          <CardDescription>当前登录账户的基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">用户名</div>
              <div className="font-medium">{user?.username || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">邮箱</div>
              <div className="font-medium">{user?.email || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">角色</div>
              <div className="font-medium">{user?.is_superuser ? '超级管理员' : '普通用户'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Sun className="h-5 w-5 text-primary" />
            <CardTitle>外观设置</CardTitle>
          </div>
          <CardDescription>选择您喜欢的界面主题</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value)
                    toast.success(`已切换到${option.label}模式`)
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                    theme === option.value
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>修改密码</CardTitle>
          </div>
          <CardDescription>定期修改密码可以提高账户安全性</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old_password">当前密码</Label>
              <Input
                id="old_password"
                type="password"
                placeholder="请输入当前密码"
                value={formData.old_password}
                onChange={(e) =>
                  setFormData({ ...formData, old_password: e.target.value })
                }
                disabled={changePasswordMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password">新密码</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="请输入新密码（至少6个字符）"
                value={formData.new_password}
                onChange={(e) =>
                  setFormData({ ...formData, new_password: e.target.value })
                }
                disabled={changePasswordMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">确认新密码</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="请再次输入新密码"
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
                disabled={changePasswordMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  修改中...
                </>
              ) : (
                '修改密码'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
