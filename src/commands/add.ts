import * as p from '@clack/prompts'
import { addAuth } from './addAuth'

export async function cmdAdd(args: string[]) {
  const addon = args[0]
  if (!addon) {
    p.log.error('Usage: tenex add <auth>')
    process.exitCode = 1
    return
  }

  if (addon === 'auth') {
    await addAuth(process.cwd())
    return
  }

  p.log.error(`Unknown add-on: ${addon}`)
  process.exitCode = 1
}
