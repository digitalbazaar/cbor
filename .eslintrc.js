module.exports = {
  root: true,
  extends: [
    'eslint-config-digitalbazaar',
    'eslint-config-digitalbazaar/jsdoc'
  ],
  env: {
    es2020: true,
    node: true
  },
  ignorePatterns: ['dist/']
};
