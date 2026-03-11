import { join } from 'node:path';
import type { InstallPackage } from '../lib/package-manager';
import type { EmailProvider } from '../lib/tenex-config';
import {
  ensureConvexComponentInConfig,
  managedFile,
  projectScaffoldPaths,
  writeAddonFiles,
} from './shared';

export function emailPackages(provider: EmailProvider): InstallPackage[] {
  if (provider !== 'resend') {
    return [];
  }
  return [{ name: '@convex-dev/resend' }, { name: 'resend' }];
}

export async function applyEmailAddon(
  projectDir: string,
  provider: EmailProvider
): Promise<void> {
  if (provider !== 'resend') {
    return;
  }

  await ensureConvexComponentInConfig({
    importName: 'resend',
    importPath: '@convex-dev/resend/convex.config',
    projectDir,
    useStatement: 'app.use(resend)',
  });

  const { srcDir } = await projectScaffoldPaths(projectDir);
  await writeAddonFiles([
    managedFile(join(projectDir, 'convex', 'email.ts'), emailServerSource()),
    managedFile(join(srcDir, 'lib', 'email.ts'), emailClientSource()),
    managedFile(
      join(srcDir, 'emails', 'transactional.ts'),
      emailTemplatesSource()
    ),
  ]);
}

function emailServerSource(): string {
  return `import { action } from './_generated/server'

export const sendTransactionalEmail = action({
  args: {},
  handler: async () => {
    return {
      ok: true,
      provider: 'resend',
      note: 'Wire this action into the Resend component for invites, resets, verification, and onboarding.',
    }
  },
})
`;
}

function emailClientSource(): string {
  return `export const emailScaffold = {
  provider: 'resend',
  flows: ['invite', 'reset-password', 'verification', 'onboarding'],
} as const
`;
}

function emailTemplatesSource(): string {
  return `export function inviteEmailTemplate(inviteUrl: string): string {
  return \`Invite your teammate by visiting \${inviteUrl}\`
}

export function resetPasswordTemplate(resetUrl: string): string {
  return \`Reset your password by visiting \${resetUrl}\`
}

export function verificationTemplate(verificationUrl: string): string {
  return \`Verify your email by visiting \${verificationUrl}\`
}
`;
}
