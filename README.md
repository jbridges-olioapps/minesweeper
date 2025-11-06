# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

# Multiplayer Minesweeper

A multiplayer Minesweeper game built with React, TypeScript, and Supabase.

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Docker Desktop (for local Supabase development)
- Supabase CLI

### Install Supabase CLI

#### macOS

```bash
brew install supabase/tap/supabase
```

#### Other platforms

See [Supabase CLI documentation](https://supabase.com/docs/guides/cli/getting-started)

### Supabase Setup

#### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project reference ID (found in Project Settings)

#### 2. Authenticate Supabase CLI

Generate an access token and log in:

```bash
# Option 1: Interactive login (if in a terminal)
supabase login

# Option 2: Login with access token
# Get your token from: https://supabase.com/dashboard/account/tokens
supabase login --token YOUR_ACCESS_TOKEN

# Option 3: Set environment variable
export SUPABASE_ACCESS_TOKEN=your_access_token
```

#### 3. Link to Your Remote Project

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Example:
# supabase link --project-ref razklaljmaodzggbfidd
```

#### 4. Local Development with Supabase

Start local Supabase services (requires Docker Desktop):

```bash
# Start local Supabase
supabase start

# This will output:
# - API URL
# - Database URL
# - Studio URL (local dashboard)
# - Anon key (for local development)
```

Apply database migrations locally:

```bash
# Reset and apply all migrations
supabase db reset

# Or apply migrations without resetting
supabase migration up
```

#### 5. Push Schema to Remote Database

Once you're satisfied with local development:

```bash
# Push migrations to remote Supabase project
supabase db push
```

### Environment Variables

Create a `.env` file in the root directory:

**For local development:**

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key_from_supabase_start
```

**For production (remote Supabase):**

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build

```bash
pnpm build
```

### Test Supabase Connection

Verify your Supabase connection is working:

```bash
pnpm test:supabase
```

This will:

- ✅ Check that your environment variables are loaded
- ✅ Test the connection to Supabase
- ✅ Verify your API key is valid
- ⚠️ Note: The `games` table warning is expected if you haven't created the schema yet

### Useful Supabase CLI Commands

```bash
# View local Supabase status
supabase status

# Stop local Supabase
supabase stop

# View database migrations
supabase migration list

# Create a new migration
supabase migration new migration_name

# Pull remote schema changes to local
supabase db pull

# Open local Supabase Studio (dashboard)
# Visit the Studio URL from `supabase status`

# Check if you're logged in
supabase projects list
```

### Troubleshooting

**"Unauthorized" error when linking:**

- Make sure you've logged in with `supabase login`
- Generate a new access token from https://supabase.com/dashboard/account/tokens
- Try: `export SUPABASE_ACCESS_TOKEN=your_token_here`

**Docker permission errors:**

- Ensure Docker Desktop is running
- On macOS, check Docker Desktop settings for file access permissions

**Migration already exists error:**

- Check `supabase/migrations/` folder for existing migrations
- Use `supabase db push --dry-run` to preview changes before pushing

## Deployment to GitHub Pages

### Prerequisites

1. Repository is already set up on GitHub
2. You have push access to the repository

### Step 1: Configure GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:
   - **Name**: `VITE_SUPABASE_URL`
     - **Value**: Your Supabase project URL (from your `.env` file)
   - **Name**: `VITE_SUPABASE_ANON_KEY`
     - **Value**: Your Supabase anon key (from your `.env` file)

### Step 2: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions** as the source
3. The workflow will automatically deploy when you push to the `main` branch

### Step 3: Deploy

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will automatically:

- Build the project with your Supabase credentials
- Deploy the `dist/` folder to GitHub Pages

Simply push to the `main` branch or manually trigger the workflow from the **Actions** tab.

**Note**: The Supabase credentials are baked into the build at compile time. This is expected and safe - the anon key is meant to be public, and Supabase protects your data via Row Level Security (RLS) policies.
