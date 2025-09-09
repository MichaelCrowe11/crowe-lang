#!/bin/bash

echo "🚀 Publishing Crowe VS Code Extension to Marketplace"
echo ""

# Check if vsce is installed
if ! command -v vsce &> /dev/null; then
    echo "📦 Installing vsce..."
    npm install -g @vscode/vsce
fi

# Navigate to extension directory
cd vscode-extension

# Install dependencies
echo "📦 Installing extension dependencies..."
npm install

# Compile the extension
echo "🔨 Building extension..."
npm run compile

# Package the extension
echo "📦 Packaging extension..."
vsce package

# Publish to marketplace
echo "🌐 Publishing to VS Code Marketplace..."
echo ""
echo "To publish, you need to:"
echo "1. Create a publisher account at https://marketplace.visualstudio.com/manage"
echo "2. Generate a Personal Access Token (PAT) at https://dev.azure.com"
echo "3. Run: vsce login MichaelCrowe11"
echo "4. Run: vsce publish"
echo ""
echo "Or publish manually by uploading the .vsix file at:"
echo "https://marketplace.visualstudio.com/manage/publishers/MichaelCrowe11"
echo ""
echo "Extension package created: crowe-lang-0.2.0.vsix"
echo ""
echo "✅ Ready to publish!"