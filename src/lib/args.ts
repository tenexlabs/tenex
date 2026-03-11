export interface ParsedArgs {
  flags: Map<string, string | boolean>;
  positional: string[];
}

const SHORT_FLAG_MAP = new Map<string, string>([['y', 'yes']]);

export function parseArgs(args: string[]): ParsedArgs {
  const flags = new Map<string, string | boolean>();
  const positional: string[] = [];

  for (let index = 0; index < args.length; index++) {
    const token = args[index];
    if (!token.startsWith('-') || token === '-') {
      positional.push(token);
      continue;
    }

    if (token === '--') {
      positional.push(...args.slice(index + 1));
      break;
    }

    if (token.startsWith('--')) {
      const equalIndex = token.indexOf('=');
      if (equalIndex !== -1) {
        const name = token.slice(2, equalIndex);
        const value = token.slice(equalIndex + 1);
        flags.set(name, value);
        continue;
      }

      const name = token.slice(2);
      const next = args[index + 1];
      if (next && !next.startsWith('-')) {
        flags.set(name, next);
        index += 1;
      } else {
        flags.set(name, true);
      }
      continue;
    }

    const shortFlags = token.slice(1).split('');
    for (const shortFlag of shortFlags) {
      const mapped = SHORT_FLAG_MAP.get(shortFlag) ?? shortFlag;
      flags.set(mapped, true);
    }
  }

  return { flags, positional };
}

export function readFlag(
  parsed: ParsedArgs,
  name: string
): string | boolean | undefined {
  return parsed.flags.get(name);
}

export function readStringFlag(
  parsed: ParsedArgs,
  name: string
): string | undefined {
  const value = readFlag(parsed, name);
  return typeof value === 'string' ? value : undefined;
}

export function hasFlag(parsed: ParsedArgs, name: string): boolean {
  return parsed.flags.has(name);
}
