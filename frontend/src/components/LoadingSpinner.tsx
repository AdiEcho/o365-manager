import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({ className = 'py-12', size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-gray-400`} />
    </div>
  )
}
