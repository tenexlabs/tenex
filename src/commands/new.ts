import { resolve } from 'node:path';
import { cancel, isCancel, log, select, text } from '@clack/prompts';
import { pathExists, removeDir } from '../lib/fs';
import { sanitizeProjectName } from '../lib/project-name';
import { run } from '../lib/run';
import { addAuth } from './add-auth';

export async function cmdNew(args: string[]) {
  let projectName = args[0];

  if (!projectName) {
    const nameInput = await text({
      message: 'Project name',
      placeholder: 'my-app',
      defaultValue: 'my-app',
    });
    if (isCancel(nameInput) || !nameInput) {
      cancel('Operation cancelled.');
      return;
    }
    projectName = nameInput;
  }

  const sanitizedName = sanitizeProjectName(projectName);
  if (sanitizedName !== projectName) {
    log.warn(`Project name sanitized: "${projectName}" → "${sanitizedName}"`);
    projectName = sanitizedName;
  }
  if (!projectName) {
    log.error('Invalid project name');
    process.exitCode = 1;
    return;
  }

  const projectDir = resolve(process.cwd(), projectName);

  if (await pathExists(projectDir)) {
    log.warn(`Directory "${projectName}" already exists`);
    const choice = await select({
      message: 'What would you like to do?',
      options: [
        { value: 'overwrite', label: 'Overwrite the existing directory' },
        { value: 'cancel', label: 'Cancel' },
      ],
      initialValue: 'cancel',
    });
    if (isCancel(choice) || choice === 'cancel') {
      cancel('Operation cancelled.');
      return;
    }
    await removeDir(projectDir);
  }

  log.info('Scaffolding TanStack Start + Convex...');
  await run(
    'npm',
    ['create', 'convex@latest', projectName, '--', '-t', 'tanstack-start'],
    {
      cwd: process.cwd(),
    }
  );

  log.info('Adding Better Auth...');
  await addAuth(projectDir);
}
