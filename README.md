# Vura Monorepo

A monorepo containing the Vura application with frontend and backend services.

## Structure

```
vura-monorepo/
├── apps/
│   ├── backend/          # Keystone.js backend application
│   └── frontend/         # React Native/Expo frontend application
├── packages/
│   ├── config/           # Shared configuration files
│   ├── types/            # Shared TypeScript types
│   └── ui/               # Shared UI components
├── package.json          # Root package.json with shared dependencies
└── turbo.json           # Turborepo configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation

```bash
# Install all dependencies
npm install

# Install dependencies for specific workspace
npm install --workspace=apps/backend
npm install --workspace=apps/frontend
```

### Development

```bash
# Start all applications in development mode
npm run dev

# Start specific applications
npm run backend:dev
npm run frontend:dev

# Build all applications
npm run build

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Shared Configuration

The monorepo uses shared configurations for consistency across all applications:

### TypeScript

- Base configuration: `packages/config/tsconfig.base.json`
- Backend configuration: `packages/config/tsconfig.backend.json`
- Frontend configuration: `packages/config/tsconfig.frontend.json`

### ESLint

- Base configuration: `packages/config/eslint.config.js`
- Frontend configuration: `packages/config/eslint.config.frontend.js`

### Prettier

- Root configuration: `.prettierrc`

## Shared Dependencies

The following dependencies are managed at the monorepo root level:

- `typescript` - TypeScript compiler
- `eslint` - ESLint for code linting
- `@typescript-eslint/eslint-plugin` - TypeScript ESLint plugin
- `@typescript-eslint/parser` - TypeScript ESLint parser
- `prettier` - Code formatter
- `husky` - Git hooks
- `lint-staged` - Lint staged files
- `git-commit-msg-linter` - Commit message linter
- `lodash` - Utility library

## Workspace Scripts

### Root Scripts

- `dev` - Start all applications in development mode
- `build` - Build all applications
- `test` - Run tests for all applications
- `lint` - Run linting for all applications
- `type-check` - Run TypeScript type checking for all applications
- `format` - Format all code with Prettier
- `format:check` - Check code formatting with Prettier

### Application-Specific Scripts

- `backend:dev` - Start backend in development mode
- `backend:build` - Build backend application
- `frontend:dev` - Start frontend in development mode
- `frontend:build` - Build frontend application

## Adding New Dependencies

### Shared Dependencies

For dependencies used across multiple applications, add them to the root `package.json`:

```bash
npm install <package-name>
```

### Application-Specific Dependencies

For dependencies used only by a specific application:

```bash
npm install <package-name> --workspace=apps/backend
npm install <package-name> --workspace=apps/frontend
```

## Contributing

1. Make sure all tests pass: `npm run test`
2. Ensure code is properly formatted: `npm run format`
3. Check for linting issues: `npm run lint`
4. Verify TypeScript types: `npm run type-check`

### No Commits To Main

Contributors are not allowed to commit directly to `main`. This rule is enforced using git hooks. Instead, you must create a new branch off of `main` using the following naming pattern:

```
Pattern:"/^(master|main|develop){1}$|^(feature|fix|hotfix|release|BH-[^/]+)\/.+$/g"
```

Example:
`feature/my-dev-task`
`BH-[JIRA-KEY]/my-dev-task`
