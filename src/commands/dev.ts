import { type ChildProcess, spawn } from 'node:child_process';
import { log } from '@clack/prompts';
import {
  detectPackageManager,
  packageManagerExecCommand,
  packageManagerRunScriptCommand,
} from '../lib/package-manager';

export async function cmdDev() {
  const projectDir = process.cwd();
  const packageManager = await detectPackageManager(projectDir);
  const convex = packageManagerExecCommand(packageManager, 'convex', ['dev']);
  const app = packageManagerRunScriptCommand(packageManager, 'dev');

  log.info(`Starting Convex with ${packageManager}`);

  const convexChild = spawnProcess(convex.cmd, convex.args, projectDir);
  const appChild = spawnProcess(app.cmd, app.args, projectDir);
  const childProcesses = [convexChild, appChild];

  const stop = () => {
    for (const child of childProcesses) {
      if (!child.killed) {
        child.kill('SIGTERM');
      }
    }
  };

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  const exitCodes = await Promise.all(
    childProcesses.map(async (child) => {
      const exitCode = await waitForChild(child);
      stop();
      return exitCode;
    })
  );

  process.off('SIGINT', stop);
  process.off('SIGTERM', stop);

  const firstFailure = exitCodes.find((code) => code !== 0) ?? 0;
  process.exitCode = firstFailure;
}

function spawnProcess(cmd: string, args: string[], cwd: string): ChildProcess {
  return spawn(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

async function waitForChild(child: ChildProcess): Promise<number> {
  return await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => {
      resolve(code ?? 1);
    });
  });
}
