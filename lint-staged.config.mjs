export default {
  '*.{ts,tsx,js,jsx,mjs,cjs,json,md,yml,yaml}': ['prettier --write'],
  '*.{ts,tsx}': ['eslint --fix'],
};
