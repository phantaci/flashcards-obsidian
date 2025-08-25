import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const commonPlugins = [
  typescript({
    tsconfig: './tsconfig.json',
    sourceMap: true,
    inlineSources: true,
  }),
  nodeResolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs({
    sourceMap: true,
  }),
];

const PRODUCTION_PLUGIN_CONFIG = {
  input: 'main.ts',
  output: {
    dir: '.',
    sourcemap: true,
    sourcemapExcludeSources: true,
    format: 'cjs',
    exports: 'auto',
    chunkFileNames: '[name].js',
    entryFileNames: 'main.js',
    manualChunks: undefined,
  },
  external: ['obsidian'],
  plugins: commonPlugins,
  onwarn(warning, warn) {
    if (warning.code === 'CIRCULAR_DEPENDENCY') return;
    warn(warning);
  },
};

const DEV_PLUGIN_CONFIG = {
  ...PRODUCTION_PLUGIN_CONFIG,
  output: {
    ...PRODUCTION_PLUGIN_CONFIG.output,
    dir: 'docs/test-vault/.obsidian/plugins/flashcards-obsidian/',
  },
  watch: {
    include: '**/*.ts',
    exclude: 'node_modules/**',
  },
};

const configs = [];

if (process.env.BUILD === 'production') {
  configs.push(PRODUCTION_PLUGIN_CONFIG);
} else {
  configs.push(DEV_PLUGIN_CONFIG);
}

export default configs;