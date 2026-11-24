
import { defineConfig, type Rolldown } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const IGNORED_SERVER_WARNINGS = new Set([
  'EVAL',
  'CIRCULAR_DEPENDENCY',
  'THIS_IS_UNDEFINED',
  'EMPTY_BUNDLE',
  'MODULE_LEVEL_DIRECTIVE',
])

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tanstackStart(),
    nitro({
      rollupConfig: {
        external: [/^@sentry\//],
        onwarn(
          warning: Rolldown.RolldownLog,
          warn: Rolldown.LoggingFunction,
        ) {
          if (IGNORED_SERVER_WARNINGS.has(warning.code ?? '')) return
          warn(warning)
        },
      },
    }),
    tailwindcss(),
    viteReact(),
  ],
})
