import { log } from '@clack/prompts';
import { inspectProjectHealth } from '../lib/doctor';
import {
  detectPackageManager,
  packageManagerExecCommand,
} from '../lib/package-manager';
import { writeDeployHandoff } from '../lib/project-readme';
import { run } from '../lib/run';

export async function cmdDeploy() {
  const projectDir = process.cwd();
  const health = await inspectProjectHealth(projectDir);

  if (health.missingLocalEnvVars.length > 0) {
    throw new Error(
      `Cannot deploy: missing local env vars ${health.missingLocalEnvVars.join(', ')}`
    );
  }
  if (!health.convexEnvError && health.missingConvexEnvVars.length > 0) {
    throw new Error(
      `Cannot deploy: missing Convex env vars ${health.missingConvexEnvVars.join(', ')}`
    );
  }

  await writeDeployHandoff(projectDir, health.manifest);

  const packageManager = await detectPackageManager(projectDir);
  const convexDeploy = packageManagerExecCommand(packageManager, 'convex', [
    'deploy',
  ]);
  log.info('Running Convex deploy...');
  await run(convexDeploy.cmd, convexDeploy.args, { cwd: projectDir });
  log.success('Convex deploy finished');
}
