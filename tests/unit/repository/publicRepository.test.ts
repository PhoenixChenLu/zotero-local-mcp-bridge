import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("public repository conversion path", () => {
  it("collects reproducible bug context without requesting secrets", async () => {
    const template = await readFile(path.resolve(".github", "ISSUE_TEMPLATE", "bug_report.yml"), "utf8");

    expect(template).toContain("MCP client");
    expect(template).toContain("doctor result");
    expect(template).toContain("Connection type");
    expect(template).not.toContain("Profile type");
    expect(template).not.toContain("confirmationToken");
    expect(template).not.toContain("API key");
  });

  it("ships contribution, funding, and release templates", async () => {
    const pullRequest = await readFile(path.resolve(".github", "pull_request_template.md"), "utf8");
    const funding = await readFile(path.resolve(".github", "FUNDING.yml"), "utf8");
    const release = await readFile(path.resolve(".github", "RELEASE_TEMPLATE.md"), "utf8");

    expect(pullRequest).toContain("Safety impact");
    expect(funding).toContain("https://ko-fi.com/phoenixchen");
    expect(funding).toContain("https://afdian.com/a/PhoenixChen");
    expect(release).toContain("Release assets");
    expect(release).toContain(".mcpb");
  });

  it("documents a read-only first query and all supported installation assets", async () => {
    const readme = await readFile(path.resolve("README.md"), "utf8");
    const chinese = await readFile(path.resolve("README.zh-CN.md"), "utf8");

    expect(readme).toContain("### 6. Run The First Read-Only Query");
    expect(readme).toContain("Claude Desktop MCPB");
    expect(chinese).toContain("### 6. 执行第一个只读查询");
    expect(chinese).toContain("Claude Desktop MCPB");
  });

  it("validates the adapter and MCPB on Windows, macOS, and Linux CI hosts", async () => {
    const workflow = await readFile(path.resolve(".github", "workflows", "ci.yml"), "utf8");

    expect(workflow).toContain("windows-latest");
    expect(workflow).toContain("macos-latest");
    expect(workflow).toContain("ubuntu-latest");
    expect(workflow).toContain("npm run build:mcp-bundle");
  });
});
