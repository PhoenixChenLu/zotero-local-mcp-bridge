import { readFile } from "node:fs/promises";
import path from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

type DoiLookupResult = {
  requestedCount: number;
  uniqueDoiCount: number;
  matchedDoiCount: number;
  unmatchedDoiCount: number;
  matches: Array<{ doi: string; items: Array<{ zoteroItemKey: string; title: string }> }>;
  matchedItems: Array<{ zoteroItemKey: string; title: string }>;
  matchedItemKeys: string[];
  unmatchedDois: string[];
};

type DoiLookupRuntime = {
  findItemsByDois(input: { dois: string[] }): Promise<DoiLookupResult>;
  normalizeDoiLookupInput(input: { dois: string[] }): { requestedCount: number; dois: string[] };
  normalizeDoiValue(value: unknown): string;
};

describe("Zotero DOI batch lookup runtime", () => {
  let runtime: DoiLookupRuntime;

  beforeAll(async () => {
    const bootstrap = await readFile(path.resolve("src", "zotero-plugin", "bootstrap.js"), "utf8");
    const start = bootstrap.indexOf("async function findItemsByDois");
    const end = bootstrap.indexOf("function normalizeItemSearchInput", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);

    const source = bootstrap.slice(start, end);
    const factory = new Function(
      "Zotero",
      "readItemDetails",
      "commandError",
      `${source}; return { findItemsByDois, normalizeDoiLookupInput, normalizeDoiValue };`
    ) as (
      zotero: unknown,
      readItemDetails: (input: { zoteroItemKey: string }) => { zoteroItemKey: string; title: string },
      commandError: (code: string, message: string, status: number) => Error
    ) => DoiLookupRuntime;

    const items = [
      regularItem("ITEMA001", "10.1000/ABC"),
      regularItem("ITEMA002", "doi:10.1000/abc"),
      regularItem("ITEMB001", "10.2000/Second"),
      regularItem("ITEMNONE", ""),
      { key: "ATTACH01", isRegularItem: () => false, getField: () => "10.1000/abc" }
    ];
    runtime = factory(
      {
        Libraries: { userLibraryID: 1 },
        Items: { getAll: async () => items }
      },
      ({ zoteroItemKey }) => ({ zoteroItemKey, title: `Title ${zoteroItemKey}` }),
      (code, message, status) => Object.assign(new Error(message), { code, status })
    );
  });

  it("normalizes common DOI forms and removes duplicate inputs", () => {
    expect(runtime.normalizeDoiLookupInput({
      dois: [" HTTPS://doi.org/10.1000/ABC ", "doi: 10.1000/abc", "10.2000/Second"]
    })).toEqual({
      requestedCount: 3,
      dois: ["10.1000/abc", "10.2000/second"]
    });
  });

  it("returns every matching record, unique item keys, and normalized misses", async () => {
    const result = await runtime.findItemsByDois({
      dois: ["https://doi.org/10.1000/ABC", "10.3000/missing", "10.1000/abc"]
    });

    expect(result.requestedCount).toBe(3);
    expect(result.uniqueDoiCount).toBe(2);
    expect(result.matchedDoiCount).toBe(1);
    expect(result.unmatchedDoiCount).toBe(1);
    expect(result.matches[0].doi).toBe("10.1000/abc");
    expect(result.matches[0].items.map((item) => item.zoteroItemKey)).toEqual(["ITEMA001", "ITEMA002"]);
    expect(result.matchedItemKeys).toEqual(["ITEMA001", "ITEMA002"]);
    expect(result.matchedItems).toHaveLength(2);
    expect(result.unmatchedDois).toEqual(["10.3000/missing"]);
  });

  it("rejects malformed DOI values and batches larger than 50", () => {
    expect(() => runtime.normalizeDoiLookupInput({ dois: ["not-a-doi"] })).toThrow("dois[0] is not a valid DOI");
    expect(() => runtime.normalizeDoiLookupInput({ dois: Array.from({ length: 51 }, (_, index) => `10.1000/${index}`) }))
      .toThrow("Batch size 51 exceeds limit 50");
  });
});

function regularItem(key: string, doi: string) {
  return {
    key,
    isRegularItem: () => true,
    getField: (fieldName: string) => fieldName === "DOI" ? doi : ""
  };
}
