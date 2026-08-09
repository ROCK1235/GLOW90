// Metro statically replaces `process.env.EXPO_PUBLIC_*` at build time.
// Scoped ambient declaration instead of @types/node, which would leak
// Node.js-only globals (fs, process.exit, ...) that don't exist at runtime here.
declare const process: {
  env: {
    readonly EXPO_PUBLIC_API_URL?: string;
  };
};
