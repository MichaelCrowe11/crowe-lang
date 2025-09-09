# Publishing Crowe Language Extension to VS Code Marketplace

## Prerequisites

1. **Create Publisher Account**
   - Go to https://marketplace.visualstudio.com/manage
   - Sign in with your Microsoft account
   - Create a new publisher ID: `MichaelCrowe11`

2. **Generate Personal Access Token (PAT)**
   - Visit https://dev.azure.com
   - Click on your profile → Security → Personal Access Tokens
   - Create new token with:
     - Name: `vsce-publish`
     - Organization: All accessible organizations
     - Expiration: 90 days (or custom)
     - Scopes: Select "Custom defined" then check:
       - Marketplace → Acquire
       - Marketplace → Manage

3. **Install Publishing Tools**
   ```bash
   npm install -g @vscode/vsce
   ```

## Publishing Steps

### Method 1: Command Line Publishing

1. **Login to Publisher**
   ```bash
   vsce login MichaelCrowe11
   # Enter your PAT when prompted
   ```

2. **Package the Extension**
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   vsce package
   ```

3. **Publish to Marketplace**
   ```bash
   vsce publish
   # Or specify version increment:
   vsce publish minor  # 0.2.0 → 0.3.0
   vsce publish patch  # 0.2.0 → 0.2.1
   vsce publish major  # 0.2.0 → 1.0.0
   ```

### Method 2: Web Upload

1. **Package the Extension**
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   vsce package
   ```

2. **Upload via Web**
   - Go to https://marketplace.visualstudio.com/manage/publishers/MichaelCrowe11
   - Click "New Extension" → "Visual Studio Code"
   - Upload the `crowe-lang-0.2.0.vsix` file
   - Fill in additional details if needed
   - Click "Upload"

## Post-Publishing

### Verify Publication
- Extension URL: https://marketplace.visualstudio.com/items?itemName=MichaelCrowe11.crowe-lang
- Search in VS Code: Extensions → Search "Crowe"

### Install from Marketplace
```bash
code --install-extension MichaelCrowe11.crowe-lang
```

### Update Extension
1. Make changes to the extension
2. Update version in `package.json`
3. Update `CHANGELOG.md`
4. Rebuild and republish:
   ```bash
   vsce publish patch
   ```

## Testing Before Publishing

### Local Installation
```bash
code --install-extension crowe-lang-0.2.0.vsix
```

### Test Checklist
- [ ] Syntax highlighting works for .crowe files
- [ ] IntelliSense provides completions
- [ ] Compilation commands work
- [ ] Language server starts without errors
- [ ] No console errors in Extension Host

## Marketplace Listing Optimization

### Keywords
Ensure `package.json` includes relevant keywords:
- crowe
- react
- jsx
- typescript
- ai
- state-management
- language-server

### README
The extension README.md becomes the marketplace description. Include:
- Clear feature list with checkmarks
- Code examples with syntax highlighting
- Installation instructions
- Links to documentation

### Icon
Add a 128x128 PNG icon:
1. Create icon as `icon.png` in extension root
2. Update `package.json`:
   ```json
   "icon": "icon.png"
   ```

### Gallery Banner
Already configured in `package.json`:
```json
"galleryBanner": {
  "color": "#007acc",
  "theme": "dark"
}
```

## Troubleshooting

### Common Issues

1. **"Publisher not found"**
   - Ensure publisher ID matches exactly
   - Wait a few minutes after creating publisher

2. **"Invalid extension package"**
   - Check all required fields in package.json
   - Ensure no syntax errors in JSON files
   - Verify file paths are correct

3. **"Authentication failed"**
   - Regenerate PAT with correct scopes
   - Ensure PAT hasn't expired
   - Try logging out and back in: `vsce logout` then `vsce login`

## Automated Publishing (CI/CD)

### GitHub Actions Workflow
Create `.github/workflows/publish.yml`:

```yaml
name: Publish VS Code Extension

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: |
          cd vscode-extension
          npm install
          npm install -g @vscode/vsce
          
      - name: Compile extension
        run: |
          cd vscode-extension
          npm run compile
          
      - name: Publish to Marketplace
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}
        run: |
          cd vscode-extension
          vsce publish -p $VSCE_PAT
```

Add PAT as GitHub secret:
1. Go to repo Settings → Secrets → Actions
2. Add new secret: `VSCE_PAT` with your token value

## Marketing & Promotion

### Social Media Announcement Template
```
🎉 Crowe Language VS Code Extension is now live!

✨ Features:
• React-native syntax with AI operations
• Hot Module Replacement
• Real-time streams
• State management

Install: ext install MichaelCrowe11.crowe-lang

#vscode #react #typescript #webdev
```

### Documentation Updates
- Update main README with marketplace badge
- Add installation instructions
- Create getting started video/GIF

## Success Metrics

Monitor extension performance:
- Install count
- Ratings and reviews
- GitHub issues and feedback
- Download trends

Access analytics at:
https://marketplace.visualstudio.com/manage/publishers/MichaelCrowe11/extensions/crowe-lang/hub

---

## Quick Publish Script

Save this as `publish.sh`:

```bash
#!/bin/bash
cd vscode-extension
npm install
npm run compile
vsce package
vsce publish
echo "✅ Published to VS Code Marketplace!"
echo "View at: https://marketplace.visualstudio.com/items?itemName=MichaelCrowe11.crowe-lang"
```

Make executable: `chmod +x publish.sh`
Run: `./publish.sh`