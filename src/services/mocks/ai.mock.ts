import type { AIInsight, AISuggestion } from '@/types/ai.types'

export const mockInsights: AIInsight[] = [
  {
    id: '1',
    type: 'lead_score',
    title: 'Lead de alto potencial identificado',
    description: 'Pedro Oliveira tem 95% de probabilidade de conversão baseado no histórico de interações',
    score: 95,
    confidence: 0.92,
    recommendations: [
      'Entre em contato nos próximos 24h',
      'Envie proposta personalizada com desconto de 10%',
      'Agende uma demo ao vivo',
    ],
    entityId: '5',
    entityType: 'lead',
    generatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'campaign_optimization',
    title: 'Otimização de campanha sugerida',
    description: 'Aumentar orçamento da campanha Meta em 20% pode gerar 35% mais conversões',
    confidence: 0.87,
    recommendations: [
      'Aumentar orçamento diário para R$ 600',
      'Expandir público para 35-45 anos',
      'Testar novos criativos com CTA diferente',
    ],
    entityId: '1',
    entityType: 'campaign',
    generatedAt: new Date().toISOString(),
  },
]

export const mockSuggestions: AISuggestion[] = [
  {
    id: '1',
    text: 'Você tem 3 leads sem follow-up há mais de 3 dias. Deseja que eu crie uma sequência de mensagens?',
    category: 'follow_up',
    priority: 'high',
    context: 'leads',
  },
  {
    id: '2',
    text: 'Sua taxa de conversão caiu 2.1% esta semana. Analisei os dados e tenho sugestões de melhoria.',
    category: 'optimization',
    priority: 'medium',
    context: 'analytics',
  },
]
