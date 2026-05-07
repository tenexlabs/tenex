import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGeneratedDocs } from './update-generated-docs.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const LINE_BREAK_REGEX = /\r\n|\r|\n/;
const MAX_AGENTS_LINES = 120;

const REQUIRED_DIRS = [
  'docs',
  'docs/design-docs',
  'docs/exec-plans',
  'docs/exec-plans/active',
  'docs/exec-plans/backlog',
  'docs/exec-plans/completed',
  'docs/exec-plans/templates',
  'docs/exec-plans/todo',
  'docs/generated',
  'docs/product-specs',
  'docs/references',
  'docs/reviews',
  'scripts',
];

const REQUIRED_FILES = [
  'AGENTS.md',
  'ARCHITECTURE.md',
  '.claude/CLAUDE.md',
  '.factory/agents.md',
  'docs/README.md',
  'docs/CODE_STANDARDS.md',
  'docs/DESIGN.md',
  'docs/FRONTEND.md',
  'docs/PLANS.md',
  'docs/PRODUCT_SENSE.md',
  'docs/QUALITY_SCORE.md',
  'docs/RELIABILITY.md',
  'docs/SECURITY.md',
  'docs/design-docs/index.md',
  'docs/design-docs/core-beliefs.md',
  'docs/design-docs/agent-first-workflow.md',
  'docs/exec-plans/README.md',
  'docs/exec-plans/tech-debt-tracker.md',
  'docs/exec-plans/templates/exec-plan-template.md',
  'docs/generated/README.md',
  'docs/generated/cli-surface.md',
  'docs/generated/source-inventory.md',
  'docs/product-specs/index.md',
  'docs/product-specs/tenex-cli.md',
  'docs/product-specs/generated-app-contract.md',
  'docs/references/README.md',
  'docs/references/harness-engineering.md',
  'docs/reviews/README.md',
  'scripts/update-generated-docs.mjs',
  'scripts/check-agent-harness.mjs',
];

const REQUIRED_AGENTS_LINKS = [
  'ARCHITECTURE.md',
  'docs/README.md',
  'docs/CODE_STANDARDS.md',
  'docs/exec-plans/active/',
  'docs/generated/',
];

const REQUIRED_DOC_INDEX_LINKS = [
  'CODE_STANDARDS.md',
  'DESIGN.md',
  'FRONTEND.md',
  'PLANS.md',
  'PRODUCT_SENSE.md',
  'QUALITY_SCORE.md',
  'RELIABILITY.md',
  'SECURITY.md',
  'design-docs/',
  'exec-plans/',
  'generated/',
  'product-specs/',
  'references/',
  'reviews/',
];

const pathExists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
};

const assertDirectory = async (relativePath, errors) => {
  const absolutePath = join(repoRoot, relativePath);
  try {
    const pathStat = await stat(absolutePath);
    if (!pathStat.isDirectory()) {
      errors.push(`${relativePath} must be a directory.`);
    }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      errors.push(`${relativePath} is missing.`);
      return;
    }
    throw error;
  }
};

const assertFile = async (relativePath, errors) => {
  const absolutePath = join(repoRoot, relativePath);
  try {
    const pathStat = await stat(absolutePath);
    if (!pathStat.isFile()) {
      errors.push(`${relativePath} must be a file.`);
    }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      errors.push(`${relativePath} is missing.`);
      return;
    }
    throw error;
  }
};

const lineCount = (contents) => {
  if (contents.length === 0) {
    return 0;
  }
  return (
    contents.split(LINE_BREAK_REGEX).length - (contents.endsWith('\n') ? 1 : 0)
  );
};

const assertIncludes = (contents, expectedValues, filePath, errors) => {
  for (const expectedValue of expectedValues) {
    if (!contents.includes(expectedValue)) {
      errors.push(`${filePath} must reference ${expectedValue}.`);
    }
  }
};

const assertGeneratedDocsFresh = async (errors) => {
  const expectedDocs = await buildGeneratedDocs(repoRoot);

  for (const [relativePath, expectedContents] of expectedDocs) {
    const absolutePath = join(repoRoot, relativePath);
    if (!(await pathExists(absolutePath))) {
      errors.push(`${relativePath} is missing. Run npm run docs:generate.`);
      continue;
    }

    const actualContents = await readFile(absolutePath, 'utf8');
    if (actualContents !== expectedContents) {
      errors.push(`${relativePath} is stale. Run npm run docs:generate.`);
    }
  }
};

const assertPlanDirectoriesAreUsable = async (errors) => {
  for (const relativePath of [
    'docs/exec-plans/active',
    'docs/exec-plans/backlog',
    'docs/exec-plans/completed',
    'docs/exec-plans/todo',
  ]) {
    const entries = await readdir(join(repoRoot, relativePath));
    if (entries.length === 0) {
      errors.push(`${relativePath} must contain .gitkeep or plan files.`);
    }
  }
};

const main = async () => {
  const errors = [];

  for (const dir of REQUIRED_DIRS) {
    await assertDirectory(dir, errors);
  }

  for (const file of REQUIRED_FILES) {
    await assertFile(file, errors);
  }

  const agentsContents = await readFile(join(repoRoot, 'AGENTS.md'), 'utf8');
  const docIndexContents = await readFile(
    join(repoRoot, 'docs/README.md'),
    'utf8'
  );

  if (lineCount(agentsContents) > MAX_AGENTS_LINES) {
    errors.push(`AGENTS.md must stay at or below ${MAX_AGENTS_LINES} lines.`);
  }

  assertIncludes(agentsContents, REQUIRED_AGENTS_LINKS, 'AGENTS.md', errors);
  assertIncludes(
    docIndexContents,
    REQUIRED_DOC_INDEX_LINKS,
    'docs/README.md',
    errors
  );

  await assertPlanDirectoriesAreUsable(errors);
  await assertGeneratedDocsFresh(errors);

  if (errors.length > 0) {
    console.error('Harness check failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Harness check passed.');
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
