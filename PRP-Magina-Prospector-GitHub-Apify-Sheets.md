# PRP — Magina Prospector
## Automação de prospecção B2B com GitHub Actions + Apify + Google Sheets

**Projeto:** Magina Labs  
**Objetivo:** alimentar automaticamente a planilha de leads com empresas reais, evidências rastreáveis e score comercial, sem depender de pesquisa manual empresa por empresa.  
**Prioridade:** confiabilidade > evidência > custo baixo > simplicidade > volume.  
**MVP sem OpenAI API:** sim.  
**Clay:** não utilizar no MVP.  
**Netlify:** não é necessária para esta automação.  
**Execução:** GitHub Actions agendado + execução manual via CLI/workflow_dispatch.  
**Fonte principal:** Apify Google Maps Scraper `compass/crawler-google-places`.  
**Planilha:** Google Sheets baseada na planilha atual da Magina Labs.

---

# 1. Decisão arquitetural

Implementar a automação como código TypeScript independente.

Fluxo:

```text
GitHub Actions
      ↓
lê aba "Busca"
      ↓
seleciona combinações nicho + cidade
      ↓
Apify Google Maps Scraper
      ↓
normalização
      ↓
deduplicação
      ↓
enriquecimento simples do site
      ↓
evidências
      ↓
score determinístico
      ↓
Google Sheets
      ↓
aba Leads + Evidências + Automação
      ↓
revisão humana dos melhores leads
```

Não usar IA dentro da execução automática do MVP.

Motivo:

- evitar custo de API;
- evitar inferências inventadas;
- tornar execução reproduzível;
- facilitar debug;
- permitir saber exatamente por que um lead recebeu determinada nota.

IA/Codex pode ser usada depois para revisar manualmente os TOP leads.

---

# 2. Por que NÃO usar Clay

Clay é bom para times comerciais que preferem configurar pipelines sem programar.

Não é a escolha recomendada para este projeto porque:

- Gustavo consegue programar;
- o fluxo necessário é simples;
- o plano grátis é limitado;
- o plano pago relevante aumenta muito o custo fixo;
- Apify + GitHub Actions + Sheets já resolvem o MVP;
- queremos manter o custo em aproximadamente R$ 0 enquanto validamos vendas.

Portanto:

```text
Clay = fora do MVP.
```

Não instalar SDK, integração ou dependência do Clay.

---

# 3. Objetivo comercial

A automação NÃO precisa encontrar milhares de empresas.

Meta inicial:

```text
20–30 leads novos qualificados por execução
2 execuções por semana
≈ 40–60 leads novos/semana no máximo
```

A automação deve priorizar qualidade.

Uma empresa só deve entrar na planilha quando:

- possuir informações mínimas úteis;
- não for duplicada;
- não estiver encerrada;
- estiver dentro das cidades/nichos configurados;
- possuir evidência suficiente para preencher os campos automáticos.

Não inventar campos desconhecidos.

Se não houver comprovação:

```text
Não sei
```

---

# 4. Fontes e documentação oficial

## Apify Google Maps Scraper

Actor:

```text
compass/crawler-google-places
```

Documentação:

```text
https://apify.com/compass/crawler-google-places
https://apify.com/compass/crawler-google-places/api
https://apify.com/compass/crawler-google-places/input-schema
```

API:

```text
https://api.apify.com/v2/actors/compass~crawler-google-places/runs
```

MCP opcional para Codex:

```text
https://mcp.apify.com/?tools=fetch-actor-details,compass/crawler-google-places
```

---

## Google Sheets API

```text
https://developers.google.com/workspace/sheets/api
https://developers.google.com/workspace/guides/create-credentials
```

Utilizar service account e compartilhar somente a planilha específica com o e-mail da service account.

Não usar OAuth interativo dentro do GitHub Actions.

---

## GitHub Actions

```text
https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
```

Usar `schedule` + `workflow_dispatch`.

---

# 5. Custo esperado

## GitHub Actions

Usar runners padrão.

Para duas execuções semanais pequenas, custo esperado:

```text
R$ 0 no estágio atual.
```

## Apify

Usar Free Plan inicialmente.

O Google Maps Scraper possui cobrança baseada em resultados/uso.

Limitar rigorosamente quantidade de resultados.

Nunca criar loop sem limite.

## Google Sheets

```text
R$ 0
```

## OpenAI API

```text
Não usar no MVP.
```

---

# 6. Repositório

Criar repositório:

```text
magina-prospector
```

Estrutura:

```text
magina-prospector/
├── .github/
│   └── workflows/
│       └── prospect.yml
│
├── src/
│   ├── cli.ts
│   ├── index.ts
│   │
│   ├── config/
│   │   └── constants.ts
│   │
│   ├── jobs/
│   │   └── prospect.ts
│   │
│   ├── providers/
│   │   ├── apify/
│   │   │   ├── client.ts
│   │   │   ├── google-maps.ts
│   │   │   └── mapper.ts
│   │   └── website/
│   │       ├── inspect-website.ts
│   │       └── extract-socials.ts
│   │
│   ├── sheets/
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   ├── read-search-config.ts
│   │   ├── read-existing-leads.ts
│   │   ├── write-leads.ts
│   │   ├── write-evidence.ts
│   │   └── write-automation.ts
│   │
│   ├── scoring/
│   │   ├── score-lead.ts
│   │   └── suggest-offer.ts
│   │
│   ├── enrichment/
│   │   ├── enrich-business.ts
│   │   ├── build-problem.ts
│   │   └── detect-domain.ts
│   │
│   ├── dedupe/
│   │   └── deduplicate.ts
│   │
│   ├── rotation/
│   │   └── select-searches.ts
│   │
│   ├── types/
│   │   ├── business.ts
│   │   ├── sheet.ts
│   │   └── evidence.ts
│   │
│   └── utils/
│       ├── phone.ts
│       ├── url.ts
│       ├── hash.ts
│       ├── date.ts
│       └── retry.ts
│
├── tests/
│   ├── score-lead.test.ts
│   ├── deduplicate.test.ts
│   ├── website.test.ts
│   └── mapper.test.ts
│
├── data/
│   └── .gitkeep
│
├── .env.example
├── .gitignore
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
└── eslint.config.js
```

---

# 7. Stack

Usar:

- Node.js 22;
- TypeScript;
- `tsx`;
- `apify-client`;
- `googleapis`;
- `cheerio`;
- `zod`;
- `tldts`;
- `p-limit`;
- `vitest`;
- ESLint.

Não usar:

- NestJS;
- Express;
- banco de dados próprio;
- Supabase;
- Next.js;
- React;
- Playwright no MVP;
- Puppeteer no MVP;
- Redis;
- filas;
- Docker obrigatório.

É um job, não uma aplicação web.

---

# 8. package.json

Scripts obrigatórios:

```json
{
  "scripts": {
    "dev": "tsx src/cli.ts",
    "prospect": "tsx src/cli.ts prospect",
    "dry-run": "tsx src/cli.ts prospect --dry-run",
    "validate-sheet": "tsx src/cli.ts validate-sheet",
    "bootstrap-sheet": "tsx src/cli.ts bootstrap-sheet",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  }
}
```

---

# 9. Variáveis de ambiente

`.env.example`:

```env
APIFY_TOKEN=
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=

MAX_SEARCHES_PER_RUN=4
MAX_RESULTS_PER_SEARCH=20
MAX_NEW_LEADS_PER_RUN=30

WEBSITE_CONCURRENCY=5
HTTP_TIMEOUT_MS=10000

AUTOMATION_VERSION=1.0.0
LOG_LEVEL=info

ENABLE_GOOGLE_ADS_ENRICHMENT=false
ENABLE_META_ADS_ENRICHMENT=false
```

Não adicionar `OPENAI_API_KEY`.

---

# 10. GitHub Secrets

Criar em:

```text
Repository
→ Settings
→ Secrets and variables
→ Actions
```

Secrets:

```text
APIFY_TOKEN
GOOGLE_SHEET_ID
GOOGLE_SERVICE_ACCOUNT_JSON
```

## GOOGLE_SERVICE_ACCOUNT_JSON

Salvar o JSON COMPLETO da service account como secret.

Código:

```ts
const credentials = JSON.parse(
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON!
);
```

Nunca commitar o JSON.

---

# 11. Configuração Google Cloud

Passo a passo:

1. criar projeto Google Cloud;
2. ativar Google Sheets API;
3. IAM & Admin;
4. Service Accounts;
5. criar:
   `magina-prospector`;
6. criar chave JSON;
7. copiar e-mail da service account;
8. abrir Planilha Leads;
9. Compartilhar;
10. adicionar o e-mail da service account como Editor;
11. colocar ID da planilha em `GOOGLE_SHEET_ID`.

Não usar domain-wide delegation.

A service account só precisa acessar esta planilha.

---

# 12. Configuração Apify

1. criar conta gratuita;
2. abrir:
   `API & Integrations`;
3. copiar Personal API token;
4. adicionar em GitHub Secret:
   `APIFY_TOKEN`.

Actor principal:

```text
compass/crawler-google-places
```

---

# 13. MCP opcional no Codex

O processo agendado NÃO depende de MCP.

MCP é apenas ferramenta extra para operação manual pelo Codex.

Adicionar:

```bash
codex mcp add apify --url "https://mcp.apify.com/?tools=fetch-actor-details,compass/crawler-google-places"
```

Verificar:

```bash
codex mcp list
```

Se a autenticação OAuth do servidor remoto não funcionar no ambiente usado, configurar o servidor local baseado no pacote oficial da Apify e `APIFY_TOKEN`.

Nunca bloquear o desenvolvimento do prospector por causa do MCP.

---

# 14. Planilha existente

A planilha possui:

```text
Planos
Leads
Configuração
```

A versão preparada para automação deve possuir também:

```text
Busca
Evidências
Automação
```

O comando:

```bash
npm run bootstrap-sheet
```

deve:

- validar se todas as abas existem;
- criar `Busca`, `Evidências`, `Automação` caso não existam;
- NÃO apagar dados existentes;
- NÃO recriar `Leads`;
- NÃO alterar preços;
- NÃO sobrescrever prospecções humanas existentes.

---

# 15. Aba Busca

Schema:

| Coluna | Campo |
|---|---|
| A | Ativo? |
| B | Nicho |
| C | Cidade |
| D | UF |
| E | Máx. resultados |
| F | Produto tem bom valor? |
| G | Prioridade da busca |
| H | Observações |

Valores:

```text
Ativo?:
Sim / Não

Produto tem bom valor?:
Sim / Não / Não sei
```

Exemplo:

```text
Sim | Móveis planejados | Campinas | SP | 20 | Sim | 1
Sim | Uniformes personalizados | Campinas | SP | 20 | Sim | 1
Sim | Energia solar | Campinas | SP | 20 | Sim | 1
```

O código deve ler esta aba em todas as execuções.

Não hardcodar cidades/nichos no TypeScript como fonte de verdade.

---

# 16. Rotação de pesquisas

Não executar todas as linhas de `Busca` a cada job.

Selecionar:

```text
MAX_SEARCHES_PER_RUN
```

combinações ativas.

Ordem:

1. menor `Prioridade da busca`;
2. combinação executada há mais tempo;
3. combinação nunca executada primeiro.

Estado da última execução pode ser obtido da aba `Automação`.

Meta:

```text
4 combinações/run
20 lugares/combinação
máximo bruto ≈ 80 lugares/run
```

Depois deduplicar e limitar novos leads.

---

# 17. Entrada do Google Maps Scraper

Para cada combinação:

```json
{
  "searchStringsArray": [
    "Móveis planejados"
  ],
  "locationQuery": "Campinas, SP, Brazil",
  "maxCrawledPlacesPerSearch": 20,
  "language": "pt-BR",
  "scrapeSocialMediaProfiles": {
    "facebooks": true,
    "instagrams": true,
    "youtubes": false,
    "tiktoks": false,
    "twitters": false
  },
  "maximumLeadsEnrichmentRecords": 0,
  "maxCompetitorsToAnalyze": 0
}
```

Se `pt-BR` não for aceito pelo Actor no momento da implementação, verificar input schema atual e utilizar o código de idioma suportado.

Não adivinhar schema se Actor mudou.

Codex deve consultar:

```text
https://apify.com/compass/crawler-google-places/input-schema
```

ou usar `fetch-actor-details` via MCP/API.

---

# 18. Execução Apify

Usar `apify-client`.

Exemplo conceitual:

```ts
const client = new ApifyClient({
  token: env.APIFY_TOKEN,
});

const run = await client
  .actor("compass/crawler-google-places")
  .call(input);

const { items } = await client
  .dataset(run.defaultDatasetId)
  .listItems();
```

Não fazer scraping direto do HTML do Google Maps.

---

# 19. Dados úteis vindos do Maps

Mapear quando disponíveis:

```text
title
categoryName
categories
address
city
state
website
phone
phoneUnformatted
totalScore
reviewsCount
placeId
url
permanentlyClosed
temporarilyClosed
isAdvertisement
instagrams
facebooks
```

O mapper deve tolerar campos ausentes.

Nunca confiar que um Actor retorna todos os campos sempre.

---

# 20. Normalização

Criar tipo interno:

```ts
type Prospect = {
  placeId: string | null;

  companyName: string;
  city: string | null;
  state: string | null;

  niche: string;

  website: string | null;
  phone: string | null;

  instagram: string | null;
  facebook: string | null;

  mapsUrl: string | null;

  rating: number | null;
  reviewCount: number | null;

  isAdvertisement: boolean | null;

  sourceQuery: string;

  rawSource: "google_maps";
};
```

---

# 21. Filtros iniciais

Descartar automaticamente:

```text
permanentlyClosed = true
```

Descartar:

- empresa sem nome;
- resultado claramente fora da cidade;
- duplicado;
- categoria incompatível com pesquisa quando for um falso positivo evidente.

Não descartar apenas por:

- poucas avaliações;
- ausência de site.

Ausência de site pode ser oportunidade.

---

# 22. Deduplicação

Identificador primário:

```text
placeId
```

Se `placeId` existir:

```text
dedupe = placeId
```

Fallback:

```text
normalized(companyName)
+
normalized(phone)
+
normalized(city)
```

Gerar SHA-256 para fallback.

Nunca usar apenas nome.

---

# 23. Verificação contra histórico

Antes de inserir:

1. ler `Automação`;
2. carregar todos os `Place ID`;
3. carregar hashes fallback;
4. comparar.

Se já existe:

```text
não criar nova linha em Leads
```

Atualizar:

```text
Última vez visto
```

Opcionalmente registrar alterações relevantes.

---

# 24. Website enrichment

Executar apenas se:

```text
website != null
```

Usar `fetch`.

Configurar:

```text
timeout = HTTP_TIMEOUT_MS
redirect = follow
user-agent próprio
```

Não usar browser no MVP.

---

# 25. WebsiteInspection

Tipo:

```ts
type WebsiteInspection = {
  reachable: boolean;
  statusCode: number | null;

  finalUrl: string | null;

  hasHttps: boolean;
  hasViewport: boolean;

  hasWhatsappLink: boolean;
  whatsappLinks: string[];

  hasTelLink: boolean;
  hasForm: boolean;

  instagramUrl: string | null;
  facebookUrl: string | null;

  title: string | null;

  error: string | null;
};
```

---

# 26. Cheerio

Detectar:

## WhatsApp

URLs contendo:

```text
wa.me
api.whatsapp.com
whatsapp.com/send
whatsapp:
```

## Telefone

```text
a[href^="tel:"]
```

## Instagram

```text
instagram.com
```

## Facebook

```text
facebook.com
fb.com
```

## Formulário

```text
form
```

## Viewport

```html
<meta name="viewport">
```

---

# 27. O que NÃO inferir do site

Não afirmar automaticamente:

```text
site bonito
site feio
site moderno
site ultrapassado
UX ruim
conversão ruim
```

Isso depende de avaliação humana.

Preencher:

```text
Qualidade do site = Não sei
```

quando há site acessível.

Se não existe URL:

```text
Qualidade do site = Não tem
```

---

# 28. Tem domínio próprio?

Usar `tldts`.

Considerar que possui domínio próprio quando a URL principal não for apenas:

```text
instagram.com
facebook.com
linktr.ee
wa.me
google.com
business.site
```

Não exigir `.com.br`.

---

# 29. Mapeamento exato para a aba Leads

Aba `Leads`, cabeçalho na linha 7.

Dados a partir da linha 8.

Mapeamento:

```text
A Data de cadastro
B Empresa
C Cidade
D Segmento / o que vende
E Site / URL
F Telefone / WhatsApp
G Instagram
H Responsável / decisor
I Como encontrou

J Tem site?
K Tem domínio próprio?
L Qualidade do site
M Funciona bem no celular?
N WhatsApp fácil?
O Instagram ativo?
P Avaliações no Google

Q Anuncia no Google?
R Anuncia no Facebook/Instagram?
S Para onde o anúncio leva?
T O anúncio leva para página específica do serviço?
U Produto/serviço tem bom valor?

V Problema encontrado
W Pontuação
X Prioridade
Y Sugestão automática

Z Pacote oferecido
AA Implantação sugerida
AB Mensalidade sugerida

AC Situação comercial
AD Último contato
AE Próximo contato
AF Resultado
AG Observações
```

---

# 30. Campos que a automação PODE preencher

Preencher:

```text
A
B
C
D
E
F
G
I
J
K
L
M
N
O
P
Q
R
S
T
U
V
W
X
Y
AC
AG
```

Não preencher automaticamente:

```text
H Responsável / decisor
Z Pacote oferecido
AA Implantação sugerida
AB Mensalidade sugerida
AD Último contato
AE Próximo contato
AF Resultado
```

Esses pertencem à operação comercial humana.

---

# 31. Regras de preenchimento

## A — Data

Timestamp da descoberta.

Formato Sheets:

```text
dd/MM/yyyy
```

---

## B — Empresa

Maps:

```text
title
```

---

## C — Cidade

Maps.

Fallback:

cidade da pesquisa.

---

## D — Segmento

Nicho da aba `Busca`.

---

## E — Site

Maps website.

Se ausente:

vazio.

---

## F — Telefone

Preferir:

```text
phoneUnformatted
```

Fallback:

```text
phone
```

---

## G — Instagram

Prioridade:

1. Instagram fornecido pelo Maps/Actor;
2. Instagram encontrado no site;
3. vazio.

---

## I — Como encontrou

Usar:

```text
Automação / Google Maps
```

---

# 32. Presença digital

## J — Tem site?

Se Maps não possui website:

```text
Não
```

Se URL existe:

```text
Sim
```

---

## K — Tem domínio próprio?

```text
Sim / Não / Não sei
```

---

## L — Qualidade do site

Regras:

Sem URL:

```text
Não tem
```

URL existe e responde:

```text
Não sei
```

URL existe e falha:

```text
Não sei
```

Não rotular automaticamente como ruim.

---

## M — Funciona bem no celular?

MVP:

```text
Não sei
```

Se não possui `<meta name="viewport">`:

pode preencher:

```text
Não
```

mas registrar evidência.

Não afirmar `Sim` somente pela existência de viewport.

---

## N — WhatsApp fácil?

Se link WhatsApp encontrado no site:

```text
Sim
```

Se site acessível e nenhum link encontrado:

```text
Não
```

Sem site:

```text
Não sei
```

Não presumir que telefone do Maps é WhatsApp.

---

## O — Instagram ativo?

A presença do perfil NÃO prova atividade.

No MVP:

```text
Não sei
```

Mesmo quando o perfil foi localizado.

V1.1 poderá enriquecer.

---

## P — Avaliações no Google

Maps:

```text
reviewsCount
```

Fallback:

0 somente se o Actor explicitamente retornar 0.

Se campo ausente:

deixar vazio.

---

# 33. Publicidade

## Q — Anuncia no Google?

Se Maps retornar:

```text
isAdvertisement = true
```

usar:

```text
Sim
```

Caso contrário:

```text
Não sei
```

NUNCA:

```text
false -> Não
```

porque a ausência de anúncio naquele resultado não prova que a empresa não anuncia.

---

## R — Anuncia no Facebook/Instagram?

MVP:

```text
Não sei
```

---

## S — Para onde o anúncio leva?

MVP:

```text
Não sei
```

a menos que o resultado forneça evidência direta inequívoca.

---

## T — O anúncio leva para página específica?

MVP:

```text
Não sei
```

---

## U — Produto/serviço tem bom valor?

Ler da aba Busca:

```text
Sim / Não / Não sei
```

---

# 34. Problema encontrado

Gerar somente frases baseadas em fatos.

Ordem de regras:

## Caso 1

Google Ads confirmado + sem site:

```text
"Encontrado como anúncio no Google Maps e não possui site informado no perfil."
```

## Caso 2

50+ avaliações + sem site:

```text
"Empresa com {reviews} avaliações no Google, mas sem site informado no perfil."
```

## Caso 3

site + sem WhatsApp visível:

```text
"Possui site, mas nenhum acesso direto ao WhatsApp foi encontrado na página inicial."
```

## Caso 4

site sem viewport:

```text
"A página inicial não possui meta viewport detectável, indicando necessidade de revisão mobile."
```

## Caso 5

sem evidência suficientemente forte:

```text
"Revisar presença digital manualmente."
```

Não gerar opinião estética.

---

# 35. Score

Usar pesos atuais da planilha.

Preferencialmente ler a aba `Configuração`.

Se leitura falhar, usar fallback:

```ts
const DEFAULT_WEIGHTS = {
  googleAds: 4,
  metaAds: 2,
  adNotSpecific: 2,
  badOrMissingSite: 2,
  reviews50Plus: 2,
  instagramActive: 1,
  whatsappAvailable: 1,
  highValueProduct: 2,
};
```

Score:

```text
Google Ads = Sim                     +4
Facebook/Instagram Ads = Sim        +2
Anúncio não específico = Não        +2
Site ruim ou inexistente            +2
50+ avaliações                      +2
Instagram ativo = Sim               +1
WhatsApp fácil = Sim                +1
Produto tem bom valor = Sim         +2
```

IMPORTANTE:

No MVP:

```text
site ruim
```

não pode ser inferido.

Somente:

```text
site inexistente
```

ativa esse peso automaticamente.

---

# 36. Prioridade

Ler `Configuração`.

Fallback:

```text
13+ PRIORIDADE
9–12 ALTO
6–8 MÉDIO
0–5 BAIXO
```

Não falsificar pontuação para encher a fila.

---

# 37. Sugestão automática

Regras simples:

## Se sem site e Google Ads = Sim

```text
Captação
```

A lógica é:

uma landing pode resolver o destino do anúncio.

Não assumir que precisa de site institucional completo.

## Se sem site e Google Ads != Sim

```text
Presença
```

## Se possui site e anúncios confirmados

```text
Captação
```

## Se possui site, mas evidência forte de problema institucional + captação

MVP:

```text
Avaliar
```

Não sugerir `Presença + Captação` sem revisão humana.

---

# 38. Aba Evidências

Cada informação importante gera registro:

```text
Place ID
Empresa
Campo
Valor encontrado
Fonte
URL da fonte
Verificado em
Confiança
Observação
```

Exemplos:

```text
ChIJ...
Empresa X
Avaliações no Google
186
Google Maps / Apify
https://www.google.com/maps/...
23/09/2026
Alta
reviewsCount
```

```text
ChIJ...
Empresa X
WhatsApp fácil
Não
Site
https://empresax.com.br
23/09/2026
Alta
Nenhum link wa.me/api.whatsapp.com encontrado na homepage
```

---

# 39. Evidência obrigatória

Gerar evidência para:

- website;
- telefone;
- reviewsCount;
- Google Ads quando Sim;
- WhatsApp fácil;
- Instagram encontrado;
- domínio;
- ausência de site;
- problema gerado.

Se o campo não possui evidência:

não afirmar.

---

# 40. Aba Automação

Usar:

```text
Place ID
Hash dedupe
Empresa
Nicho
Cidade
Consulta
Primeira vez visto
Última vez visto
Site verificado em
Google Ads verificado em
Meta Ads verificado em
Apify Run ID
Versão automação
Status interno
```

Status:

```text
NOVO
ATUALIZADO
IGNORADO
DUPLICADO
ERRO
```

---

# 41. Google Sheets API

Usar pacote:

```text
googleapis
```

Autorização:

```ts
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets"
  ],
});
```

---

# 42. Não sobrescrever fórmulas comerciais

A planilha possui lógica manual nas colunas:

```text
Z:AB
```

Não atualizar essas colunas na inserção.

Utilizar `spreadsheets.values.batchUpdate`.

Gravar:

```text
A:Y
```

e:

```text
AC:AG
```

em requests separados.

Não tocar:

```text
Z
AA
AB
```

---

# 43. Busca da próxima linha

Não usar `append` indiscriminadamente porque pode interferir em fórmulas e formatação.

Encontrar a primeira linha com:

```text
B == vazio
```

a partir da linha 8.

Usar slots existentes.

Se não houver slot livre:

o comando deve:

1. inserir novas linhas;
2. copiar formatação/validações da última linha template;
3. garantir fórmulas necessárias em Z:AB;
4. prosseguir.

Implementar isso em função isolada:

```ts
ensureLeadCapacity()
```

---

# 44. Limite de novos leads

Mesmo que 80 empresas sejam coletadas:

ordenar candidatos antes de escrever.

Ordenação:

1. score desc;
2. reviews desc;
3. rating desc.

Depois:

```text
slice(0, MAX_NEW_LEADS_PER_RUN)
```

Default:

```text
30
```

O restante pode ser registrado apenas em `Automação` como encontrado, ou ignorado.

Não encher a aba Leads com baixa prioridade.

---

# 45. Site concorrência / HTTP

Usar `p-limit`.

Default:

```text
WEBSITE_CONCURRENCY=5
```

Não fazer 100 requests simultâneas.

Retry:

```text
máximo 2 tentativas
```

Somente para erros de rede / 5xx.

Não retry em:

```text
404
403
```

---

# 46. User-Agent

Utilizar:

```text
MaginaProspector/1.0 (+https://maginalabs.netlify.app/)
```

Não fingir ser Chrome.

---

# 47. Robots / limites

Website enrichment acessa apenas homepage pública.

Não:

- efetuar login;
- burlar CAPTCHA;
- tentar contornar bloqueios;
- navegar páginas privadas;
- coletar informação pessoal não publicada comercialmente.

Se receber 403/429:

registrar:

```text
site inspection unavailable
```

e seguir.

---

# 48. Informações pessoais

Foco:

- empresa;
- telefone comercial;
- site;
- redes comerciais.

Não realizar enriquecimento de dados pessoais de funcionários no MVP.

Campo:

```text
Responsável / decisor
```

continua manual.

---

# 49. Logs

Criar logger simples.

Por execução:

```text
runId
startedAt
searchesSelected
rawBusinesses
duplicates
websiteInspections
newLeads
updatedRecords
errors
duration
```

Não imprimir secrets.

Não imprimir JSON da service account.

---

# 50. Run summary

No final do GitHub Actions, escrever em:

```text
$GITHUB_STEP_SUMMARY
```

Exemplo:

```md
# Magina Prospector

- Pesquisas: 4
- Resultados brutos: 73
- Duplicados: 29
- Novos candidatos: 44
- Inseridos na planilha: 25
- PRIORIDADE: 2
- ALTO: 8
- MÉDIO: 13
- BAIXO: 2
- Erros: 1
```

Adicionar TOP 10:

```text
Empresa | Cidade | Score | Problema
```

---

# 51. Artefato da execução

Salvar JSON:

```text
data/run-result.json
```

Upload via:

```yaml
actions/upload-artifact
```

Nome:

```text
prospector-${{ github.run_id }}
```

Retenção curta.

Não commitar resultados no Git automaticamente.

---

# 52. GitHub Actions

Arquivo:

```text
.github/workflows/prospect.yml
```

Implementar:

```yaml
name: Prospectar clientes

on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: "Executar sem escrever na planilha?"
        required: false
        default: "false"
      max_new_leads:
        description: "Limite de novos leads"
        required: false
        default: "30"

  schedule:
    - cron: "17 8 * * 1"
      timezone: "America/Sao_Paulo"
    - cron: "17 8 * * 4"
      timezone: "America/Sao_Paulo"

concurrency:
  group: magina-prospector
  cancel-in-progress: false

jobs:
  prospect:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - run: npm run typecheck

      - run: npm test

      - name: Prospect
        env:
          APIFY_TOKEN: ${{ secrets.APIFY_TOKEN }}
          GOOGLE_SHEET_ID: ${{ secrets.GOOGLE_SHEET_ID }}
          GOOGLE_SERVICE_ACCOUNT_JSON: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_JSON }}
          MAX_NEW_LEADS_PER_RUN: ${{ inputs.max_new_leads || '30' }}
        run: |
          if [ "${{ inputs.dry_run }}" = "true" ]; then
            npm run prospect -- --dry-run
          else
            npm run prospect
          fi

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: prospector-${{ github.run_id }}
          path: data/run-result.json
          retention-days: 14
```

Se sintaxe de timezone de GitHub Actions tiver mudado, validar contra documentação atual antes do commit.

---

# 53. Por que 08:17?

Evitar o início exato da hora.

GitHub pode ter maior carga no início de cada hora.

Horário exato não é crítico.

---

# 54. CLI

Comandos:

```bash
npm run prospect
```

Execução normal.

```bash
npm run dry-run
```

Não escreve.

```bash
npm run prospect -- --city Campinas --niche "Móveis planejados"
```

Override manual.

```bash
npm run prospect -- --max-new-leads 10
```

---

# 55. workflow_dispatch

Permitir rodar manualmente pelo GitHub.

Isso é importante para:

- testar nova cidade;
- prospectar quando houver tempo;
- validar configuração;
- aumentar temporariamente volume.

---

# 56. dry-run

Obrigatório.

Dry run:

- chama Apify;
- deduplica;
- analisa sites;
- calcula score;
- gera run-result.json;
- NÃO escreve no Sheets.

Exibir preview dos 20 melhores.

---

# 57. Testes

## scoring

Testar:

- Google Ads Sim;
- Google Ads Não sei;
- site inexistente;
- 50 avaliações;
- WhatsApp;
- high ticket;
- combinação.

---

## dedupe

Testar:

- mesmo placeId;
- placeIds diferentes;
- fallback nome + telefone + cidade;
- acentos;
- telefone formatado.

---

## website

Fixtures HTML:

1. WhatsApp;
2. sem WhatsApp;
3. Instagram;
4. form;
5. sem viewport;
6. página vazia.

Não depender de internet nos unit tests.

---

## Google Maps mapper

Fixture JSON semelhante ao Actor.

Campos ausentes não podem quebrar execução.

---

# 58. Fail-fast e fail-soft

Falhar execução inteira se:

- APIFY_TOKEN ausente;
- Sheet ID ausente;
- credencial Google inválida;
- abas essenciais não podem ser lidas.

Não falhar execução inteira por:

- um site fora do ar;
- uma empresa com dado estranho;
- um resultado inválido.

Registrar e continuar.

---

# 59. Idempotência

Rodar o job duas vezes seguidas não deve duplicar leads.

Critério de aceite:

```text
run 1 -> 25 novos
run 2 imediato -> 0 duplicados inseridos
```

---

# 60. V1.1 — Google Ads Transparency

NÃO implementar no primeiro commit.

Preparar interface:

```ts
interface AdsChecker {
  check(input: Prospect): Promise<AdsEvidence>;
}
```

Feature flag:

```text
ENABLE_GOOGLE_ADS_ENRICHMENT=false
```

Candidato futuro:

```text
automation-lab/google-ads-transparency-center-scraper
```

ou outro Actor selecionado após teste.

Só rodar para:

```text
top 10–15 candidatos
```

por execução.

Quando comprovado:

```text
Q Anuncia no Google? = Sim
```

e criar evidência.

Nunca colocar `Não` só porque o scraper não encontrou.

Resultado negativo:

```text
Não sei
```

---

# 61. V1.1 — Meta Ads

Mesmo princípio.

Interface:

```ts
interface MetaAdsChecker
```

Feature flag:

```text
ENABLE_META_ADS_ENRICHMENT=false
```

Só executar para empresas com:

- Facebook/Instagram encontrado;
- score preliminar relevante.

Resultado positivo:

```text
R = Sim
```

Resultado negativo:

```text
R = Não sei
```

---

# 62. V1.2 — análise visual/manual

Não usar browser em lote.

Criar comando futuro:

```bash
npm run review-top
```

que gera JSON dos TOP leads contendo:

- empresa;
- site;
- Maps;
- Instagram;
- score;
- evidências.

Esse JSON pode ser enviado ao Codex/ChatGPT para análise manual.

---

# 63. Codex + MCP depois do MVP

O código deve ser a fonte de verdade.

MCP apenas chama capacidades.

Possível segunda etapa:

```text
search_prospects
inspect_prospect
list_top_prospects
sync_sheet
```

Não construir MCP customizado agora.

Primeiro provar que o pipeline encontra leads úteis.

---

# 64. README

README deve conter:

## Setup local

```bash
npm install
cp .env.example .env
npm run validate-sheet
npm run dry-run
```

## Setup Apify

Passos.

## Setup Google service account

Passos.

## Setup GitHub Secrets

Passos.

## Execução manual

Passos.

## Troubleshooting

- 403 Sheets;
- Apify credit exhausted;
- aba faltando;
- site timeout.

---

# 65. AGENTS.md

Criar:

```md
# Magina Prospector

Este repositório automatiza descoberta e qualificação inicial de prospects.

Regras:
- não invente dados;
- fatos precisam de evidência;
- "Não sei" é resposta válida;
- não automatize envio de mensagens;
- não adicione OpenAI API ao MVP;
- não use Playwright sem necessidade;
- não altere preços comerciais;
- preserve a estrutura da planilha;
- idempotência é obrigatória;
- service account e APIFY_TOKEN nunca vão para o Git.
```

Adicionar:

```md
Quando precisar trabalhar com Apify manualmente, use o MCP Apify configurado no Codex se estiver disponível.
```

---

# 66. Critérios de aceite — MVP

## Setup

- [ ] `.env.example`;
- [ ] Google auth funcional;
- [ ] Apify auth funcional;
- [ ] aba Busca lida;
- [ ] dry-run funciona.

## Descoberta

- [ ] Actor roda;
- [ ] empresas retornam;
- [ ] encerradas são removidas;
- [ ] Maps URL preservada;
- [ ] placeId preservado.

## Deduplicação

- [ ] placeId;
- [ ] fallback;
- [ ] duas execuções não duplicam.

## Website

- [ ] timeout;
- [ ] redirects;
- [ ] WhatsApp;
- [ ] Instagram;
- [ ] viewport;
- [ ] form;
- [ ] falha não derruba job.

## Score

- [ ] somente evidência;
- [ ] `Não sei` não pontua;
- [ ] score reproduzível;
- [ ] prioridade correta.

## Sheets

- [ ] Leads escritos;
- [ ] Evidências escritas;
- [ ] Automação escrita;
- [ ] não altera Z:AB;
- [ ] não sobrescreve contato humano;
- [ ] não apaga linhas.

## Actions

- [ ] manual;
- [ ] schedule;
- [ ] summary;
- [ ] artifact;
- [ ] secrets não vazam.

---

# 67. Definição de pronto

O MVP está pronto quando:

```text
1. Uma linha "Móveis planejados / Campinas" está ativa em Busca
2. workflow é executado
3. Apify coleta empresas
4. empresas repetidas são eliminadas
5. sites são inspecionados
6. score é calculado
7. os melhores prospects entram em Leads
8. cada afirmação relevante possui registro em Evidências
9. Place IDs aparecem em Automação
10. segunda execução não duplica empresas
11. GitHub Summary mostra os TOP prospects
```

---

# 68. Resultado esperado para Gustavo

Ao abrir a planilha depois da automação:

```text
Empresa A
Campinas
Móveis planejados
site.com.br
(19) ...
Instagram
87 avaliações
WhatsApp fácil: Não
Google Ads: Não sei
Score: 7
Prioridade: MÉDIO
Problema:
"Possui site, mas nenhum acesso direto ao WhatsApp foi encontrado na página inicial."
```

ou:

```text
Empresa B
Campinas
Uniformes
Sem site
214 avaliações
Google Ads: Sim
Score: 10+
Prioridade: ALTO
Problema:
"Encontrado como anúncio no Google Maps e não possui site informado no perfil."
```

Gustavo abre apenas os melhores.

A automação não vende.

Ela elimina o trabalho de descobrir quem merece ser abordado.

---

# 69. Prompt final para o Codex

Copiar exatamente o texto abaixo ao iniciar a implementação.

---

Você está implementando o projeto **Magina Prospector**.

Leia integralmente o arquivo `PRP-Magina-Prospector.md` antes de modificar qualquer arquivo.

Seu objetivo é construir um pipeline de prospecção B2B em TypeScript que:

1. rode localmente e pelo GitHub Actions;
2. leia a configuração de nichos/cidades da aba `Busca` de uma Google Sheet;
3. use o Apify Actor `compass/crawler-google-places` para encontrar empresas reais;
4. normalize os resultados;
5. elimine empresas duplicadas por `placeId`, com fallback seguro;
6. faça enriquecimento HTTP simples da homepage das empresas;
7. identifique apenas fatos verificáveis;
8. gere evidências;
9. calcule score comercial determinístico;
10. escreva somente os melhores novos leads na aba `Leads`;
11. escreva as fontes na aba `Evidências`;
12. mantenha controle técnico na aba `Automação`;
13. seja idempotente;
14. tenha modo `--dry-run`;
15. gere resumo no GitHub Actions.

## Restrições

NÃO:

- use OpenAI API;
- use Clay;
- use Playwright/Puppeteer no MVP;
- crie interface React;
- crie banco de dados;
- use Supabase;
- envie WhatsApp/e-mail automaticamente;
- invente se uma empresa anuncia;
- classifique design como "ruim" por opinião;
- sobrescreva dados comerciais humanos;
- exponha secrets;
- altere preços da Magina Labs.

Use:

- Node 22;
- TypeScript;
- Apify Client;
- Google Sheets API;
- Cheerio;
- Zod;
- tldts;
- p-limit;
- Vitest.

## Antes de implementar

1. inspecione o repositório;
2. confira se a planilha atual segue o schema descrito no PRP;
3. consulte a documentação atual do Actor `compass/crawler-google-places`;
4. confirme input schema atual;
5. escreva um plano curto;
6. só então implemente.

## Ordem obrigatória

1. setup TypeScript;
2. env validation;
3. Google Sheets client;
4. `validate-sheet`;
5. `bootstrap-sheet`;
6. Apify provider;
7. mapper;
8. deduplicação;
9. website inspection;
10. evidências;
11. score;
12. escrita em Sheets;
13. dry-run;
14. GitHub Actions;
15. testes;
16. README;
17. AGENTS.md.

## Teste real final

Execute primeiro em dry-run com:

```text
nicho = Móveis planejados
cidade = Campinas
max = 10
```

Confira manualmente pelo menos 3 resultados.

Depois execute escrita real com limite:

```text
MAX_NEW_LEADS_PER_RUN=5
```

Valide a planilha.

Em seguida execute novamente.

A segunda execução não pode inserir os mesmos cinco leads.

## Antes de finalizar

Executar:

```bash
npm run lint
npm run typecheck
npm test
npm run validate-sheet
```

Se possível, rodar um dry-run final.

Não considere a tarefa concluída com testes quebrados ou TODOs no fluxo principal.

No final, entregue:

- arquivos criados;
- comandos executados;
- resultado dos testes;
- secrets que o usuário ainda precisa configurar;
- passos manuais restantes;
- qualquer diferença entre o PRP e a implementação, com justificativa.

---

# Override de implementação — descoberta e revisão por vencimento

Este override substitui a ordenação estática da seção 16 para seleção de buscas. Ele preserva os demais limites e critérios do PRP.

| ID | Requisito | Estado |
|---|---|---|
| ROT-1 | Prioridade 1, 2 e 3 corresponde a intervalos de 60, 90 e 120 dias. | verified |
| ROT-2 | Todas as buscas ativas nunca executadas vêm primeiro, em ordem de linha; prioridade não antecipa revisão. | verified |
| ROT-3 | Depois da fila de nunca executadas, selecionar apenas buscas vencidas e ordenar pela maior defasagem de `Próxima execução`. | verified |
| ROT-4 | Persistir `Última execução` e `Próxima execução` por linha na aba `Busca`; o bootstrap pode importar uma vez o último horário disponível em `Automação`, mas depois a própria linha é a fonte do agendamento. | verified: colunas migradas, buscas executadas e datas gravadas na planilha |
| ROT-5 | Se não houver busca nunca executada ou vencida, encerrar sem chamada paga ao Apify. | verified |
| ROT-6 | Campo `Última execução` vazio torna a busca elegível como nunca executada; bootstrap não restaura histórico após a migração inicial. | verified |
| ROT-7 | Preservar deduplicação por Place ID, processamento pendente, filtros CLI, dry-run e execução manual do GitHub Actions. | verified |
| ROT-8 | Respeitar o limite de pesquisas por execução e o máximo de resultados configurado em cada linha. | verified |
| ROT-9 | Testar intervalos, datas, ordem de nunca executadas, defasagem, fila vazia e reset manual. | verified: 32 testes passaram; planilha recalculada com os novos intervalos |

## Override de implementação — revisitas mais espaçadas

Este override substitui os intervalos semanais do override anterior. O workflow segue agendado às segundas-feiras às 08:00 de São Paulo; uma execução manual adicional pode ser iniciada pelo operador.
