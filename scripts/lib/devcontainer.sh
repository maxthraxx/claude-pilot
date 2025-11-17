#!/bin/bash
# =============================================================================
# Dev Container Functions - Detection and installation of dev container setup
# =============================================================================

# Check if dev container directory exists
# Returns: 0 if exists, 1 otherwise
has_devcontainer() {
	[[ -d "$PROJECT_DIR/.devcontainer" ]] && return 0
	return 1
}

# Check if running inside a dev container
# Returns: 0 if inside container, 1 otherwise
is_in_devcontainer() {
	[[ -f /.dockerenv ]] || [[ -f /run/.containerenv ]] && return 0
	return 1
}

# Install dev container configuration
# Downloads .devcontainer directory from repo or copies from local
# Returns: void
install_devcontainer() {
	print_status "Installing dev container configuration..."

	local devcontainer_files=(
		".devcontainer/Dockerfile"
		".devcontainer/devcontainer.json"
		".devcontainer/postCreateCommand.sh"
	)

	for file_path in "${devcontainer_files[@]}"; do
		local dest_file="${PROJECT_DIR}/${file_path}"
		if download_file "$file_path" "$dest_file" 2>/dev/null; then
			echo "   ✓ $(basename "$file_path")"
		else
			print_warning "Failed to download $file_path"
		fi
	done

	# Make postCreateCommand.sh executable
	chmod +x "$PROJECT_DIR/.devcontainer/postCreateCommand.sh"

	print_success "Dev container configuration installed"
}

# Offer dev container setup to user
# If not in container and no .devcontainer exists, offer to install
# Returns: void
offer_devcontainer_setup() {
	# Skip if already in dev container
	if is_in_devcontainer; then
		return
	fi

	# Skip if .devcontainer already exists
	if has_devcontainer; then
		return
	fi

	# Skip if non-interactive
	if [[ $NON_INTERACTIVE == true ]]; then
		return
	fi

	print_section "Dev Container Setup (Recommended)"
	echo "Claude CodePro can run in a VS Code Dev Container for:"
	echo "  ✓ Complete isolation from your host system"
	echo "  ✓ Pre-configured tools and extensions"
	echo "  ✓ No interference with system packages or settings"
	echo "  ✓ Consistent environment across machines"
	echo ""
	echo "Installing locally may interfere with:"
	echo "  ✗ Existing Node.js, Python, or tool versions"
	echo "  ✗ Shell configuration files (.bashrc, .zshrc)"
	echo "  ✗ Global package installations"
	echo ""

	read -r -p "Install dev container configuration? (Y/n): " REPLY </dev/tty || read -r -p "Install dev container configuration? (Y/n): " REPLY
	echo ""

	# Default to Y
	REPLY=${REPLY:-Y}

	if [[ ! $REPLY =~ ^[Yy]$ ]]; then
		print_warning "Proceeding with local installation (may interfere with system packages)"
		echo ""
		return
	fi

	# Install dev container files
	install_devcontainer
	echo ""

	# Provide instructions
	print_section "Dev Container Next Steps"
	echo "The .devcontainer configuration has been installed."
	echo ""
	echo "To use it:"
	echo "  1. Install the 'Dev Containers' extension in VS Code/Cursor/Windsurf"
	echo "     Extension ID: ms-vscode-remote.remote-containers"
	echo ""
	echo "  2. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)"
	echo ""
	echo "  3. Run: 'Dev Containers: Reopen in Container'"
	echo ""
	echo "  4. Wait for container to build (first time takes ~5-10 minutes)"
	echo ""
	echo "  5. Installation will continue automatically inside the container"
	echo ""
	echo -e "${YELLOW}Press Enter to exit and set up dev container, or Ctrl+C to continue local installation${NC}"
	read -r </dev/tty || read -r

	print_success "Please reopen in dev container to continue installation"
	exit 0
}
