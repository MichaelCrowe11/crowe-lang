# Manual VS Code Extension Publishing Instructions

## Your Extension is Ready!
**File:** `vscode-extension/crowe-lang-0.2.0.vsix`
**Publisher:** CroweOSSystems
**Version:** 0.2.0

## Option 1: Command Line Publishing

Run these commands:

```bash
# Login to your publisher account
vsce login CroweOSSystems

# Enter your Personal Access Token when prompted
# Then publish the packaged extension
vsce publish --packagePath vscode-extension/crowe-lang-0.2.0.vsix
```

## Option 2: Web Portal Upload (Recommended for Manual Publishing)

1. **Go to the VS Code Marketplace Publisher Portal:**
   https://marketplace.visualstudio.com/manage/publishers/CroweOSSystems

2. **Sign in with your Microsoft account**

3. **Click "New Extension" → "Visual Studio Code"**

4. **Upload the VSIX file:**
   - Click "Upload" button
   - Select the file: `crowe-lang-0.2.0.vsix` from the `vscode-extension` folder
   - The file is located at: `C:\Users\micha\crowe-lang\vscode-extension\crowe-lang-0.2.0.vsix`

5. **Review the metadata** (should auto-populate from package.json):
   - Display Name: Crowe Programming Language
   - Description: Syntax highlighting, IntelliSense, and language server for Crowe language
   - Categories: Programming Languages
   - Repository: https://github.com/MichaelCrowe11/crowe-lang

6. **Click "Upload" to publish**

## After Publishing

Your extension will be available at:
https://marketplace.visualstudio.com/items?itemName=CroweOSSystems.crowe-lang

It may take 5-10 minutes to appear in the marketplace and be searchable in VS Code.

## To Install Published Extension

Users can install via:
- VS Code: Extensions panel → Search "Crowe Programming Language"
- Command: `code --install-extension CroweOSSystems.crowe-lang`
- Web: Visit the marketplace URL above and click "Install"

## Need a Personal Access Token?

1. Go to: https://dev.azure.com
2. Click your profile icon → Security → Personal Access Tokens
3. Click "New Token"
4. Configure:
   - Name: `vsce-publish`
   - Organization: All accessible organizations
   - Expiration: 90 days (or custom)
   - Scopes: Custom defined → Check:
     - Marketplace → Acquire
     - Marketplace → Manage
5. Copy the token immediately (you won't see it again!)

## Troubleshooting

- **Publisher not found:** Make sure you've created the publisher "CroweOSSystems" at https://marketplace.visualstudio.com/manage
- **Invalid package:** The VSIX file might be corrupted. Re-run `vsce package` in the vscode-extension directory
- **Authentication failed:** Your PAT may have expired or incorrect scopes. Generate a new one with the correct permissions

---

**Current Status:** Extension packaged and ready for upload
**File Size:** 277.11 KB
**Files Included:** 201 files