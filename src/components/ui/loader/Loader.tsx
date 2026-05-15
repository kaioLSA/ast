import { cn } from '@/lib/utils/cn'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-6 h-6 border-2',
  lg: 'w-10 h-10 border-2',
}

export function Loader({ size = 'md', className }: LoaderProps) {
  return (
    <div
      className={cn(
        'rounded-full border-primary/30 border-t-primary animate-spin',
        sizeMap[size],
        className,
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        <p className="text-muted-foreground text-sm animate-pulse">Carregando...</p>
      </div>
    </div>
  )
}

export function FullscreenLoader() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4 glass rounded-2xl p-8">
        <Loader size="lg" />
        <p className="text-muted-foreground text-sm">Processando...</p>
      </div>
    </div>
  )
}
