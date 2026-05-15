export default function RootLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-muted-foreground text-sm animate-pulse">Carregando...</p>
      </div>
    </div>
  )
}
