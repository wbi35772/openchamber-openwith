/**
 * Proxy-aware HTTP requests for the marketplace.
 *
 * The service runs inside the OpenChamber host, where the global `fetch` does
 * not accept a per-request proxy. Requests that must use the configured proxy
 * are executed through the system `curl`, which already understands http,
 * https and socks5 upstreams on every supported platform.
 */

import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export interface SimpleResponse {
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  json(): Promise<unknown>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface CurlResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

const run = (command: string, args: string[]): Promise<CurlResult> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => out.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => err.push(chunk));
    child.on('error', (error) => reject(error));
    child.on('close', (code) =>
      resolve({
        stdout: Buffer.concat(out).toString('utf8'),
        stderr: Buffer.concat(err).toString('utf8').trim(),
        code,
      }),
    );
  });

/** Parse the final header block emitted by `curl -D -` (redirects add earlier blocks). */
const parseHeaders = (dump: string): Map<string, string> => {
  const blocks = dump.split(/\r?\n\r?\n/).filter((block) => block.trim().length > 0);
  const block = [...blocks].reverse().find((item) => /^HTTP\//i.test(item.trim()));
  const map = new Map<string, string>();
  if (!block) return map;
  for (const line of block.trim().split(/\r?\n/).slice(1)) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    map.set(line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim());
  }
  return map;
};

const headerArgs = (headers: RequestInit['headers']): string[] => {
  const args: string[] = [];
  if (!headers) return args;
  const entries =
    headers instanceof Headers
      ? [...headers.entries()]
      : Array.isArray(headers)
        ? headers.map(([name, value]) => [name, String(value)] as [string, string])
        : Object.entries(headers as Record<string, string>);
  for (const [name, value] of entries) {
    if (!name || value === undefined || value === null) continue;
    args.push('-H', `${name}: ${value}`);
  }
  return args;
};

export async function fetchViaProxy(
  url: string,
  init: RequestInit,
  proxy: string,
  timeoutMs = 12_000,
): Promise<SimpleResponse> {
  const dir = await mkdtemp(path.join(tmpdir(), 'openwith-proxy-'));
  try {
    const bodyFile = path.join(dir, 'body');
    const args = [
      '-sS',
      '-L',
      '--max-time',
      String(Math.max(1, Math.ceil(timeoutMs / 1000))),
      '--proxy',
      proxy,
      '-o',
      bodyFile,
      '-D',
      '-',
      '-w',
      '\n%{http_code}',
      ...headerArgs(init.headers),
      url,
    ];
    if (init.method && init.method.toUpperCase() !== 'GET') {
      args.unshift('-X', init.method.toUpperCase());
    }
    const result = await run('curl', args);
    if (result.code !== 0) {
      throw new Error(result.stderr || `curl exited with ${result.code ?? 'no status'}`);
    }
    const marker = result.stdout.lastIndexOf('\n');
    const status = Number(result.stdout.slice(marker + 1).trim()) || 0;
    const headerDump = result.stdout.slice(0, marker);
    const headers = parseHeaders(headerDump);
    const body = await readFile(bodyFile);
    const buffer = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
    return {
      status,
      ok: status >= 200 && status < 300,
      headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
      text: async () => body.toString('utf8'),
      json: async () => JSON.parse(body.toString('utf8')) as unknown,
      arrayBuffer: async () => buffer,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
