import { join } from 'node:path';
import type { TeamsProvider } from '../lib/tenex-config';
import {
  ensureBetterAuthPlugins,
  managedFile,
  projectScaffoldPaths,
  writeAddonFiles,
} from './shared';

export async function applyTeamsAddon(
  projectDir: string,
  provider: TeamsProvider
): Promise<void> {
  if (provider !== 'organization') {
    return;
  }

  await ensureBetterAuthPlugins({
    projectDir,
    pluginImports: ['organization'],
    pluginCalls: ['organization()'],
  });

  const { srcDir } = await projectScaffoldPaths(projectDir);
  await writeAddonFiles([
    managedFile(join(srcDir, 'lib', 'teams.ts'), teamsClientSource()),
  ]);
}

function teamsClientSource(): string {
  return `export const teamScaffold = {
  provider: 'organization',
  flows: ['create-organization', 'invite-member', 'seat-aware-billing'],
} as const
`;
}
