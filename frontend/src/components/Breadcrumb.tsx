import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { tenantApi } from '@/utils/api'
import { ChevronRight } from 'lucide-react'

const subPageNames: Record<string, string> = {
  users: '用户',
  licenses: '许可证',
  domains: '域名',
  roles: '角色',
  reports: '报告',
}

export function Breadcrumb() {
  const location = useLocation()
  const { tenantId } = useParams<{ tenantId: string }>()

  const tenantIdNum = tenantId ? parseInt(tenantId, 10) : undefined

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await tenantApi.list()
      return res.data
    },
    enabled: !!tenantIdNum,
  })

  const tenant = tenants?.items.find(t => t.id === tenantIdNum)

  // Only show on tenant sub-pages
  const pathParts = location.pathname.split('/').filter(Boolean)
  if (pathParts[0] !== 'tenants' || !tenantId) return null

  const subPage = pathParts[2]
  const subPageName = subPageNames[subPage] || subPage

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4">
      <Link to="/tenants" className="hover:text-foreground transition-colors">
        租户管理
      </Link>
      <ChevronRight className="h-4 w-4 mx-1" />
      <Link to="/tenants" className="hover:text-foreground transition-colors">
        {tenant?.tenant_name || '未命名租户'}
      </Link>
      <ChevronRight className="h-4 w-4 mx-1" />
      <span className="text-foreground font-medium">{subPageName}</span>
    </nav>
  )
}
