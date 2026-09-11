# Tribuna

Rede social de futebol: descubra partidas, avalie jogos, escreva reviews, siga pessoas, crie listas e acompanhe sua Watchlist (partidas futuras) e Diário (partidas assistidas).

## Stack

```
Vercel (Next.js 14 / App Router / TypeScript / Tailwind / shadcn-style UI / Framer Motion)
  ↓ HTTPS
Render (Node.js / Fastify / TypeScript)
  ↓
Neon (PostgreSQL / Drizzle ORM)
```

Monorepo (npm workspaces):

```
tribuna/
├── apps/
│   ├── web/     → Next.js frontend (deploy: Vercel)
│   └── api/     → Fastify backend (deploy: Render)
├── packages/
│   └── shared/  → Zod schemas + TypeScript types shared by web and api
```

## Regra fundamental do produto

- **Watchlist** = partidas futuras que o usuário quer assistir (`SCHEDULED`/`TIMED` e `dateTime > agora`). Validado no backend.
- **Diário** = partidas que o usuário já assistiu e avaliou.

## Rodando localmente

### 1. Requisitos

- Node.js 20+
- Uma conexão PostgreSQL (local ou [Neon](https://neon.tech))

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edite `apps/api/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
AUTH_SECRET=uma-string-longa-e-aleatoria
FRONTEND_URL=http://localhost:3000
PORT=4000
FOOTBALL_API_PROVIDER=mock
```

`FOOTBALL_API_PROVIDER=mock` faz o projeto funcionar 100% sem nenhuma API externa — o `MockProvider` gera times, competições, +30 partidas (passadas e futuras), eventos, estatísticas e escalações realistas.

### 4. Migrations + seed

```bash
npm run db:migrate
npm run db:seed
```

O seed cria ~11 usuários de teste (senha `password123` para todos, ex: `demo@tribuna.app`), follows, ratings, reviews, likes, watchlists e listas.

### 5. Rodar em desenvolvimento

```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

## Qualidade

```bash
npm run typecheck
npm run lint
npm run build
```

## Deploy

### 1. Neon (PostgreSQL)

1. Crie um projeto em [neon.tech](https://neon.tech).
2. Copie a connection string (`DATABASE_URL`), incluindo `?sslmode=require`.

### 2. Backend no Render

1. Novo **Web Service** apontando para `apps/api`.
2. Build command: `npm install && npm run build -w packages/shared && npm run build -w apps/api`
3. Start command: `npm run start -w apps/api`
4. Environment variables: `DATABASE_URL`, `AUTH_SECRET`, `FRONTEND_URL` (URL da Vercel), `PORT` (Render define automaticamente), `FOOTBALL_API_PROVIDER`.
5. Após o primeiro deploy, rode as migrations e o seed via Shell do Render:
   ```bash
   npm run db:migrate -w apps/api
   npm run db:seed -w apps/api
   ```

### 3. Frontend na Vercel

1. Novo projeto apontando para `apps/web` (root directory).
2. Build command: `npm run build -w apps/web` (a partir da raiz do monorepo).
3. Environment variable: `NEXT_PUBLIC_API_URL` = URL pública do serviço no Render.

### 4. CORS

O backend restringe CORS à origem definida em `FRONTEND_URL`. Atualize essa variável no Render sempre que o domínio da Vercel mudar.

### 5. Sincronização de partidas

A sincronização roda **dentro do próprio processo da API** (`apps/api/src/providers/scheduler.ts`):
uma vez no boot e depois a cada `SYNC_INTERVAL_MINUTES` (padrão: 10). Não é preciso configurar
cron nenhum — basta que `FOOTBALL_API_PROVIDER` seja diferente de `mock`.

Variáveis relacionadas:

| Variável | Padrão | Efeito |
| --- | --- | --- |
| `SYNC_ENABLED` | `true` | `false` desliga o agendador |
| `SYNC_INTERVAL_MINUTES` | `10` | Intervalo entre sincronizações |
| `SYNC_SECRET` | — | Se definida, libera `POST /sync/matches` com o header `x-sync-secret` |

Duas sincronizações nunca rodam em paralelo: uma chamada durante uma execução em andamento
espera pelo resultado dela.

Cada execução termina com um passo de **backfill**: partidas que já começaram, continuam sem
placar e não aparecem mais na janela que o provedor devolve (a TheSportsDB só expõe os últimos
eventos de cada liga) são buscadas uma a uma pelo id. O resultado só é gravado se o confronto
devolvido bater com o armazenado — ids se repetem entre provedores.

**Sincronização manual** (admin autenticado, ou cron externo usando `SYNC_SECRET`):

```
POST https://<seu-backend>.onrender.com/sync/matches
GET  https://<seu-backend>.onrender.com/sync/status
```

No plano gratuito do Render o serviço hiberna após um período sem tráfego, e o agendador
para junto. A sincronização de boot cobre esse caso: o primeiro acesso reacorda o processo
e os dados são atualizados na sequência. Para manter a atualização contínua de verdade, use
um plano que não hiberne ou um ping externo.

## Football providers

Abstração em `apps/api/src/providers`:

- `MockProvider` — dados realistas gerados localmente (padrão).
- `FootballDataProvider` — integra com [football-data.org](https://www.football-data.org) (`FOOTBALL_DATA_API_KEY`).
- `TheSportsDbProvider` — integra com [TheSportsDB](https://www.thesportsdb.com) (`THESPORTSDB_API_KEY`).

Todas implementam a mesma interface `FootballProvider.fetchMatches()`, normalizada antes de chegar ao banco via `syncMatchesFromProvider` (upsert idempotente por `provider + externalId`).

## Autenticação

Sessão via cookie httpOnly (`tribuna_session`), senha com hash `bcrypt`. Recuperação de senha por token com expiração de 1h — como não há provedor de e-mail configurado neste MVP, o link de redefinição é retornado diretamente na resposta da API (`/auth/forgot-password`) em vez de enviado por e-mail; trocar por um envio real de e-mail em produção é a única mudança necessária.
