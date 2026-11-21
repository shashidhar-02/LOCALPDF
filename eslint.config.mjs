import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      '**/node_modules/**',
      'dist/**',
      'out/**',
      'build/**',
      'coverage/**',
      'public/**',
      '*.config.mjs',
      '*.config.js',
      'vitest.config.mjs',
      'tailwind.config.js',
      'postcss.config.mjs'
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'off'
    },
    rules: {
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-useless-assignment': 'off',
      'no-undef': 'off',
      'no-console': 'off'
    }
  }
);
