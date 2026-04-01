# Agentic Fuzzer

AI-powered red team attack simulation platform for API security testing.

## Features

- Paste any API URL and run automated attack simulations
- AI-generated attack payloads targeting common vulnerabilities (SQLi, XSS, IDOR, etc.)
- Real-time activity log with terminal-style output
- Live stats: vulnerabilities found, endpoints scanned, security score
- Downloadable Markdown exploit reports

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Edge Functions (AI analysis backend)

## Getting Started

```bash
npm install
npm run dev
```

## Usage

1. Enter a target API URL
2. Click **Initialize Attack Simulation**
3. Watch the activity log as AI analyzes endpoints and executes payloads
4. Download the exploit report when complete
