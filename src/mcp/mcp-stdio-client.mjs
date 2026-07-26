import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

/** Minimal, dependency-free MCP JSON-RPC client for the official DataHub MCP server. */
export class McpStdioClient {
  constructor({ command, args = [], env = process.env, timeoutMs = 20_000 }) {
    this.command = command;
    this.args = args;
    this.env = env;
    this.timeoutMs = timeoutMs;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    if (this.child) return;
    this.child = spawn(this.command, this.args, {
      env: this.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false
    });

    this.stderr = '';
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk) => {
      this.stderr = `${this.stderr}${chunk}`.slice(-4_000);
    });

    createInterface({ input: this.child.stdout }).on('line', (line) => this.#onMessage(line));
    this.child.on('error', (error) => this.#rejectAll(error));
    this.child.on('exit', (code) => {
      if (code !== 0 && this.pending.size > 0) {
        this.#rejectAll(new Error(`DataHub MCP server exited with code ${code}. ${this.stderr}`));
      }
    });

    await this.request('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'dollar-data-context-guard', version: '0.1.0' }
    });
    this.notify('notifications/initialized', {});
  }

  async listTools() {
    await this.connect();
    const response = await this.request('tools/list', {});
    return response.tools ?? [];
  }

  async callTool(name, args) {
    await this.connect();
    return this.request('tools/call', { name, arguments: args });
  }

  notify(method, params) {
    this.#send({ jsonrpc: '2.0', method, params });
  }

  request(method, params) {
    const id = this.nextId++;
    this.#send({ jsonrpc: '2.0', id, method, params });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for DataHub MCP ${method}. ${this.stderr}`));
      }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
    });
  }

  async close() {
    if (!this.child) return;
    this.#rejectAll(new Error('MCP client closed'));
    this.child.kill();
    this.child = undefined;
  }

  #send(message) {
    if (!this.child?.stdin.writable) throw new Error('DataHub MCP server is not running.');
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  #onMessage(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return; // MCP servers may send human-readable diagnostics to stdout.
    }
    if (message.id === undefined) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    clearTimeout(pending.timer);
    if (message.error) {
      pending.reject(new Error(`MCP ${message.error.code}: ${message.error.message}`));
    } else {
      pending.resolve(message.result);
    }
  }

  #rejectAll(error) {
    for (const { reject, timer } of this.pending.values()) {
      clearTimeout(timer);
      reject(error);
    }
    this.pending.clear();
  }
}

