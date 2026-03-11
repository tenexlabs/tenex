import { log } from '@clack/prompts';
import { inspectProjectHealth } from '../lib/doctor';
import { formatAddonSummary } from '../lib/tenex-config';

export async function cmdDoctor() {
  const result = await inspectProjectHealth(process.cwd());

  log.info(`Template: ${result.manifest.template}`);
  log.info(`Addons: ${formatAddonSummary(result.manifest).join(', ')}`);

  if (result.missingLocalEnvVars.length === 0) {
    log.success('Local env looks good');
  } else {
    log.error(
      `Missing local env vars: ${result.missingLocalEnvVars.join(', ')}`
    );
  }

  if (result.convexEnvError) {
    log.warn(`Could not verify Convex env vars: ${result.convexEnvError}`);
  } else if (result.missingConvexEnvVars.length === 0) {
    log.success('Convex env looks good');
  } else {
    log.error(
      `Missing Convex env vars: ${result.missingConvexEnvVars.join(', ')}`
    );
  }

  if (
    result.missingLocalEnvVars.length > 0 ||
    (!result.convexEnvError && result.missingConvexEnvVars.length > 0)
  ) {
    process.exitCode = 1;
  }
}
