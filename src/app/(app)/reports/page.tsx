'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Plus, FileText, BarChart2, DollarSign, Users, MessageSquare, Download, Eye, X, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const reports = [
  { id: '1', title: 'Pipeline de Vendas', subtitle: 'Análise completa do funil de vendas e conversões', date: 'Maio 2026', format: 'PDF', metric: '342 leads', icon: BarChart2, iconColor: 'text-blue-400', iconBg: 'bg-blue-500/15', formatColor: 'bg-red-500/10 text-red-400 border-red-500/20', preview: ['Leads totais: 342', 'Em negociação: 89', 'Fechados: 47', 'Taxa de conversão: 24,7%', 'Ticket médio: R$ 5.287', 'Receita pipeline: R$ 248.500'] },
  { id: '2', title: 'Performance de Campanhas', subtitle: 'Resultados e ROAS de todas as campanhas ativas', date: 'Abril 2026', format: 'PDF', metric: '12 campanhas', icon: BarChart2, iconColor: 'text-purple-400', iconBg: 'bg-purple-500/15', formatColor: 'bg-red-500/10 text-red-400 border-red-500/20', preview: ['Campanhas ativas: 6', 'Impressões totais: 1.37M', 'Conversões: 802', 'ROAS médio: 8.5x', 'Gasto total: R$ 22.760', 'CPL médio: R$ 28,38'] },
  { id: '3', title: 'Análise de Conversão', subtitle: 'Taxa de conversão por etapa e segmento', date: 'Maio 2026', format: 'XLSX', metric: '47 negócios', icon: FileText, iconColor: 'text-green-400', iconBg: 'bg-green-500/15', formatColor: 'bg-green-500/10 text-green-400 border-green-500/20', preview: ['Leads → Contato: 63,7%', 'Contato → Qualificado: 41,5%', 'Qualificado → Proposta: 26,0%', 'Proposta → Fechado: 13,7%', 'Gargalo: Proposta', 'Melhora potencial: +5%'] },
  { id: '4', title: 'Receita por Segmento', subtitle: 'Distribuição de receita por setor e produto', date: 'Q1 2026', format: 'PDF', metric: 'R$ 248.500', icon: DollarSign, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-500/15', formatColor: 'bg-red-500/10 text-red-400 border-red-500/20', preview: ['Tech & SaaS: R$ 98.400 (39,6%)', 'Varejo: R$ 54.200 (21,8%)', 'Agro: R$ 35.000 (14,1%)', 'Saúde: R$ 33.700 (13,6%)', 'Outros: R$ 27.200 (10,9%)', 'Crescimento Q/Q: +12,5%'] },
  { id: '5', title: 'Equipe — Metas vs Resultados', subtitle: 'Desempenho individual e comparativo de metas', date: 'Maio 2026', format: 'PDF', metric: '8 vendedores', icon: Users, iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/15', formatColor: 'bg-red-500/10 text-red-400 border-red-500/20', preview: ['Meta coletiva: R$ 300.000', 'Resultado: R$ 248.500 (82,8%)', 'Top performer: Ana Lima', 'Melhor crescimento: Gabriel Moura', 'Reuniões realizadas: 124', 'Deals fechados: 47'] },
  { id: '6', title: 'WhatsApp Analytics', subtitle: 'Volume de mensagens, tempo de resposta e conversões', date: 'Abril 2026', format: 'PDF', metric: '1.247 mensagens', icon: MessageSquare, iconColor: 'text-green-400', iconBg: 'bg-green-500/15', formatColor: 'bg-red-500/10 text-red-400 border-red-500/20', preview: ['Mensagens enviadas: 1.247', 'Taxa de entrega: 98,2%', 'Taxa de leitura: 87,4%', 'Tempo médio resposta: 4min', 'Conversões via WA: 62', 'Automações disparadas: 847'] },
]

const reportTypes = ['Pipeline de Vendas', 'Performance de Campanhas', 'Análise de Conversão', 'Receita por Segmento', 'Relatório de Equipe', 'WhatsApp Analytics', 'Relatório Personalizado']
const formats = ['PDF', 'XLSX', 'CSV']

function Modal({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
        onClick={onClose}
      />
      <div
        className={cn('relative z-10 w-full rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl', wide ? 'max-w-lg' : 'max-w-md')}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default function ReportsPage() {
  usePageTitle('Relatórios')
  const { user } = useAuthStore()
  const activeReports = !user?.isDemo ? [] : reports
  const [previewReport, setPreviewReport] = useState<typeof reports[0] | null>(null)
  const [generateModal, setGenerateModal] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState<string | null>(null)
  const [genForm, setGenForm] = useState({ type: reportTypes[0], format: formats[0], period: 'Maio 2026' })
  const [generated, setGenerated] = useState(false)

  const handleDownload = (id: string, format: string) => {
    setDownloading(id)
    setTimeout(() => {
      setDownloading(null)
      setDownloaded(id)
      setTimeout(() => setDownloaded(null), 2000)
    }, 1500)
  }

  const handleGenerate = () => {
    setGenerated(true)
    setTimeout(() => { setGenerateModal(false); setGenerated(false) }, 800)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Exporte e analise dados do seu negócio"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Relatórios' }]}
        actions={
          <button onClick={() => setGenerateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Gerar Relatório
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {activeReports.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-12">Nenhum relatório ainda.</p>
        )}
        {activeReports.map(r => {
          const Icon = r.icon
          const isDown = downloading === r.id
          const isDone = downloaded === r.id
          return (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-sm hover:border-white/20 transition-all duration-200">
              <div className="flex items-start gap-4 mb-4">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', r.iconBg)}>
                  <Icon className={cn('w-5 h-5', r.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{r.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{r.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', r.formatColor)}>{r.format}</span>
                <span className="text-xs text-slate-500">{r.date}</span>
                <span className="text-xs text-slate-400 ml-auto font-medium">{r.metric}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(r.id, r.format)}
                  className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-all', isDone ? 'bg-green-600/20 border-green-500/30 text-green-400' : 'bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25')}
                >
                  {isDown ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                  {isDown ? 'Baixando...' : isDone ? 'Baixado!' : 'Download'}
                </button>
                <button
                  onClick={() => setPreviewReport(r)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Visualizar
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview modal */}
      <Modal wide open={!!previewReport} onClose={() => setPreviewReport(null)} title={previewReport?.title ?? ''}>
        {previewReport && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', previewReport.formatColor)}>{previewReport.format}</span>
              <span>{previewReport.date}</span>
              <span className="ml-auto text-slate-300 font-medium">{previewReport.metric}</span>
            </div>
            <p className="text-xs text-slate-500">{previewReport.subtitle}</p>
            <div className="rounded-xl border border-white/10 bg-white/3 divide-y divide-white/5">
              {previewReport.preview.map((line, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{line.split(':')[0]}</span>
                  <span className="text-xs font-semibold text-white">{line.split(':').slice(1).join(':').trim()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => handleDownload(previewReport.id, previewReport.format)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Baixar {previewReport.format}
            </button>
          </div>
        )}
      </Modal>

      {/* Generate modal */}
      <Modal open={generateModal} onClose={() => setGenerateModal(false)} title="Gerar Relatório">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tipo de relatório</label>
            <select value={genForm.type} onChange={e => setGenForm(p => ({ ...p, type: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {reportTypes.map(t => <option key={t} value={t} className="bg-[#1c1c24]">{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Formato</label>
              <select value={genForm.format} onChange={e => setGenForm(p => ({ ...p, format: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
                {formats.map(f => <option key={f} value={f} className="bg-[#1c1c24]">{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Período</label>
              <input value={genForm.period} onChange={e => setGenForm(p => ({ ...p, period: e.target.value }))}
                placeholder="Ex: Maio 2026"
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
          </div>
          <button onClick={handleGenerate} className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', generated ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
            {generated ? <><CheckCircle2 className="w-4 h-4" /> Relatório gerado!</> : 'Gerar Relatório'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
