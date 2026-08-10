import { pathToFileURL } from "node:url";

const DEFAULT_REPOSITORY = "PhoenixChenLu/zotero-local-mcp-bridge";
const DEFAULT_NPM_PACKAGE = "zotero-local-mcp-bridge-stdio-adapter";
const REQUEST_TIMEOUT_MS = 10_000;

export async function collectGitHubMetrics(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const repository = options.repository || DEFAULT_REPOSITORY;
  const token = options.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = {
    accept: "application/vnd.github+json",
    "user-agent": "zotero-local-mcp-bridge-adoption-metrics"
  };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const [repositoryData, releasesData] = await Promise.all([
    requestJson(`https://api.github.com/repos/${repository}`, { fetchImpl, headers, service: "GitHub API" }),
    requestJson(`https://api.github.com/repos/${repository}/releases?per_page=100`, {
      fetchImpl,
      headers,
      service: "GitHub API"
    })
  ]);

  const releases = releasesData.map((release) => ({
    tagName: release.tag_name,
    publishedAt: release.published_at,
    xpiDownloads: release.assets
      .filter((asset) => asset.name.toLowerCase().endsWith(".xpi"))
      .reduce((total, asset) => total + asset.download_count, 0)
  }));

  return {
    repositoryUrl: repositoryData.html_url,
    stars: repositoryData.stargazers_count,
    forks: repositoryData.forks_count,
    watchers: repositoryData.subscribers_count,
    openIssues: repositoryData.open_issues_count,
    authentication: token ? "token" : "unauthenticated",
    totalXpiDownloads: releases.reduce((total, release) => total + release.xpiDownloads, 0),
    releases
  };
}

export async function collectNpmMetrics(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const packageName = options.packageName || DEFAULT_NPM_PACKAGE;
  const encodedPackageName = encodeURIComponent(packageName);
  const [packageData, downloadsData] = await Promise.all([
    requestJson(`https://registry.npmjs.org/${encodedPackageName}`, {
      fetchImpl,
      service: "npm registry"
    }),
    requestJson(`https://api.npmjs.org/downloads/point/last-week/${encodedPackageName}`, {
      fetchImpl,
      service: "npm downloads API"
    })
  ]);

  return {
    packageName,
    latestVersion: packageData["dist-tags"]?.latest || "unknown",
    lastWeekDownloads: downloadsData.downloads || 0
  };
}

export async function collectAdoptionMetrics(options = {}) {
  const capturedAt = (options.capturedAt || new Date()).toISOString();
  const warnings = [];
  const [githubResult, npmResult] = await Promise.allSettled([
    collectGitHubMetrics(options),
    collectNpmMetrics(options)
  ]);

  let github;
  if (githubResult.status === "fulfilled") {
    github = githubResult.value;
  } else {
    warnings.push(`GitHub metrics unavailable: ${formatError(githubResult.reason)} Set GITHUB_TOKEN to raise the API rate limit.`);
  }

  let npm;
  if (npmResult.status === "fulfilled") {
    npm = npmResult.value;
  } else {
    warnings.push(`npm metrics unavailable: ${formatError(npmResult.reason)}`);
  }

  return { capturedAt, github, npm, warnings };
}

export function formatMetricsReport(metrics) {
  const lines = [
    `## Adoption metrics - ${metrics.capturedAt}`,
    "",
    "| Metric | Value |",
    "|---|---:|"
  ];

  if (metrics.github) {
    lines.push(
      `| GitHub Stars | ${metrics.github.stars} |`,
      `| GitHub Forks | ${metrics.github.forks} |`,
      `| GitHub Watchers | ${metrics.github.watchers} |`,
      `| Open issues and PRs | ${metrics.github.openIssues} |`,
      `| Total XPI downloads | ${metrics.github.totalXpiDownloads} |`
    );
  }
  if (metrics.npm) {
    lines.push(
      `| npm latest version | ${metrics.npm.latestVersion} |`,
      `| npm downloads (last week) | ${metrics.npm.lastWeekDownloads} |`
    );
  }

  if (metrics.github?.releases.length) {
    lines.push("", "### XPI downloads by release", "", "| Release | XPI downloads |", "|---|---:|");
    for (const release of metrics.github.releases) {
      lines.push(`| ${release.tagName} | ${release.xpiDownloads} |`);
    }
  }

  lines.push("", "> Only `.xpi` release assets count as plugin downloads; updates.json is excluded.");
  if (metrics.github) {
    lines.push(`> GitHub API mode: ${metrics.github.authentication}.`);
  }
  for (const warning of metrics.warnings) {
    lines.push(`> Warning: ${warning}`);
  }
  return `${lines.join("\n")}\n`;
}

async function requestJson(url, options) {
  const response = await options.fetchImpl(url, {
    headers: options.headers,
    signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.message || detail;
    } catch {
      // Keep the HTTP status text when the response is not JSON.
    }
    throw new Error(`${options.service} request failed (${response.status}): ${detail}`);
  }
  return response.json();
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

function isDirectRun() {
  return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectRun()) {
  collectAdoptionMetrics()
    .then((metrics) => process.stdout.write(formatMetricsReport(metrics)))
    .catch((error) => {
      console.error(formatError(error));
      process.exitCode = 1;
    });
}
