module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    $: 'readonly',
    Chess: 'readonly',
    Chessboard: 'readonly',
    io: 'readonly',
    gameConfig: 'readonly',
    soundManager: 'readonly',
    ChessAnalysisService: 'readonly',
    playerColor: 'readonly',
    gameId: 'readonly',
    playerName: 'readonly',
  },
  rules: {
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    }],
    'no-console': ['warn', { 
      allow: ['error', 'warn', 'info'] 
    }],
    'max-len': ['error', { 
      code: 100,
      ignoreComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    }],
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': 'error',
    'no-case-declarations': 'warn',
    'no-useless-catch': 'warn',
  },
  ignorePatterns: [
    'node_modules/**',
    'public/dist/**',
    'public/js/jquery-3.6.0.min.js',
    'public/js/bootstrap.bundle.min.js',
    'coverage/**',
    'packages/chess-universe-utils/dist/**',
  ],
}
