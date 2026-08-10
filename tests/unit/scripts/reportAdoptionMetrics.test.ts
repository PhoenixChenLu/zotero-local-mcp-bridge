import { describe, expect, it } from "vitest";

import {
  collectAdoptionMetrics,
  collectGitHubMetrics,
  collectNpmMetrics,
  formatMetricsReport
} from "../../../scripts/reportAdoptionMetrics.mjs";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

describe("reportAdoptionMetrics", () => {
  it("collects GitHub repository data and counts only XPI downloads as plugin downloads", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/repos/PhoenixChenLu/zotero-local-mcp-bridge")) {
        return jsonResponse({
          stargazers_count: 8,
          forks_count: 2,
          subscribers_count: 1,
          open_issues_count: 3,
          html_url: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge"
        });
      }
      if (url.endsWith("/releases?per_page=100")) {
        return jsonResponse([
          {
            tag_name: "v0.1.59",
            published_at: "2026-07-23T12:08:52Z",
            assets: [
              { name: "zotero-local-mcp-bridge.xpi", download_count: 12 },
              { name: "updates.json", download_count: 200 },
              { name: "checksums-v0.1.59.txt", download_count: 4 }
            ]
          }
        ]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    const result = await collectGitHubMetrics({ fetchImpl });

    expect(result.stars).toBe(8);
    expect(result.totalXpiDownloads).toBe(12);
    expect(result.releases[0]).toMatchObject({ tagName: "v0.1.59", xpiDownloads: 12 });
    expect(result.authentication).toBe("unauthenticated");
  });

  it("collects the npm latest version and last-week downloads", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.startsWith("https://registry.npmjs.org/")) {
        return jsonResponse({ "dist-tags": { latest: "0.1.59" } });
      }
      if (url.startsWith("https://api.npmjs.org/downloads/point/last-week/")) {
        return jsonResponse({ downloads: 42, package: "zotero-local-mcp-bridge-stdio-adapter" });
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    await expect(collectNpmMetrics({ fetchImpl })).resolves.toEqual({
      packageName: "zotero-local-mcp-bridge-stdio-adapter",
      latestVersion: "0.1.59",
      lastWeekDownloads: 42
    });
  });

  it("keeps partial metrics and emits an actionable warning when GitHub is unavailable", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("api.github.com")) {
        return jsonResponse({ message: "API rate limit exceeded" }, 403);
      }
      if (url.startsWith("https://registry.npmjs.org/")) {
        return jsonResponse({ "dist-tags": { latest: "0.1.59" } });
      }
      return jsonResponse({ downloads: 10 });
    };

    const result = await collectAdoptionMetrics({ fetchImpl, capturedAt: new Date("2026-08-09T16:00:00Z") });

    expect(result.github).toBeUndefined();
    expect(result.npm?.lastWeekDownloads).toBe(10);
    expect(result.warnings.join(" ")).toContain("GITHUB_TOKEN");
  });

  it("formats a Markdown report without treating updates.json as installs", () => {
    const report = formatMetricsReport({
      capturedAt: "2026-08-09T16:00:00.000Z",
      github: {
        repositoryUrl: "https://github.com/PhoenixChenLu/zotero-local-mcp-bridge",
        stars: 8,
        forks: 2,
        watchers: 1,
        openIssues: 3,
        authentication: "token",
        totalXpiDownloads: 12,
        releases: [{ tagName: "v0.1.59", publishedAt: "2026-07-23T12:08:52Z", xpiDownloads: 12 }]
      },
      npm: {
        packageName: "zotero-local-mcp-bridge-stdio-adapter",
        latestVersion: "0.1.59",
        lastWeekDownloads: 42
      },
      warnings: []
    });

    expect(report).toContain("| GitHub Stars | 8 |");
    expect(report).toContain("| npm downloads (last week) | 42 |");
    expect(report).toContain("| v0.1.59 | 12 |");
    expect(report).toContain("updates.json is excluded");
  });
});
