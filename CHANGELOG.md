# Changelog

All notable changes to this repository are documented here.

## [1.2.0] - 2026-09-27

### Changed
- `context: fork`: in Claude Code the skill runs in a forked subagent, so its scans and tool output stay out of the main conversation and only the result comes back.
- New "Forked Run" section: take the scope from the invocation arguments, state assumptions instead of asking mid-run, and end with a summary plus the paths of the written files.

## [1.1.1] - 2026-04-30

### Changed
- Trim `SKILL.md` frontmatter to fit the 1000-character dispatcher limit (description trim, migrate non-dispatcher fields to body).

