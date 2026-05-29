# MRK-OS Architecture & Development Plan

> Fullstack Autonomous AI Agent SaaS (like OpenClaw)

---

## 📋 Quick Overview

**What we're building**: A SaaS platform where users can create, deploy, and manage autonomous AI agents that perform tasks.

**Core flow**: User → Creates Agent → Agent runs tasks → Returns results

---

## 🏗️ Architecture Layers

### Layer 1: Frontend (User Interface)
- **Where**: `app/` folder (Next.js App Router)
- **Tech**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Key pages**:
  - `/` - Dashboard (shows user's agents)
  - `/agents/new` - Create agent form
  - `/agents/[id]` - Agent detail page (monitor, run, configure)
  - `/agents/[id]/history` - Task history & logs
  - `/account` - User settings

### Layer 2: Backend API (Business Logic)
- **Where**: `app/api/` folder (Next.js Server Routes)
- **Tech**: TypeScript + Node.js runtime
- **Key endpoints**:
  - `POST /api/agents` - Create agent
  - `GET /api/agents` - List user's agents
  - `POST /api/agents/[id]/run` - Execute agent
  - `GET /api/agents/[id]/results` - Get agent results
  - `DELETE /api/agents/[id]` - Delete agent

### Layer 3: AI Engine (Agent Logic)
- **Where**: `lib/ai/` folder (separate business logic)
- **Tech**: LLM API (OpenAI / Claude / Gemini)
- **Responsibilities**:
  - Parse agent configuration
  - Generate agent instructions
  - Execute agent tasks
  - Handle tool calls (web search, API calls, etc.)
  - Stream responses

### Layer 4: Database (Data Persistence)
- **Type**: PostgreSQL (recommended) or MongoDB
- **What we store**:
  - Users (via Clerk - no need to manage)
  - Agents (config, settings, metadata)
  - Tasks/Runs (execution history, results, logs)
  - Agent memory/context (for multi-turn tasks)

### Layer 5: Authentication (Gating)
- **Tech**: Clerk (already configured ✅)
- **What it does**:
  - Sign up / Sign in
  - Protect routes (middleware in `middleware.ts`)
  - User identification for data isolation

---

## 💾 Database Schema (MVP)

```sql
-- Users (managed by Clerk - we just reference clerk_id)
agents
├── id (UUID) PRIMARY KEY
├── clerk_id (from Clerk) NOT NULL
├── name (string) NOT NULL
├── description (text)
├── system_prompt (text) NOT NULL - instructions for the AI
├── model (string) NOT NULL - which AI model to use
├── tools (JSON) - what the agent can access (web, APIs, etc.)
├── created_at (timestamp) NOT NULL DEFAULT NOW()
├── updated_at (timestamp) NOT NULL DEFAULT NOW()
├── deleted_at (timestamp) NULL - for soft deletes

-- Indexes
CREATE INDEX idx_agents_clerk_id ON agents(clerk_id);
CREATE INDEX idx_agents_created_at ON agents(created_at);

agent_runs
├── id (UUID) PRIMARY KEY
├── agent_id (UUID) NOT NULL REFERENCES agents(id) ON DELETE CASCADE
├── input (text) NOT NULL - what the user asked
├── output (text) - what the agent returned
├── status (enum: pending, running, completed, failed) NOT NULL DEFAULT 'pending'
├── logs (JSON) - step-by-step execution logs
├── created_at (timestamp) NOT NULL DEFAULT NOW()
├── completed_at (timestamp) NULL

-- Indexes
CREATE INDEX idx_agent_runs_agent_id ON agent_runs(agent_id);
CREATE INDEX idx_agent_runs_created_at ON agent_runs(created_at);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);

-- Partitioning: Consider partitioning by created_at (monthly) for growth
-- CREATE TABLE agent_runs_y2024m01 PARTITION OF agent_runs FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

agent_memory
├── id (UUID) PRIMARY KEY
├── agent_id (UUID) NOT NULL REFERENCES agents(id) ON DELETE CASCADE
├── key (string) NOT NULL - context name
├── value (JSON) NOT NULL - stored context
├── updated_at (timestamp) NOT NULL DEFAULT NOW()

-- Indexes
CREATE INDEX idx_agent_memory_agent_id ON agent_memory(agent_id);
CREATE INDEX idx_agent_memory_key ON agent_memory(agent_id, key);
CREATE INDEX idx_agent_memory_updated_at ON agent_memory(updated_at);
```

---

## 🤖 AI Integration Strategy

### Simple Approach (MVP)
1. User creates agent with a **goal** and **available tools**
2. Backend calls OpenAI/Claude with agent config
3. LLM decides what to do (tool calls)
4. Backend executes tool calls
5. Repeat until agent completes task

### Example Agent Flow
```
User: "Create a Twitter thread about AI"
↓
Agent Config: name="TwitterWriter", model="claude-3.5", tools=["web_search"]
↓
LLM thinks: "I need to search for recent AI news first"
↓
Tool Call: web_search("latest AI news 2024")
↓
LLM gets results, writes thread
↓
Return: "Thread created with 5 tweets"
```

### Available Tools (Start with these)
- **web_search** - Search the internet
- **http_request** - Call external APIs
- **file_operations** - Read/write files (for processing)
- **code_execution** - Run Python/JavaScript (optional, risky)

### Security & Operational Safeguards
- **Sandboxing/Isolation**: Use Docker containers or jailed VMs for code_execution to prevent system access
- **Timeouts**: Max execution time (30s for web_search, 60s for code_execution, 10s for http_request)
- **Rate Limiting**: Per user (100 requests/hour) and per-agent run (10 tool calls max)
- **Cost Controls**: Max token limits per run ($0.10), spend tracking per user
- **Input Validation**: Sanitize all tool inputs, validate URLs, escape shell commands
- **Loop Prevention**: Max tool-call depth (5 iterations), detect infinite loops
- **Error Handling**: Retry failed requests (3x), graceful failures, detailed logging for monitoring

---

## 📁 Folder Structure (Target)

```
app/
├── layout.tsx              (ClerkProvider, theme setup) ✅
├── page.tsx                (Dashboard)
├── globals.css             ✅
│
├── api/                    (API routes)
│   ├── agents/
│   │   ├── route.ts        (GET all, POST create)
│   │   └── [id]/
│   │       ├── route.ts    (GET detail, DELETE)
│   │       └── run/
│   │           └── route.ts (POST execute)
│   │
│   └── auth/
│       └── route.ts        (webhooks from Clerk)
│
├── agents/
│   ├── page.tsx            (List agents)
│   ├── new/
│   │   └── page.tsx        (Create agent form)
│   └── [id]/
│       ├── page.tsx        (Agent detail page)
│       └── history/
│           └── page.tsx    (Execution history)
│
├── account/
│   └── page.tsx            (User settings)
│
├── sign-in/                ✅
│   └── page.tsx
│
└── sign-up/                ✅
    └── page.tsx

lib/
├── ai/
│   ├── client.ts           (Initialize LLM client - OpenAI/Claude)
│   ├── agent.ts            (Agent execution logic)
│   ├── tools.ts            (Tool implementations)
│   └── prompts.ts          (System prompts for agents)
│
├── db/
│   ├── schema.prisma        (Prisma schema with datasource/generator)
│   ├── client.ts           (Database connection - instantiate PrismaClient)
│   └── queries.ts          (Complex multi-table helpers using PrismaClient)
│
├── utils.ts                ✅
└── types.ts                (TypeScript interfaces)

components/
├── ui/                     ✅ (shadcn components)
├── agents/
│   ├── AgentCard.tsx       (Agent display card)
│   ├── AgentForm.tsx       (Create/edit agent)
│   └── RunResults.tsx      (Show execution results)
│
└── layout/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx

public/
└── ...

.env.local                  (API keys)
middleware.ts               (Middleware - route protection) ✅
```

---

## 🔑 Key Files to Create (Priority Order)

### Phase 1: Core Structure
1. **`lib/types.ts`** - TypeScript types for Agent, Run, etc.
2. **`lib/db/client.ts`** - Database connection (Prisma or raw client)
3. **`app/api/agents/route.ts`** - Create/list agents API
4. **`app/agents/new/page.tsx`** - Agent creation form

### Phase 2: AI Engine
5. **`lib/ai/client.ts`** - Initialize OpenAI/Claude client
6. **`lib/ai/agent.ts`** - Main agent execution logic
7. **`app/api/agents/[id]/run/route.ts`** - Execute agent endpoint

### Phase 3: UI
8. **`app/agents/page.tsx`** - List user's agents
9. **`app/agents/[id]/page.tsx`** - Agent detail page
10. **`app/page.tsx`** - Dashboard

---

## 🔐 Authentication & Authorization

**Already set up with Clerk** ✅

What we need to add:
```typescript
import { auth } from "@clerk/nextjs/server";

// Check if user is authenticated
const { userId } = await auth();
if (!userId) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// Ensure agent belongs to current user
const agent = await db.agents.findUnique({ where: { id } });
if (!agent) {
  return Response.json({ error: 'Agent not found' }, { status: 404 });
}

if (agent.clerkId !== userId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 🚀 Tech Stack Summary

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | Next.js 15.x (latest stable) + React 19 | Server-side rendering, API routes |
| UI Framework | Tailwind + shadcn/ui | Fast, accessible components |
| Auth | Clerk | User management, webhooks |
| AI | OpenAI/Claude API | Powerful LLMs, reliable |
| Database | PostgreSQL (Prisma ORM) | Type-safe, migrations |
| Language | TypeScript | Type safety, better DX |
| Deployment | Vercel (Next.js native) | Easy, serverless |

---

## 📊 User Flow (MVP)

```
1. User signs up → Clerk
2. Goes to dashboard → Empty agent list
3. Clicks "Create Agent" → Form page
4. Fills in name, goal, tools → Creates agent
5. Clicks "Run" → Executes agent, shows results
6. Views history → Sees past runs and logs
7. Edits agent → Update config and re-run
```

---

## 💡 MVP Features (Don't overcomplicate)

✅ **Must have**:
- Create agents with custom prompts
- List user's agents
- Execute agents with text input
- Show execution results
- Store execution history

❌ **Nice to have (Phase 2)**:
- Schedule agents to run automatically
- Webhooks for external triggers
- Agent marketplace/sharing
- Advanced memory/context persistence
- Multiple LLM providers

---

## 🔄 Development Workflow

1. **Design database schema** → Create migrations
2. **Build API routes** → CRUD for agents
3. **Implement AI logic** → LLM integration
4. **Create UI pages** → Forms, lists, details
5. **Test end-to-end** → Create agent, run it, see results
6. **Deploy** → Vercel

---

## 📝 Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# LLM
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mrk_os
# For serverless: Use connection pooling (PgBouncer or hosted service)
# Never commit .env.local - add to .gitignore
# Use Vercel environment variables dashboard for production

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✅ Checklist

- [ ] Set up database (PostgreSQL + Prisma)
- [ ] Create database schema & migrations
- [ ] Implement agent CRUD API
- [ ] Add LLM client setup
- [ ] Build agent execution logic
- [ ] Create agent creation form UI
- [ ] Build agent list UI
- [ ] Build agent detail/results UI
- [ ] Add error handling & logging
- [ ] Test full flow
- [ ] Deploy to Vercel
- [ ] Set up monitoring (Sentry/Datadog optional)

---

## 🎯 Success Criteria (MVP Done When)

- User can create an agent
- User can execute an agent
- User sees results in real-time
- User can see execution history
- All data is scoped to logged-in user
- No hardcoded LLM prompts (configurable)

