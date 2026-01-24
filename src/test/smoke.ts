import { BETTER_AUTH_VERSION, generateBetterAuthSecret } from '../addons/auth';
import { sanitizeProjectName } from '../lib/project-name';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  sanitizeProjectName('My App') === 'my-app',
  'sanitizeProjectName failed'
);
assert(BETTER_AUTH_VERSION === '1.4.9', 'Unexpected BETTER_AUTH_VERSION');

const secret = generateBetterAuthSecret();
assert(
  typeof secret === 'string' && secret.length > 10,
  'Bad secret generation'
);

console.log('smoke test ok');
