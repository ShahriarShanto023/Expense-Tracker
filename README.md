# Expense Tracker

A React + Vite expense tracker starter for tracking income, expenses, budgets, and spending trends in Bangladeshi taka (BDT). Supabase provides authentication and PostgreSQL storage.

## Features in this starter

- Email/password sign-up, sign-in, and sign-out with Supabase Auth
- Dashboard totals for income, expenses, balance, and monthly budget usage
- Add and delete income/expense transactions with category, date, and payment method
- Category breakdown and a simple recent-month trend chart
- Per-user transaction and budget access enforced by Supabase Row Level Security (RLS)
- Admin role foundation (admin assignment is performed securely in SQL, not through public sign-up)
- Responsive layout and BDT formatting

## Requirements

- Node.js 20.19+ or 22.12+ recommended
- A free Supabase project

## Run locally

1. Clone this repository and enter the project folder.
2. Install packages: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon/publishable key.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. Start the app: `npm run dev`
6. Open the local URL printed by Vite.

Without Supabase environment values, the app displays setup guidance; authentication and persistent data require a configured Supabase project.

## Configure Supabase

1. Create a project at https://supabase.com/.
2. Find the project URL and anon/publishable key in the project's API settings.
3. Add them to `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `supabase/schema.sql` in the SQL Editor.
5. In Authentication settings, configure your local and deployed site URLs and enable email/password sign-in.
6. Register your own account. To make that account an administrator, run the following SQL as the project owner, replacing the email:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('you@example.com');
```

Do not expose a service-role key in frontend code. Never allow users to select their own role during registration. Admin role management and cross-user reporting are intentionally not exposed in this starter UI.

## Deploy for free

Deploy the Vite frontend to Vercel or Cloudflare Pages and use Supabase for auth/database. Set the two `VITE_` environment variables in the hosting dashboard. Set the deployed URL in Supabase Auth redirect/site URL settings. Free-tier limits and terms may change.

## Project structure

```text
src/
  lib/supabase.js   Supabase client
  main.jsx          React entry point
  App.jsx           Auth, dashboard, transactions and budget UI
  styles.css        Responsive styling
supabase/
  schema.sql        Tables, triggers, indexes and RLS policies
.env.example
index.html
package.json
vite.config.js
```

## Current limitations

This is an initial working foundation, not a financial/accounting system. The monthly budget is currently a single overall budget per user; category-specific budgets, recurring transactions, richer analytics, exports, password recovery UI, and admin management can be added next. Validate all calculations and permissions before using sensitive financial data.
