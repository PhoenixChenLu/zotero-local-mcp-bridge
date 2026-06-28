## Summary

-

## Validation

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run build:zotero-plugin:release`

## Safety Checklist

- [ ] Does not use Zotero Web API writes
- [ ] Does not require or read `ZOTERO_API_KEY`
- [ ] Does not directly write `zotero.sqlite`
- [ ] Does not expose arbitrary JavaScript eval as a normal MCP tool
- [ ] Preserves dry-run before write execution
- [ ] Keeps audit and backup outside Zotero profile/data/attachment folders
