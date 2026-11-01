import neverthrow from '@ninoseki/eslint-plugin-neverthrow'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']), {
  name: 'app/neverthrow',
  files: ['**/*.{ts,mts,tsx}'],

  plugins: { neverthrow },

  rules: {
    'neverthrow/must-use-result': 'error',
  },

  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: true,
    },
  },
})
