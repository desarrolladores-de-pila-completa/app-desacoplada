module.exports = {
  presets: [
    'module:@react-native/babel-preset',
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
  ],
};
