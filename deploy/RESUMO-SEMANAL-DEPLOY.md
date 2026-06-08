# Deploy — Automação de Resumo Semanal de Grupos

Passos para ATIVAR a funcionalidade em produção. Rodar **somente quando autorizado**.

## Já feito (não precisa repetir)
- ✅ Tabelas criadas no Supabase (mesmo banco de produção): `group_summary_settings`,
  `group_messages`, `daily_summaries`, `weekly_summaries`, `tasks`, `critical_alerts`
- ✅ Serviço Whisper instalado e ativo na VPS (`systemctl status whisper`) na porta 9000
- ✅ Código pronto e testado localmente (build + type-check passam)

## 1. Adicionar variáveis no `.env.production` da VPS (`/docker/crm/.env.production`)
```env
CRON_SECRET=cron-startsette-2024
WHISPER_API_URL=http://host.docker.internal:9000
WA_WEBHOOK_SECRET=wa-startsette-2024
```

## 2. Subir o código + rebuild (usa o docker-compose com extra_hosts já incluído)
```bash
cd /docker/crm
docker compose -f docker-compose.prod.yml build --no-cache crm
docker compose -f docker-compose.prod.yml up -d crm
```

## 3. Configurar o webhook do Evolution (captura das mensagens dos grupos)
```bash
curl -sk -X POST "https://evolution-api-fhww.srv1677824.hstgr.cloud/webhook/set/StartSette" \
  -H "apikey: Lj3QnETcJzvUZr7rOb25qZapUr4yLhVi" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://crm.startsette.com/api/whatsapp/webhook?secret=wa-startsette-2024",
      "byEvents": false,
      "events": ["MESSAGES_UPSERT"]
    }
  }'
```

## 4. Criar os crons na VPS (processamento diário e semanal)
```bash
# Diário às 23h (BRT) e semanal segunda às 6h (BRT). VPS está em UTC → +3h.
# 23h BRT = 02h UTC (dia seguinte) | 6h BRT seg = 09h UTC seg
( crontab -l 2>/dev/null | grep -v 'cron/daily-summary\|cron/weekly-summary'
  echo '0 2 * * * curl -s "https://crm.startsette.com/api/cron/daily-summary?secret=cron-startsette-2024" >> /var/log/resumo-diario.log 2>&1'
  echo '0 9 * * 1 curl -s "https://crm.startsette.com/api/cron/weekly-summary?secret=cron-startsette-2024" >> /var/log/resumo-semanal.log 2>&1'
) | crontab -
```

> ⚠️ Conferir o fuso da VPS com `date`. Se a VPS estiver em UTC, 23h BRT = 02:00 UTC
> e segunda 6h BRT = 09:00 UTC segunda (já considerado acima).

## Como usar (depois de ativo)
1. No CRM → WhatsApp → clicar com botão direito num grupo → **Resumo Semanal: ON**
2. A partir daí, as mensagens do grupo são salvas no banco
3. Todo dia às 23h a IA resume o dia (e cria alerta se algo crítico)
4. Toda segunda às 6h envia o relatório no grupo + cria as tarefas na aba **Task**
