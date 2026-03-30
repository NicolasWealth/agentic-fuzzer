<div align="center">

```
█████╗  ██████╗ ███████╗███╗   ██╗████████╗██╗ ██████╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██║██╔════╝
███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║██║
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║██║
██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║╚██████╗
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝ ╚═════╝
███████╗██╗   ██╗███████╗███████╗███████╗██████╗
██╔════╝██║   ██║╚══███╔╝╚══███╔╝██╔════╝██╔══██╗
█████╗  ██║   ██║  ███╔╝   ███╔╝ █████╗  ██████╔╝
██╔══╝  ██║   ██║ ███╔╝   ███╔╝  ██╔══╝  ██╔══██╗
██║     ╚██████╔╝███████╗███████╗███████╗██║  ██║
╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝
```

**AI-Powered API Penetration Testing. Automated. Intelligent. Relentless.**

</div>

---

> *"The best offense knows where defense is weakest before defense does."*

---

## The Problem with Manual Penetration Testing

Every penetration test begins the same way — a security engineer stares at a list of API endpoints and starts crafting payloads by hand. It is methodical. It is necessary. And for the first 20%, it is almost entirely mechanical.

**Agentic Fuzzer eliminates that 20%.**

It deploys Claude Sonnet as a reasoning engine — not a pattern-matcher — to study your API surface, infer the intent behind each endpoint, and generate contextually intelligent attack payloads that human testers would spend hours constructing. By the time your team opens their terminal, the groundwork is already laid.

---

## What It Does

Agentic Fuzzer acts as an AI-powered **Red Team Strategist**. Feed it a list of API endpoints. It returns a structured, prioritized attack plan — complete with malicious payloads, vulnerability classifications, and severity ratings — ready to fire.

```
Input:   POST /auth/login
         GET  /users/{id}/profile
         POST /api/orders/search

Output:  3 targeted attack payloads per endpoint
         Covering: SQLi, NoSQLi, Broken Auth, IDOR, Path Traversal, RCE, XSS
         Formatted as executable JSON your fuzzer can ingest directly
```

No guessing. No boilerplate. Just signal.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AGENTIC FUZZER                         │
│                                                             │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────┐  │
│  │  Endpoint   │───▶│  Red Team        │───▶│  Payload  │  │
│  │  Ingestion  │    │  Strategist      │    │  Engine   │  │
│  │             │    │  (Claude Sonnet) │    │           │  │
│  └─────────────┘    └──────────────────┘    └─────┬─────┘  │
│                                                   │         │
│  ┌─────────────────────────────────────────────────▼─────┐  │
│  │              Structured Attack Report                  │  │
│  │   attack_type · severity · payload · expected_flaw    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

The core reasoning loop is powered by **Claude Sonnet**, which analyzes each endpoint's HTTP method, path semantics, parameter names, and likely backend behavior to select the most plausible attack vectors — not just throw a wordlist at the wall.

---

## Features

| Capability | Description |
|---|---|
| **AI-Driven Payload Generation** | Claude Sonnet reasons about endpoint context to craft targeted, non-generic payloads |
| **Batch Analysis** | Submit dozens of endpoints in a single pass — the strategist handles them in parallel |
| **Multi-Vector Coverage** | SQL Injection, NoSQL Injection, Broken Authentication, IDOR, XSS, Path Traversal, RCE |
| **Severity Classification** | Every payload is rated `critical / high / medium / low` with an explanation |
| **Fuzzer-Ready Output** | JSON schema designed for direct integration into your HTTP fuzzing pipeline |
| **Structured Reports** | Machine-readable results that slot cleanly into your existing reporting workflow |

---

## Quickstart

### Prerequisites

```bash
node >= 18.x
npm or pnpm
ANTHROPIC_API_KEY
```

### Installation

```bash
git clone https://github.com/yourhandle/agentic-fuzzer.git
cd agentic-fuzzer
npm install
```

### Configuration

```bash
cp .env.example .env
# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env
```

### Run

```typescript
import { redTeamStrategist } from './src/strategist';

const endpoints = [
  'POST /auth/login',
  'GET /users/{id}',
  'POST /api/products/search',
  'DELETE /admin/users/{id}',
];

const attackPlan = await redTeamStrategist(endpoints);
console.log(JSON.stringify(attackPlan, null, 2));
```

```bash
npx ts-node src/index.ts
```

---

## Output Schema

```typescript
interface AttackPayload {
  attack_type: string;              // e.g. "SQL Injection"
  severity: 'critical' | 'high' | 'medium' | 'low';
  payload: Record<string, unknown>; // Ready-to-send request body
  expected_vulnerability: string;   // What flaw this exposes and why
}

interface EndpointAnalysis {
  endpoint: string;                 // "METHOD /path"
  payloads: AttackPayload[];        // Always 3 per endpoint
}
```

### Example Output

```json
[
  {
    "endpoint": "POST /auth/login",
    "payloads": [
      {
        "attack_type": "SQL Injection",
        "severity": "critical",
        "payload": {
          "username": "admin' OR '1'='1' -- ",
          "password": "irrelevant"
        },
        "expected_vulnerability": "Classic tautology injection to bypass authentication if credentials are interpolated into a raw SQL query without parameterization."
      },
      {
        "attack_type": "NoSQL Injection",
        "severity": "critical",
        "payload": {
          "username": { "$ne": null },
          "password": { "$ne": null }
        },
        "expected_vulnerability": "MongoDB operator injection to match any document where both fields are non-null, granting unauthorized access."
      },
      {
        "attack_type": "Broken Authentication",
        "severity": "high",
        "payload": {
          "username": "admin",
          "password": "admin",
          "role": "superadmin",
          "_isAdmin": true
        },
        "expected_vulnerability": "Mass assignment probe — tests whether the server blindly binds request body fields to internal user objects, allowing privilege escalation."
      }
    ]
  }
]
```

---

## Scope & Philosophy

Agentic Fuzzer is built around a deliberate premise: **automate reconnaissance, not judgment.**

The first 20% of a penetration test — endpoint enumeration, attack surface mapping, initial payload generation — is high-volume, low-variance work. It demands consistency and breadth, not creativity. This is precisely where AI excels and human attention is wasted.

The remaining 80% — chain exploitation, business logic abuse, privilege escalation, report writing — demands the intuition of an experienced tester. Agentic Fuzzer gets out of the way and hands them a clean foundation.

```
Phase 1  [Automated]  ████████████████████░░░░░░░░░░░░░░░░░░░░  20%
Phase 2  [Human]      ░░░░░░░░░░░░░░░░░░░░████████████████████  80%
                       └─ Agentic Fuzzer ─┘└──── Your Team ────┘
```

---

## Vulnerability Coverage

- **Injection Attacks** — SQL, NoSQL, LDAP, Command
- **Broken Authentication** — Credential stuffing, JWT manipulation, session fixation
- **Broken Object Level Authorization (IDOR)** — Horizontal and vertical privilege probes
- **Security Misconfiguration** — Exposed admin routes, permissive CORS, verbose errors
- **Mass Assignment** — Unfiltered body binding, hidden field injection
- **Path Traversal** — Directory climbing via file parameters
- **Cross-Site Scripting (XSS)** — Stored and reflected vectors in API responses
- **Remote Code Execution (RCE)** — Deserialization and template injection probes

---

## Roadmap

- [x] Core Red Team Strategist (Claude Sonnet)
- [x] JSON output schema
- [ ] Live HTTP fuzzing engine (fire payloads, capture responses)
- [ ] Anomaly detection layer (flag 500s, data leaks, auth bypasses)
- [ ] OpenAPI / Swagger spec ingestion
- [ ] HTML + Markdown pentest report generation
- [ ] CI/CD integration (GitHub Actions, Jenkins)
- [ ] Custom attack vector injection
- [ ] Rate-limit and stealth mode

---

## Legal & Ethical Use

> **Agentic Fuzzer is a professional security research tool.**

This software is intended exclusively for:

- Authorized penetration testing engagements
- Security research on systems you own or have explicit written permission to test
- Red team exercises within defined scope and rules of engagement

Unauthorized use against systems you do not own is illegal and unethical. The authors accept no liability for misuse. Always operate within scope. Always get written authorization.

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature-name
npm run test
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

Please ensure all new attack vectors include test cases and follow the existing output schema.

---
