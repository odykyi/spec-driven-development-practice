import { describe, it, expect } from 'vitest';
import { SpecParser } from '../parser/spec-parser.js';

describe('SpecParser', () => {
  const parser = new SpecParser();

  it('should parse a basic specification document', () => {
    const markdown = `# User Authentication

## ADDED Requirements

### Requirement: User can log in
Users SHALL be able to log in with email and password.

#### Scenario: Successful login
- **WHEN** user enters valid credentials
- **THEN** system authenticates the user
- **THEN** system redirects to dashboard

#### Scenario: Failed login
- **WHEN** user enters invalid credentials
- **THEN** system shows error message
- **THEN** system stays on login page
`;

    const spec = parser.parse(markdown);

    expect(spec.title).toBe('User Authentication');
    expect(spec.requirements).toHaveLength(1);
    expect(spec.requirements[0].name).toBe('User can log in');
    expect(spec.requirements[0].scenarios).toHaveLength(2);
    expect(spec.requirements[0].scenarios[0].name).toBe('Successful login');
    expect(spec.requirements[0].scenarios[0].when).toHaveLength(1);
    expect(spec.requirements[0].scenarios[0].when[0]).toBe('user enters valid credentials');
    expect(spec.requirements[0].scenarios[0].then).toHaveLength(2);
  });

  it('should parse multiple requirements', () => {
    const markdown = `# API Spec

## ADDED Requirements

### Requirement: Rate limiting
The API SHALL implement rate limiting.

#### Scenario: Too many requests
- **WHEN** client exceeds 100 requests per minute
- **THEN** system returns 429 status

### Requirement: Authentication
The API SHALL require authentication.

#### Scenario: Missing token
- **WHEN** request has no auth token
- **THEN** system returns 401 status
`;

    const spec = parser.parse(markdown);

    expect(spec.requirements).toHaveLength(2);
    expect(spec.requirements[0].name).toBe('Rate limiting');
    expect(spec.requirements[1].name).toBe('Authentication');
  });

  it('should handle empty document', () => {
    const spec = parser.parse('');
    
    expect(spec.title).toBe('');
    expect(spec.requirements).toHaveLength(0);
  });

  it('should parse AST structure', () => {
    const markdown = `# Title

Some text

- Item 1
- Item 2
`;

    const ast = parser.parseToAST(markdown);

    expect(ast.type).toBe('document');
    expect(ast.children.length).toBeGreaterThan(0);
  });
});
