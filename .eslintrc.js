module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [
      './packages/server/tsconfig.json',
      './packages/shared/tsconfig.json',
      './packages/app/tsconfig.json',
    ],
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: [
    '.eslintrc.js',
    'dist',
    'node_modules',
    'coverage',
    '*.config.js',
    '*.config.ts',
    '*.config.mjs',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
  overrides: [
    // App-specific rules (Expo/React Native)
    {
      files: ['packages/app/**/*.{ts,tsx}'],
      parserOptions: {
        project: './packages/app/tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      env: {
        browser: false,
        es2021: true,
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_|^React$',
          },
        ],
      },
    },
    // Server-specific rules (NestJS)
    {
      files: ['packages/server/**/*.ts'],
      parserOptions: {
        project: './packages/server/tsconfig.json',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
          },
        ],
      },
    },
  ],
};
