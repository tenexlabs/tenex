export function parseDotenv(contents: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) out[key] = value
  }
  return out
}

export function upsertDotenvVar(
  contents: string,
  key: string,
  value: string,
): string {
  const lines = contents ? contents.split(/\r?\n/) : []
  const newLine = `${key}=${value}`

  let found = false
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = newLine
      found = true
      break
    }
  }
  if (!found) {
    if (lines.length && lines[lines.length - 1] !== '') lines.push('')
    lines.push(newLine)
  }
  return lines.join('\n').replace(/\n+$/, '\n')
}
