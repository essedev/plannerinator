# Database Structure — Plannerinator

> Schema completo del progetto dopo il refactor cross-domain e l'introduzione della sezione Finanza.

## Principi

1. **Tabella solo se**: lifecycle indipendente + queryabile singolarmente + più di 3-5 istanze
2. **JSONB per**: dati semi-statici, poche istanze, sempre letti col parent
3. **Riuso planner**: task per action items, eventi per scadenze, goal unificato cross-domain
4. **Singleton**: unique constraint su `userId`, per profili/configurazioni one-per-user

---

## Auth (5 tabelle, 1 enum) — Better Auth, non modificabili

| Tabella | Tipo | Note |
|---------|------|------|
| `user` | Core | `userRoleEnum` (user/admin) |
| `session` | Core | |
| `account` | Core | OAuth providers |
| `verification` | Core | Email/password reset tokens |
| `rateLimit` | Core | Database-backed rate limiting |

---

## Planner (12 tabelle, 8 enum)

### Core (4 tabelle)

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `task` | Entita | title, description, dueDate, status, priority, projectId, parentTaskId, metadata (JSONB) |
| `event` | Entita | title, startTime, endTime, allDay, location, calendarType, projectId, metadata (JSONB) |
| `note` | Entita | title, content (markdown), type, projectId, isFavorite, metadata (JSONB) |
| `project` | Entita | name, description, status, startDate, endDate, color, icon, parentProjectId, metadata (JSONB) |

Enum: `taskStatusEnum`, `taskPriorityEnum`, `eventCalendarTypeEnum`, `noteTypeEnum`, `projectStatusEnum`

### Collections (2 tabelle)

| Tabella | Tipo | Note |
|---------|------|------|
| `collection` | Entita | Schema-less custom lists, schema definito via JSONB |
| `collectionItem` | Child | data (JSONB) conforme allo schema della collection |

### Universal features (6 tabelle)

| Tabella | Tipo | Scope |
|---------|------|-------|
| `link` | Join | Collegamento polimorfico tra entita (from/to via `entityTypeEnum`) |
| `tag` | Lookup | Tag utente con nome e colore |
| `entityTag` | Join | Many-to-many tag ↔ entita |
| `comment` | Entita | Commenti threaded su qualsiasi entita |
| `attachment` | Entita | File R2 allegati a qualsiasi entita |
| `activityLog` | Log | Audit trail (create/update/delete/restore) |

Enum: `entityTypeEnum`, `linkRelationshipEnum`, `activityActionEnum`, `sharePermissionEnum` (future)

---

## AI (3 tabelle)

| Tabella | Tipo | Note |
|---------|------|------|
| `aiConversation` | Entita | Chat history, messages come JSONB array |
| `aiUsage` | Log | Token usage per conversazione |
| `aiLog` | Log | Debug/error logging operazioni AI |

---

## Health / Salute (4 tabelle, 1 enum)

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `supplementProtocol` | Entita | name, isActive, startDate, endDate, sortOrder |
| `supplement` | Child | protocolId, name, brand, dosage, frequency, timeOfDay, isActive |
| `bodyMetric` | Entita | metricType, value, unit, measuredAt |
| `healthProfile` | Singleton | dateOfBirth, bloodType, height, allergies (JSONB), conditions (JSONB), sleepTarget |

Enum: `supplementFrequencyEnum`

> `healthGoal` viene sostituito dal `goal` unificato cross-domain (vedi sotto).

---

## Finance / Finanza (15 tabelle, ~4 enum)

### Core (6 tabelle)

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `transaction` | Entita | type (income/expense/transfer), amount, date, description, categoryId, bankAccountId, notes |
| `category` | Lookup | name, type (income/expense), parentId (gerarchica), icon, color, sortOrder |
| `bankAccount` | Entita | name, type (checking/savings/cash/investment), currency, initialBalance, isActive |
| `fixedExpenseGroup` | Entita | name, description, sortOrder |
| `fixedExpense` | Child | groupId, name, amount, frequency (monthly/quarterly/yearly/etc), dueDay, isActive, notes |
| `budget` | Entita | categoryId, month (date), plannedAmount |

Enum: `transactionTypeEnum` (income/expense/transfer), `accountTypeEnum`, `expenseFrequencyEnum`

**Note:**
- `budget` sostituisce `variableBudget` + `variableBudgetItem`. Actual = `SUM(transactions)` per categoria+mese.
- Le scadenze fiscali (F24, INPS) sono **calcolate in codice** (`helpers.ts`) e opzionalmente create come **eventi planner**.

### Fiscale (3 tabelle)

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `taxProfile` | Singleton | regime (forfettario/ordinario), atecoCode, coefficienteRedditività, inpsRate, inpsMinimum, atecoDescription |
| `annualRevenue` | Entita | year, totalRevenue, totalExpenses, taxableIncome, notes |
| `f24Payment` | Entita | date, totalAmount, isPaid, paidAt, period, items (JSONB), notes |

**`f24Payment.items`** JSONB schema:
```ts
items: [
  { code: "PX", section: "inps", amount: 1234.56, description: "Acconto INPS" },
  { code: "4001", section: "irpef", amount: 2345.67, description: "Saldo IRPEF" }
]
```

### Lavoro (3 tabelle)

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `workProfile` | Singleton | jobTitle, companyName, partitaIva, hourlyRate, monthlyRate, **+ JSONB fields** |
| `client` | Entita | name, email, phone, company, vatNumber, defaultRate, isActive, notes |
| `recurringInvoice` | Entita | clientId, description, amount, frequency, nextDueDate, isActive |

**`workProfile` JSONB fields:**
```ts
skills: ["React", "TypeScript", "Node.js"]
specializations: ["Frontend", "Full-stack"]
workHistory: [{ company: "Acme", role: "Dev", from: "2020-01", to: "2023-06" }]
incomeTargets: [{ year: 2026, grossTarget: 50000, notes: "..." }]
planB: { description: "...", items: [{ action: "...", priority: "high" }] }
```

### Investimenti (2 tabelle)

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `investment` | Entita | name, type (etf/bond/stock/fund/other), ticker, quantity, purchasePrice, purchaseDate, currentValue, notes |
| `cryptoHolding` | Entita | symbol, name, quantity, purchasePrice, exchange, walletType (exchange/cold/hot), notes |

> Prezzi live crypto via CoinGecko server-side con cache 5 min.

### Settings (1 tabella)

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `financeSettings` | Singleton | Tutto JSONB |

**`financeSettings` JSONB fields:**
```ts
pensionFund: { fundName: "...", monthlyContribution: 200, totalAccrued: 15000, projectedAt67: 180000 }
investmentStrategy: { targetAllocation: { stocks: 60, bonds: 30, crypto: 10 }, rebalancingFrequency: "quarterly", riskTolerance: "moderate" }
riskProfile: { overallScore: 7, factors: [{ name: "Eta", score: 8 }, { name: "Reddito stabile", score: 6 }] }
vehicles: [{ make: "Toyota", model: "Yaris", year: 2020, plate: "AB123CD", insuranceMonthly: 45 }]
```

---

## Cross-domain (1 tabella, 1 enum)

### Goal unificato

| Tabella | Tipo | Campi chiave |
|---------|------|-------------|
| `goal` | Entita | **domain**, title, description, category, targetValue, targetUnit, currentValue, status, startDate, targetDate, metadata (JSONB) |

Enum: `goalStatusEnum` (active/paused/completed/abandoned) — rinomina di `healthGoalStatusEnum`

**`domain`**: `"health"` | `"finance"` | `"personal"`

**`metadata` per dominio:**
```ts
// Health
{ metricType: "weight", autoTrack: true }

// Finance
{ monthlyContribution: 500, linkedAccountId: "...", targetAmount: 10000 }

// Personal
{ linkedProjectId: "...", linkedCollectionId: "..." }
```

**Migrazione da `healthGoal`:**
1. Rinomina tabella `health_goal` → `goal`
2. Aggiungi colonna `domain` con default `"health"`
3. Rinomina enum `health_goal_status` → `goal_status`
4. Sposta `metricType` in `metadata` JSONB
5. Aggiorna feature module health e AI tools

---

## Riuso planner per concetti finanza

| Concetto originale | Implementazione |
|--------------------|-----------------|
| `actionItem` (to-do finanziari) | `task` con `metadata: { domain: "finance" }` o tag "finanza" |
| `taxDeadline` (scadenze fiscali) | Calcolate in `helpers.ts` + `event` planner con `calendarType: "work"` |
| `futureProject` (spese future) | `goal` con `domain: "finance"`, `category: "project"` |
| `incomePlan` + items | JSONB su `workProfile.incomeTargets` |
| `riskProfile` + factors | JSONB su `financeSettings.riskProfile` |
| `planB` + items | JSONB su `workProfile.planB` |

---

## Conteggio totale

| Sezione | Tabelle | Enum |
|---------|---------|------|
| Auth | 5 | 1 |
| Planner | 12 | 8 |
| AI | 3 | 0 |
| Health | 4 | 1 |
| Finance | 15 | ~4 |
| Cross-domain | 1 | 1 |
| **Totale** | **40** | **~15** |

vs piano originale: ~60 tabelle → **40 tabelle** (-33%), funzionalita invariata.

---

## File structure

### Schema split (pre-implementazione)

```
src/db/schema/
├── index.ts          # barrel: re-export * da tutti i file
├── auth.ts           # 5 tabelle Better Auth + userRoleEnum
├── planner.ts        # 12 tabelle + 8 enum + type exports planner
├── health.ts         # 4 tabelle + 1 enum + type exports salute
├── finance.ts        # 15 tabelle + ~4 enum + type exports finanza
└── common.ts         # goal + goalStatusEnum (cross-domain)
```

### Feature modules

```
src/features/
├── health/           # schema.ts, actions.ts, queries.ts, helpers.ts (esistente)
├── finance/          # schema.ts, actions.ts, queries.ts, helpers.ts (nuovo)
└── goals/            # schema.ts, actions.ts, queries.ts (nuovo, cross-domain)
```

### AI tools

```
src/lib/ai/tools/definitions/
├── (12 planner tools esistenti)
├── (4 health tools esistenti, goal tool aggiornato)
├── manage-finance-transaction.ts
├── manage-finance-budget.ts
├── manage-finance-account.ts
├── query-finance-status.ts
└── manage-goal.ts        # unificato, sostituisce manage-health-goal
```
