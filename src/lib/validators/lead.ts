import { z } from 'zod'

export const leadContactSchema = z.object({
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().optional(),
})

export const createLeadSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  company: z.string().optional(),
  contact: leadContactSchema,
  source: z.enum(['organic', 'meta_ads', 'google_ads', 'tiktok_ads', 'whatsapp', 'referral', 'email', 'cold_call', 'website', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  value: z.number().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
})

export const updateLeadSchema = createLeadSchema.partial().extend({
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'inactive']).optional(),
  temperature: z.enum(['cold', 'warm', 'hot']).optional(),
})

export type CreateLeadSchema = z.infer<typeof createLeadSchema>
export type UpdateLeadSchema = z.infer<typeof updateLeadSchema>
