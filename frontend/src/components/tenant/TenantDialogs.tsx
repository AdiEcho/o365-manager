import { type Tenant, type TenantCreate } from '@/utils/api'
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
import { Loader2, Copy, ExternalLink } from 'lucide-react'
import { formatDate } from '@/utils/utils'
import toast from 'react-hot-toast'

interface TenantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  formData: TenantCreate
  setFormData: (data: TenantCreate) => void
  onSubmit: () => void
  isPending: boolean
  submitLabel: string
  isEdit?: boolean
  editingTenant?: Tenant | null
  onReset: () => void
}

export function TenantFormDialog({
  open,
  onOpenChange,
  title,
  formData,
  setFormData,
  onSubmit,
  isPending,
  submitLabel,
  isEdit = false,
  onReset,
}: TenantFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) onReset() }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isEdit ? (
            <>
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
            </>
          ) : (
            <>
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
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="tenant_name">租户名称{!isEdit && ''}</Label>
            {!isEdit && <Input id="tenant_name" placeholder="我的组织" value={formData.tenant_name} onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })} />}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="remarks">备注</Label>
            <Input id="remarks" placeholder="备注信息" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{submitLabel}中...</> : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface UpdateSecretDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
  deleteOldSecret: boolean
  setDeleteOldSecret: (v: boolean) => void
  onConfirm: () => void
  isPending: boolean
}

export function UpdateSecretDialog({ open, onOpenChange, tenant, deleteOldSecret, setDeleteOldSecret, onConfirm, isPending }: UpdateSecretDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>更新客户端密钥</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              将为租户 <strong>{tenant?.tenant_name || '未命名租户'}</strong> 创建一个新的客户端密钥，过期时间为 <strong>2099-12-31</strong>。
            </p>
            {tenant?.client_secret_expires_at && (
              <div className={`text-sm ${new Date(tenant.client_secret_expires_at) < new Date() ? 'text-red-600' : 'text-muted-foreground'}`}>
                当前密钥过期时间: {formatDate(tenant.client_secret_expires_at)}
                {new Date(tenant.client_secret_expires_at) < new Date() && ' (已过期)'}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border bg-slate-50 dark:bg-slate-900">
            <input type="checkbox" id="delete_old_secret" checked={deleteOldSecret} onChange={(e) => setDeleteOldSecret(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <label htmlFor="delete_old_secret" className="text-sm font-medium cursor-pointer">删除所有旧密钥</label>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200"><strong>注意：</strong></p>
            <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
              <li>新密钥生成后将自动保存到系统</li>
              <li>如果勾选"删除所有旧密钥"，所有现有密钥将被删除</li>
              <li>请确保在删除前，所有使用旧密钥的服务已更新</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />更新中...</> : '确认更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ConfigurePermissionsDialogProps {
  open: boolean
  onClose: () => void
  tenant: Tenant | null
  consentUrl: string
  onConfirm: () => void
  isPending: boolean
}

export function ConfigurePermissionsDialog({ open, onClose, tenant, consentUrl, onConfirm, isPending }: ConfigurePermissionsDialogProps) {
  const handleCopy = () => {
    if (!consentUrl) { toast.error('授权链接为空'); return }
    navigator.clipboard.writeText(consentUrl)
      .then(() => toast.success('已复制到剪贴板'))
      .catch(() => toast.error('复制失败，请手动复制链接'))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>配置 API 权限</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!consentUrl ? (
            <>
              <p className="text-sm text-muted-foreground">
                将为租户 <strong>{tenant?.tenant_name || '未命名租户'}</strong> 配置以下 Microsoft Graph API 权限：
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200"><strong>前置要求：</strong></p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  此操作需要应用已拥有 <strong>Application.ReadWrite.All</strong> 权限并已授予管理员同意。
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">应用程序权限：</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground ml-4">
                  {[
                    ['User.ReadWrite.All', '用户管理'],
                    ['Directory.ReadWrite.All', '目录读写'],
                    ['Organization.Read.All', '组织信息和许可证'],
                    ['Reports.Read.All', '使用情况报告'],
                    ['RoleManagement.ReadWrite.Directory', '角色管理'],
                    ['Domain.ReadWrite.All', '域名管理'],
                    ['Application.ReadWrite.All', '应用配置和密钥'],
                    ['Sites.FullControl.All', 'SharePoint Online'],
                  ].map(([perm, desc]) => (
                    <li key={perm} className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5">&#8226;</span>
                      <div><strong className="text-foreground">{perm}</strong> - {desc}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200"><strong>说明：</strong></p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside">
                  <li>系统将自动配置所有上述权限</li>
                  <li>权限配置后需要全局管理员进行授权同意</li>
                  <li>配置完成后会显示管理员同意链接</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">权限配置成功！</p>
              <p className="text-sm text-muted-foreground">请使用全局管理员账户打开以下链接完成授权：</p>
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <p className="text-xs font-mono break-all">{consentUrl}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                  <Copy className="h-3 w-3 mr-1" />复制链接
                </Button>
                <Button type="button" variant="default" size="sm" onClick={() => window.open(consentUrl, '_blank')} className="flex-1">
                  <ExternalLink className="h-3 w-3 mr-1" />在新标签页打开
                </Button>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200"><strong>注意：</strong></p>
                <ul className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                  <li>需要使用此租户的全局管理员账户登录</li>
                  <li>授权后权限才会生效</li>
                </ul>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          {!consentUrl ? (
            <>
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button onClick={onConfirm} disabled={isPending}>
                {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />配置中...</> : '确认配置'}
              </Button>
            </>
          ) : (
            <Button onClick={onClose} className="w-full">关闭</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
