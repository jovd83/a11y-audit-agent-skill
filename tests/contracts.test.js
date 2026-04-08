"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { summarizeFindings, validateEnvelope } = require("../scripts/lib/contracts");
const { classifyRoute, parseHtmlLinks, parseSitemapUrls } = require("../scripts/crawler");
const { generateHtml } = require("../scripts/generate-html-report");
const { compareRuns, groupRuns } = require("../scripts/aggregate-runs");
const { expandActions, loadSessionConfig, resolveActionValue, resolveRouteProfile } = require("../scripts/lib/browser-session");

const sampleEnvelope = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "examples", "sample-audit-results.json"), "utf8")
);

test("validateEnvelope accepts the sample fixture", () => {
  assert.deepEqual(validateEnvelope(sampleEnvelope), []);
});

test("summarizeFindings computes counts by impact and status", () => {
  const summary = summarizeFindings(sampleEnvelope.findings);
  assert.equal(summary.total, 3);
  assert.equal(summary.byImpact.serious, 1);
  assert.equal(summary.byStatus["needs-review"], 1);
});

test("crawler extracts links from HTML", () => {
  const html = "<a href=\"/contact\">Contact</a><a href=\"https://example.com/products\">Products</a>";
  const links = parseHtmlLinks(html, "https://example.com");
  assert.equal(links.length, 2);
});

test("crawler parses sitemap locations", () => {
  const xml = "<urlset><url><loc>https://example.com/contact</loc></url></urlset>";
  assert.deepEqual(parseSitemapUrls(xml), ["https://example.com/contact"]);
});

test("crawler classifies high-risk routes", () => {
  assert.equal(classifyRoute("/login").priority, "critical");
  assert.equal(classifyRoute("/products").type, "listing");
});

test("report generator renders sample content", () => {
  const html = generateHtml(sampleEnvelope);
  assert.match(html, /Accessibility Audit Report/);
  assert.match(html, /Form controls must have labels/);
});

test("aggregation groups pages by run id", () => {
  const secondPage = structuredClone(sampleEnvelope);
  secondPage.__file = "run1-page2.json";
  secondPage.metadata.url = "https://example.com/products";
  secondPage.findings = secondPage.findings.slice(0, 1);

  const firstPage = structuredClone(sampleEnvelope);
  firstPage.__file = "run1-page1.json";

  const grouped = groupRuns([firstPage, secondPage]);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].pageCount, 2);
});

test("aggregation computes deltas between baseline and latest runs", () => {
  const baseline = {
    runId: "baseline",
    summary: { byImpact: { critical: 0, serious: 1, moderate: 1, minor: 0 } },
    pages: [{ url: "https://example.com/contact", summary: { byStatus: { violation: 1 } } }]
  };
  const latest = {
    runId: "latest",
    summary: { byImpact: { critical: 1, serious: 1, moderate: 0, minor: 0 } },
    pages: [{ url: "https://example.com/contact", summary: { byStatus: { violation: 3 } } }]
  };

  const comparison = compareRuns(baseline, latest);
  assert.equal(comparison.summaryDelta.critical, 1);
  assert.equal(comparison.pageDelta[0].deltaViolations, 2);
});

test("session config supports reusable library actions", () => {
  const sessionConfig = loadSessionConfig(path.join(__dirname, "..", "examples", "session-config.example.json"));
  const expanded = expandActions([{ use: "login-form" }], sessionConfig);
  assert.equal(expanded.length, 4);
});

test("session config resolves secrets and variables", () => {
  process.env.A11Y_USERNAME = "tester@example.com";
  const sessionConfig = loadSessionConfig(path.join(__dirname, "..", "examples", "session-config.example.json"));
  assert.equal(resolveActionValue("${secret:username}", sessionConfig), "tester@example.com");
  assert.match(resolveActionValue("${baseUrl}/app/${tenant}", sessionConfig), /example\.com\/app\/acme/);
});

test("session config resolves matching route profiles", () => {
  const sessionConfig = loadSessionConfig(path.join(__dirname, "..", "examples", "session-config.example.json"));
  const profile = resolveRouteProfile(sessionConfig, "https://example.com/account/profile");
  assert.equal(profile.name, "account-pages");
});
