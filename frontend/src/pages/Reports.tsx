import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { reportApi } from '@/utils/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { CardSkeleton } from '@/components/CardSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { downloadBlob } from '@/utils/download'

export function Reports() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const [period, setPeriod] = useState('D7')

  const tenantIdNum = tenantId ? parseInt(tenantId, 10) : undefined

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', tenantIdNum],
    queryFn: async () => {
      try {
        if (tenantIdNum) {
          const res = await reportApi.getOrganizationByTenant(tenantIdNum)
          return res.data
        }
        const res = await reportApi.getOrganization()
        return res.data
      } catch {
        return null
      }
    },
  })

  const downloadOneDriveMutation = useMutation({
    mutationFn: (period: string) => reportApi.getOneDrive(period),
    onSuccess: (response) => {
      downloadBlob(response.data, `onedrive_usage_${period}_${Date.now()}.csv`)
      toast.success('OneDrive 报告下载成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const downloadExchangeMutation = useMutation({
    mutationFn: (period: string) => reportApi.getExchange(period),
    onSuccess: (response) => {
      downloadBlob(response.data, `exchange_usage_${period}_${Date.now()}.csv`)
      toast.success('Exchange 报告下载成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const periods = [
    { value: 'D7', label: '最近 7 天' },
    { value: 'D30', label: '最近 30 天' },
    { value: 'D90', label: '最近 90 天' },
    { value: 'D180', label: '最近 180 天' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="报告中心"
        subtitle="生成和下载 Office 365 使用报告"
      />

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            组织信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgLoading ? (
            <CardSkeleton count={1} />
          ) : organization ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">组织名称</div>
                <div className="font-medium">{organization.displayName}</div>
              </div>
              {organization.tenantType && (
                <div>
                  <div className="text-sm text-muted-foreground">租户类型</div>
                  <div className="font-medium">{organization.tenantType}</div>
                </div>
              )}
              {organization.city && (
                <div>
                  <div className="text-sm text-muted-foreground">城市</div>
                  <div className="font-medium">{organization.city}</div>
                </div>
              )}
              {organization.country && (
                <div>
                  <div className="text-sm text-muted-foreground">国家</div>
                  <div className="font-medium">{organization.country}</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              无法获取组织信息，请确保已选择租户
            </div>
          )}
        </CardContent>
      </Card>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>报告周期</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* OneDrive Report */}
        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              OneDrive 使用报告
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              生成所有用户的 OneDrive 存储使用情况详细报告，包括已用空间、文件数量等信息。
            </p>
            <Button
              onClick={() => downloadOneDriveMutation.mutate(period)}
              disabled={downloadOneDriveMutation.isPending}
              className="w-full"
            >
              {downloadOneDriveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  下载 OneDrive 报告
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              ℹ️ 报告将以 CSV 格式下载
            </div>
          </CardContent>
        </Card>

        {/* Exchange Report */}
        <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Exchange 使用报告
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              生成所有用户的邮箱使用情况详细报告，包括邮件数量、邮箱大小等信息。
            </p>
            <Button
              onClick={() => downloadExchangeMutation.mutate(period)}
              disabled={downloadExchangeMutation.isPending}
              className="w-full"
            >
              {downloadExchangeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  下载 Exchange 报告
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              ℹ️ 报告将以 CSV 格式下载
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="pt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                关于报告中的用户信息
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  由于 Microsoft 的隐私策略更新，报告中的用户信息和 URL 可能会以匿名形式显示。
                  如需查看真实信息，请使用管理员账号登录{' '}
                  <a
                    href="https://admin.microsoft.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    Microsoft 365 管理中心
                  </a>
                  ，在"设置 → 组织设置 → 报告"中取消勾选相关隐私选项。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
