module.exports = {
  root: true,
  extends: '@react-native',
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaFeatures: { jsx: true },
    babelOptions: {
      plugins: ['@babel/plugin-syntax-jsx'], // Cambia aquí
    },
  },
};
