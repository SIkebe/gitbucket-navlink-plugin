# GitHub Configuration Files

This directory contains GitHub-specific configuration files for the GitBucket NavLink Plugin project.

## Files

### copilot-setup-steps.yml

This file defines setup steps for GitHub Copilot Coding Agent. When developers use Copilot to work on this project, these steps automatically prepare the development environment.

**What it does:**
1. Installs SBT (Scala Build Tool) version 1.6.2
2. Starts Docker Compose services (GitBucket and PostgreSQL)
3. Sets up environment variables (GITBUCKET_HOME)
4. Installs E2E test dependencies (Node.js packages and Playwright)
5. Builds and installs the plugin into the GitBucket instance

**Benefits:**
- Eliminates manual setup steps
- Ensures consistent development environment
- Speeds up onboarding for new contributors
- Reduces setup errors

For more information, see: [Customizing Copilot Coding Agent's Development Environment](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment)

### workflows/

Contains GitHub Actions CI/CD workflows:
- `scala.yml` - Build and E2E test workflow
- `dependency-graph.yml` - Dependency graph generation
