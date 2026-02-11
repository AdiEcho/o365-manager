import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi, type UserCreate, type User as O365User } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Trash2, Search, CheckCircle2, XCircle, Loader2, Users as UsersIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function Users() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: O365User | null }>({ open: false, user: null })
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const [formData, setFormData] = useState<UserCreate>({
    display_name: '',
    user_principal_name: '',
    mail_nickname: '',
    password: '',
    usage_location: 'CN',
    account_enabled: true,
  })

  const tenantIdNum = tenantId ? parseInt(tenantId, 10) : undefined

  useEffect(() => {
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchKeyword)
    }, 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchKeyword])

  const { data: users, isLoading, isFetching } = useQuery({
    queryKey: ['users', tenantIdNum, debouncedSearch],
    queryFn: async () => {
      if (tenantIdNum) {
        if (debouncedSearch) {
          const res = await userApi.searchByTenant(tenantIdNum, debouncedSearch)
          return res.data
        }
        const res = await userApi.listByTenant(tenantIdNum, { top: 100 })
        return res.data
      }
      if (debouncedSearch) {
        const res = await userApi.search(debouncedSearch)
        return res.data
      }
      const res = await userApi.list({ top: 100 })
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: UserCreate) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsCreateOpen(false)
      toast.success('用户创建成功')
      setFormData({
        display_name: '',
        user_principal_name: '',
        mail_nickname: '',
        password: '',
        usage_location: 'CN',
        account_enabled: true,
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户删除成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const enableMutation = useMutation({
    mutationFn: (id: string) => userApi.enable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户已启用')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const disableMutation = useMutation({
    mutationFn: (id: string) => userApi.disable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('用户已禁用')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = () => {
    if (
      !formData.display_name ||
      !formData.user_principal_name ||
      !formData.mail_nickname ||
      !formData.password
    ) {
      toast.error('请填写所有必填字段')
      return
    }
    createMutation.mutate(formData)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="用户管理"
        subtitle="管理 Office 365 用户账户"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建用户
          </Button>
        }
      />

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="搜索用户名或邮箱..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="max-w-md"
            />
            {(isFetching && debouncedSearch !== searchKeyword) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表 ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : users?.length === 0 ? (
            <EmptyState message={debouncedSearch ? '未找到匹配的用户' : '暂无用户，请创建第一个用户'} icon={UsersIcon} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">状态</th>
                    <th className="px-4 py-2 text-left font-semibold">UPN</th>
                    <th className="px-4 py-2 text-left font-semibold">显示名称</th>
                    <th className="px-4 py-2 text-left font-semibold">位置</th>
                    <th className="px-4 py-2 text-left font-semibold">许可证</th>
                    <th className="px-4 py-2 text-right font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-2">
                        {user.accountEnabled ? (
                          <span className="flex items-center text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            可用
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-red-600 dark:text-red-400">
                            <XCircle className="h-4 w-4 mr-1" />
                            禁用
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{user.userPrincipalName || '-'}</td>
                      <td className="px-4 py-2 font-semibold">{user.displayName || '-'}</td>
                      <td className="px-4 py-2 text-muted-foreground">{user.usageLocation || '-'}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {user.assignedLicenses && user.assignedLicenses.length > 0
                          ? user.assignedLicenses.join(', ')
                          : '-'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {user.accountEnabled ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => disableMutation.mutate(user.id)}
                              disabled={disableMutation.isPending}
                            >
                              禁用
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => enableMutation.mutate(user.id)}
                              disabled={enableMutation.isPending}
                            >
                              启用
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirm({ open: true, user })}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>创建用户</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="display_name">显示名称 *</Label>
              <Input
                id="display_name"
                placeholder="张三"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user_principal_name">用户主体名称 *</Label>
              <Input
                id="user_principal_name"
                placeholder="zhangsan@yourdomain.com"
                value={formData.user_principal_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    user_principal_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mail_nickname">邮件昵称 *</Label>
              <Input
                id="mail_nickname"
                placeholder="zhangsan"
                value={formData.mail_nickname}
                onChange={(e) =>
                  setFormData({ ...formData, mail_nickname: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码 *</Label>
              <Input
                id="password"
                type="password"
                placeholder="至少8位，包含大小写字母和数字"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="usage_location">使用位置</Label>
              <Input
                id="usage_location"
                placeholder="CN"
                value={formData.usage_location}
                onChange={(e) =>
                  setFormData({ ...formData, usage_location: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, user: open ? deleteConfirm.user : null })}
        title="删除用户"
        description={`确定要删除用户「${deleteConfirm.user?.displayName || ''}」吗？此操作不可撤销。`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={() => deleteConfirm.user && deleteMutation.mutate(deleteConfirm.user.id)}
      />
    </div>
  )
}
