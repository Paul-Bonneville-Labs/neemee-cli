import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';

const CONFIG_DIR = join(homedir(), '.config', 'neemee');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

interface Config {
  apiKey?: string;
  baseUrl?: string;
}

export function readConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) as Config;
  } catch {
    return {};
  }
}

export function writeConfig(updates: Partial<Config>): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const current = readConfig();
  writeFileSync(CONFIG_FILE, JSON.stringify({ ...current, ...updates }, null, 2));
}

export function getApiKey(): string {
  const envKey = process.env.NEEMEE_API_KEY?.trim();
  if (envKey) return envKey;

  const config = readConfig();
  if (!config.apiKey) {
    console.error('No API key configured. Set NEEMEE_API_KEY env var or run: neemee config set-key <your-api-key>');
    process.exit(1);
  }
  return config.apiKey;
}

export function getApiKeySource(): 'env' | 'config' | 'none' {
  if (process.env.NEEMEE_API_KEY?.trim()) return 'env';
  if (readConfig().apiKey) return 'config';
  return 'none';
}

export function getBaseUrl(): string {
  return process.env.NEEMEE_BASE_URL?.trim() || readConfig().baseUrl || 'https://neemee.app';
}
