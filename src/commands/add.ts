import { log } from '@clack/prompts';
import { addAuth } from './add-auth';

export async function cmdAdd(args: string[]) {
  const addon = args[0];
  if (!addon) {
    log.error('Usage: tenex add <auth>');
    process.exitCode = 1;
    return;
  }

  if (addon === 'auth') {
    await addAuth(process.cwd());
    return;
  }

  log.error(`Unknown add-on: ${addon}`);
  process.exitCode = 1;
}
