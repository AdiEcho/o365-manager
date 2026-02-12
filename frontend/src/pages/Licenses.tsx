import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { licenseApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Loader2, RefreshCw, AlertTriangle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function Licenses() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const queryClient = useQueryClient()
  
  const { data: licenses, isLoading } = useQuery({
    queryKey: ['licenses', tenantId],
    queryFn: async () => {
      if (tenantId) {
        const res = await licenseApi.listByTenant(parseInt(tenantId))
        return res.data
      } else {
        const res = await licenseApi.list()
        return res.data
      }
    },
  })

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (tenantId) {
        const res = await licenseApi.listByTenant(parseInt(tenantId), true)
        return res.data
      } else {
        throw new Error('刷新功能仅适用于租户许可证')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['licenses', tenantId] })
      toast.success('许可证数据已刷新')
    },
    onError: (error: Error) => {
      toast.error(`刷新失败: ${error.message}`)
    },
  })

  const totalConsumed = licenses?.reduce((sum, lic) => sum + lic.consumed_units, 0) || 0
  const totalEnabled = licenses?.reduce((sum, lic) => sum + lic.enabled_units, 0) || 0
  const totalAvailable = licenses?.reduce((sum, lic) => sum + lic.available_units, 0) || 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="许可证管理"
        subtitle="查看和管理 Office 365 许可证"
        actions={
          tenantId ? (
            <Button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending || isLoading}
              variant="outline"
            >
              {refreshMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  刷新中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新数据
                </>
              )}
            </Button>
          ) : undefined
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总许可证</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnabled}</div>
            <p className="text-xs text-muted-foreground">已启用的许可证总数</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已使用</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalConsumed}</div>
            <p className="text-xs text-muted-foreground">已分配给用户的许可证</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可用</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalAvailable}</div>
            <p className="text-xs text-muted-foreground">剩余可分配的许可证</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">即将过期</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {licenses?.filter(l => l.expires_at && new Date(l.expires_at).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">90 天内到期的许可证</p>
          </CardContent>
        </Card>
      </div>

      {/* Licenses List */}
      <Card>
        <CardHeader>
          <CardTitle>许可证详情</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : licenses?.length === 0 ? (
            <EmptyState message="暂无许可证信息" icon={Award} />
          ) : (
            <div className="space-y-6 divide-y">
              {licenses?.map((license) => {
                const usagePercent = license.enabled_units > 0 ? (license.consumed_units / license.enabled_units) * 100 : 0
                return (
                  <div key={license.sku_id} className="space-y-3 pt-6 first:pt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {license.sku_name_cn || license.sku_part_number}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {license.sku_part_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {license.consumed_units} / {license.enabled_units}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          可用: {license.available_units}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>使用率</span>
                        <span className="font-medium">{usagePercent.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-700 ${
                            usagePercent >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : usagePercent >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>
                    {license.available_units <= 5 && license.available_units > 0 && (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />警告: 可用许可证不足 ({license.available_units} 个)
                      </div>
                    )}
                    {license.available_units === 0 && (
                      <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        <XCircle className="h-4 w-4 inline mr-1" />错误: 许可证已用尽
                      </div>
                    )}
                    {license.expires_at && (() => {
                      const expiresDate = new Date(license.expires_at)
                      const now = new Date()
                      const daysUntilExpiry = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      const isExpired = daysUntilExpiry < 0
                      const isExpiringSoon = !isExpired && daysUntilExpiry <= 30

                      return (
                        <div className={`text-sm p-2 rounded flex items-center gap-1.5 ${
                          isExpired
                            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                            : isExpiringSoon
                            ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'text-muted-foreground'
                        }`}>
                          <Clock className="h-4 w-4 shrink-0" />
                          {isExpired
                            ? `已过期: ${formatDate(license.expires_at)}`
                            : isExpiringSoon
                            ? `即将过期 (${daysUntilExpiry} 天后): ${formatDate(license.expires_at)}`
                            : `到期时间: ${formatDate(license.expires_at)}`
                          }
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
