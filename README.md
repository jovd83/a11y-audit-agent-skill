# A11y Audit Agent Skill

[![Validate Skills](https://github.com/jovd83/a11y-audit-agent-skill/actions/workflows/validate.yml/badge.svg)](https://github.com/jovd83/a11y-audit-agent-skill/actions/workflows/validate.yml)
[![version](https://img.shields.io/badge/version-1.0.0-blue)](CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/jovd83)

Enterprise-grade AgentSkill for structured accessibility auditing of websites and web applications, including authenticated browser-backed audits, screenshot evidence capture, CI validation, and repeated-run trend reporting.

This repository provides:

- a clear skill contract for agents
- normalized JSON output for automation and reporting
- route discovery for representative page selection
- authenticated browser session support for crawl and audit flows
- automated screenshot evidence capture for browser-backed findings
- portable HTML reporting
- multi-run aggregation with baseline and trend comparison
- validation scripts, examples, and smoke tests
- GitHub-ready packaging and contribution guidance

## What This Skill Does

The skill helps an agent:

1. scope an accessibility audit
2. discover representative routes on a site
3. run automated audits with `axe`, `pa11y`, or `lighthouse`
4. separate automated findings from manual verification work
5. produce remediation-ready reports for developers and stakeholders

## What This Skill Does Not Do

- certify legal compliance
- replace expert manual testing with assistive technology
- provide shared-memory infrastructure
- persist findings outside the local repo unless the caller chooses to

## Repository Layout

```text
a11y-audit-agent-skill/
|- SKILL.md
|- README.md
|- agents/openai.yaml
|- assets/
|- examples/
|- references/
|- schemas/
|- scripts/
`- tests/
```

## Install

1. Use Node.js 18 or newer.
2. Run `npm install`.
3. Run `npm test`.

## Usage

Discover representative routes:

```bash
node scripts/crawler.js --url https://example.com --output sandbox/routes.json
```

Run an automated audit:

```bash
node scripts/audit.js --url https://example.com/contact --tool axe --standard wcag22aa --output sandbox/contact.json
```

Run an authenticated browser-backed crawl:

```bash
node scripts/crawler-browser.js --url https://example.com/app --session-config examples/session-config.example.json --storage-state sandbox/auth/state.json --output sandbox/routes-auth.json
```

Run an authenticated browser-backed audit with screenshots:

```bash
node scripts/audit-browser.js --url https://example.com/app/account --session-config examples/session-config.example.json --storage-state sandbox/auth/state.json --capture-screenshots --run-id nightly-2026-03-20 --run-label "Nightly 2026-03-20" --output sandbox/runs/account.json
```

Validate a browser session config:

```bash
node scripts/validate-session-config.js examples/session-config.example.json
```

Validate the output:

```bash
node scripts/validate-results.js sandbox/contact.json
```

Generate an HTML report:

```bash
node scripts/generate-html-report.js sandbox/contact.json sandbox/contact.html
```

Aggregate repeated runs and generate a trend report:

```bash
node scripts/aggregate-runs.js --input-dir sandbox/runs --output sandbox/trends.json --html-output sandbox/trends.html --baseline-run nightly-2026-03-01
```

## Output Model

The canonical artifact is a JSON envelope with `schemaVersion`, `metadata`, `summary`, and `findings`. Metadata now also supports run grouping, browser-mode sessions, and screenshot-aware audit runs.

See [references/output-contract.md](references/output-contract.md) and [schemas/a11y-audit.schema.json](schemas/a11y-audit.schema.json).

## Standards And Scope

Supported standards include `wcag22aa`, `wcag21aa`, `wcag20aa`, `section508`, and `en301549`.

Jurisdictional guidance lives in [references/legal-standards.md](references/legal-standards.md).

## Memory Boundaries

- Runtime memory: current task notes, route inventory, live findings
- Project-local memory: local fixtures or baselines in this repository
- Shared memory: out of scope unless explicitly integrated externally

## Validation And Maintenance

This repo includes:

- sample fixtures in [examples/](examples/)
- a results validator
- a session-config validator
- smoke tests for normalization, validation, and HTML generation
- a GitHub Actions workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml)
- an evaluation checklist in [references/evaluation.md](references/evaluation.md)

## Optional Integrations

These are related but intentionally out of scope for the current implementation:

- authenticated browser-session replay
- persistent accessibility baselines across projects outside the local repo
- shared-memory promotion of stable remediation patterns

## Session DSL

Browser session configs support:

- `actionLibrary` for reusable named action sequences
- `secrets` for stable aliases mapped to environment variables
- `variables` for string interpolation such as `${tenant}` and `${baseUrl}`
- `routeProfiles` for route-specific `afterLogin` and `beforeAudit` hooks

See [examples/session-config.example.json](examples/session-config.example.json) and [references/browser-session-dsl.md](references/browser-session-dsl.md).

## Publishability Notes

- generated files belong in `sandbox/` and are gitignored
- `node_modules/` is not part of the source distribution
- the report generator is self-contained and does not depend on hosted fonts or external CSS
