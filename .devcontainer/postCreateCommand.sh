#!/usr/bin/env bash

set -e

# =============================================================================
# Dev Container Post-Create Setup
# Runs automatically after dev container is created
# =============================================================================

echo "=================================================="
echo "Dev Container Post-Create Setup"
echo "=================================================="
echo ""

# Install zsh fzf
echo "Configuring zsh with fzf..."
echo -e "\nsource <(fzf --zsh)" >>~/.zshrc

# Enable dotenv plugin for automatic .env loading
# This will auto-load .env files when you cd into directories
if ! grep -q "plugins=.*dotenv" ~/.zshrc; then
    # Add dotenv to plugins array if not already present
    sed -i 's/plugins=(/plugins=(dotenv /' ~/.zshrc

    # Disable prompt for auto-loading .env (trust dev container environment)
    echo -e "\n# Auto-load .env files without prompting" >>~/.zshrc
    echo 'export ZSH_DOTENV_PROMPT=false' >>~/.zshrc
fi

# Make zsh the default shell
chsh -s $(which zsh)

echo "✓ Shell configuration complete"
echo ""

# =============================================================================
# Dev Container Setup Complete
# =============================================================================

echo "=================================================="
echo "Dev Container Setup Complete!"
echo "=================================================="
echo ""
echo "To install Claude CodePro, run the installation command"
echo "from the project README with your desired version."
echo ""
echo "For the latest version:"
echo "  curl -sSL https://raw.githubusercontent.com/maxritter/claude-codepro/main/scripts/install.py -o /tmp/claude-codepro-install.py && python3 /tmp/claude-codepro-install.py"
echo ""
echo "For a specific version (e.g., v2.4.1):"
echo "  curl -sSL https://raw.githubusercontent.com/maxritter/claude-codepro/v2.4.1/scripts/install.py -o /tmp/claude-codepro-install.py && python3 /tmp/claude-codepro-install.py"
echo ""
echo "=================================================="
