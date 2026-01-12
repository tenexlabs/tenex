#!/usr/bin/env node

import * as p from '@clack/prompts'
import { cmdAdd } from './commands/add'
import { cmdNew } from './commands/new'

function printUsage() {
  // Keep this short; README currently documents `init`.
  console.log(`tenex

Usage:
  tenex init [name]
  tenex new [name]
  tenex add auth
`)
}

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === '-h' || command === '--help' || command === 'help') {
    printUsage()
    return
  }

  if (command === '-v' || command === '--version' || command === 'version') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../package.json') as { version?: string }
    console.log(pkg.version ?? '0.0.0')
    return
  }

  if (command === 'init' || command === 'new') {
    await cmdNew(args.slice(1))
    return
  }

  if (command === 'add') {
    await cmdAdd(args.slice(1))
    return
  }

  p.log.error(`Unknown command: ${command}`)
  printUsage()
  process.exitCode = 1
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err)
  p.log.error(message)
  process.exitCode = 1
})
