import { CheckCircle2, XCircle, HelpCircle, Ban, AlertCircle } from 'lucide-react'

export function getCredentialStatusDisplay(credentialStatus?: string) {
  switch (credentialStatus) {
    case 'valid':
      return {
        icon: CheckCircle2,
        text: '凭据有效',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      }
    case 'invalid':
      return {
        icon: XCircle,
        text: '凭据无效',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20'
      }
    default:
      return {
        icon: HelpCircle,
        text: '未验证',
        color: 'text-gray-400 dark:text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-800'
      }
  }
}

export function getSpoStatusDisplay(spoStatus?: string) {
  switch (spoStatus) {
    case 'available':
      return {
        icon: CheckCircle2,
        text: 'SPO 可用',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      }
    case 'unavailable':
      return {
        icon: XCircle,
        text: 'SPO 不可用',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      }
    case 'no_subscription':
      return {
        icon: Ban,
        text: '无 SPO 订阅',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20'
      }
    case 'error':
      return {
        icon: AlertCircle,
        text: '检查出错',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20'
      }
    default:
      return {
        icon: HelpCircle,
        text: '未检查',
        color: 'text-gray-400 dark:text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-800'
      }
  }
}

interface StatusBadgeProps {
  status?: string
  type: 'credential' | 'spo'
  checkedAt?: string
}

export function StatusBadge({ status, type, checkedAt }: StatusBadgeProps) {
  const display = type === 'credential' ? getCredentialStatusDisplay(status) : getSpoStatusDisplay(status)
  const Icon = display.icon
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${display.bgColor} ${display.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {display.text}
      </span>
      {checkedAt && (
        <span className="text-xs text-gray-500">
          {new Date(checkedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}
