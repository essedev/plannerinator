# Hub Migration: life-terminal → plannerinator

> Documento di riferimento per il porting delle sezioni Finanza e Salute da life-terminal a plannerinator, con introduzione del sistema Hub.

## Stato attuale

### life-terminal (sorgente)

- **Stack:** Python 3.12 / FastAPI / SQLAlchemy 2.0 / Jinja2 SSR / PostgreSQL
- **Sezioni:** Finanza (30 tabelle, 10 pagine, 43 AI tool) + Salute (5 tabelle, 6 pagine, 15 AI tool)
- **Auth:** Single-user, sessione semplice
- **AI:** OpenRouter, 60+ tool, streaming SSE, context caching per sezione
- **UI:** Dark "Ledger Terminal" monospace, sidebar per sezione

### plannerinator (destinazione)

- **Stack:** Next.js 16 / React 19 / Drizzle ORM / TypeScript / PostgreSQL (Neon)
- **Sezioni:** Planner (tasks, events, notes, projects, collections)
- **Auth:** Multi-user Better Auth (RBAC) — **verrà semplificato a single-user**
- **AI:** OpenRouter, 12 tool con registry pattern, Zod schema
- **UI:** shadcn/ui + Tailwind CSS v4, sidebar collapsibile

---

## Decisioni Architetturali

### 1. Single-user

L'app resta single-user, tailored. Le nuove tabelle **non** avranno `userId` — si allinea al modello life-terminal. Le tabelle esistenti di plannerinator mantengono `userId` per ora (refactor opzionale futuro).

### 2. ORM: Drizzle (riscrittura)

Tutti i modelli SQLAlchemy vengono **riscritti da zero** in Drizzle. Nessun tentativo di conversione automatica. Lo schema Drizzle di plannerinator è il riferimento per convenzioni (naming, tipi, indici).

### 3. Stile UI: plannerinator

Si mantiene lo stile attuale di plannerinator (shadcn/ui, Tailwind, tema chiaro/scuro). Nessun porting dello stile "Ledger Terminal" di life-terminal. I nuovi componenti seguono i pattern esistenti (Card, PageHeader, DataTable, ecc.).

### 4. Calcoli finanziari: precisione richiesta

I calcoli del regime Forfettario (INPS, accantonamento, coefficiente redditività) vanno portati con precisione. Servono test unitari per validare la correttezza numerica confrontando con i risultati Python.

### 5. CoinGecko: server-side (server action)

L'integrazione crypto con CoinGecko va implementata **server-side** tramite server action con caching. Motivazioni:

- Evita esporre API key al client (anche se CoinGecko free non richiede key, il rate limit è più gestibile server-side)
- Permette caching in-memory o su DB per ridurre chiamate (life-terminal usa cache 5 min)
- Coerente con il pattern server actions di plannerinator
- I dati crypto servono anche ai calcoli patrimonio lato server (dashboard, AI context)

### 6. AI Tools: completi e strutturati

Tutti i tool di life-terminal vengono portati nel registry pattern di plannerinator. Ogni tool avrà:

- Definizione Zod (schema parametri)
- `promptDocs` per il system prompt
- Handler che usa le server actions/queries del feature module
- File dedicato in `src/lib/ai/tools/definitions/`

---

## Strategia Hub

### Layout scelto: Ibrido (sidebar con section switcher)

```
AppSidebar
├── [Planner ▾] ← Hub switcher dropdown in alto
│   ├── Planner
│   ├── Finanza
│   └── Salute
├── (contenuto sidebar cambia in base alla sezione attiva)
│
│   Se Planner:          Se Finanza:           Se Salute:
│   ├── Dashboard        ├── Dashboard         ├── Dashboard
│   ├── Tasks            ├── Storico           ├── Integratori
│   ├── Events           ├── Spese Fisse       ├── Corpo
│   ├── Notes            ├── Spese Variabili   ├── Routine
│   ├── Projects         ├── Fiscale           └── Obiettivi
│   └── Collections      ├── Lavoro
│                        ├── Investimenti
│                        ├── Patrimonio
│                        └── Obiettivi
│
└── Impostazioni (cross-section, sempre visibile)
```

### Routing

```
/dashboard              → Planner (invariato, comportamento attuale)
/dashboard/tasks/*      → Planner tasks
/dashboard/events/*     → Planner events
/dashboard/notes/*      → Planner notes
/dashboard/projects/*   → Planner projects

/finanza                → Finanza dashboard
/finanza/storico        → Transazioni
/finanza/spese-fisse    → Spese fisse
/finanza/spese-variabili → Budget variabili
/finanza/fiscale        → Profilo fiscale, F24, scadenze
/finanza/lavoro         → Profilo lavoro, clienti, competenze
/finanza/investimenti   → Investimenti, crypto, pensione
/finanza/patrimonio     → Patrimonio netto
/finanza/obiettivi      → Obiettivi finanziari

/salute                 → Salute dashboard
/salute/integratori     → Protocolli e integratori
/salute/corpo           → Metriche corporee, BMI
/salute/routine         → Routine sonno/esercizio
/salute/obiettivi       → Obiettivi salute
```

Tutte le route `/finanza/*` e `/salute/*` condividono il layout dashboard (sidebar + breadcrumb + AI drawer) ma con contenuto sidebar diverso.

---

## Fasi di Implementazione

### Fase 1: Hub System ✅ COMPLETATA

**Obiettivo:** Ristrutturare il layout per supportare sezioni multiple.

- [x] Creare `src/lib/hub.ts` — tipi `HubId`, `HubConfig`, `hubConfigs`, `getActiveHub(pathname)`
- [x] Creare componente `HubSwitcher` (dropdown nella sidebar con icone per Planner/Salute/Finanza)
- [x] Modificare `AppSidebar` per renderizzare voci diverse in base alla sezione attiva (nav dinamica da `hubConfigs`)
- [x] Creare route group `(hub)` — layout condiviso `src/app/(hub)/layout.tsx` (mosso da `dashboard/layout.tsx`)
- [x] Spostare tutto `src/app/dashboard/` → `src/app/(hub)/dashboard/`
- [x] Creare `src/app/(hub)/salute/` e `src/app/(hub)/finanza/`
- [x] Aggiornare breadcrumb per supportare le nuove sezioni (salute, integratori, corpo, routine, obiettivi, finanza)
- [x] Placeholder page per finanza dashboard

### Fase 2: Salute (pilot) ✅ COMPLETATA

**Obiettivo:** Validare l'architettura hub con una sezione semplice.

#### 2a. Database ✅

- [x] Schema Drizzle: `supplementProtocol`, `supplement`, `bodyMetric`, `healthProfile`, `healthGoal`
- [x] 2 nuovi enum: `supplementFrequencyEnum`, `healthGoalStatusEnum`
- [x] Relazioni: protocollo → integratori (cascade), profilo come singleton-per-utente (unique userId)
- [x] Migration generata (`0009_tan_rocket_raccoon.sql`) e applicata
- [x] Type exports: `SupplementProtocol`, `Supplement`, `BodyMetric`, `HealthProfile`, `HealthGoal` + versioni `New*`

#### 2b. Feature Module ✅

- [x] `src/features/health/schema.ts` — Zod schemas per tutti i CRUD (protocol, supplement, metric, profile, goal)
- [x] `src/features/health/actions.ts` — 11 server actions (3 protocol + 3 supplement + 2 metric + 1 profile + 3 goal)
- [x] `src/features/health/queries.ts` — Query con filtri, paginazione, aggregazioni, routine giornaliera
- [x] `src/features/health/helpers.ts` — Calcolo BMI, trend metriche, formatting, progresso obiettivi

#### 2c. UI (8 pagine + 6 componenti client) ✅

- [x] `/salute` — Dashboard: stats card (protocolli, peso, BMI, obiettivi), quick actions, protocolli attivi, obiettivi con progresso
- [x] `/salute/integratori` — Lista protocolli con conteggio, toggle attivo/inattivo (`ProtocolToggle`)
- [x] `/salute/integratori/new` — Form creazione protocollo
- [x] `/salute/integratori/[id]` — Dettaglio protocollo con lista integratori (`SupplementRow`), form aggiunta (`AddSupplementForm`), delete (`DeleteProtocolButton`)
- [x] `/salute/corpo` — BMI display, form logging metrica (`LogMetricForm`), storico con delete (`MetricRow`)
- [x] `/salute/routine` — Routine giornaliera raggruppata per orario (mattina/pomeriggio/sera)
- [x] `/salute/obiettivi` — Lista obiettivi con progresso, stato, filtri per categoria
- [x] `/salute/obiettivi/new` — Form creazione obiettivo
- [x] `/salute/obiettivi/[id]` — Dettaglio obiettivo con progresso e azioni (`GoalActions`: completa, pausa, riattiva, elimina)

#### 2d. AI Tools (4 nuovi tool) ✅

- [x] `manage_supplement_protocol` — CRUD protocolli e integratori (7 azioni via discriminated union)
- [x] `log_body_metric` — Logging rapido metriche corporee
- [x] `manage_health_goal` — CRUD obiettivi salute (4 azioni)
- [x] `query_health_status` — Query read-only (5 aspetti: overview, supplements, metrics, goals, routine)
- [x] Registrati in `definitions/index.ts` e `registry.ts` (da 12 a 16 tool totali)
- [x] System prompt aggiornato:
  - `types.ts` — `UserStats` esteso con campi salute opzionali
  - `stats.ts` — 4 query parallele aggiuntive (protocolli, integratori, peso, obiettivi)
  - `context.ts` — Blocco `💊 SALUTE:` bilingue (IT/EN) nel contesto utente
  - `identity.ts` — Ruolo aggiornato con "monitorare salute e integratori"

#### Verifica build ✅

- [x] `pnpm typecheck` — passa
- [x] `pnpm lint` — passa (0 errori, 0 warning)
- [x] `pnpm build` — passa, 39 route corrette (tutte `/dashboard/*`, `/salute/*`, `/finanza`)
- [x] Componente `Switch` (shadcn) installato come dipendenza

### --- CHECKPOINT: Test e Validazione ---

> Fase 1 e 2 completate. Pronto per test manuale e-2-e prima di procedere con Fase 3 (Finanza).

### Fase 3: Finanza Base ✅ COMPLETATA

**Obiettivo:** Core financial tracking — transazioni, spese, budget.

#### 3a. Database ✅

- [x] Schema: `transaction`, `category`, `fixedExpenseGroup`, `fixedExpense`, `budget` (consolidato da variableBudget+item)
- [x] Schema: `bankAccount` (vehicle consolidato in financeSettings JSONB)
- [x] 15 tabelle totali + 4 enum, molte entità del piano originale consolidate via JSONB
- [x] Migration generata e applicata

#### 3b. Feature Module ✅

- [x] `src/features/finance/actions.ts` — 40+ server actions (CRUD per tutte le 15 entità)
- [x] `src/features/finance/queries.ts` — Aggregazioni mensili, trend, budget vs actual, dashboard aggregate
- [x] `src/features/finance/schema.ts` — Zod validation per tutti i CRUD + filtri
- [x] `src/features/finance/helpers.ts` — formatCurrency, normalizeToMonthly, calculateBudgetProgress, calculateForfettarioTax, calculateNetPatrimony, getMonthKey

#### 3c. UI (7 pagine + componenti client) ✅

- [x] `/finanza` — Dashboard: entrate/uscite mese, netto (color-coded), conti attivi, quick actions, obiettivi, scadenze F24
- [x] `/finanza/storico` — Transazioni con filtri (tipo, date), badge tipo/categoria, importi colorati, paginazione
- [x] `/finanza/storico/new` — Form creazione transazione (tipo, importo, data, categoria, conto, trasferimenti)
- [x] `/finanza/spese-fisse` — Gruppi con spese, totale mensile normalizzato, form inline aggiunta spese
- [x] `/finanza/spese-fisse/new` — Form creazione gruppo
- [x] `/finanza/spese-variabili` — Budget mensili con progress bar, confronto actual, form inline
- [x] `/finanza/categorie` — Gestione categorie entrate/uscite con form inline e delete

#### 3d. AI Tools (4 tool finanza base) ✅

- [x] `manage_finance_transaction` — CRUD transazioni (create, update, list, delete)
- [x] `manage_finance_account` — CRUD conti bancari (create, update, list, delete)
- [x] `manage_finance_goal` — CRUD obiettivi finanziari (create, update, list, delete)
- [x] `query_finance_status` — Query read-only (overview, accounts, budget, investments, fixed_expenses, goals)
- [x] Registrati in registry.ts, system prompt aggiornato (stats + context IT/EN)

#### Verifica build ✅

- [x] `pnpm typecheck` — passa
- [x] `pnpm lint` — passa
- [x] `pnpm build` — passa, route finanza visibili

### Fase 4: Finanza Avanzata ✅ COMPLETATA

**Obiettivo:** Fiscale, lavoro, investimenti, patrimonio, obiettivi.

#### 4a. Database ✅

- [x] Schema fiscale: `taxProfile`, `annualRevenue`, `f24Payment` (items come JSONB array, consolidato da tabelle separate)
- [x] Schema lavoro: `workProfile` (skills, specializations, workHistory, incomeTargets, planB come JSONB), `client`, `recurringInvoice`
- [x] Schema investimenti: `investment`, `cryptoHolding`, `financeSettings` (pensionFund, investmentStrategy, riskProfile, vehicles come JSONB)
- [x] Schema obiettivi: tabella unificata `goal` con `domain="finance"` (consolidato da goal, futureProject, etc.)

#### 4b. Logica Business (con test) ✅

- [x] Calcolo reddito netto Forfettario (coefficiente redditività, INPS, accantonamento) — `calculateForfettarioTax()`
- [x] Calcolo patrimonio netto (liquidità + investimenti + crypto) — `calculateNetPatrimony()`
- [x] Integrazione CoinGecko server-side con cache 5 min — `src/features/finance/coingecko.ts`
- [x] Test unitari: 35 test in `helpers.test.ts` (7 scenari Forfettario: 5%, 15%, coeff diverso, INPS minimo, zero, cap 85k, consistenza)
- [ ] Calcolo fondo emergenza (non implementato — bassa priorità, calcolabile a mano)

#### 4c. UI (7 pagine + componenti client) ✅

- [x] `/finanza/fiscale` — Profilo fiscale (form edit), simulazione Forfettario automatica, F24 da pagare/pagati con azioni (segna pagato, elimina), revenue annuali
- [x] `/finanza/lavoro` — Profilo professionale (ruolo, P.IVA, tariffe, competenze), clienti con form inline, fatture ricorrenti con totale mensile
- [x] `/finanza/investimenti` — Portfolio tradizionale + crypto, form aggiunta investimento/crypto
- [x] `/finanza/patrimonio` — Net worth breakdown (4 card totali), dettaglio conti/investimenti/crypto con prezzi live CoinGecko, fondo pensione, profilo rischio
- [x] `/finanza/obiettivi` — Goals finanziari con progress bar, status badges, CRUD completo
- [x] `/finanza/categorie` — Gestione categorie transazioni (bonus, non nel piano originale)
- [x] `/finanza` dashboard aggiornata con dati completi

#### 4d. AI Tools (finanza avanzata) ✅

- [x] `manage_finance_fiscal` — 9 azioni (view/update profilo, simulate_tax, add/list revenue, add/list/pay/delete F24)
- [x] `manage_finance_work` — 9 azioni (view/update profilo, add/update/delete/list clienti, add/delete/list fatture)
- [x] `query_finance_status` esteso con prezzi crypto live CoinGecko
- [x] `manage_finance_goal` e `manage_finance_account` per patrimonio e obiettivi
- [x] Context builder completo: `💰 FINANZA:` bilingue (IT/EN) nel system prompt con monthly income/expenses, accounts, goals, F24
- [x] Identity prompt aggiornato con ruolo finanza

#### Verifica build ✅

- [x] `pnpm typecheck` — passa
- [x] `pnpm lint` — passa (0 errori, 0 warning)
- [x] `pnpm build` — passa, 53 route totali (25 dashboard, 14 finanza, 9 salute, 5 static)
- [x] `pnpm test` — 178 test OK (35 finance + 143 esistenti)
- [x] 22 AI tool totali (12 planner + 4 salute + 6 finanza)
- [x] Hub nav finanza: 10 voci (Overview, Storico, Spese fisse, Budget, Categorie, Fiscale, Lavoro, Investimenti, Patrimonio, Obiettivi)

---

## Tabelle da Creare (riepilogo)

### Salute (5 tabelle)

| Tabella               | Tipo           | Origine                |
| --------------------- | -------------- | ---------------------- |
| `supplement_protocol` | Entità         | `supplement_protocols` |
| `supplement`          | Entità (child) | `supplements`          |
| `body_metric`         | Entità         | `body_metrics`         |
| `health_profile`      | Singleton      | `health_profile`       |
| `health_goal`         | Entità         | `health_goals`         |

### Finanza (30 tabelle)

| Tabella                | Tipo           | Origine                 |
| ---------------------- | -------------- | ----------------------- |
| `transaction`          | Entità         | `transactions`          |
| `category`             | Lookup         | `categories`            |
| `fixed_expense_group`  | Entità         | `fixed_expense_groups`  |
| `fixed_expense`        | Entità (child) | `fixed_expenses`        |
| `variable_budget`      | Entità         | `variable_budgets`      |
| `variable_budget_item` | Entità (child) | `variable_budget_items` |
| `bank_account`         | Entità         | `bank_accounts`         |
| `vehicle`              | Entità         | `vehicles`              |
| `tax_profile`          | Singleton      | `tax_profile`           |
| `annual_revenue`       | Entità         | `annual_revenue`        |
| `f24_payment`          | Entità         | `f24_payments`          |
| `f24_payment_item`     | Entità (child) | `f24_payment_items`     |
| `tax_deadline`         | Entità         | `tax_deadlines`         |
| `tax_deadline_item`    | Entità (child) | `tax_deadline_items`    |
| `work_profile`         | Singleton      | `work_profile`          |
| `work_history`         | Entità         | `work_history`          |
| `client`               | Entità         | `clients`               |
| `skill`                | Lookup         | `skills`                |
| `specialization`       | Lookup         | `specializations`       |
| `income_target`        | Entità         | `income_targets`        |
| `recurring_invoice`    | Entità         | `recurring_invoices`    |
| `plan_b`               | Singleton      | `plan_b`                |
| `plan_b_item`          | Entità (child) | `plan_b_items`          |
| `investment`           | Entità         | `investments`           |
| `crypto_holding`       | Entità         | `crypto_holdings`       |
| `pension_fund`         | Singleton      | `pension_fund`          |
| `investment_strategy`  | Singleton      | `investment_strategy`   |
| `goal`                 | Entità         | `goals`                 |
| `future_project`       | Entità         | `future_projects`       |
| `income_plan`          | Singleton      | `income_plan`           |
| `income_plan_prep`     | Entità (child) | `income_plan_prep`      |
| `risk_profile`         | Singleton      | `risk_profile`          |
| `risk_profile_factor`  | Entità (child) | `risk_profile_factors`  |
| `action_item`          | Entità         | `action_items`          |

---

## Convenzioni per il Porting

### Naming

- **Tabelle Drizzle:** camelCase (`fixedExpenseGroup`)
- **Colonne DB:** snake_case (generato da Drizzle)
- **Codice:** inglese (variabili, funzioni, tipi)
- **UI:** italiano (label, titoli, messaggi)
- **Enum values:** inglese (`short_term`, `monthly`, `active`)

### Pattern da seguire

- **Soft delete:** `deletedAt` timestamp (come plannerinator)
- **Singleton:** Unique constraint su `userId` (o `id = 1` se single-user puro)
- **Feature module:** `actions.ts` + `queries.ts` + `schema.ts` + `helpers.ts`
- **Server actions:** `validateSession()` → `parseInput()` → operazione → `revalidatePath()`
- **AI tool:** file in `definitions/`, schema Zod, `promptDocs`, `execute()` handler
- **Componenti:** shadcn/ui, pattern `PageHeader` + `Card` + `DataTable`

### Cosa NON portare

- Stile "Ledger Terminal" (monospace dark)
- Template Jinja2 e macro (riscritto tutto in React)
- Sistema config API JSON (`/api/config/*`) — sostituito da server actions
- Chat SSE streaming — pianificabile come miglioramento futuro
- Guide/Knowledge base — non in scope
- Web search tool (SearXNG) — non in scope
