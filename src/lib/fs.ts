import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string) {
  await mkdir(dirPath, { recursive: true });
}

export async function removeDir(dirPath: string) {
  await rm(dirPath, { recursive: true, force: true });
}

export async function readTextFile(filePath: string): Promise<string> {
  return await readFile(filePath, 'utf8');
}

export async function writeTextFile(filePath: string, contents: string) {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, contents);
}

export async function writeTextFileIfChanged(
  filePath: string,
  contents: string
) {
  const exists = await pathExists(filePath);
  if (exists) {
    const current = await readTextFile(filePath);
    if (current === contents) {
      return;
    }
  }
  await writeTextFile(filePath, contents);
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readTextFile(filePath);
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, value: unknown) {
  const json = `${JSON.stringify(value, null, 2)}\n`;
  await writeTextFileIfChanged(filePath, json);
}
