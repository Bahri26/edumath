import js from '@eslint/js';
import globals from 'globals';

/** Backend Node (CommonJS) — sözdizimi ve bariz hataları CI’da yakala. */
export default [
  {
    ignores: [
      'node_modules/**',
      'uploads/**',
      'coverage/**',
      'eslint-report.json',
      '**/*.min.js',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Mevcut kod tabanı: unused → uyarı (CI’yi kırmasın)
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(err|error|e|_)$',
        },
      ],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-constant-condition': ['error', { checkLoops: false }],
      // Regex kaçışları bilinçli / tarihsel; sözdizimi lint:syntax ile ayrı kontrol
      'no-useless-escape': 'off',
      'no-useless-catch': 'warn',
      'no-console': 'off',
    },
  },
];
