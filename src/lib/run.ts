import { spawn } from 'node:child_process'

export type RunOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
}

export async function run(cmd: string, args: string[], options: RunOptions = {}) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) return resolve()
      reject(
        new Error(
          `${cmd} ${args.join(' ')} exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`,
        ),
      )
    })
  })
}
