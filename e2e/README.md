# E2E Tests for GitBucket NavLink Plugin

This directory contains end-to-end tests for the GitBucket NavLink Plugin using Playwright.

## Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- GitBucket instance running on http://localhost:8080

## Setup

1. Install dependencies:
```bash
cd e2e
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Running the Tests

### With Docker Compose (Recommended)

1. Start GitBucket and PostgreSQL:
```bash
cd ..
docker compose up -d
```

2. Wait for GitBucket to be ready (usually takes 30-60 seconds)

3. Build and install the plugin:
```bash
cd ..
export GITBUCKET_HOME=$(pwd)/docker
sbt install
```

4. Restart GitBucket to load the plugin:
```bash
docker compose restart gitbucket
```

5. Wait for GitBucket to restart, then run the tests:
```bash
cd e2e
npm test
```

### Test Commands

- Run all tests: `npm test`
- Run tests in headed mode (see browser): `npm run test:headed`
- Run tests in debug mode: `npm run test:debug`
- Open Playwright UI: `npm run test:ui`

## Test Structure

- `playwright.config.ts` - Playwright configuration
- `tests/navlink.spec.ts` - E2E test suite for NavLink functionality

## Test Scenarios

The test suite covers:

1. **Settings Access**: Verify admin can access NavLink settings page
2. **Settings Update**: Test updating NavLink configuration (menu name and path)
3. **Global Menu Display**: Verify NavLink appears in navigation after configuration
4. **Form Validation**: Test required field validation
5. **Data Persistence**: Verify settings persist across page reloads

## Troubleshooting

- If tests fail with connection errors, ensure GitBucket is running on http://localhost:8080
- If tests fail with timeout errors, increase the timeout in `playwright.config.ts`
- Check GitBucket logs: `docker compose logs -f gitbucket`
- If the plugin is not loaded, verify the JAR file exists in `docker/plugins/`

## CI/CD Integration

The E2E tests are integrated into the GitHub Actions workflow. They run automatically on pull requests to master and develop branches.
