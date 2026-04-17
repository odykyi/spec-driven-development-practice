import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';

export interface Config {
  serverUrl?: string;
  exercisesPath?: string;
  workspacePath: string;
  authToken?: string;
  userId?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'sdd');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG: Config = {
  workspacePath: path.join(os.homedir(), 'sdd-exercises'),
  exercisesPath: './exercises',
};

export async function getConfig(): Promise<Config> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    const saved = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...saved };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function setConfig<K extends keyof Config>(
  key: K,
  value: Config[K]
): Promise<void> {
  const config = await getConfig();
  config[key] = value;
  await saveConfig(config);
}

export async function saveConfig(config: Config): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function initConfig(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  
  try {
    await fs.access(CONFIG_FILE);
  } catch {
    // Config doesn't exist, create with defaults
    await saveConfig(DEFAULT_CONFIG);
  }
}
