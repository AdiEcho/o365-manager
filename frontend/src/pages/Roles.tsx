import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { roleApi, userApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ShieldCheck, Users, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/PageHeader'
import { CardSkeleton } from '@/components/CardSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'

const GLOBAL_ADMIN_ROLE_ID = '62e90394-69f5-4237-9190-012177145e10'

export function Roles() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isPromoteOpen, setIsPromoteOpen] = useState(false)
  const [demoteConfirm, setDemoteConfirm] = useState<{ open: boolean; member: { id: string; displayName: string } | null }>({ open: false, member: null })
  const [promoteConfirm, setPromoteConfirm] = useState<{ open: boolean; user: { id: string; displayName: string } | null }>({ open: false, user: null })

  const tenantIdNum = tenantId ? parseInt(tenantId, 10) : undefined

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles', tenantIdNum],
    queryFn: async () => {
      if (tenantIdNum) {
        const res = await roleApi.listByTenant(tenantIdNum)
        return res.data
      }
      const res = await roleApi.list()
      return res.data
    },
  })

  const { data: users } = useQuery({
    queryKey: ['users-for-roles', tenantIdNum],
    queryFn: async () => {
      if (tenantIdNum) {
        const res = await userApi.listByTenant(tenantIdNum, { top: 100 })
        return res.data
      }
      const res = await userApi.list({ top: 100 })
      return res.data
    },
  })

  const { data: roleMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['roleMembers', tenantIdNum, selectedRole],
    queryFn: async () => {
      if (!selectedRole) return []
      if (tenantIdNum) {
        const res = await roleApi.listMembersByTenant(tenantIdNum, selectedRole)
        return res.data
      }
      const res = await roleApi.listMembers(selectedRole)
      return res.data
    },
    enabled: !!selectedRole,
  })

  const promoteMutation = useMutation({
    mutationFn: (userId: string) => roleApi.promote(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleMembers'] })
      setIsPromoteOpen(false)
      toast.success('用户已提升为全局管理员')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const demoteMutation = useMutation({
    mutationFn: (userId: string) => roleApi.demote(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roleMembers'] })
      toast.success('已撤销全局管理员权限')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="角色管理"
        subtitle="管理用户的目录角色和权限"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Roles List */}
        <Card>
          <CardHeader>
            <CardTitle>目录角色</CardTitle>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <CardSkeleton count={4} />
            ) : roles?.length === 0 ? (
              <EmptyState message="暂无角色信息" icon={ShieldCheck} />
            ) : (
              <div className="space-y-2">
                {roles?.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                      selectedRole === role.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{role.displayName}</div>
                        {role.description && (
                          <div className="text-sm text-muted-foreground">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>
              {selectedRole
                ? roles?.find((r) => r.id === selectedRole)?.displayName
                : '选择一个角色'}
            </CardTitle>
            {selectedRole === GLOBAL_ADMIN_ROLE_ID && (
              <Button
                size="sm"
                onClick={() => setIsPromoteOpen(true)}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                提升用户
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  请从左侧选择一个角色查看成员
                </p>
              </div>
            ) : membersLoading ? (
              <CardSkeleton count={3} />
            ) : roleMembers?.length === 0 ? (
              <EmptyState message="此角色暂无成员" />
            ) : (
              <div className="space-y-2">
                {roleMembers?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border rounded-lg transition-all duration-200 hover:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div>
                      <div className="font-medium">{member.displayName}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.userPrincipalName}
                      </div>
                    </div>
                    {selectedRole === GLOBAL_ADMIN_ROLE_ID && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDemoteConfirm({ open: true, member })}
                        disabled={demoteMutation.isPending}
                      >
                        <ArrowDown className="h-4 w-4 mr-1" />
                        撤销
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promote Dialog */}
      <Dialog open={isPromoteOpen} onOpenChange={setIsPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提升为全局管理员</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users?.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setPromoteConfirm({ open: true, user })}
                  disabled={promoteMutation.isPending}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium">{user.displayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.userPrincipalName}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPromoteOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote Confirmation */}
      <ConfirmDialog
        open={demoteConfirm.open}
        onOpenChange={(open) => setDemoteConfirm({ open, member: open ? demoteConfirm.member : null })}
        title="撤销全局管理员"
        description={`确定要撤销「${demoteConfirm.member?.displayName || ''}」的全局管理员权限吗？`}
        confirmLabel="撤销"
        variant="destructive"
        onConfirm={() => demoteConfirm.member && demoteMutation.mutate(demoteConfirm.member.id)}
      />

      {/* Promote Confirmation */}
      <ConfirmDialog
        open={promoteConfirm.open}
        onOpenChange={(open) => setPromoteConfirm({ open, user: open ? promoteConfirm.user : null })}
        title="提升为全局管理员"
        description={`确定要提升「${promoteConfirm.user?.displayName || ''}」为全局管理员吗？`}
        confirmLabel="确认提升"
        onConfirm={() => { promoteConfirm.user && promoteMutation.mutate(promoteConfirm.user.id); setIsPromoteOpen(false) }}
      />
    </div>
  )
}
