import { join } from 'node:path';
import { pathExists } from './fs';

export async function resolveAppSourceDir(projectDir: string): Promise<string> {
  const src = join(projectDir, 'src');
  const app = join(projectDir, 'app');

  const srcScore = await scoreAppDir(src);
  const appScore = await scoreAppDir(app);

  if (srcScore === 0 && appScore === 0) {
    if (await pathExists(src)) {
      return src;
    }
    if (await pathExists(app)) {
      return app;
    }
    throw new Error(
      'Could not find app source directory (expected src/ or app/)'
    );
  }

  if (appScore > srcScore) {
    return app;
  }
  return src;
}

async function scoreAppDir(dir: string): Promise<number> {
  if (!(await pathExists(dir))) {
    return 0;
  }

  let score = 1;
  if (await pathExists(join(dir, 'routes', '__root.tsx'))) {
    score += 4;
  }
  if (await pathExists(join(dir, 'routes'))) {
    score += 2;
  }
  if (await pathExists(join(dir, 'router.tsx'))) {
    score += 2;
  }

  return score;
}
