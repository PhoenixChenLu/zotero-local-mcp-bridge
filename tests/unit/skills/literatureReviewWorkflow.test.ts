import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const englishSkillPath = path.resolve("skills", "zotero-local-mcp-bridge", "SKILL.md");
const chineseSkillPath = path.resolve("skills", "zotero-local-mcp-bridge-zh-cn", "SKILL.md");

describe("literature review workflow skill", () => {
  it("routes English literature review requests through the batch Zotero workflow", async () => {
    const skill = await readFile(englishSkillPath, "utf8");

    expect(skill).toContain("literature review");
    expect(skill).toContain("## Literature Review Workflow");
    expect(skill).toContain("item.findByDois");
    expect(skill).toContain("collection.addItems");
    expect(skill).toContain("pdf.addAndRecognizeBatch");
    expect(skill).toContain("one dry-run, one required approval, and one execute");
    expect(skill).toContain("Do not treat an attached file as proof that its full text was read");
    expect(skill).toContain("examples/literature-review.md");
  });

  it("provides an equivalent Chinese workflow without mixed narrative prose", async () => {
    const skill = await readFile(chineseSkillPath, "utf8");

    expect(skill).toContain("文献综述");
    expect(skill).toContain("## 文献综述工作流");
    expect(skill).toContain("item.findByDois");
    expect(skill).toContain("collection.addItems");
    expect(skill).toContain("pdf.addAndRecognizeBatch");
    expect(skill).toContain("一次 dry-run、一次必要批准和一次 execute");
    expect(skill).toContain("不能把存在附件等同于已经阅读全文");
    expect(skill).toContain("examples/literature-review.md");
  });

  it("ships workflow references and language-matched examples", async () => {
    const workflow = await readFile(path.resolve("docs", "workflows", "literature-review.md"), "utf8");
    const englishExample = await readFile(path.resolve("skills", "zotero-local-mcp-bridge", "examples", "literature-review.md"), "utf8");
    const chineseExample = await readFile(path.resolve("skills", "zotero-local-mcp-bridge-zh-cn", "examples", "literature-review.md"), "utf8");

    expect(workflow).toContain("Responsibility Boundary");
    expect(workflow).toContain("item.findByDois");
    expect(englishExample).toContain("Expected tool sequence");
    expect(chineseExample).toContain("预期工具顺序");
  });
});
