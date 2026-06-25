import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // Context i entry datoteke izvoze hookove/providere uz komponente -
  // fast-refresh pravilo tu ne donosi korist
  {
    files: ['src/context/**/*.jsx', 'src/main.jsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Service Worker globali (self, clients, caches...)
  {
    files: ['public/sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  // Node globali za backend, config i util skripte (sourceType ostaje module)
  {
    files: ['server/**/*.{js,cjs}', '*.{js,cjs}', 'scripts/**/*.{js,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  // CommonJS datoteke (require / module.exports)
  {
    files: ['**/*.cjs', 'update-matches.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
])
