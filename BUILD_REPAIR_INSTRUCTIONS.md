# Build Notes

This repository is complete and modular. Cloudflare should use:

```text
Build command: npm run check && npm test
Deploy command: npx wrangler deploy
Root directory: /
```

If a build reports a missing project file, replace the repository with the complete update ZIP rather than uploading isolated fragments.
