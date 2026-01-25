const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      playwright,
    },
    rules: {
      // TypeScript ESLint rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'off',

      // General ESLint rules
      'no-console': 'off',
      'prefer-const': 'error',
      'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead

      // Playwright specific rules
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-element-handle': 'warn',
      'playwright/no-eval': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-page-pause': 'warn',
      'playwright/no-skipped-test': 'off',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/prefer-web-first-assertions': 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      // Test-specific rules
      '@typescript-eslint/no-non-null-assertion': 'off',
      'playwright/expect-expect': 'off', // Playwright handles assertions differently
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'reports/**',
      'allure-results/**',
      'html-report/**',
      'test-results/**',
      '*.config.js',
      '*.config.ts',
    ],
  }
];