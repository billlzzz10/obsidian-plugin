import esbuild from 'esbuild';
import pkg from './package.json' assert { type: 'json' };
const { dependencies } = pkg;

const external = [
  ...Object.keys(dependencies || {}),
  'obsidian',
  'electron',
  'fs', 'path', 'os', 'crypto', 'stream', 'zlib', 'util', 'buffer', 'child_process', 'worker_threads', 'perf_hooks', 'url', 'http', 'https', 'net', 'tls', 'events', 'assert', 'tty', 'readline', 'constants', 'timers', 'dns', 'dgram', 'module', 'repl', 'v8', 'vm', 'inspector', 'async_hooks', 'cluster', 'domain', 'punycode', 'querystring', 'string_decoder', 'sys', 'trace_events', 'wasi', 'node:fs', 'node:path', 'node:os', 'node:crypto', 'node:stream', 'node:zlib', 'node:util', 'node:buffer', 'node:child_process', 'node:worker_threads', 'node:perf_hooks', 'node:url', 'node:http', 'node:https', 'node:net', 'node:tls', 'node:events', 'node:assert', 'node:tty', 'node:readline', 'node:constants', 'node:timers', 'node:dns', 'node:dgram', 'node:module', 'node:repl', 'node:v8', 'node:vm', 'node:inspector', 'node:async_hooks', 'node:cluster', 'node:domain', 'node:punycode', 'node:querystring', 'node:string_decoder', 'node:sys', 'node:trace_events', 'node:wasi'
];

esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'main.js',
  platform: 'browser',
  target: ['es2020'],
  format: 'cjs',
  external,
  minify: true,
  sourcemap: false,
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'window',
  },
  logLevel: 'info',
}).catch(() => process.exit(1));
