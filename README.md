# Loan Recovery AI — Dashboard

React/Next.js frontend for the Loan Recovery AI system.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Make sure your FastAPI backend is running at localhost:8000

# 3. Start the dashboard
npm run dev
```

Open http://localhost:3000

## Pages
- `/`            — Overview dashboard with charts
- `/customers`   — Customer list, add/delete, trigger AI calls
- `/calls`       — Call logs with transcript viewer
- `/analytics`   — Deep analytics and sentiment charts
- `/support`     — Contact form for bank employees

## Connect to backend
Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production, set this to your Railway/AWS URL.
