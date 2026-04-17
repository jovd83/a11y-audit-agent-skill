---
name: a11y-audit-agent-skill
description: Run structured accessibility audits for websites and web applications using a hybrid workflow: scope representative pages, run automated scanners, perform manual verification, and deliver remediation-ready reports. Use when Codex needs to assess WCAG compliance, Section 508 or EN 301 549 alignment, accessibility risk on a page or app, or produce developer/stakeholder audit artifacts with evidence.
metadata:
  dispatcher-layer: execution
  dispatcher-lifecycle: active
  author: jovd83
  version: "1.1.0"
  dispatcher-output-artifacts: accessibility_findings, remediation_report, stakeholder_summary
  dispatcher-risk: medium
  dispatcher-writes-files: true
  dispatcher-input-artifacts: url_scope, accessibility_target, audit_constraints, repository_context
  dispatcher-capabilities: accessibility-audit, wcag-review, remediation-reporting
  dispatcher-stack-tags: accessibility, web, audit
  dispatcher-accepted-intents: run_accessibility_audit, review_wcag_compliance, generate_accessibility_report
  dispatcher-category: testing
---

## Telemetry & Logging
> [!IMPORTANT]
> All usage of this skill must be logged via the Skill Dispatcher to ensure audit logs and wallboard analytics are accurate:
> `./log-dispatch.cmd --skill <skill_name> --intent <intent> --reason <reason>` (or `./log-dispatch.sh` on Linux)

# Accessibility Audit

Use this skill to produce evidence-based accessibility audits without overstating what automation can prove.

## Core Rules

1. Treat automated scanning as triage, not full conformance proof.
2. Ask whether the user wants a single page, a representative sample, or a full application surface.
3. Default to WCAG 2.2 AA unless the user specifies a different target.
4. Keep automated findings, manual findings, and `needs-review` items separate.
5. Do not claim legal certification or formal conformance unless the user explicitly asks for a limited gap assessment and the evidence supports that framing.
6. Prefer representative route coverage over crawling every reachable URL.
7. Record evidence for every non-trivial finding: page, selector or component, WCAG mapping, impact, explanation, and remediation.

## Memory Model

- Runtime memory: current audit scope, notes, tool outputs, and evidence
- Project-local memory: local fixtures, approved route inventories, or saved baselines in this repo
- Shared memory: out of scope unless the user explicitly asks to promote stable cross-project conventions through a separate shared-memory skill

Do not automatically promote runtime observations into persistent storage.

## Inputs To Confirm

Confirm or infer:

- target URL or entry point
- scope type: single page, representative sample, or broader crawl
- standard and level such as `wcag22aa`, `wcag21aa`, `section508`, or `en301549`
- primary tool: `axe`, `pa11y`, or `lighthouse`
- whether authentication or browser-session replay is required
- authentication or environment constraints
- whether the user wants developer detail, stakeholder summary, or both

Defaults:

- scope: representative sample
- standard: `wcag22aa`
- tool: `axe`
- deliverables: JSON findings envelope, HTML report, concise markdown summary

## Workflow

### 1. Scope the audit

For a single page, audit the supplied URL directly.

For a broader surface:

1. Run `node scripts/crawler.js --url <URL>`.
2. If authentication or client-side navigation is required, run `node scripts/crawler-browser.js --url <URL> --session-config <config> --storage-state <state>`.
3. Review discovered routes.
4. Select representative pages covering key templates and high-risk flows:
   - landing or home
   - navigation-heavy page
   - form or authentication flow
   - search or listing page
   - detail page
   - checkout, settings, or other critical workflow when present

If discovery fails, fall back to user-supplied routes or a manually selected sample.

### 2. Run automated assessment

```bash
node scripts/audit.js --url <URL> --tool axe --standard wcag22aa --output sandbox/<slug>.json
```

For authenticated or interaction-dependent pages, use:

```bash
node scripts/audit-browser.js --url <URL> --standard wcag22aa --session-config examples/session-config.example.json --storage-state sandbox/auth/state.json --capture-screenshots --output sandbox/<slug>.json
```

Use the generated JSON envelope as the canonical machine-readable artifact. Read [references/output-contract.md](references/output-contract.md) when you need the exact field contract.

### 3. Prioritize manual verification

Always inspect:

- `needs-review` items from the scanner
- keyboard access and focus behavior
- heading structure and landmarks
- form labeling, validation, and error recovery
- contrast cases that automation may miss
- custom widgets, dialogs, menus, comboboxes, and dynamic status messages

Use [references/manual-check-guide.md](references/manual-check-guide.md) and [references/wcag-quickref.md](references/wcag-quickref.md) as needed.

### 4. Produce evidence-based findings

For manual findings, use this minimum shape:

```json
{
  "source": "manual",
  "status": "violation",
  "impact": "serious",
  "pageUrl": "https://example.com/contact",
  "ruleId": "KB-02",
  "wcag": ["2.4.7", "2.4.13"],
  "selector": "button.submit",
  "summary": "Keyboard focus is not visually apparent on the primary submit button.",
  "evidence": "Focus outline is removed by custom CSS.",
  "remediation": "Restore a visible focus indicator with sufficient contrast and persistent styling."
}
```

If screenshots are available, store them in `sandbox/screenshots/` and reference them relative to the report.

### 5. Deliver the report

```bash
node scripts/generate-html-report.js sandbox/<slug>.json sandbox/<slug>.html
```

Deliver:

- the JSON findings envelope
- the HTML report
- a short markdown summary covering scope, standard, highest-severity issues, manual outcomes, remediation priorities, and known limitations
- when multiple runs exist, a trend/baseline report generated with `scripts/aggregate-runs.js`

## Guardrails

- Do not describe a site as accessible based only on automated results.
- Do not claim full WCAG conformance from a small sample without clearly stating the scope.
- If the product requires authentication, state what was and was not tested.
- If the user cites a jurisdiction, map it to the closest WCAG baseline and call out any extra obligations with [references/legal-standards.md](references/legal-standards.md).
- If a tool fails because of auth, CSP, timing, or bot protection, say so plainly and switch to a reduced-scope or manual-first path.

## Failure Handling

- If automated scanning fails, return a partial result with the failure reason and continue manually when possible.
- If crawling returns too many URLs, collapse to representative templates.
- If the target is a single-page app, increase wait time or use the most suitable tool.
- If the target requires authentication, prefer `crawler-browser.js` and `audit-browser.js` with a session config and storage state.
- Validate non-trivial session configs with `scripts/validate-session-config.js` before long-running audits.
- If evidence is incomplete, mark the finding `needs-review` instead of guessing.

## Bundled Resources

- `scripts/audit.js`: run a normalized automated audit
- `scripts/crawler.js`: discover representative same-origin routes
- `scripts/generate-html-report.js`: render a portable HTML report
- `scripts/audit-browser.js`: run authenticated or browser-backed audits with screenshot capture
- `scripts/crawler-browser.js`: discover routes behind login or client-side navigation
- `scripts/aggregate-runs.js`: aggregate repeated audits into trend and baseline reports
- `scripts/validate-session-config.js`: validate browser session recipes
- `scripts/validate-results.js`: validate a results envelope
- `examples/session-config.example.json`: example browser session recipe
- `references/browser-session-dsl.md`: browser session config DSL reference
- `references/output-contract.md`: JSON contract and field semantics
- `references/manual-check-guide.md`: manual verification checklist
- `references/wcag-quickref.md`: WCAG lookup table
- `references/legal-standards.md`: jurisdiction mapping
- `references/evaluation.md`: evaluation strategy for maintaining the skill
- `assets/report-template.md`: markdown report structure

## Examples

```bash
node scripts/crawler.js --url https://example.com --output sandbox/routes.json
node scripts/audit.js --url https://example.com/contact --tool axe --standard wcag22aa --output sandbox/contact.json
node scripts/generate-html-report.js sandbox/contact.json sandbox/contact.html
```

```bash
node scripts/crawler-browser.js --url https://example.com/app --session-config examples/session-config.example.json --storage-state sandbox/auth/state.json --output sandbox/routes-auth.json
node scripts/audit-browser.js --url https://example.com/app/account --session-config examples/session-config.example.json --storage-state sandbox/auth/state.json --capture-screenshots --run-id nightly-2026-03-20 --output sandbox/runs/account.json
node scripts/validate-session-config.js examples/session-config.example.json
node scripts/aggregate-runs.js --input-dir sandbox/runs --output sandbox/trends.json --html-output sandbox/trends.html
```

```bash
node scripts/validate-results.js examples/sample-audit-results.json
```