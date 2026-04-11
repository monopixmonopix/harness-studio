export interface SkillTemplate {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly body: string;
}

export const SKILL_TEMPLATES: readonly SkillTemplate[] = [
  {
    id: 'commit',
    name: 'commit',
    description: 'Create conventional git commits',
    body: [
      'When the user asks to commit:',
      '1. Run git status',
      '2. Stage relevant files',
      '3. Write conventional commit message',
      '4. Create the commit',
    ].join('\n'),
  },
  {
    id: 'review-pr',
    name: 'review-pr',
    description: 'Review a pull request',
    body: [
      'When reviewing a PR:',
      '1. Read all changed files',
      '2. Check for security issues',
      '3. Check for performance issues',
      '4. Provide constructive feedback',
    ].join('\n'),
  },
  {
    id: 'refactor',
    name: 'refactor',
    description: 'Refactor code for better quality',
    body: [
      'When asked to refactor:',
      '1. Identify code smells',
      '2. Apply SOLID principles',
      '3. Ensure tests still pass',
      '4. Keep changes minimal and focused',
    ].join('\n'),
  },
  {
    id: 'tdd',
    name: 'tdd',
    description: 'Test-driven development workflow',
    body: [
      'Follow TDD:',
      '1. Write a failing test (RED)',
      '2. Write minimal code to pass (GREEN)',
      '3. Refactor while keeping tests green (IMPROVE)',
      '4. Verify coverage >= 80%',
    ].join('\n'),
  },
  {
    id: 'debug',
    name: 'debug',
    description: 'Systematic debugging workflow',
    body: [
      'When debugging:',
      '1. Reproduce the issue',
      '2. Read error messages carefully',
      '3. Add logging to narrow down root cause',
      '4. Fix the root cause, not symptoms',
      '5. Add a test to prevent regression',
    ].join('\n'),
  },
];
