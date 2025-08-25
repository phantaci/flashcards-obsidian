#!/bin/bash

# Flashcards Obsidian Plugin Installer
# Usage: ./install-plugin.sh [VAULT_PATH]

set -e

# Default vault path (modify as needed)
DEFAULT_VAULT_PATH="$HOME/Documents/ObsidianVault"
VAULT_PATH="${1:-$DEFAULT_VAULT_PATH}"
PLUGIN_NAME="flashcards-obsidian"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Installing Flashcards Plugin..."
echo "Source: $SOURCE_DIR"
echo "Target Vault: $VAULT_PATH"

# Check if vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Error: Vault directory not found: $VAULT_PATH"
    echo "Usage: $0 [VAULT_PATH]"
    echo "Example: $0 ~/Documents/MyVault"
    exit 1
fi

# Check if required files exist
if [ ! -f "$SOURCE_DIR/main.js" ]; then
    echo "❌ Error: main.js not found. Please run 'npm run build' first."
    exit 1
fi

if [ ! -f "$SOURCE_DIR/manifest.json" ]; then
    echo "❌ Error: manifest.json not found."
    exit 1
fi

# Create plugin directory
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/$PLUGIN_NAME"
mkdir -p "$PLUGIN_DIR"

# Copy files
echo "📁 Creating plugin directory: $PLUGIN_DIR"
cp "$SOURCE_DIR/main.js" "$PLUGIN_DIR/"
cp "$SOURCE_DIR/manifest.json" "$PLUGIN_DIR/"

# Optional: copy source map for debugging
if [ -f "$SOURCE_DIR/main.js.map" ]; then
    cp "$SOURCE_DIR/main.js.map" "$PLUGIN_DIR/"
fi

echo "✅ Plugin installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Open Obsidian"
echo "2. Go to Settings > Community plugins"
echo "3. Disable 'Safe mode' if enabled"
echo "4. Find 'Flashcards' in installed plugins and enable it"
echo "5. Configure plugin settings as needed"
echo ""
echo "🎯 Plugin location: $PLUGIN_DIR"
