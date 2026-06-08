// ─── Dados fictícios para conta demo ─────────────────────────────────────────
// Nenhum dado real é retornado para usuários com is_demo = true

const now = new Date()

// Gera ISO string subtraindo dias e opcionalmente hora
function ago(days: number, hour = 10, minute = 0): string {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// Gera ISO string para uma data absoluta (mês relativo ao atual)
function rel(monthOffset: number, day: number, hour = 10): string {
  const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, day, hour, 0, 0)
  return d.toISOString()
}

// ── Leads ─────────────────────────────────────────────────────────────────────
export const DEMO_LEADS = [
  // Mês atual
  { id: 'demo-lead-1',  name: 'João Silva',        company: 'TechSolutions Ltda',      email: 'joao@techsolutions.com',      phone: '11999990001', status: 'hot',         source: 'meta_ads',   temperature: 'hot',  value: 8500,  score: 92, notes: 'Muito interessado, quer fechar essa semana.',        state: 'SP', created_at: ago(2,  9),  updated_at: ago(2,  9)  },
  { id: 'demo-lead-2',  name: 'Maria Santos',       company: 'Grupo Alfa',              email: 'maria@grupoalfa.com.br',      phone: '21988880002', status: 'contacted',   source: 'whatsapp',   temperature: 'warm', value: 12000, score: 74, notes: 'Pediu proposta por escrito.',                        state: 'RJ', created_at: ago(5,  14), updated_at: ago(5,  14) },
  { id: 'demo-lead-3',  name: 'Pedro Oliveira',     company: 'Prime Consultoria',       email: 'pedro@primeconsult.com',      phone: '31977770003', status: 'qualified',   source: 'google_ads', temperature: 'warm', value: 5200,  score: 68, notes: 'Tem orçamento aprovado para Q3.',                    state: 'MG', created_at: ago(8,  11), updated_at: ago(8,  11) },
  { id: 'demo-lead-4',  name: 'Ana Costa',          company: 'Inovação Digital',        email: 'ana@inovacaodigital.io',      phone: '47966660004', status: 'proposal',    source: 'organic',    temperature: 'hot',  value: 18000, score: 88, notes: 'Proposta enviada. Aguardando retorno do jurídico.',  state: 'SC', created_at: ago(4,  16), updated_at: ago(4,  16) },
  { id: 'demo-lead-5',  name: 'Carlos Mendes',      company: 'CM Engenharia',           email: 'carlos@cmengenharia.com',     phone: '85955550005', status: 'won',         source: 'referral',   temperature: 'hot',  value: 9800,  score: 95, notes: 'Fechado! Contrato assinado.',                       state: 'CE', created_at: ago(10, 10), updated_at: ago(10, 10) },
  { id: 'demo-lead-6',  name: 'Fernanda Lima',      company: 'Studio Lima',             email: 'fernanda@studiolima.design',  phone: '51944440006', status: 'negotiation', source: 'meta_ads',   temperature: 'warm', value: 6300,  score: 71, notes: 'Negociando desconto para contrato anual.',          state: 'RS', created_at: ago(1,  15), updated_at: ago(1,  15) },
  { id: 'demo-lead-7',  name: 'Roberto Faria',      company: 'Faria & Associados',      email: 'roberto@fariaadv.com.br',     phone: '62933330007', status: 'lost',        source: 'google_ads', temperature: 'cold', value: 4500,  score: 30, notes: 'Optou por concorrente. Recontatar em 6 meses.',     state: 'GO', created_at: ago(15, 13), updated_at: ago(15, 13) },

  // Mês anterior
  { id: 'demo-lead-8',  name: 'Beatriz Nunes',      company: 'BN Estética',             email: 'beatriz@bnestetica.com.br',   phone: '41922220008', status: 'won',         source: 'meta_ads',   temperature: 'hot',  value: 7200,  score: 90, notes: 'Pagamento via PIX confirmado.',                    state: 'PR', created_at: rel(-1, 5,  10), updated_at: rel(-1, 5,  10) },
  { id: 'demo-lead-9',  name: 'Lucas Andrade',      company: 'Andrade Seguros',         email: 'lucas@andradeseg.com.br',     phone: '71911110009', status: 'proposal',    source: 'referral',   temperature: 'warm', value: 15000, score: 80, notes: 'Indicado pela BN Estética.',                        state: 'BA', created_at: rel(-1, 12, 9),  updated_at: rel(-1, 12, 9)  },
  { id: 'demo-lead-10', name: 'Camila Ferreira',    company: 'CF Nutrição',             email: 'camila@cfnutricao.com',       phone: '92900000010', status: 'contacted',   source: 'instagram',  temperature: 'warm', value: 3800,  score: 60, notes: 'Entrou pelo link da bio.',                         state: 'AM', created_at: rel(-1, 18, 14), updated_at: rel(-1, 18, 14) },
  { id: 'demo-lead-11', name: 'Diego Rocha',        company: 'Rocha Imóveis',           email: 'diego@rochaimoveis.com',      phone: '81899990011', status: 'qualified',   source: 'meta_ads',   temperature: 'hot',  value: 22000, score: 85, notes: 'Grande potencial. Reunião agendada.',             state: 'PE', created_at: rel(-1, 22, 11), updated_at: rel(-1, 22, 11) },
  { id: 'demo-lead-12', name: 'Isabela Teixeira',   company: 'IT Advocacia',            email: 'isabela@itadvocacia.com.br',  phone: '27888880012', status: 'won',         source: 'google_ads', temperature: 'hot',  value: 11400, score: 93, notes: 'Contrato anual fechado.',                          state: 'ES', created_at: rel(-1, 28, 16), updated_at: rel(-1, 28, 16) },

  // Dois meses atrás
  { id: 'demo-lead-13', name: 'Thiago Carvalho',    company: 'TC Tecnologia',           email: 'thiago@tctec.com.br',         phone: '11877770013', status: 'won',         source: 'referral',   temperature: 'hot',  value: 19600, score: 97, notes: 'Maior contrato do trimestre.',                     state: 'SP', created_at: rel(-2, 3,  10), updated_at: rel(-2, 3,  10) },
  { id: 'demo-lead-14', name: 'Renata Souza',       company: 'RS Marketing Digital',    email: 'renata@rsmarketing.com.br',   phone: '21766660014', status: 'lost',        source: 'meta_ads',   temperature: 'cold', value: 4200,  score: 25, notes: 'Sem budget no momento.',                           state: 'RJ', created_at: rel(-2, 9,  14), updated_at: rel(-2, 9,  14) },
  { id: 'demo-lead-15', name: 'Felipe Duarte',      company: 'Duarte Construções',      email: 'felipe@duarteconstrucoes.com',phone: '47655550015', status: 'proposal',    source: 'organic',    temperature: 'warm', value: 31000, score: 78, notes: 'Obra grande. Proposta personalizada enviada.',     state: 'SC', created_at: rel(-2, 15, 9),  updated_at: rel(-2, 15, 9)  },
  { id: 'demo-lead-16', name: 'Larissa Moura',      company: 'Moura Academia',          email: 'larissa@mouraacademia.com.br',phone: '85544440016', status: 'negotiation', source: 'meta_ads',   temperature: 'warm', value: 5600,  score: 70, notes: 'Duas unidades. Descutindo desconto por volume.',  state: 'CE', created_at: rel(-2, 20, 11), updated_at: rel(-2, 20, 11) },
  { id: 'demo-lead-17', name: 'Gustavo Pinheiro',   company: 'GP Contabilidade',        email: 'gustavo@gpcontab.com.br',     phone: '51433330017', status: 'contacted',   source: 'whatsapp',   temperature: 'warm', value: 7800,  score: 65, notes: 'Primeiro contato pelo WhatsApp.',                  state: 'RS', created_at: rel(-2, 25, 15), updated_at: rel(-2, 25, 15) },

  // Três meses atrás
  { id: 'demo-lead-18', name: 'Patricia Alves',     company: 'Alves Clínica',           email: 'patricia@alvesclinica.com',   phone: '31322220018', status: 'won',         source: 'referral',   temperature: 'hot',  value: 14400, score: 96, notes: 'Indicação direta do Thiago Carvalho.',            state: 'MG', created_at: rel(-3, 7,  10), updated_at: rel(-3, 7,  10) },
  { id: 'demo-lead-19', name: 'Marcelo Viana',      company: 'MV Logística',            email: 'marcelo@mvlogistica.com.br',  phone: '41211110019', status: 'lost',        source: 'google_ads', temperature: 'cold', value: 8200,  score: 20, notes: 'Budget cortado internamente.',                     state: 'PR', created_at: rel(-3, 14, 14), updated_at: rel(-3, 14, 14) },
  { id: 'demo-lead-20', name: 'Juliana Castro',     company: 'JC Educação',             email: 'juliana@jceducacao.com.br',   phone: '71100000020', status: 'won',         source: 'meta_ads',   temperature: 'hot',  value: 9600,  score: 88, notes: 'Plano anual para escola.',                         state: 'BA', created_at: rel(-3, 21, 11), updated_at: rel(-3, 21, 11) },
]

// ── Clientes ──────────────────────────────────────────────────────────────────
export const DEMO_CLIENTS = [
  { id: 'demo-client-1', name: 'Carlos Mendes',      company_name: 'CM Engenharia',         email: 'carlos@cmengenharia.com',      phone: '85955550005', status: 'active',   value: 9800,  deals: 1, score: 95, gradient: 'from-emerald-500 to-teal-600',   since: rel(-1, 10).slice(0, 10), state: 'CE', created_at: rel(-1, 10) },
  { id: 'demo-client-2', name: 'Lúcia Barros',        company_name: 'Barros Contabilidade',  email: 'lucia@barroscont.com.br',      phone: '11922220008', status: 'active',   value: 14400, deals: 2, score: 89, gradient: 'from-violet-500 to-purple-600',  since: rel(-3, 5).slice(0,  10), state: 'SP', created_at: rel(-3, 5)  },
  { id: 'demo-client-3', name: 'Thiago Carvalho',     company_name: 'TC Tecnologia',         email: 'thiago@tctec.com.br',          phone: '11877770013', status: 'active',   value: 19600, deals: 3, score: 97, gradient: 'from-blue-500 to-cyan-500',      since: rel(-2, 3).slice(0,  10), state: 'SP', created_at: rel(-2, 3)  },
  { id: 'demo-client-4', name: 'Beatriz Nunes',       company_name: 'BN Estética',           email: 'beatriz@bnestetica.com.br',    phone: '41922220008', status: 'active',   value: 7200,  deals: 1, score: 90, gradient: 'from-rose-500 to-pink-600',      since: rel(-1, 5).slice(0,  10), state: 'PR', created_at: rel(-1, 5)  },
  { id: 'demo-client-5', name: 'Isabela Teixeira',    company_name: 'IT Advocacia',          email: 'isabela@itadvocacia.com.br',   phone: '27888880012', status: 'active',   value: 11400, deals: 1, score: 93, gradient: 'from-amber-500 to-orange-500',   since: rel(-1, 28).slice(0, 10), state: 'ES', created_at: rel(-1, 28) },
  { id: 'demo-client-6', name: 'Patricia Alves',      company_name: 'Alves Clínica',         email: 'patricia@alvesclinica.com',    phone: '31322220018', status: 'active',   value: 14400, deals: 2, score: 96, gradient: 'from-indigo-500 to-blue-400',    since: rel(-3, 7).slice(0,  10), state: 'MG', created_at: rel(-3, 7)  },
  { id: 'demo-client-7', name: 'Juliana Castro',      company_name: 'JC Educação',           email: 'juliana@jceducacao.com.br',    phone: '71100000020', status: 'active',   value: 9600,  deals: 1, score: 88, gradient: 'from-cyan-500 to-sky-400',       since: rel(-3, 21).slice(0, 10), state: 'BA', created_at: rel(-3, 21) },
  { id: 'demo-client-8', name: 'Rocha Imóveis',       company_name: 'Rocha Imóveis',         email: 'diego@rochaimoveis.com',       phone: '81899990011', status: 'inactive', value: 7200,  deals: 1, score: 62, gradient: 'from-slate-500 to-slate-400',    since: rel(-4, 10).slice(0, 10), state: 'PE', created_at: rel(-4, 10) },
]

// ── WhatsApp chats ────────────────────────────────────────────────────────────
export const DEMO_WA_CHATS = [
  { id: '5511999990001@s.whatsapp.net', name: 'João Silva',      phone: '11999990001', participantJid: '5511999990001@s.whatsapp.net', lastMsg: 'Pode me enviar a proposta hoje?',     timestamp: Math.floor(Date.now() / 1000) - 3600,   unread: 2, isGroup: false, lastFromMe: false },
  { id: '5521988880002@s.whatsapp.net', name: 'Maria Santos',    phone: '21988880002', participantJid: '5521988880002@s.whatsapp.net', lastMsg: 'Ótimo, aguardo o contrato ✅',         timestamp: Math.floor(Date.now() / 1000) - 7200,   unread: 0, isGroup: false, lastFromMe: true  },
  { id: '5547966660004@s.whatsapp.net', name: 'Ana Costa',       phone: '47966660004', participantJid: '5547966660004@s.whatsapp.net', lastMsg: 'Nosso jurídico aprova até sexta',      timestamp: Math.floor(Date.now() / 1000) - 18000,  unread: 1, isGroup: false, lastFromMe: false },
  { id: '5541922220008@s.whatsapp.net', name: 'Beatriz Nunes',   phone: '41922220008', participantJid: '5541922220008@s.whatsapp.net', lastMsg: 'Perfeito! Manda o acesso.',            timestamp: Math.floor(Date.now() / 1000) - 36000,  unread: 0, isGroup: false, lastFromMe: false },
  { id: '5551944440006@s.whatsapp.net', name: 'Fernanda Lima',   phone: '51944440006', participantJid: '5551944440006@s.whatsapp.net', lastMsg: 'Consegue dar 10% de desconto?',       timestamp: Math.floor(Date.now() / 1000) - 86400,  unread: 0, isGroup: false, lastFromMe: false },
  { id: '5585955550005@s.whatsapp.net', name: 'Carlos Mendes',   phone: '85955550005', participantJid: '5585955550005@s.whatsapp.net', lastMsg: '👍 Pode mandar o boleto',              timestamp: Math.floor(Date.now() / 1000) - 172800, unread: 0, isGroup: false, lastFromMe: false },
  { id: '5511877770013@s.whatsapp.net', name: 'Thiago Carvalho', phone: '11877770013', participantJid: '5511877770013@s.whatsapp.net', lastMsg: 'Renovamos por mais um ano? 🚀',       timestamp: Math.floor(Date.now() / 1000) - 259200, unread: 0, isGroup: false, lastFromMe: false },
]

export const DEMO_WA_MESSAGES: Record<string, unknown[]> = {
  '5511999990001@s.whatsapp.net': [
    { id: 'm1', from: 'them', text: 'Olá! Vi o anúncio de vocês no Instagram', time: '09:10', timestamp: Math.floor(Date.now() / 1000) - 7200, senderName: 'João Silva' },
    { id: 'm2', from: 'me',   text: 'Olá João! Fico feliz que encontrou a gente. Como posso te ajudar?', time: '09:15', timestamp: Math.floor(Date.now() / 1000) - 6900, senderName: null },
    { id: 'm3', from: 'them', text: 'Quero saber mais sobre os planos. Vocês atendem empresas de engenharia?', time: '09:18', timestamp: Math.floor(Date.now() / 1000) - 6720, senderName: 'João Silva' },
    { id: 'm4', from: 'me',   text: 'Sim! Temos vários clientes do setor. Posso te apresentar os planos agora ou prefere agendar uma call?', time: '09:20', timestamp: Math.floor(Date.now() / 1000) - 6600, senderName: null },
    { id: 'm5', from: 'them', text: 'Prefiro por aqui mesmo. Quais os valores?', time: '09:45', timestamp: Math.floor(Date.now() / 1000) - 5400, senderName: 'João Silva' },
    { id: 'm6', from: 'me',   text: 'Claro! Nossos planos começam em R$ 297/mês. Vou te enviar o material completo.', time: '09:48', timestamp: Math.floor(Date.now() / 1000) - 5220, senderName: null },
    { id: 'm7', from: 'them', text: 'Pode me enviar a proposta hoje?', time: '10:30', timestamp: Math.floor(Date.now() / 1000) - 3600, senderName: 'João Silva' },
  ],
  '5521988880002@s.whatsapp.net': [
    { id: 'm1', from: 'me',   text: 'Maria, bom dia! Preparei a proposta personalizada.', time: '08:30', timestamp: Math.floor(Date.now() / 1000) - 10800, senderName: null },
    { id: 'm2', from: 'them', text: 'Bom dia! Que ótimo, pode enviar.', time: '08:45', timestamp: Math.floor(Date.now() / 1000) - 9900, senderName: 'Maria Santos' },
    { id: 'm3', from: 'me',   text: 'Enviado por e-mail! Plano Empresa com 3 usuários, R$ 12.000/ano.', time: '08:47', timestamp: Math.floor(Date.now() / 1000) - 9780, senderName: null },
    { id: 'm4', from: 'them', text: 'Vou analisar com meu sócio', time: '09:00', timestamp: Math.floor(Date.now() / 1000) - 9000, senderName: 'Maria Santos' },
    { id: 'm5', from: 'them', text: 'Ótimo, aguardo o contrato ✅', time: '11:20', timestamp: Math.floor(Date.now() / 1000) - 7200, senderName: 'Maria Santos' },
  ],
  '5547966660004@s.whatsapp.net': [
    { id: 'm1', from: 'them', text: 'Recebemos a proposta. Estamos analisando.', time: '14:00', timestamp: Math.floor(Date.now() / 1000) - 21600, senderName: 'Ana Costa' },
    { id: 'm2', from: 'me',   text: 'Oi Ana! Qualquer dúvida estou por aqui 😊', time: '14:05', timestamp: Math.floor(Date.now() / 1000) - 21300, senderName: null },
    { id: 'm3', from: 'them', text: 'Nosso jurídico aprova até sexta', time: '16:30', timestamp: Math.floor(Date.now() / 1000) - 18000, senderName: 'Ana Costa' },
  ],
  '5541922220008@s.whatsapp.net': [
    { id: 'm1', from: 'them', text: 'Oi! Acabei de fechar. Quando começa o onboarding?', time: '10:00', timestamp: Math.floor(Date.now() / 1000) - 39600, senderName: 'Beatriz Nunes' },
    { id: 'm2', from: 'me',   text: 'Parabéns Beatriz! Inicio amanhã às 9h. Vou te enviar o guia de acesso.', time: '10:15', timestamp: Math.floor(Date.now() / 1000) - 38700, senderName: null },
    { id: 'm3', from: 'them', text: 'Perfeito! Manda o acesso.', time: '10:20', timestamp: Math.floor(Date.now() / 1000) - 36000, senderName: 'Beatriz Nunes' },
  ],
  '5551944440006@s.whatsapp.net': [
    { id: 'm1', from: 'them', text: 'Adorei a demonstração de ontem', time: '10:00', timestamp: Math.floor(Date.now() / 1000) - 90000, senderName: 'Fernanda Lima' },
    { id: 'm2', from: 'me',   text: 'Que bom, Fernanda! Posso te mandar a proposta?', time: '10:15', timestamp: Math.floor(Date.now() / 1000) - 89100, senderName: null },
    { id: 'm3', from: 'them', text: 'Sim! Mas consegue dar 10% de desconto?', time: '10:20', timestamp: Math.floor(Date.now() / 1000) - 86400, senderName: 'Fernanda Lima' },
  ],
  '5585955550005@s.whatsapp.net': [
    { id: 'm1', from: 'me',   text: 'Carlos, contrato assinado! Bem-vindo à bordo 🎉', time: '09:00', timestamp: Math.floor(Date.now() / 1000) - 175200, senderName: null },
    { id: 'm2', from: 'them', text: 'Muito obrigado! Equipe incrível.', time: '09:30', timestamp: Math.floor(Date.now() / 1000) - 173400, senderName: 'Carlos Mendes' },
    { id: 'm3', from: 'them', text: '👍 Pode mandar o boleto', time: '10:05', timestamp: Math.floor(Date.now() / 1000) - 172500, senderName: 'Carlos Mendes' },
  ],
  '5511877770013@s.whatsapp.net': [
    { id: 'm1', from: 'them', text: 'Estamos há 1 ano com vocês. Excelente serviço!', time: '14:00', timestamp: Math.floor(Date.now() / 1000) - 262800, senderName: 'Thiago Carvalho' },
    { id: 'm2', from: 'me',   text: 'Que honra, Thiago! Foi um prazer crescer junto com a TC Tecnologia 🚀', time: '14:30', timestamp: Math.floor(Date.now() / 1000) - 261000, senderName: null },
    { id: 'm3', from: 'them', text: 'Renovamos por mais um ano? 🚀', time: '15:00', timestamp: Math.floor(Date.now() / 1000) - 259200, senderName: 'Thiago Carvalho' },
  ],
}

// ── Financeiro ────────────────────────────────────────────────────────────────
export const DEMO_TRANSACTIONS = [
  { id: 'demo-tx-1',  type: 'income',  description: 'Contrato TC Tecnologia',         category: 'sales',        amount: 19600, currency: 'BRL', status: 'completed', transaction_date: rel(-2, 3).slice(0, 10) },
  { id: 'demo-tx-2',  type: 'income',  description: 'Contrato Patricia Alves',         category: 'sales',        amount: 14400, currency: 'BRL', status: 'completed', transaction_date: rel(-3, 7).slice(0, 10) },
  { id: 'demo-tx-3',  type: 'income',  description: 'Mensalidade Barros Contabilidade',category: 'subscription', amount: 1200,  currency: 'BRL', status: 'completed', transaction_date: rel(0, 5).slice(0,  10) },
  { id: 'demo-tx-4',  type: 'income',  description: 'Contrato CM Engenharia',          category: 'sales',        amount: 9800,  currency: 'BRL', status: 'completed', transaction_date: rel(-1, 10).slice(0, 10) },
  { id: 'demo-tx-5',  type: 'income',  description: 'Mensalidade TC Tecnologia',       category: 'subscription', amount: 1633,  currency: 'BRL', status: 'completed', transaction_date: rel(0, 3).slice(0,  10) },
  { id: 'demo-tx-6',  type: 'income',  description: 'Contrato BN Estética',            category: 'sales',        amount: 7200,  currency: 'BRL', status: 'completed', transaction_date: rel(-1, 5).slice(0,  10) },
  { id: 'demo-tx-7',  type: 'income',  description: 'Contrato Isabela Teixeira',       category: 'sales',        amount: 11400, currency: 'BRL', status: 'completed', transaction_date: rel(-1, 28).slice(0, 10) },
  { id: 'demo-tx-8',  type: 'income',  description: 'Contrato Juliana Castro',         category: 'sales',        amount: 9600,  currency: 'BRL', status: 'completed', transaction_date: rel(-3, 21).slice(0, 10) },
  { id: 'demo-tx-9',  type: 'income',  description: 'Consultoria Inovação Digital',    category: 'services',     amount: 3600,  currency: 'BRL', status: 'pending',   transaction_date: rel(0, 1).slice(0,  10) },
  { id: 'demo-tx-10', type: 'expense', description: 'Meta Ads — Campanha Mês Atual',   category: 'marketing',    amount: 1500,  currency: 'BRL', status: 'completed', transaction_date: rel(0, 2).slice(0,  10) },
  { id: 'demo-tx-11', type: 'expense', description: 'Meta Ads — Campanha Mês Passado', category: 'marketing',    amount: 1800,  currency: 'BRL', status: 'completed', transaction_date: rel(-1, 2).slice(0,  10) },
  { id: 'demo-tx-12', type: 'expense', description: 'Ferramentas SaaS',                category: 'software',     amount: 480,   currency: 'BRL', status: 'completed', transaction_date: rel(0, 1).slice(0,  10) },
  { id: 'demo-tx-13', type: 'expense', description: 'Google Ads',                      category: 'marketing',    amount: 620,   currency: 'BRL', status: 'completed', transaction_date: rel(-1, 15).slice(0, 10) },
]

// ── Equipe ────────────────────────────────────────────────────────────────────
export const DEMO_TEAM = [
  { id: 'demo-user-1', name: 'Kaio Laurindo',    email: 'admin@startsette.com.br',    role: 'admin',   custom_role: 'CEO',               permissions: [], active: true, created_at: rel(-6, 1),  avatar_url: null },
  { id: 'demo-user-2', name: 'Juliana Ferreira', email: 'juliana@startsette.com.br',  role: 'manager', custom_role: 'Gerente Comercial', permissions: [], active: true, created_at: rel(-4, 10), avatar_url: null },
  { id: 'demo-user-3', name: 'Rafael Souza',     email: 'rafael@startsette.com.br',   role: 'agent',   custom_role: 'SDR',               permissions: [], active: true, created_at: rel(-2, 5),  avatar_url: null },
  { id: 'demo-user-4', name: 'Mariana Lima',     email: 'mariana@startsette.com.br',  role: 'agent',   custom_role: 'Closer',            permissions: [], active: true, created_at: rel(-1, 15), avatar_url: null },
]

// ── Calendário ────────────────────────────────────────────────────────────────
// Gera eventos para o mês atual ± 6 meses para sempre mostrar algo em qualquer mês
function makeEvents() {
  const events: { id: string; company_id: string; created_by: string; label: string; day: number; month: number; year: number; time: string; color: string; description: string }[] = []
  const templates = [
    { label: 'Reunião com cliente',     time: '10:00', color: 'blue',   description: 'Apresentar proposta comercial' },
    { label: 'Demo do sistema',         time: '14:30', color: 'green',  description: 'Demonstração ao vivo para prospect' },
    { label: 'Follow-up WhatsApp',      time: '09:00', color: 'yellow', description: 'Retorno sobre proposta enviada' },
    { label: 'Call de onboarding',      time: '11:00', color: 'purple', description: 'Treinamento do novo cliente' },
    { label: 'Revisão de contratos',    time: '15:00', color: 'red',    description: 'Analisar renovações do mês' },
    { label: 'Planejamento de vendas',  time: '08:30', color: 'blue',   description: 'Alinhamento da equipe comercial' },
    { label: 'Demo para lead quente',   time: '16:00', color: 'green',  description: 'Prospect pediu demonstração urgente' },
    { label: 'Check-in com cliente',    time: '10:30', color: 'purple', description: 'Acompanhamento mensal de satisfação' },
  ]

  let id = 1
  for (let mo = -5; mo <= 6; mo++) {
    const base = new Date(now.getFullYear(), now.getMonth() + mo, 1)
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()
    // 3–5 events per month on different days
    const days = [5, 10, 15, 20, 25].filter(d => d <= daysInMonth)
    days.forEach((day, i) => {
      const t = templates[(mo * 5 + i + 40) % templates.length]
      events.push({
        id: `demo-ev-${id++}`,
        company_id: 'demo',
        created_by: 'demo',
        label: t.label,
        day,
        month: base.getMonth() + 1,
        year: base.getFullYear(),
        time: t.time,
        color: t.color,
        description: t.description,
      })
    })
  }
  return events
}

export const DEMO_EVENTS = makeEvents()

// ── Analytics ─────────────────────────────────────────────────────────────────
export const DEMO_ANALYTICS = {
  metrics: { totalLeads: 20, conversionRate: '30.0%', totalRevenue: 93100, activeClients: 7 },
  leadsPerDay: Array.from({ length: 30 }, (_, i) => {
    const dt = new Date(now); dt.setDate(dt.getDate() - (29 - i))
    const label = `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}`
    const leads = [1, 3, 5, 8, 10, 14, 17, 20, 22, 26, 29].includes(i) ? (i % 3 === 0 ? 2 : 1) : 0
    return { day: label, leads, conversions: leads > 1 ? 1 : 0 }
  }),
  leadsBySource: [
    { name: 'Meta Ads',   value: 40, color: '#3b82f6' },
    { name: 'WhatsApp',   value: 25, color: '#8b5cf6' },
    { name: 'Indicação',  value: 20, color: '#06b6d4' },
    { name: 'Google Ads', value: 15, color: '#10b981' },
  ],
  revenueByMonth: [
    { month: 'Jan', receita: 14400, despesas: 2800 },
    { month: 'Fev', receita: 19600, despesas: 3100 },
    { month: 'Mar', receita: 24200, despesas: 3400 },
    { month: 'Abr', receita: 18800, despesas: 2900 },
    { month: 'Mai', receita: 28400, despesas: 3800 },
    { month: 'Jun', receita: 35200, despesas: 4200 },
  ],
}

// ── Dashboard (Visão Geral) ───────────────────────────────────────────────────
export const DEMO_DASHBOARD = {
  metrics: { totalLeads: 20, wonLeads: 6, conversionRate: '30.0%', totalRevenue: 93100, activeClients: 7 },
  recentLeads: DEMO_LEADS.slice(0, 6),
  recentClients: DEMO_CLIENTS,
}

// ── Meta Insights ─────────────────────────────────────────────────────────────
export const DEMO_META_INSIGHTS = {
  period: 'last_30d', totalSpend: 3300, totalImpressions: 94800, totalClicks: 1820,
  totalReach: 61400, totalLeads: 42, totalMessages: 58, leadCount: 42, clientCount: 7,
  cpl: 78.57, cac: 471.43, ctr: 1.92, cpc: 1.81, cpm: 34.81, activeAccounts: 1,
}

// ── Form Leads (Meta Lead Ads) ────────────────────────────────────────────────
export const DEMO_FORM_LEADS = [
  {
    id: 'demo-fl-1', form_id: 'demo-form-1', form_name: 'FORMS 01 - ESTÉTICA',
    name: 'Camila Rodrigues', phone: '(11) 97832-4501',
    created_time: ago(0, 14), // hoje
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Entre R$ 25.000 e R$ 40.000' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Não consigo atrair pacientes novos fora do círculo de indicações' },
    ],
  },
  {
    id: 'demo-fl-2', form_id: 'demo-form-1', form_name: 'FORMS 01 - ESTÉTICA',
    name: 'Juliana Martins', phone: '(21) 98541-3320',
    created_time: ago(0, 9),
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Até R$ 25.000' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Posto nas redes mas não converto em agendamentos' },
    ],
  },
  {
    id: 'demo-fl-3', form_id: 'demo-form-2', form_name: 'FORMS 01 - ESTÉTICA (v1)',
    name: 'Fernanda Souza', phone: '(31) 99123-7654',
    created_time: ago(1, 16),
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Entre R$ 40.000 e R$ 90.000' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Minhas pacientes fazem o procedimento uma vez e somem' },
    ],
  },
  {
    id: 'demo-fl-4', form_id: 'demo-form-1', form_name: 'FORMS 01 - ESTÉTICA',
    name: 'Patrícia Lima', phone: '(47) 98765-4321',
    created_time: ago(1, 11),
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Acima de R$ 90.000' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Não tenho tempo de cuidar do Instagram e da clínica ao mesmo tempo' },
    ],
  },
  {
    id: 'demo-fl-5', form_id: 'demo-form-2', form_name: 'FORMS 01 - ESTÉTICA (v1)',
    name: 'Renata Alves', phone: '(85) 99234-5678',
    created_time: ago(2, 15),
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Ainda não faturei ou estou começando' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Não consigo atrair pacientes novos fora do círculo de indicações' },
    ],
  },
  {
    id: 'demo-fl-6', form_id: 'demo-form-1', form_name: 'FORMS 01 - ESTÉTICA',
    name: 'Beatriz Nascimento', phone: '(51) 98432-1098',
    created_time: ago(3, 10),
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Entre R$ 25.000 e R$ 40.000' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Posto nas redes mas não converto em agendamentos' },
    ],
  },
  {
    id: 'demo-fl-7', form_id: 'demo-form-1', form_name: 'FORMS 01 - ESTÉTICA',
    name: 'Larissa Costa', phone: '(62) 97654-3210',
    created_time: ago(5, 14),
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Entre R$ 40.000 e R$ 90.000' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Minhas pacientes fazem o procedimento uma vez e somem' },
    ],
  },
  {
    id: 'demo-fl-8', form_id: 'demo-form-2', form_name: 'FORMS 01 - ESTÉTICA (v1)',
    name: 'Amanda Ferreira', phone: '(41) 99876-5432',
    created_time: ago(7, 9),
    answers: [
      { question: 'Qual é o faturamento médio da sua clínica por mês?', answer: 'Até R$ 25.000' },
      { question: 'Qual é o seu maior desafio hoje na clínica?', answer: 'Não tenho tempo de cuidar do Instagram e da clínica ao mesmo tempo' },
    ],
  },
]

// ── Tasks (aba Task) ──────────────────────────────────────────────────────────
export const DEMO_TASKS = [
  { id: 'demo-task-1', group_name: 'Comercial — Start Sette', title: 'Enviar proposta revisada para a clínica BellaForma', description: 'Prazo: até terça-feira', responsible: 'Juliana Ferreira', due_date: null, status: 'pending',     priority: 'high',   source: 'weekly_summary', created_at: ago(1, 6) },
  { id: 'demo-task-2', group_name: 'Comercial — Start Sette', title: 'Ligar para o lead Patrícia (não respondeu no grupo)',  description: '',                       responsible: 'Rafael Souza',     due_date: null, status: 'in_progress', priority: 'medium', source: 'weekly_summary', created_at: ago(1, 6) },
  { id: 'demo-task-3', group_name: 'Suporte — Start Sette',   title: 'Resolver acesso travado do cliente CM Engenharia',   description: 'Prazo: hoje',            responsible: 'Mariana Lima',     due_date: null, status: 'done',        priority: 'high',   source: 'weekly_summary', created_at: ago(2, 6) },
  { id: 'demo-task-4', group_name: 'Comercial — Start Sette', title: 'Preparar material de onboarding para BN Estética',    description: '',                       responsible: '',                 due_date: null, status: 'pending',     priority: 'low',    source: 'manual',         created_at: ago(3, 10) },
  { id: 'demo-task-5', group_name: 'Suporte — Start Sette',   title: 'Documentar passo a passo de integração WhatsApp',     description: 'Prazo: sexta-feira',     responsible: 'Rafael Souza',     due_date: null, status: 'in_progress', priority: 'medium', source: 'manual',         created_at: ago(4, 9) },
]

// ── Resumos semanais (aba Task → Relatórios) ──────────────────────────────────
export const DEMO_WEEKLY_SUMMARIES = [
  {
    id: 'demo-ws-1', group_name: 'Comercial — Start Sette',
    week_start: ago(7).slice(0, 10), week_end: ago(1).slice(0, 10), created_at: ago(1, 6),
    content: {
      resumo_geral: 'Semana focada no fechamento da clínica BellaForma e na recuperação de leads parados. A equipe alinhou o novo script de follow-up e três propostas foram enviadas. Ficou pendente o retorno do jurídico sobre o contrato anual.',
      action_items: [
        { tarefa: 'Enviar proposta revisada para a clínica BellaForma', responsavel: 'Juliana Ferreira', prazo: 'até terça-feira' },
        { tarefa: 'Ligar para o lead Patrícia que não respondeu', responsavel: 'Rafael Souza', prazo: 'Não definido' },
      ],
      decisoes: [
        'Adotar o novo script de follow-up em todas as abordagens a partir de segunda',
        'Dar 10% de desconto apenas para contratos anuais',
      ],
      pendencias: [
        'Retorno do jurídico sobre o modelo de contrato anual',
        'Definição do responsável pelo onboarding da BN Estética',
      ],
      follow_up: [
        'Resolvido: integração do WhatsApp que estava pendente da semana anterior',
        'Em aberto: ainda sem retorno do lead Diego (Rocha Imóveis)',
      ],
      clima: 'Semana produtiva e colaborativa, com bom engajamento da equipe comercial.',
    },
  },
  {
    id: 'demo-ws-2', group_name: 'Suporte — Start Sette',
    week_start: ago(7).slice(0, 10), week_end: ago(1).slice(0, 10), created_at: ago(1, 6),
    content: {
      resumo_geral: 'Volume de chamados estável. O principal ponto foi o acesso travado do cliente CM Engenharia, resolvido na quinta. A equipe começou a documentar os procedimentos mais recorrentes.',
      action_items: [
        { tarefa: 'Documentar passo a passo de integração WhatsApp', responsavel: 'Rafael Souza', prazo: 'sexta-feira' },
      ],
      decisoes: ['Criar uma base de conhecimento interna para chamados recorrentes'],
      pendencias: ['Aguardando feedback do cliente CM Engenharia após a correção'],
      follow_up: ['Resolvido: lentidão no painel relatada na semana passada'],
      clima: 'Tranquilo, sem urgências críticas.',
    },
  },
]

// ── Alertas críticos ──────────────────────────────────────────────────────────
export const DEMO_CRITICAL_ALERTS = [
  { id: 'demo-al-1', group_name: 'Comercial — Start Sette', message: 'Cliente BellaForma demonstrou insatisfação com o atraso na proposta e mencionou estar avaliando concorrentes.', level: 'critical', detected_date: ago(1).slice(0, 10), is_read: false, created_at: ago(1, 23) },
  { id: 'demo-al-2', group_name: 'Suporte — Start Sette',   message: 'Prazo de entrega da integração do cliente CM Engenharia está estourando — combinado para hoje.',          level: 'warning',  detected_date: ago(2).slice(0, 10), is_read: true,  created_at: ago(2, 23) },
]

// ── Search ────────────────────────────────────────────────────────────────────
export const DEMO_SEARCH = {
  leads: DEMO_LEADS.slice(0, 4).map(l => ({ id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company, status: l.status, temperature: l.temperature, value: l.value })),
  clients: DEMO_CLIENTS.slice(0, 3).map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, company_name: c.company_name, status: c.status, value: c.value })),
  transactions: [],
  contacts: [],
}
