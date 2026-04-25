# Production Guard — CLAUDE.md

Sistema industrial de impressão de etiquetas e controle de produção. A UI é inteiramente em **português do Brasil**.

---

## Gerenciador de Pacotes

**Use sempre `npm`.** Nunca use bun, yarn ou pnpm.

---

## Comandos de Desenvolvimento

```bash
# Desenvolvimento completo (frontend + backend)
npm run dev:all

# Somente frontend (sem backend)
npm run dev

# Somente backend
npm run backend:dev

# Build de produção
npm run build

# Tauri (desktop)
npm run tauri:dev      # modo desenvolvimento com hot reload
npm run tauri:build    # build final do instalador

# Testes
npm test               # Vitest (run)
npm run test:watch     # Vitest (watch)
npm run lint           # ESLint
```

---

## Arquitetura

```
production-guard/
├── src/                      # React frontend
│   ├── components/
│   │   ├── ui/               # shadcn/ui — NÃO EDITAR
│   │   ├── AppLayout.tsx     # layout com sidebar + useSseUpdates()
│   │   ├── AppSidebar.tsx    # nav role-based + logout
│   │   └── LabelPreview.tsx  # prévia das etiquetas (produto e caixa)
│   ├── pages/
│   │   ├── SplashScreen.tsx  # tela de carregamento inicial
│   │   ├── ModeSelect.tsx    # seleção Admin / Operador
│   │   ├── OperatorSetup.tsx # configuração de IP do servidor (1ª vez)
│   │   ├── LoginPage.tsx     # login username/senha
│   │   ├── WorkstationSelect.tsx  # seleção de bancada (operador)
│   │   ├── Dashboard.tsx
│   │   ├── Workstation.tsx
│   │   ├── ImportPage.tsx
│   │   ├── Supervisor.tsx
│   │   ├── AdminPage.tsx
│   │   └── NotFound.tsx
│   ├── store/
│   │   ├── authStore.ts      # Zustand persisted: mode, user, token, serverUrl, workstationId
│   │   └── productionStore.ts  # wrapper legado → delega para authStore
│   ├── hooks/
│   │   └── useProductionData.ts  # todos os React Query hooks + useSseUpdates()
│   └── lib/
│       ├── api.ts            # cliente HTTP — lê serverUrl do authStore dinamicamente
│       └── utils.ts          # cn()
├── backend/                  # Node.js Express + SQLite
│   └── src/
│       ├── index.ts          # Express (porta 3001, bind 0.0.0.0)
│       ├── db.ts             # better-sqlite3 + schema + nextLabelSeqId() + hashPassword()
│       ├── sse.ts            # Server-Sent Events — broadcast() + getConnectedClients()
│       └── routes/
│           ├── auth.ts       # POST /auth/login, POST /auth/logout, GET /auth/me
│           ├── users.ts      # CRUD /users (admin only)
│           ├── admin.ts      # GET /admin/network-info, /connected-clients, backup, export
│           ├── shipments.ts
│           ├── partNumbers.ts
│           ├── reservations.ts
│           ├── labels.ts
│           ├── workstations.ts
│           └── divergences.ts
├── src-tauri/                # Tauri v2 (Rust wrapper)
│   ├── src/
│   │   ├── main.rs           # entry point
│   │   └── lib.rs            # comando list_printers via wmic
│   └── tauri.conf.json
└── .env                      # VITE_API_URL=https://production-guard-2.onrender.com/api
```

---

## Fluxo de Telas (App.tsx)

O `App.tsx` implementa uma máquina de estados de tela:

```
splash → mode-select → [operator-setup] → login → [workstation-select] → app
```

- **splash**: `SplashScreen` (6 steps, ~2s), verifica token salvo via `api.me()`
- **mode-select**: `ModeSelect` — Admin ou Operador
- **operator-setup**: `OperatorSetup` — só se modo=operador e serverUrl vazio
- **login**: `LoginPage`
- **workstation-select**: `WorkstationSelect` — só para operadores
- **app**: `AppLayout` com rotas protegidas por role

### Permissões por Role

| Rota | admin | supervisor | operador |
|---|---|---|---|
| `/` Dashboard | ✅ | ✅ | ✅ (filtrado à bancada) |
| `/workstation` Bancada | ✅ | ✅ | ✅ |
| `/import` Importar | ✅ | ✅ | ❌ |
| `/supervisor` Supervisor | ✅ | ✅ | ❌ |
| `/admin` Admin | ✅ | ❌ | ❌ |

---

## Autenticação

- **Token**: UUID gerado no backend, armazenado em `sessions` (SQLite), expira em 24h
- **Hash de senha**: SHA256 via `crypto` nativo do Node
- **authStore** (Zustand persisted — `pg-auth` key):
  - `mode`: `'admin' | 'operador' | null`
  - `user`: `AppUser | null`
  - `token`: `string | null` (não persiste — re-validado via `api.me()` no splash)
  - `serverUrl`: `string` (persiste — URL base da API)
  - `workstationId`: `number | null`
- **api.ts**: lê `useAuthStore.getState().serverUrl` em toda chamada (dinâmico)
- **Bearer token**: adicionado em todos os headers via `getHeaders()`
- **Downloads** (backup/export): token passado como `?_token=` na query string
  - Backend middleware aceita `Authorization: Bearer` **ou** `?_token=`

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + Vite (SWC) |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS 3 + shadcn/ui |
| Estado UI | Zustand 5 (mode, user, token, serverUrl, workstationId) |
| Estado servidor | TanStack React Query v5 |
| Formulários | React Hook Form + Zod |
| Roteamento | React Router DOM v6 |
| Backend | Express + better-sqlite3 |
| Tempo real | Server-Sent Events (SSE) — `/api/sse` |
| Desktop | Tauri v2 (impressoras via `list_printers` command) |
| Testes unitários | Vitest + Testing Library |
| Testes E2E | Playwright |

---

## Lógica de Etiquetas (IMPORTANTE)

**1 etiqueta = 1 lote físico com uma quantidade específica.**

Existem dois tipos (`labelType`):
- `'normal'` — Etiqueta de Produto (vinculada a um part number de remessa)
- `'caixa'` — Etiqueta de Caixa (entrada livre, sem vínculo com remessa)

Exemplo com REMESSA = 10.000 (tipo normal):
- Etiqueta 1: qty=1.000 → FÍSICO=1.000, DIFERENÇA=-9.000
- Etiqueta 2: qty=1.000 → FÍSICO=2.000, DIFERENÇA=-8.000
- ...
- Etiqueta 10: qty=1.000 → FÍSICO=10.000, DIFERENÇA=0 → concluído

### ID da Etiqueta
- **12 dígitos numéricos** sequenciais globais (ex: `000000000001`)
- Gerado atomicamente: `UPDATE label_sequence SET last_value = last_value + 1 RETURNING last_value`
- Armazenado em `labels.label_seq_id`
- Nunca se repete, mesmo entre bancadas

---

## Hooks React Query (`src/hooks/useProductionData.ts`)

```ts
// Auth
useLogin()              → POST /api/auth/login
useLogout()             → POST /api/auth/logout

// Users (admin)
useUsers()              → GET  /api/users
useCreateUser()         → POST /api/users
useUpdateUser()         → PATCH /api/users/:id
useDeleteUser()         → DELETE /api/users/:id

// Admin
useNetworkInfo()        → GET  /api/admin/network-info
useConnectedClients()   → GET  /api/admin/connected-clients
useRestoreBackup()      → POST /api/admin/restore

// Shipments
useShipments()          → GET  /api/shipments
useCreateShipment()     → POST /api/shipments

// Part Numbers
usePartNumbers()        → GET  /api/part-numbers
useAuthorizeSurplus()   → POST /api/part-numbers/:id/authorize-surplus

// Reservations
useReservations()       → GET  /api/reservations
useCreateReservation()  → POST /api/reservations

// Labels
useLabels()             → GET  /api/labels
useCreateLabel()        → POST /api/labels
useDeleteLabel()        → DELETE /api/labels/:id
useReprintLabel()       → POST /api/labels/:id/reprint

// Workstations
useWorkstations()       → GET  /api/workstations
useUpdateWorkstation()  → PATCH /api/workstations/:id

// Divergences
useDivergences()        → GET  /api/divergences
useFinalizePartNumber() → POST /api/divergences/finalize/:id

// SSE (real-time sync)
useSseUpdates()         → EventSource /api/sse  (usado no AppLayout)
```

---

## SSE (Server-Sent Events)

- Endpoint: `GET /api/sse?workstationId=N` (token via query `?_token=`)
- Heartbeat: `:heartbeat` a cada 30s
- Eventos emitidos pelo backend:
  - `labels:created` → invalida `['labels', 'part-numbers']`
  - `labels:deleted` → invalida `['labels', 'part-numbers']`
  - `part-numbers:updated` → invalida `['part-numbers']`
  - `shipments:created` → invalida `['shipments', 'part-numbers']`
- `useSseUpdates()` é chamado dentro de `AppLayout` (ativo enquanto o app estiver aberto)

---

## Backend (`backend/src/`)

- Porta: **3001** (bind `0.0.0.0` — acessível na rede local)
- CORS: `{ origin: true, credentials: true }` — aceita qualquer origem local
- SQLite em `~/.production-guard/data.db`
- Auth middleware: **soft** — anexa `req.user` se token válido (não bloqueia rotas por padrão)
  - Aceita `Authorization: Bearer <token>` **ou** `?_token=<token>` (para downloads)
- Credenciais padrão (primeira inicialização): `admin` / `admin123`

### Rotas

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

GET|POST|PATCH|DELETE /api/users        (admin)

GET  /api/admin/network-info            (admin)
GET  /api/admin/connected-clients       (admin)
GET  /api/admin/backup                  (admin — download JSON)
POST /api/admin/restore                 (admin — upload JSON)
GET  /api/admin/export/excel            (admin — download xlsx)

GET|POST /api/shipments
GET      /api/part-numbers
POST     /api/part-numbers/:id/authorize-surplus
GET|POST /api/reservations
GET|POST|DELETE /api/labels
POST     /api/labels/:id/reprint
GET|PATCH /api/workstations
GET      /api/divergences
POST     /api/divergences/finalize/:id

GET /api/sse
GET /api/health
```

---

## Banco de Dados (SQLite)

Schema em `backend/src/db.ts`. Tabelas:

| Tabela | Descrição |
|---|---|
| `users` | usuários do sistema (id, username, password hash, role, is_blocked) |
| `sessions` | tokens de sessão (expires_at em 24h) |
| `label_sequence` | contador global de ID de etiqueta (1 linha) |
| `shipments` | remessas importadas |
| `part_numbers` | part numbers por remessa |
| `reservations` | reservas de lote por bancada |
| `labels` | etiquetas geradas (label_seq_id, msl, expiry_date, label_type) |
| `print_jobs` | jobs de impressão |
| `workstations` | bancadas (4 padrão) |
| `divergences` | divergências ao finalizar PN |
| `quality_checks` | validações por QR code |

---

## Tauri (Impressoras)

`src-tauri/src/lib.rs` expõe o comando `list_printers`:
- Executa `wmic printer get name /format:list` via `std::process::Command`
- Retorna `Vec<String>` com nomes das impressoras instaladas
- Frontend usa `invoke('list_printers')` com try/catch (fallback: IP da bancada)

---

## Etiquetas — Estrutura Visual

Ambas as etiquetas têm 420px de largura, fundo branco, borda preta, cabeçalho **grupoMultilaser**, QR codes simulados e faixa amarela de aviso.

### Etiqueta de Produto (`labelType: 'normal'`)
- Linha 1: QR | PN + Descrição | QR
- Linha 2: Data Venc / MSL | Quantidade + ID (12 dígitos) | QR + Processo
- Faixa amarela: `⚠ ATENÇÃO: COMPONENTE SENSÍVEL À DESCARGA ELETROSTÁTICA`

### Etiqueta de Caixa (`labelType: 'caixa'`)
- Header: PRODUTO: / Part Number: / QTD:
- Linha central: QR | PN + Descrição | QR
- Linha inferior: Quantidade | MSL | PROCESSO

---

## Importação de Remessas (ImportPage)

- Upload de arquivo Excel (`.xlsx`, `.xls`) via drag/drop ou clique
- Parse no frontend com `import('xlsx')` (dinâmico)
- Suporte a CSV (vírgula / ponto-e-vírgula / tab)
- Colunas esperadas: `part_number` (ou PN/Código), `description` (ou Descrição), `declared_qty` (ou Quantidade)
- Tabela de remessas com busca por nome/código

---

## Estilização

- **Apenas Tailwind CSS** — sem `style={}` inline
- Tokens semânticos:

| Token | Uso |
|---|---|
| `bg-success` / `text-success` | OK / concluído / online |
| `bg-warning` / `text-warning` | atenção / pendente / sobra |
| `bg-destructive` / `text-destructive` | erro / falta / offline |
| `bg-info` | informação |
| `bg-processing` | em processamento |
| `bg-primary` | ações principais |
| `bg-muted` | conteúdo secundário |

---

## TypeScript

- Tipos de domínio em `src/types/production.ts`
- `PartNumberStatus`: `'pendente' | 'em_processo' | 'concluido' | 'divergente'`
- `UserRole`: `'operador' | 'supervisor' | 'admin'`
- `PrintJobStatus`: `'queued' | 'printing' | 'printed' | 'failed' | 'cancelled'`
- `ReservationStatus`: `'pendente' | 'consumido' | 'cancelado'`
- `Label` tem campos: `quantity`, `labelSeqId`, `msl`, `expiryDate`, `labelType`
- `AppUser`: `{ id, name, username, role }`

---

## Testes

- Unitários: Vitest + Testing Library (`*.test.ts(x)`)
- E2E: Playwright (`playwright.config.ts`)
- `npm test` — executa todos os unitários

---

## Glossário de Domínio (PT-BR)

| Termo | Significado |
|---|---|
| remessa | shipment importado |
| REMESSA | coluna = `declaredQty` |
| FÍSICO | coluna = `labeledQty` (soma das qtds de etiquetas) |
| DIFERENÇA | `labeledQty - declaredQty` (negativo=falta, positivo=sobra) |
| part number | identificador de componente/peça |
| reserva | reserva de lote para uma bancada |
| etiqueta | etiqueta física = 1 lote com N unidades |
| bancada | workstation (Bancada 1–4) |
| impressora | impressora térmica ZPL (TCP porta 9100) |
| divergência | discrepância ao finalizar PN |
| sobra | etiquetado > declarado |
| falta | etiquetado < declarado |
| MSL | Moisture Sensitivity Level |

---

## Regras Inegociáveis

1. **Planeje antes de codificar** — use Shift+Tab para entrar em modo de planejamento.
2. **Nunca edite `src/components/ui/`** — são arquivos gerados pelo shadcn/ui.
3. **Use `npm`** — nunca bun ou yarn.
4. **Siga os padrões existentes** — veja implementações similares antes de criar novas.
5. **Prefira editar arquivos existentes** a criar novos.
6. **Estado de domínio vem da API** — use React Query; Zustand só para UI local.
7. **UI em português** — todas as strings visíveis ao usuário permanecem em pt-BR.
8. **Cores semânticas** — use `success`/`warning`/`info`/`processing`/`destructive`.
9. **1 etiqueta = 1 lote** — nunca gere múltiplas etiquetas em loop; passe a qty para `createLabel`.
10. **ID de etiqueta**: 12 dígitos numéricos sequenciais globais (`label_seq_id`).
11. **Auth**: todo acesso autenticado usa `getHeaders()` de `api.ts`; downloads usam `?_token=`.
12. **SSE**: `useSseUpdates()` fica em `AppLayout` — não instancie EventSource em outros componentes.
