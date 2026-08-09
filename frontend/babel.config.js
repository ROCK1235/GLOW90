module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-detects react-native-worklets/reanimated and
    // injects their babel plugin — do not add it manually, it would run twice.
    presets: ['babel-preset-expo'],
  };
};
