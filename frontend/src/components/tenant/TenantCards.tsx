import { type Tenant } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Loader2, Users, Award, Globe, ShieldCheck, FileText, RefreshCw, Key, ChevronUp, MoreHorizontal, RotateCw } from 'lucide-react'
import { StatusBadge, getCredentialStatusDisplay, getSpoStatusDisplay } from './StatusBadges'
import { formatDate } from '@/utils/utils'
import { TenantLicensesSummary } from '@/components/TenantLicensesSummary'

interface LoadingTenantIds {
  validate?: number
  checkSpo?: number
  refreshLicenses?: number
}

interface TenantCardProps {
  tenant: Tenant
  loadingTenantIds: LoadingTenantIds
  onValidate: (id: number) => void
  onCheckSpo: (id: number) => void
  onRefreshLicenses: (id: number) => void
  onEdit: (tenant: Tenant) => void
  onDelete: (tenant: Tenant) => void
  onUpdateSecret: (tenant: Tenant) => void
  onConfigurePermissions: (tenant: Tenant) => void
  onNavigate: (path: string) => void
  updateSecretPending: boolean
  configurePermissionsPending: boolean
  deletePending: boolean
}

interface CompactCardProps extends TenantCardProps {
  isExpanded: boolean
  onToggleExpansion: (id: number) => void
}

export function TenantCardCompact({
  tenant,
  loadingTenantIds,
  onValidate,
  onCheckSpo,
  onRefreshLicenses,
  onEdit,
  onDelete,
  onUpdateSecret,
  onConfigurePermissions,
  onNavigate,
  updateSecretPending,
  configurePermissionsPending,
  deletePending,
  isExpanded,
  onToggleExpansion,
}: CompactCardProps) {
  const credentialDisplay = getCredentialStatusDisplay(tenant.credential_status)
  const CredentialIcon = credentialDisplay.icon
  const spoDisplay = getSpoStatusDisplay(tenant.spo_status)
  const SpoIcon = spoDisplay.icon

  return (
    <Card className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-l-4" style={{ borderLeftColor: tenant.credential_status === 'valid' ? '#16a34a' : tenant.credential_status === 'invalid' ? '#dc2626' : '#9ca3af' }}>
      <CardContent className="py-2 px-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">
                {tenant.tenant_name || '未命名租户'}
              </h3>
              <span className="text-muted-foreground">·</span>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {tenant.tenant_id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${credentialDisplay.bgColor} ${credentialDisplay.color}`}>
              <CredentialIcon className="h-3 w-3 mr-1" />
              {credentialDisplay.text}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${spoDisplay.bgColor} ${spoDisplay.color}`}>
              <SpoIcon className="h-3 w-3 mr-1" />
              {spoDisplay.text}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onValidate(tenant.id)} disabled={loadingTenantIds.validate === tenant.id} className="h-7 px-2 text-xs" title="验证凭据">
              {loadingTenantIds.validate === tenant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><ShieldCheck className="h-3 w-3 mr-1" />验证</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onCheckSpo(tenant.id)} disabled={loadingTenantIds.checkSpo === tenant.id} className="h-7 px-2 text-xs" title="检查 SPO">
              {loadingTenantIds.checkSpo === tenant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" />SPO</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onRefreshLicenses(tenant.id)} disabled={loadingTenantIds.refreshLicenses === tenant.id} className="h-7 px-2 text-xs" title="刷新许可证">
              {loadingTenantIds.refreshLicenses === tenant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RotateCw className="h-3 w-3 mr-1" />许可证</>}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onToggleExpansion(tenant.id)} className="h-7 px-2" title={isExpanded ? "收起" : "更多操作"}>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div>客户端 ID: <span className="font-mono text-[10px]">{tenant.client_id}</span></div>
              {tenant.client_secret_expires_at && (
                <div className={new Date(tenant.client_secret_expires_at) < new Date() ? 'text-red-600' : ''}>
                  密钥过期: {formatDate(tenant.client_secret_expires_at)}
                </div>
              )}
              {tenant.remarks && <div>备注: {tenant.remarks}</div>}
              <div>创建: {formatDate(tenant.created_at)}</div>
              {tenant.credential_checked_at && <div>凭据检查: {formatDate(tenant.credential_checked_at)}</div>}
              {tenant.spo_checked_at && <div>SPO检查: {formatDate(tenant.spo_checked_at)}</div>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => onEdit(tenant)} className="h-7 px-2 text-xs"><Edit2 className="h-3 w-3 mr-1" />编辑</Button>
              <Button variant="outline" size="sm" onClick={() => onUpdateSecret(tenant)} disabled={updateSecretPending} className="h-7 px-2 text-xs">
                {updateSecretPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Key className="h-3 w-3 mr-1" />更新密钥</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onConfigurePermissions(tenant)} disabled={configurePermissionsPending} className="h-7 px-2 text-xs">
                {configurePermissionsPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><ShieldCheck className="h-3 w-3 mr-1" />配置权限</>}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate(`/tenants/${tenant.id}/users`)} className="h-7 px-2 text-xs"><Users className="h-3 w-3 mr-1" />用户</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate(`/tenants/${tenant.id}/licenses`)} className="h-7 px-2 text-xs"><Award className="h-3 w-3 mr-1" />许可证</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate(`/tenants/${tenant.id}/domains`)} className="h-7 px-2 text-xs"><Globe className="h-3 w-3 mr-1" />域名</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate(`/tenants/${tenant.id}/roles`)} className="h-7 px-2 text-xs"><ShieldCheck className="h-3 w-3 mr-1" />角色</Button>
              <Button variant="outline" size="sm" onClick={() => onNavigate(`/tenants/${tenant.id}/reports`)} className="h-7 px-2 text-xs"><FileText className="h-3 w-3 mr-1" />报告</Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(tenant)} disabled={deletePending} className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 className="h-3 w-3 mr-1" />删除
              </Button>
            </div>
            <div className="pt-2 border-t">
              <TenantLicensesSummary tenantId={tenant.id} compact />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TenantCardFull({
  tenant,
  loadingTenantIds,
  onValidate,
  onCheckSpo,
  onRefreshLicenses,
  onEdit,
  onDelete,
  onUpdateSecret,
  onConfigurePermissions,
  onNavigate,
  updateSecretPending,
  configurePermissionsPending,
  deletePending,
}: TenantCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{tenant.tenant_name || '未命名租户'}</CardTitle>
            <CardDescription className="mt-2 space-y-1">
              <div>租户 ID: {tenant.tenant_id}</div>
              <div>客户端 ID: {tenant.client_id}</div>
              {tenant.client_secret_expires_at && (
                <div className={new Date(tenant.client_secret_expires_at) < new Date() ? 'text-red-600' : ''}>
                  密钥过期: {formatDate(tenant.client_secret_expires_at)}
                </div>
              )}
              {tenant.remarks && <div>备注: {tenant.remarks}</div>}
              <div>创建时间: {formatDate(tenant.created_at)}</div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusBadge type="credential" status={tenant.credential_status} checkedAt={tenant.credential_checked_at} />
                <StatusBadge type="spo" status={tenant.spo_status} checkedAt={tenant.spo_checked_at} />
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(tenant)}><Edit2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(tenant)} disabled={deletePending}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => onValidate(tenant.id)} disabled={loadingTenantIds.validate === tenant.id}>验证凭据</Button>
          <Button variant="outline" size="sm" onClick={() => onCheckSpo(tenant.id)} disabled={loadingTenantIds.checkSpo === tenant.id}>
            {loadingTenantIds.checkSpo === tenant.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />检查中...</> : <><RefreshCw className="h-3 w-3 mr-1" />检查 SPO</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onRefreshLicenses(tenant.id)} disabled={loadingTenantIds.refreshLicenses === tenant.id}>
            {loadingTenantIds.refreshLicenses === tenant.id ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />刷新中...</> : <><RotateCw className="h-3 w-3 mr-1" />刷新许可证</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onUpdateSecret(tenant)} disabled={updateSecretPending}>
            {updateSecretPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />更新中...</> : <><Key className="h-3 w-3 mr-1" />更新密钥</>}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onConfigurePermissions(tenant)} disabled={configurePermissionsPending}>
            {configurePermissionsPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />配置中...</> : <><ShieldCheck className="h-3 w-3 mr-1" />配置权限</>}
          </Button>
        </div>
        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">管理功能</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="flex flex-col h-auto py-2" onClick={() => onNavigate(`/tenants/${tenant.id}/users`)}><Users className="h-4 w-4 mb-1" /><span className="text-xs">用户</span></Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto py-2" onClick={() => onNavigate(`/tenants/${tenant.id}/licenses`)}><Award className="h-4 w-4 mb-1" /><span className="text-xs">许可证</span></Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto py-2" onClick={() => onNavigate(`/tenants/${tenant.id}/domains`)}><Globe className="h-4 w-4 mb-1" /><span className="text-xs">域名</span></Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto py-2" onClick={() => onNavigate(`/tenants/${tenant.id}/roles`)}><ShieldCheck className="h-4 w-4 mb-1" /><span className="text-xs">角色</span></Button>
            <Button variant="outline" size="sm" className="flex flex-col h-auto py-2 col-span-2" onClick={() => onNavigate(`/tenants/${tenant.id}/reports`)}><FileText className="h-4 w-4 mb-1" /><span className="text-xs">报告</span></Button>
          </div>
        </div>
        <div className="pt-3 border-t">
          <TenantLicensesSummary tenantId={tenant.id} compact />
        </div>
      </CardContent>
    </Card>
  )
}
