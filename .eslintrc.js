module.exports = {
  'env': {
    'browser': true,
    'es2021': true
  },
  'extends': [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaFeatures': {
      'jsx': true,
      'tsx': true
    },
    'ecmaVersion': 'latest',
    'sourceType': 'module'
  },
  'plugins': [
    'react',
    '@typescript-eslint'
  ],
  'ignorePatterns': ['**/*.js'],
  'rules': {
    'indent': [
      'error',
      'tab'
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'prefer-const': ['off'],
    'no-empty': ['off'],
    '@typescript-eslint/no-empty-function': ['off'],
    '@typescript-eslint/no-this-alias': ['off'],
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/explicit-module-boundary-types': ['off'],
    'react/display-name': ['off'],
    'no-mixed-spaces-and-tabs': ['off'],
    '@typescript-eslint/ban-ts-comment': ['off'],
    '@typescript-eslint/no-var-requires': ['off'],
    '@typescript-eslint/no-non-null-assertion': ['off'],
    'object-curly-spacing': ['error', 'always']
  }
};
