# CBMS Setup Guide

## Environment Configuration

The "Failed to fetch" error you're experiencing is due to missing Supabase environment variables. Follow these steps to resolve it:

### 1. Create Environment File

Create a `.env.local` file in your project root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Example Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdG5wdmJqY2JqY2JqY2JqY2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjUwNjI0MDAsImV4cCI6MTk0MDYzODQwMH0.example
```

### 4. Database Setup

After configuring the environment variables, you'll need to set up your database tables. Run the SQL scripts in the `scripts/` directory in your Supabase SQL editor:

1. `01-create-tables.sql` - Creates the main tables
2. `02-rls-policies.sql` - Sets up Row Level Security policies
3. `05-create-profiles-table.sql` - Creates the profiles table
4. `06-admin-functions.sql` - Creates admin functions

### 5. Restart Development Server

After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

### 6. Verify Configuration

Check the browser console for any remaining errors. You should see a success message instead of the "Failed to fetch" error.

## Troubleshooting

### Still getting "Failed to fetch" error?

1. **Check file location**: Ensure `.env.local` is in the project root (same level as `package.json`)
2. **Restart server**: Stop and restart your development server
3. **Check credentials**: Verify your Supabase URL and key are correct
4. **Network issues**: Ensure you can access your Supabase project URL in a browser

### Need help with Supabase setup?

1. [Supabase Documentation](https://supabase.com/docs)
2. [Supabase Quick Start](https://supabase.com/docs/guides/getting-started)
3. [Environment Variables Guide](https://supabase.com/docs/guides/getting-started/environment-variables)

## Project Structure

```
CBMS/
├── .env.local          # Environment variables (create this)
├── app/                # Next.js app directory
├── components/         # React components
├── lib/               # Utility libraries
├── scripts/           # Database setup scripts
└── ...
```