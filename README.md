# Expense Tracker

A React + Vite expense tracker for tracking daily income, expenses, budgets, and spending trends in Bangladeshi taka (BDT). Supabase provides authentication and PostgreSQL storage. The same responsive app can be packaged as an Android APK using Capacitor.

## Features

- Email/password sign-up, sign-in, and sign-out with Supabase Auth
- Dashboard totals for income, expenses, balance, and monthly budget usage
- Add and delete income/expense transactions with category, date, and payment method
- Category breakdown and recent-month trend charts
- Per-user transaction and budget access enforced by Supabase Row Level Security (RLS)
- Responsive mobile layout and BDT formatting
- Android APK build through GitHub Actions

## Run on the web

Requirements: Node.js 20.19+ or 22.12+ recommended, plus a Supabase project.

1. Clone this repository and enter the project folder.
2. Install packages: `npm install`
3. Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `supabase/schema.sql` in the Supabase SQL Editor if you have not already created the schema.
5. Start the app with `npm run dev`.

## Build the Android APK

The repository includes a GitHub Actions workflow that builds an Android debug APK.

1. Push/commit changes to the `main` branch, or open the repository's **Actions** tab.
2. Choose **Build Android APK** and select **Run workflow** if you want to start a build manually.
3. Open the completed workflow run.
4. In **Artifacts**, download `expense-tracker-android-debug-apk`.
5. Extract the ZIP file. The APK inside is named `app-debug.apk`.
6. Transfer `app-debug.apk` to your Android phone, open it, and approve installation from that source if Android asks.

The APK is debug-signed for personal testing and direct installation. It is not a Play Store release build. Keep the GitHub artifact private if you do not want to distribute your app.

### Build locally (optional)

Install Android Studio and its Android SDK, then run:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

In Android Studio, build the debug APK from **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The generated file is normally `android/app/build/outputs/apk/debug/app-debug.apk`.

## Supabase configuration

1. Find the project URL and publishable/anon key in Supabase API settings.
2. Put them in `.env.local` for local web builds, or configure them as Vercel environment variables for the deployed web app.
3. In Supabase Authentication URL Configuration, set the deployed website URL as the Site URL and add the redirect URLs you use.
4. Register your own account. To make it an administrator, run the following SQL in the Supabase SQL Editor, replacing the email:

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('you@example.com');
```

Never put a Supabase service-role or secret key in a frontend app. Do not let users choose their own role during sign-up.

## Project structure

```text
src/
  lib/supabase.js   Supabase client
  main.jsx          React entry point
  App.jsx           Authentication, dashboard, transactions and budget UI
  styles.css        Responsive styling
supabase/
  schema.sql        Tables, triggers, indexes and RLS policies
capacitor.config.json
.github/workflows/
  ci.yml
  build-android-apk.yml
.env.example
index.html
package.json
vite.config.js
```

## Current limitations

This is a personal-finance starter, not a formal accounting system. The monthly budget is a single overall budget per user. Category-specific budgets, recurring transactions, richer analytics, exports, password recovery UI, and admin management can be added later. The Android app needs an internet connection to sync data with Supabase; it is not an offline-first ledger. Validate calculations and permissions before using sensitive financial data.
