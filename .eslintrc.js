module.exports = {
  ignorePatterns: ['node_modules/'],
  rules: {
    'prefer-const': 1,
    'max-len': ['error', 120],
    'quote-props': 'off',
    'id-length': [
      'error',
      {
        max: 45,
        min: 1
      }
    ],
    indent: 'off',
    'max-params': ['error', 4],
    'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    'no-multiple-empty-lines': [
      'error',
      {
        max: 2,
        maxEOF: 1
      }
    ],
    'object-curly-spacing': 'off',
    eqeqeq: ['error', 'allow-null'],
    quotes: [2, 'single', { avoidEscape: true, allowTemplateLiterals: true }]
  },
  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module',
    ecmaFeatures: {
      globalReturn: true
    }
  }
};

