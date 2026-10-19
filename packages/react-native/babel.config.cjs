// Babel for the Jest suite only — the package ships TypeScript source and the consuming app's
// Metro transpiles it.
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
