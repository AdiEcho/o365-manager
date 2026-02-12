import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { domainApi } from '@/utils/api'
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
import { Plus, Trash2, CheckCircle2, XCircle, Loader2, Shield, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function Domains() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [domainName, setDomainName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; domain: { id: string } | null }>({ open: false, domain: null })

  const tenantIdNum = tenantId ? parseInt(tenantId, 10) : undefined

  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains', tenantIdNum],
    queryFn: async () => {
      if (tenantIdNum) {
        const res = await domainApi.listByTenant(tenantIdNum)
        return res.data
      }
      const res = await domainApi.list()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => domainApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      setIsCreateOpen(false)
      setDomainName('')
      toast.success('域名添加成功，请验证域名')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => domainApi.verify(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('域名验证成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => domainApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] })
      toast.success('域名删除请求已提交，可能需要最多24小时完成')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = () => {
    if (!domainName) {
      toast.error('请输入域名')
      return
    }
    createMutation.mutate(domainName)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="域名管理"
        subtitle="管理 Office 365 自定义域名"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            添加域名
          </Button>
        }
      />

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>域名列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : domains?.length === 0 ? (
            <EmptyState message="暂无域名，请添加第一个域名" icon={Globe} />
          ) : (
            <div className="space-y-3">
              {domains?.map((domain) => (
                <div
                  key={domain.id}
                  className={`p-4 border rounded-xl transition-all duration-200 ${
                    domain.isDefault ? 'border-primary/50 bg-primary/5 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-lg">{domain.id}</h3>
                        {domain.isDefault && (
                          <span className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full">
                            默认域名
                          </span>
                        )}
                        {domain.isVerified ? (
                          <span className="flex items-center text-xs text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            已验证
                          </span>
                        ) : (
                          <span className="flex items-center text-xs text-yellow-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            未验证
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <div>认证类型: {domain.authenticationType}</div>
                        {domain.supportedServices && domain.supportedServices.length > 0 && (
                          <div>
                            支持的服务:{' '}
                            {domain.supportedServices.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!domain.isVerified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verifyMutation.mutate(domain.id)}
                          disabled={verifyMutation.isPending}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          验证
                        </Button>
                      )}
                      {!domain.isDefault && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirm({ open: true, domain })}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加域名</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="domain_name">域名</Label>
              <Input
                id="domain_name"
                placeholder="example.com"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                请确保您拥有此域名，并能够添加 DNS 记录进行验证
              </p>
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
                  添加中...
                </>
              ) : (
                '添加'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, domain: open ? deleteConfirm.domain : null })}
        title="删除域名"
        description={`确定要删除域名「${deleteConfirm.domain?.id || ''}」吗？删除可能需要最多24小时完成。`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={() => deleteConfirm.domain && deleteMutation.mutate(deleteConfirm.domain.id)}
      />
    </div>
  )
}
