## Custom Instructions for Copilot (project-local)

- Before committing, always run `sbt scalafmt` and verify formatting passes.
- After formatting, run `sbt test` and the Playwright E2E suite (`cd e2e && npm test`) locally; ensure all tests pass before pushing.
- Keep navlink behavior limited to authenticated users and support up to five nav links.
