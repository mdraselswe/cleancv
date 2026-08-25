import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * Layer boundaries. Each entry lists the import groups a layer may NOT reach for.
 * See .claude/skills/cv-maker/SKILL.md section 1.
 *
 * Applied after the shared src block so the narrower `files` pattern wins.
 */
const boundaryRules = [
  {
    files: ['src/constants/**', 'src/types/**'],
    forbidden: ['@/lib/*', '@/hooks/*', '@/components/*', '@/features/*', '@/app/*'],
    message: 'constants/ and types/ are leaf layers and may not import from other src folders.',
  },
  {
    files: ['src/lib/**'],
    forbidden: ['@/hooks/*', '@/components/*', '@/features/*', '@/app/*', 'react', 'react-dom'],
    message: 'lib/ holds pure functions. Anything that needs React belongs in hooks/ or features/.',
  },
  {
    files: ['src/hooks/**'],
    forbidden: ['@/components/*', '@/features/*', '@/app/*'],
    message: 'hooks/ holds domain-free hooks. Domain logic belongs in features/<domain>/hooks.',
  },
  {
    files: ['src/components/**'],
    forbidden: ['@/features/*', '@/app/*'],
    message:
      'components/ is presentational. It receives data via props and must not reach into features/.',
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  ...boundaryRules.map(({ files, forbidden, message }) => ({
    files,
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: forbidden.map((group) => ({ group: [group], message })) },
      ],
    },
  })),

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
