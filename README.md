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
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# Multiplayer Minesweeper

A multiplayer Minesweeper game built with React, TypeScript, and Supabase.

## Setup

### Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
pnpm install
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
