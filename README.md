# Magina Prospector

Job TypeScript para descobrir empresas B2B via Google Maps/Apify, verificar sinais públicos da homepage, registrar evidências e priorizar oportunidades na planilha da Magina Labs.

O MVP não usa OpenAI API, Clay, banco de dados próprio, navegador automatizado nem envio automático de mensagens. Cidades, nichos e prioridade vêm da aba `Busca`.

## Requisitos

- Node.js 22+
- Conta Apify com acesso ao Actor `compass/crawler-google-places`
- Service account com acesso de editor à planilha

## Setup local

```bash
npm install
cp .env.example .env
npm run validate-sheet
npm run dry-run
```

No Windows, copie `.env.example` para `.env` manualmente ou use `Copy-Item .env.example .env`.

Configure no `.env`:

```env
APIFY_TOKEN=
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_FILE=.secrets/google-service-account.json
```

O cliente também aceita `GOOGLE_SERVICE_ACCOUNT_JSON_B64`, que prevalece sobre o caminho local e é adequado a Secrets de CI.

## Planilha

O comando `npm run validate-sheet` verifica as abas `Planos`, `Leads`, `Configuração`, `Busca`, `Evidências` e `Automação`, além dos cabeçalhos de `Leads!A7:AG7`.

`npm run bootstrap-sheet` cria apenas `Busca`, `Evidências` ou `Automação` quando estiverem ausentes. Não recria `Leads`, não apaga dados e não muda preços. Revise manualmente qualquer aba criada antes da primeira prospecção.

Na aba `Busca`, mantenha as colunas `Ativo?`, `Nicho`, `Cidade`, `UF`, `Máx. resultados`, `Produto tem bom valor?`, `Prioridade da busca` e `Observações`. O job ignora linhas inativas e escolhe até quatro pesquisas por execução.

## Apify e custos

O Actor usa resultados limitados pela coluna `Máx. resultados` e por `MAX_RESULTS_PER_SEARCH`. O enriquecimento pago de perfis sociais fica desligado; links retornados sem esse add-on ou encontrados na homepage podem ser registrados.

Não habilite limites altos sem revisar o custo atual na conta Apify. Cada busca é uma execução externa do Actor.

## Comandos

```bash
npm run validate-sheet
npm run bootstrap-sheet
npm run dry-run
npm run prospect
npm run prospect -- --city Campinas --niche "Móveis planejados"
npm run prospect -- --max-new-leads 10
```

`dry-run` consulta Apify e as homepages, calcula score, escreve `data/run-result.json` e exibe o TOP 20, sem gravar na planilha.

## GitHub Actions

O workflow manual também oferece `dry_run` e `max_new_leads`. O schedule roda segunda e quinta às 08:17 no fuso `America/Sao_Paulo`.

Cadastre em **Settings → Secrets and variables → Actions**:

- `APIFY_TOKEN`
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_JSON_B64` — conteúdo JSON da service account codificado em Base64 UTF-8.

Exemplo para gerar o Base64 localmente sem imprimir a chave no histórico do Git:

```bash
node -e "process.stdout.write(require('node:fs').readFileSync('.secrets/google-service-account.json').toString('base64'))"
```

O summary e o artefato JSON ficam associados à execução do workflow; o resultado não é commitado.

O workflow serializa execuções no GitHub e a CLI bloqueia duas execuções locais no mesmo checkout. Não inicie uma execução local no mesmo horário de uma execução do GitHub Actions; os dois ambientes não compartilham um mecanismo distribuído de lock.

## Regras de qualificação

- `placeId` é a chave de deduplicação; sem ele, usa SHA-256 de nome, telefone normalizado e cidade.
- Os valores de empresas vindos de fontes externas são gravados como dados literais (RAW). O estado `PENDENTE` em `Automação` permite retomar uma escrita interrompida sem inserir outra linha de lead; evidências são deduplicadas por fonte/campo/valor.
- Empresas fechadas, sem nome, fora da cidade consultada ou repetidas não entram como leads novos.
- Site sem viewport pode receber `Não` em “Funciona bem no celular?”; site existente nunca recebe avaliação estética automática.
- Instagram localizado não prova atividade; anúncios não encontrados ficam como `Não sei`.
- Escritas automáticas em `Leads` cobrem `A:Y` e `AC:AG`, preservando `Z:AB` e dados de contato humanos.

## Troubleshooting

- **403 no Sheets:** confirme se Sheets API está ativa e se a planilha foi compartilhada com a service account.
- **Apify sem créditos:** reduza o limite por busca ou aguarde/revise o plano da conta.
- **Aba ausente:** rode `npm run bootstrap-sheet` e confira os cabeçalhos antes da prospecção.
- **Site indisponível:** timeout, HTTP 403/429 e falhas de rede são registrados e não interrompem as outras empresas.
- **Credencial inválida:** valide o JSON local ou gere novamente o Secret Base64 a partir do arquivo correto.
