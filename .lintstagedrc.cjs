module.exports = {
  '*.{cjs,js,mjs,ts}': ['pnpm format:fix', 'pnpm lint:fix'],
  '*.{json}': ['pnpm format:fix'],
}
