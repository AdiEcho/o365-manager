import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tenantApi, licenseApi, type TenantCreate, type Tenant } from '@/utils/api'
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
import { Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TenantCardCompact, TenantCardFull } from '@/components/tenant/TenantCards'
import { PageHeader } from '@/components/PageHeader'
import { UpdateSecretDialog, ConfigurePermissionsDialog } from '@/components/tenant/TenantDialogs'

export function Tenants() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [viewMode, setViewMode] = useState<'compact' | 'full'>(() => {
    const savedMode = localStorage.getItem('tenantViewMode')
    return (savedMode === 'compact' || savedMode === 'full') ? savedMode : 'full'
  })
  const [expandedTenants, setExpandedTenants] = useState<Set<number>>(new Set())
  const [isUpdateSecretOpen, setIsUpdateSecretOpen] = useState(false)
  const [updatingTenant, setUpdatingTenant] = useState<Tenant | null>(null)
  const [deleteOldSecret, setDeleteOldSecret] = useState(false)
  const [isConfigurePermissionsOpen, setIsConfigurePermissionsOpen] = useState(false)
  const [configuringTenant, setConfiguringTenant] = useState<Tenant | null>(null)
  const [consentUrl, setConsentUrl] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; tenant: Tenant | null }>({ open: false, tenant: null })
  const [loadingTenantIds, setLoadingTenantIds] = useState<{
    validate?: number
    checkSpo?: number
    refreshLicenses?: number
  }>({})
  const [formData, setFormData] = useState<TenantCreate>({
    tenant_id: '',
    client_id: '',
    client_secret: '',
    tenant_name: '',
    remarks: '',
  })

  useEffect(() => {
    localStorage.setItem('tenantViewMode', viewMode)
  }, [viewMode])

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await tenantApi.list()
      return res.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: TenantCreate) => tenantApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setIsCreateOpen(false)
      toast.success('租户创建成功')
      resetForm()
    },
    onError: (error: Error) => { toast.error(error.message) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TenantCreate> }) =>
      tenantApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setIsEditOpen(false)
      setEditingTenant(null)
      toast.success('租户更新成功')
    },
    onError: (error: Error) => { toast.error(error.message) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tenantApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('租户删除成功')
    },
    onError: (error: Error) => { toast.error(error.message) },
  })

  const validateMutation = useMutation({
    mutationFn: (id: number) => {
      setLoadingTenantIds(prev => ({ ...prev, validate: id }))
      return tenantApi.validate(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('租户凭据验证成功')
      setLoadingTenantIds(prev => ({ ...prev, validate: undefined }))
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.error(error.message)
      setLoadingTenantIds(prev => ({ ...prev, validate: undefined }))
    },
  })

  const checkSpoMutation = useMutation({
    mutationFn: (id: number) => {
      setLoadingTenantIds(prev => ({ ...prev, checkSpo: id }))
      return tenantApi.checkSpoStatus(id)
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success(`SPO 状态检查完成: ${response.data.message}`)
      setLoadingTenantIds(prev => ({ ...prev, checkSpo: undefined }))
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setLoadingTenantIds(prev => ({ ...prev, checkSpo: undefined }))
    },
  })

  const updateSecretMutation = useMutation({
    mutationFn: ({ id, deleteOld }: { id: number; deleteOld: boolean }) =>
      tenantApi.updateSecret(id, deleteOld),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      const detail = response.data.detail ? ` (${response.data.detail})` : ''
      toast.success(`${response.data.message}${detail}`)
      setIsUpdateSecretOpen(false)
      setUpdatingTenant(null)
      setDeleteOldSecret(false)
    },
    onError: (error: Error) => { toast.error(error.message) },
  })

  const configurePermissionsMutation = useMutation({
    mutationFn: (id: number) => tenantApi.configurePermissions(id),
    onSuccess: (response) => {
      toast.success(response.data.message)
      setConsentUrl(response.data.consent_url)
    },
    onError: (error: Error) => {
      toast.error(error.message)
      setIsConfigurePermissionsOpen(false)
      setConfiguringTenant(null)
    },
  })

  const refreshLicensesMutation = useMutation({
    mutationFn: (tenantId: number) => {
      setLoadingTenantIds(prev => ({ ...prev, refreshLicenses: tenantId }))
      return licenseApi.listByTenant(tenantId, true)
    },
    onSuccess: () => {
      toast.success('许可证数据已刷新')
      setLoadingTenantIds(prev => ({ ...prev, refreshLicenses: undefined }))
    },
    onError: (error: Error) => {
      toast.error(`刷新失败: ${error.message}`)
      setLoadingTenantIds(prev => ({ ...prev, refreshLicenses: undefined }))
    },
  })

  const handleCreate = () => {
    if (!formData.tenant_id || !formData.client_id || !formData.client_secret) {
      toast.error('请填写必填字段')
      return
    }
    createMutation.mutate(formData)
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      tenant_id: tenant.tenant_id,
      client_id: tenant.client_id,
      client_secret: '',
      tenant_name: tenant.tenant_name || '',
      remarks: tenant.remarks || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdate = () => {
    if (!editingTenant) return
    const updateData: Partial<TenantCreate> = {
      tenant_name: formData.tenant_name,
      remarks: formData.remarks,
    }
    if (formData.tenant_id && formData.tenant_id !== editingTenant.tenant_id) updateData.tenant_id = formData.tenant_id
    if (formData.client_id && formData.client_id !== editingTenant.client_id) updateData.client_id = formData.client_id
    if (formData.client_secret) updateData.client_secret = formData.client_secret
    updateMutation.mutate({ id: editingTenant.id, data: updateData })
  }

  const resetForm = () => {
    setFormData({ tenant_id: '', client_id: '', client_secret: '', tenant_name: '', remarks: '' })
    setEditingTenant(null)
  }

  const toggleTenantExpansion = (tenantId: number) => {
    setExpandedTenants(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tenantId)) newSet.delete(tenantId)
      else newSet.add(tenantId)
      return newSet
    })
  }

  const cardProps = (tenant: Tenant) => ({
    tenant,
    loadingTenantIds,
    onValidate: (id: number) => validateMutation.mutate(id),
    onCheckSpo: (id: number) => checkSpoMutation.mutate(id),
    onRefreshLicenses: (id: number) => refreshLicensesMutation.mutate(id),
    onEdit: handleEdit,
    onDelete: (t: Tenant) => setDeleteConfirm({ open: true, tenant: t }),
    onUpdateSecret: (t: Tenant) => { setUpdatingTenant(t); setDeleteOldSecret(false); setIsUpdateSecretOpen(true) },
    onConfigurePermissions: (t: Tenant) => { setConfiguringTenant(t); setConsentUrl(''); setIsConfigurePermissionsOpen(true) },
    onNavigate: (path: string) => navigate(path),
    updateSecretPending: updateSecretMutation.isPending,
    configurePermissionsPending: configurePermissionsMutation.isPending,
    deletePending: deleteMutation.isPending,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="租户管理"
        subtitle="管理多个 Microsoft 365 租户"
        actions={
          <>
            <div className="flex items-center gap-2">
              <Label htmlFor="view-mode" className="text-sm">缩略视图</Label>
              <Switch id="view-mode" checked={viewMode === 'compact'} onCheckedChange={(checked) => setViewMode(checked ? 'compact' : 'full')} />
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />添加租户
            </Button>
          </>
        }
      />

      {/* Tenants List */}
      <Card>
        <CardHeader><CardTitle>租户列表</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : tenants?.items.length === 0 ? (
            <EmptyState message="暂无租户，请添加第一个租户" />
          ) : (
            <div className={viewMode === 'compact' ? "space-y-1" : "grid gap-6 md:grid-cols-2"}>
              {tenants?.items.map((tenant) => (
                viewMode === 'compact' ? (
                  <TenantCardCompact
                    key={tenant.id}
                    {...cardProps(tenant)}
                    isExpanded={expandedTenants.has(tenant.id)}
                    onToggleExpansion={toggleTenantExpansion}
                  />
                ) : (
                  <TenantCardFull key={tenant.id} {...cardProps(tenant)} />
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>添加租户</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenant_id">租户 ID *</Label>
              <Input id="tenant_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={formData.tenant_id} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_id">客户端 ID *</Label>
              <Input id="client_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_secret">客户端密钥 *</Label>
              <Input id="client_secret" type="password" placeholder="请输入客户端密钥" value={formData.client_secret} onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant_name">租户名称</Label>
              <Input id="tenant_name" placeholder="我的组织" value={formData.tenant_name} onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remarks">备注</Label>
              <Input id="remarks" placeholder="备注信息" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />创建中...</> : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm() }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>编辑租户</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_tenant_name">租户名称</Label>
              <Input id="edit_tenant_name" placeholder="我的组织" value={formData.tenant_name} onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_tenant_id">租户 ID</Label>
              <Input id="edit_tenant_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={formData.tenant_id} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })} />
              <p className="text-xs text-muted-foreground">如果修改，凭据状态将被重置</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_client_id">客户端 ID</Label>
              <Input id="edit_client_id" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={formData.client_id} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} />
              <p className="text-xs text-muted-foreground">如果修改，凭据状态将被重置</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_client_secret">客户端密钥</Label>
              <Input id="edit_client_secret" type="password" placeholder="留空表示不修改" value={formData.client_secret} onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })} />
              <p className="text-xs text-muted-foreground">留空表示不修改密钥。如果修改，凭据状态将被重置。</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_remarks">备注</Label>
              <Input id="edit_remarks" placeholder="备注信息" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>取消</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />更新中...</> : '更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Secret Dialog */}
      <UpdateSecretDialog
        open={isUpdateSecretOpen}
        onOpenChange={(open) => { setIsUpdateSecretOpen(open); if (!open) { setUpdatingTenant(null); setDeleteOldSecret(false) } }}
        tenant={updatingTenant}
        deleteOldSecret={deleteOldSecret}
        setDeleteOldSecret={setDeleteOldSecret}
        onConfirm={() => updatingTenant && updateSecretMutation.mutate({ id: updatingTenant.id, deleteOld: deleteOldSecret })}
        isPending={updateSecretMutation.isPending}
      />

      {/* Configure Permissions Dialog */}
      <ConfigurePermissionsDialog
        open={isConfigurePermissionsOpen}
        onClose={() => { setIsConfigurePermissionsOpen(false); setConfiguringTenant(null); setConsentUrl('') }}
        tenant={configuringTenant}
        consentUrl={consentUrl}
        onConfirm={() => configuringTenant && configurePermissionsMutation.mutate(configuringTenant.id)}
        isPending={configurePermissionsMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, tenant: open ? deleteConfirm.tenant : null })}
        title="删除租户"
        description={`确定要删除租户「${deleteConfirm.tenant?.tenant_name || '未命名租户'}」吗？此操作不可撤销。`}
        confirmLabel="删除"
        variant="destructive"
        onConfirm={() => deleteConfirm.tenant && deleteMutation.mutate(deleteConfirm.tenant.id)}
      />
    </div>
  )
}
