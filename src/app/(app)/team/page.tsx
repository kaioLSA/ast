'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Plus, Mail, X, CheckCircle2, Shield, User, Users, Eye, EyeOff,
  Building2, Calendar, DollarSign, BarChart3, MessageCircle,
  FileText, Target, Settings, Zap, Trash2, ChevronDown, ChevronUp, ShieldCheck, KeyRound, AlertTriangle, Lock,
  Camera, Pencil, Loader2, ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

type Member = {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent' | string
  custom_role: string
  permissions: string[]
  active: boolean
  created_at: string
  avatar_url?: string | null
}

// ─── Permissions definition ───────────────────────────────────────────────────

const PERMISSION_GROUPS = [
  {
    key: 'leads', label: 'Leads', icon: Users,
    items: [
      { key: 'leads:read', label: 'Visualizar leads' },
      { key: 'leads:write', label: 'Criar e editar leads' },
      { key: 'leads:delete', label: 'Excluir leads' },
    ],
  },
  {
    key: 'clients', label: 'Clientes', icon: Building2,
    items: [
      { key: 'clients:read', label: 'Visualizar clientes' },
      { key: 'clients:write', label: 'Criar e editar clientes' },
      { key: 'clients:delete', label: 'Excluir clientes' },
    ],
  },
  {
    key: 'calendar', label: 'Calendário', icon: Calendar,
    items: [
      { key: 'calendar:read', label: 'Visualizar eventos' },
      { key: 'calendar:write', label: 'Criar e editar eventos' },
      { key: 'calendar:delete', label: 'Excluir eventos' },
    ],
  },
  {
    key: 'finance', label: 'Financeiro', icon: DollarSign,
    items: [
      { key: 'finance:read', label: 'Visualizar financeiro' },
      { key: 'finance:write', label: 'Editar lançamentos' },
    ],
  },
  {
    key: 'analytics', label: 'Analytics', icon: BarChart3,
    items: [
      { key: 'analytics:read', label: 'Visualizar analytics' },
    ],
  },
  {
    key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle,
    items: [
      { key: 'whatsapp:read', label: 'Visualizar conversas' },
      { key: 'whatsapp:write', label: 'Enviar mensagens' },
    ],
  },
  {
    key: 'reports', label: 'Relatórios', icon: FileText,
    items: [
      { key: 'reports:read', label: 'Visualizar relatórios' },
    ],
  },
  {
    key: 'campaigns', label: 'Campanhas', icon: Target,
    items: [
      { key: 'campaigns:read', label: 'Visualizar campanhas' },
      { key: 'campaigns:write', label: 'Criar e editar campanhas' },
      { key: 'campaigns:delete', label: 'Excluir campanhas' },
    ],
  },
  {
    key: 'team', label: 'Equipe', icon: Users,
    items: [
      { key: 'team:read', label: 'Visualizar membros' },
      { key: 'team:write', label: 'Convidar membros' },
      { key: 'team:delete', label: 'Remover membros' },
    ],
  },
  {
    key: 'settings', label: 'Configurações', icon: Settings,
    items: [
      { key: 'settings:read', label: 'Visualizar configurações' },
      { key: 'settings:write', label: 'Editar configurações' },
    ],
  },
  {
    key: 'ai', label: 'Inteligência Artificial', icon: Zap,
    items: [
      { key: 'ai:use', label: 'Usar recursos de IA' },
    ],
  },
  {
    key: 'forms', label: 'Formulários Meta Ads', icon: ClipboardList,
    items: [
      { key: 'forms:read', label: 'Visualizar respostas dos formulários' },
    ],
  },
]

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key))

const GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-600',
  'from-cyan-500 to-sky-500',
  'from-green-500 to-emerald-500',
]

function getGradient(name: string) {
  const code = name.charCodeAt(0) % GRADIENTS.length
  return GRADIENTS[code]
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ─── Modal wrapper with portal ────────────────────────────────────────────────

function Modal({ open, onClose, title, wide, children }: {
  open: boolean; onClose: () => void; title: string; wide?: boolean; children: React.ReactNode
}) {
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
        className={cn('relative z-10 w-full rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[85vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}

// ─── Permission toggle group ──────────────────────────────────────────────────

function PermissionGroup({
  group, selected, onChange, disabled,
}: {
  group: typeof PERMISSION_GROUPS[0]
  selected: string[]
  onChange: (key: string, checked: boolean) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(true)
  const Icon = group.icon
  const allChecked = group.items.every(i => selected.includes(i.key))
  const someChecked = group.items.some(i => selected.includes(i.key))

  const toggleGroup = () => {
    if (disabled) return
    const newVal = !allChecked
    group.items.forEach(i => onChange(i.key, newVal))
  }

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-white">{group.label}</span>
          {someChecked && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
              {group.items.filter(i => selected.includes(i.key)).length}/{group.items.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleGroup() }}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-md border transition-colors',
                allChecked
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-white/5 text-slate-500 border-white/10 hover:text-slate-300'
              )}
            >
              {allChecked ? 'Remover todos' : 'Selecionar todos'}
            </button>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-2">
          {group.items.map(item => (
            <label key={item.key} className={cn('flex items-center gap-3 cursor-pointer group', disabled && 'cursor-default opacity-70')}>
              <div
                onClick={() => !disabled && onChange(item.key, !selected.includes(item.key))}
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all',
                  selected.includes(item.key)
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-white/5 border-white/20 group-hover:border-white/40'
                )}
              >
                {selected.includes(item.key) && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-slate-300 select-none">{item.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 256
        const canvas = document.createElement('canvas')
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        const side = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Main page ────────────────────────────────────────────────────────────────

// Conta que nunca pode ser excluída/desativada ou modificada
const PROTECTED_EMAIL = 'kaiolaurindo@setteia.com'

const emptyForm = {
  name: '', email: '', password: '', confirmPassword: '',
  role: 'custom' as 'admin' | 'custom',
  custom_role: '',
  permissions: [] as string[],
}

const emptyResetForm = { newPassword: '', confirmPassword: '' }

export default function TeamPage() {
  usePageTitle('Equipe')
  const { user: me } = useAuthStore()
  const isAdmin = me?.role === 'admin'

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModal, setInviteModal] = useState(false)
  const [viewMember, setViewMember] = useState<Member | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Reset password state
  const [resetModal, setResetModal] = useState(false)
  const [resetTarget, setResetTarget] = useState<Member | null>(null)
  const [resetForm, setResetForm] = useState(emptyResetForm)
  const [resetSaving, setResetSaving] = useState(false)
  const [resetSaved, setResetSaved] = useState(false)
  const [resetError, setResetError] = useState('')
  const [showResetPass, setShowResetPass] = useState(false)

  // ── Edit member state ──────────────────────────────────────────────────────
  const [editMode, setEditMode]       = useState(false)
  const [editPerms, setEditPerms]     = useState<string[]>([])
  const [editRole, setEditRole]       = useState<'admin' | 'custom'>('custom')
  const [editCustomRole, setEditCustomRole] = useState('')
  const [editAvatar, setEditAvatar]   = useState<string | null>(null)
  const [editSaving, setEditSaving]   = useState(false)
  const [editSaved, setEditSaved]     = useState(false)
  const [editError, setEditError]     = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then((data: Member[]) => { if (Array.isArray(data)) setMembers(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // When role switches to admin → auto-select all permissions
  useEffect(() => {
    if (form.role === 'admin') {
      setForm(p => ({ ...p, permissions: ALL_PERMISSIONS }))
    }
  }, [form.role])

  const togglePermission = (key: string, checked: boolean) => {
    setForm(p => ({
      ...p,
      permissions: checked ? [...p.permissions, key] : p.permissions.filter(k => k !== key),
    }))
  }

  const handleCreate = async () => {
    setError('')
    if (!form.name.trim()) return setError('Nome é obrigatório')
    if (!form.email.trim()) return setError('Email é obrigatório')
    if (!form.password) return setError('Senha é obrigatória')
    if (form.password.length < 6) return setError('Senha deve ter pelo menos 6 caracteres')
    if (form.password !== form.confirmPassword) return setError('As senhas não coincidem')

    setSaving(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role === 'admin' ? 'admin' : 'agent',
          custom_role: form.custom_role.trim(),
          permissions: form.role === 'admin' ? ALL_PERMISSIONS : form.permissions,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar membro')
        setSaving(false)
        return
      }
      setMembers(prev => [...prev, data])
      setSaved(true)
      setTimeout(() => {
        setInviteModal(false)
        setSaved(false)
        setSaving(false)
        setForm(emptyForm)
      }, 900)
    } catch {
      setError('Erro de conexão')
      setSaving(false)
    }
  }

  const requestRemove = (member: Member) => {
    setConfirmDelete(member)
    setViewMember(null)
  }

  const handleRemove = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    await fetch(`/api/team/${confirmDelete.id}`, { method: 'DELETE' })
    setMembers(prev => prev.map(m => m.id === confirmDelete.id ? { ...m, active: false } : m))
    setConfirmDelete(null)
    setDeleting(false)
  }

  const openResetModal = (member: Member) => {
    setResetTarget(member)
    setResetForm(emptyResetForm)
    setResetError('')
    setResetSaved(false)
    setShowResetPass(false)
    setResetModal(true)
  }

  const handleResetPassword = async () => {
    setResetError('')
    if (!resetForm.newPassword || resetForm.newPassword.length < 6) return setResetError('A senha deve ter pelo menos 6 caracteres')
    if (resetForm.newPassword !== resetForm.confirmPassword) return setResetError('As senhas não coincidem')
    setResetSaving(true)
    try {
      const res = await fetch(`/api/team/${resetTarget!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: resetForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setResetError(data.error ?? 'Erro ao resetar senha'); setResetSaving(false); return }
      setResetSaved(true)
      setTimeout(() => { setResetModal(false); setResetSaved(false); setResetSaving(false) }, 1200)
    } catch {
      setResetError('Erro de conexão')
      setResetSaving(false)
    }
  }

  const openEdit = useCallback((m: Member) => {
    setEditMode(true)
    setEditPerms(m.permissions ?? [])
    setEditRole(m.role === 'admin' ? 'admin' : 'custom')
    setEditCustomRole(m.custom_role ?? '')
    setEditAvatar(m.avatar_url ?? null)
    setEditSaving(false)
    setEditSaved(false)
    setEditError('')
  }, [])

  const handleEditSave = async () => {
    if (!viewMember) return
    setEditSaving(true)
    setEditError('')
    try {
      const patch: Record<string, unknown> = {
        role: editRole === 'admin' ? 'admin' : 'agent',
        custom_role: editCustomRole,
        permissions: editRole === 'admin' ? ALL_PERMISSIONS : editPerms,
      }
      // Only send avatar if changed
      if (editAvatar !== viewMember.avatar_url) patch.avatar_url = editAvatar

      const res = await fetch(`/api/team/${viewMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error ?? 'Erro ao salvar'); setEditSaving(false); return }

      // Update local list
      setMembers(prev => prev.map(m => m.id === viewMember.id
        ? { ...m, ...patch, avatar_url: editAvatar, permissions: patch.permissions as string[] }
        : m
      ))
      setViewMember(prev => prev ? { ...prev, ...patch, avatar_url: editAvatar, permissions: patch.permissions as string[] } : prev)

      setEditSaved(true)
      setTimeout(() => { setEditMode(false); setEditSaved(false); setEditSaving(false) }, 1000)
    } catch {
      setEditError('Erro de conexão')
      setEditSaving(false)
    }
  }

  const handleEditFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    try { setEditAvatar(await compressImage(file)) } catch { /* ignore */ }
  }, [])

  const activeMembers = members.filter(m => m.active)
  const adminCount = activeMembers.filter(m => m.role === 'admin').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Gerencie os membros e permissões de acesso"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Equipe' }]}
        actions={
          isAdmin ? (
            <button
              onClick={() => { setInviteModal(true); setForm(emptyForm); setError('') }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Convidar Membro
            </button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total de membros', value: activeMembers.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Administradores', value: adminCount, icon: ShieldCheck, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Membros personalizados', value: activeMembers.filter(m => m.role !== 'admin').length, icon: User, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Inativos', value: members.filter(m => !m.active).length, icon: Shield, color: 'text-slate-400', bg: 'bg-slate-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/3 p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-semibold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Members grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : activeMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-300 font-medium">Nenhum membro ainda</p>
          {isAdmin && (
            <button onClick={() => setInviteModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Convidar primeiro membro
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeMembers.map(m => {
            const isMe = m.id === me?.id
            const isProtected = m.email?.toLowerCase() === PROTECTED_EMAIL.toLowerCase()
            const isAdminMember = m.role === 'admin'
            const permCount = isAdminMember ? ALL_PERMISSIONS.length : m.permissions?.length ?? 0
            return (
              <div key={m.id} className="rounded-2xl border border-white/8 bg-white/3 p-5 hover:border-white/15 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold text-white shrink-0', !m.avatar_url && `bg-gradient-to-br ${getGradient(m.name)}`)}>
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                        : getInitials(m.name)
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                        {m.name}
                        {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">você</span>}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.email}</p>
                    </div>
                  </div>
                  {isAdmin && !isMe && (
                    isProtected ? (
                      <div title="Conta protegida" className="p-1.5 text-slate-700">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <button
                        onClick={() => requestRemove(m)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full border text-[11px] font-medium',
                      isAdminMember
                        ? 'bg-violet-500/15 text-violet-400 border-violet-500/20'
                        : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                    )}>
                      {isAdminMember ? '👑 Administrador' : m.custom_role || 'Membro'}
                    </span>
                    <span className="text-xs text-slate-500">{permCount}/{ALL_PERMISSIONS.length} permissões</span>
                  </div>

                  {/* Permission summary pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {isAdminMember ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        Acesso total
                      </span>
                    ) : (
                      PERMISSION_GROUPS.filter(g => g.items.some(i => m.permissions?.includes(i.key))).slice(0, 4).map(g => (
                        <span key={g.key} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/8">
                          {g.label}
                        </span>
                      ))
                    )}
                    {!isAdminMember && PERMISSION_GROUPS.filter(g => g.items.some(i => m.permissions?.includes(i.key))).length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/8">
                        +{PERMISSION_GROUPS.filter(g => g.items.some(i => m.permissions?.includes(i.key))).length - 4}
                      </span>
                    )}
                    {!isAdminMember && m.permissions?.length === 0 && (
                      <span className="text-[10px] text-slate-600">Sem permissões</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setViewMember(m)}
                  className="w-full py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
                >
                  Ver permissões
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Hidden file input for edit avatar ─── */}
      <input
        ref={editFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleEditFile(f); e.target.value = '' }}
      />

      {/* ─── View Member Modal ─── */}
      <Modal
        open={!!viewMember}
        onClose={() => { setViewMember(null); setEditMode(false) }}
        title={editMode ? 'Editar Membro' : 'Detalhes do Membro'}
        wide
      >
        {viewMember && !editMode && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-lg font-bold text-white shrink-0',
                !viewMember.avatar_url && `bg-gradient-to-br ${getGradient(viewMember.name)}`
              )}>
                {viewMember.avatar_url
                  ? <img src={viewMember.avatar_url} alt={viewMember.name} className="w-full h-full object-cover" />
                  : getInitials(viewMember.name)
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-white">{viewMember.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                  <p className="text-xs text-slate-400 truncate">{viewMember.email}</p>
                </div>
                <span className={cn(
                  'inline-block mt-1.5 px-2 py-0.5 rounded-full border text-[11px] font-medium',
                  viewMember.role === 'admin'
                    ? 'bg-violet-500/15 text-violet-400 border-violet-500/20'
                    : 'bg-slate-500/15 text-slate-400 border-slate-500/20'
                )}>
                  {viewMember.role === 'admin' ? '👑 Administrador' : viewMember.custom_role || 'Membro'}
                </span>
              </div>
            </div>

            {/* Permissions view */}
            <div className="border-t border-white/8 pt-4">
              <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">
                Permissões {viewMember.role === 'admin' ? '— Acesso total' : `— ${viewMember.permissions?.length ?? 0} de ${ALL_PERMISSIONS.length}`}
              </p>
              <div className="space-y-2">
                {PERMISSION_GROUPS.map(group => {
                  const activeItems = viewMember.role === 'admin'
                    ? group.items
                    : group.items.filter(i => viewMember.permissions?.includes(i.key))
                  if (activeItems.length === 0) return null
                  const Icon = group.icon
                  return (
                    <div key={group.key} className="rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-medium text-slate-300">{group.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeItems.map(item => (
                          <span key={item.key} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Action buttons */}
            {isAdmin && viewMember.id !== me?.id && (
              <div className="flex gap-2 pt-1 flex-wrap">
                {/* Edit button — hidden for protected account */}
                {viewMember.email?.toLowerCase() !== PROTECTED_EMAIL.toLowerCase() && (
                  <button
                    onClick={() => openEdit(viewMember)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
                  >
                    <Pencil className="w-4 h-4" /> Editar
                  </button>
                )}
                <button
                  onClick={() => { setViewMember(null); openResetModal(viewMember) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors"
                >
                  <KeyRound className="w-4 h-4" /> Resetar senha
                </button>
                {viewMember.email?.toLowerCase() === PROTECTED_EMAIL.toLowerCase() ? (
                  <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/8 bg-white/3 text-slate-600 text-sm font-medium cursor-not-allowed">
                    <Lock className="w-4 h-4" /> Protegida
                  </div>
                ) : (
                  <button
                    onClick={() => requestRemove(viewMember)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Desativar
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Edit mode panel ── */}
        {viewMember && editMode && (
          <div className="space-y-5">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative group cursor-pointer"
                onClick={() => editFileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleEditFile(f) }}
              >
                <div className={cn(
                  'w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold text-white shrink-0 transition-all',
                  !editAvatar && `bg-gradient-to-br ${getGradient(viewMember.name)}`
                )}>
                  {editAvatar
                    ? <img src={editAvatar} alt={viewMember.name} className="w-full h-full object-cover" />
                    : getInitials(viewMember.name)
                  }
                </div>
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => editFileRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-colors"
                >
                  {editAvatar ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                {editAvatar && (
                  <button
                    type="button"
                    onClick={() => setEditAvatar(null)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Tipo de acesso</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditRole('admin')}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    editRole === 'admin' ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'
                  )}
                >
                  <ShieldCheck className={cn('w-5 h-5 shrink-0', editRole === 'admin' ? 'text-violet-400' : 'text-slate-500')} />
                  <div>
                    <p className={cn('text-sm font-medium', editRole === 'admin' ? 'text-violet-300' : 'text-slate-300')}>Administrador</p>
                    <p className="text-[11px] text-slate-500">Acesso total</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setEditRole('custom')}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                    editRole === 'custom' ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/10 bg-white/3 hover:border-white/20'
                  )}
                >
                  <User className={cn('w-5 h-5 shrink-0', editRole === 'custom' ? 'text-blue-400' : 'text-slate-500')} />
                  <div>
                    <p className={cn('text-sm font-medium', editRole === 'custom' ? 'text-blue-300' : 'text-slate-300')}>Personalizado</p>
                    <p className="text-[11px] text-slate-500">Permissões manuais</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom role label */}
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Cargo / Função</label>
              <input
                placeholder="Ex: Vendedor, SDR, Analista..."
                value={editCustomRole}
                onChange={e => setEditCustomRole(e.target.value)}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                  {editRole === 'admin' ? 'Permissões — todas ativadas' : `Permissões — ${editPerms.length} de ${ALL_PERMISSIONS.length}`}
                </label>
                {editRole === 'custom' && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditPerms(ALL_PERMISSIONS)} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">Selecionar tudo</button>
                    <span className="text-slate-700">·</span>
                    <button type="button" onClick={() => setEditPerms([])} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">Limpar</button>
                  </div>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {PERMISSION_GROUPS.map(group => (
                  <PermissionGroup
                    key={group.key}
                    group={group}
                    selected={editRole === 'admin' ? ALL_PERMISSIONS : editPerms}
                    onChange={(key, checked) => setEditPerms(prev => checked ? [...prev, key] : prev.filter(k => k !== key))}
                    disabled={editRole === 'admin'}
                  />
                ))}
              </div>
            </div>

            {editError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{editError}</p>
            )}

            {/* Save / Cancel */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                disabled={editSaving}
                className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/8 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving}
                className={cn(
                  'flex-1 h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  editSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
                )}
              >
                {editSaved
                  ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</>
                  : editSaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                    : <><CheckCircle2 className="w-4 h-4" /> Salvar alterações</>
                }
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Reset Password Modal ─── */}
      <Modal open={resetModal} onClose={() => setResetModal(false)} title="Resetar senha">
        {resetTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 flex items-start gap-3">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Resetar senha de {resetTarget.name}</p>
                <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">
                  Defina uma senha temporária. O membro será obrigado a criar uma nova senha no próximo login.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Senha temporária</label>
              <div className="relative">
                <input
                  type={showResetPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={resetForm.newPassword}
                  onChange={e => setResetForm(p => ({ ...p, newPassword: e.target.value }))}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
                <button type="button" onClick={() => setShowResetPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showResetPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Confirmar senha temporária</label>
              <input
                type={showResetPass ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={resetForm.confirmPassword}
                onChange={e => setResetForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </div>

            {resetError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{resetError}</p>
            )}

            <button
              onClick={handleResetPassword}
              disabled={resetSaving}
              className={cn(
                'w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                resetSaved ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50'
              )}
            >
              {resetSaved
                ? <><CheckCircle2 className="w-4 h-4" /> Senha resetada!</>
                : resetSaving ? 'Resetando...'
                : <><KeyRound className="w-4 h-4" /> Resetar senha</>
              }
            </button>
          </div>
        )}
      </Modal>

      {/* ─── Confirm Delete Modal ─── */}
      <Modal open={!!confirmDelete} onClose={() => !deleting && setConfirmDelete(null)} title="Confirmar desativação">
        {confirmDelete && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  Tem certeza que deseja desativar a conta de{' '}
                  <span className="font-semibold text-white">{confirmDelete.name}</span>?
                </p>
                <p className="text-xs text-slate-500 mt-1">{confirmDelete.email}</p>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  O membro perderá o acesso ao sistema imediatamente.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/8 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemove}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? 'Desativando...' : <><Trash2 className="w-4 h-4" /> Sim, desativar</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Invite Modal ─── */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Convidar Membro" wide>
        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Nome completo *</label>
              <input
                placeholder="João Silva"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Cargo / Função</label>
              <input
                placeholder="Ex: Vendedor, SDR..."
                value={form.custom_role}
                onChange={e => setForm(p => ({ ...p, custom_role: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Email *</label>
            <input
              type="email"
              placeholder="joao@empresa.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Senha *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 pr-10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Confirmar senha *</label>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tipo de acesso *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, role: 'admin' }))}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  form.role === 'admin'
                    ? 'border-violet-500/40 bg-violet-500/10'
                    : 'border-white/10 bg-white/3 hover:border-white/20'
                )}
              >
                <ShieldCheck className={cn('w-5 h-5 shrink-0', form.role === 'admin' ? 'text-violet-400' : 'text-slate-500')} />
                <div>
                  <p className={cn('text-sm font-medium', form.role === 'admin' ? 'text-violet-300' : 'text-slate-300')}>Administrador</p>
                  <p className="text-[11px] text-slate-500">Acesso total ao sistema</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, role: 'custom', permissions: [] }))}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  form.role === 'custom'
                    ? 'border-blue-500/40 bg-blue-500/10'
                    : 'border-white/10 bg-white/3 hover:border-white/20'
                )}
              >
                <User className={cn('w-5 h-5 shrink-0', form.role === 'custom' ? 'text-blue-400' : 'text-slate-500')} />
                <div>
                  <p className={cn('text-sm font-medium', form.role === 'custom' ? 'text-blue-300' : 'text-slate-300')}>Personalizado</p>
                  <p className="text-[11px] text-slate-500">Escolha cada permissão</p>
                </div>
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 uppercase tracking-wide font-medium">
                {form.role === 'admin' ? 'Permissões — todas ativadas' : `Permissões — ${form.permissions.length} de ${ALL_PERMISSIONS.length} selecionadas`}
              </label>
              {form.role === 'custom' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm(p => ({ ...p, permissions: ALL_PERMISSIONS }))} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">Selecionar tudo</button>
                  <span className="text-slate-700">·</span>
                  <button type="button" onClick={() => setForm(p => ({ ...p, permissions: [] }))} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">Limpar</button>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {PERMISSION_GROUPS.map(group => (
                <PermissionGroup
                  key={group.key}
                  group={group}
                  selected={form.role === 'admin' ? ALL_PERMISSIONS : form.permissions}
                  onChange={togglePermission}
                  disabled={form.role === 'admin'}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={saving}
            className={cn(
              'w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
              saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50'
            )}
          >
            {saved
              ? <><CheckCircle2 className="w-4 h-4" /> Membro criado!</>
              : saving
                ? 'Criando...'
                : <><Plus className="w-4 h-4" /> Criar membro</>
            }
          </button>
        </div>
      </Modal>
    </div>
  )
}
