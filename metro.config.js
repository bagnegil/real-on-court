// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js (and its sub-packages like functions-js / realtime-js)
// ship modern "exports" maps that Metro ignores by default, which breaks module
// resolution. Enabling package exports lets Metro resolve them correctly.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
