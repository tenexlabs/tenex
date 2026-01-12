import * as path from 'node:path'
import * as p from '@clack/prompts'
import { cancel, isCancel } from '@clack/prompts'
import { addAuth } from './addAuth'
import { pathExists, removeDir } from '../lib/fs'
import { sanitizeProjectName } from '../lib/projectName'
import { run } from '../lib/run'

export async function cmdNew(args: string[]) {
  let projectName = args[0]

  if (!projectName) {
    const nameInput = await p.text({
      message: 'Project name',
      placeholder: 'my-app',
      defaultValue: 'my-app',
    })
    if (isCancel(nameInput) || !nameInput) {
      cancel('Operation cancelled.')
      return
    }
    projectName = nameInput
  }

  const sanitizedName = sanitizeProjectName(projectName)
  if (sanitizedName !== projectName) {
    p.log.warn(`Project name sanitized: "${projectName}" → "${sanitizedName}"`)
    projectName = sanitizedName
  }
  if (!projectName) {
    p.log.error('Invalid project name')
    process.exitCode = 1
    return
  }

  const projectDir = path.resolve(process.cwd(), projectName)

  if (await pathExists(projectDir)) {
    p.log.warn(`Directory "${projectName}" already exists`)
    const choice = await p.select({
      message: 'What would you like to do?',
      options: [
        { value: 'overwrite', label: 'Overwrite the existing directory' },
        { value: 'cancel', label: 'Cancel' },
      ],
      initialValue: 'cancel',
    })
    if (isCancel(choice) || choice === 'cancel') {
      cancel('Operation cancelled.')
      return
    }
    await removeDir(projectDir)
  }

  p.log.info('Scaffolding TanStack Start + Convex...')
  await run(
    'npm',
    ['create', 'convex@latest', projectName, '--', '-t', 'tanstack-start'],
    {
      cwd: process.cwd(),
    },
  )

  p.log.info('Adding Better Auth...')
  await addAuth(projectDir)
}
