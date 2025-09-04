# Lab Portal Makefile
# Provides convenient targets for development, building, and deployment

.PHONY: help dev typecheck lint migrate seed smoke portal-build portal-start portal-stop agent-build agent-package agent-sign agent-install agent-uninstall

# Default target
help:
	@echo "Lab Portal Makefile - Available targets:"
	@echo ""
	@echo "Development:"
	@echo "  dev         - Start development server"
	@echo "  typecheck   - Run TypeScript type checking"
	@echo "  lint        - Run ESLint"
	@echo "  migrate     - Run database migrations"
	@echo "  seed        - Seed database with initial data"
	@echo "  smoke       - Run comprehensive smoke tests"
	@echo ""
	@echo "Portal:"
	@echo "  portal-build - Build portal for production"
	@echo "  portal-start - Start production portal server"
	@echo "  portal-stop  - Stop production portal server"
	@echo ""
	@echo "Agent:"
	@echo "  agent-build    - Build agent TypeScript"
	@echo "  agent-package  - Package agent as tgz to /dist-artifacts"
	@echo "  agent-sign     - Sign agent tarball with GPG (optional)"
	@echo "  agent-install  - Install agent on remote host (HOST=hostname)"
	@echo "  agent-uninstall- Uninstall agent from remote host (HOST=hostname)"
	@echo ""
	@echo "Examples:"
	@echo "  make dev"
	@echo "  make agent-install HOST=web-server.local"
	@echo "  make smoke"

# Development targets
dev:
	@echo "🚀 Starting development server..."
	npm run dev

typecheck:
	@echo "🔍 Running TypeScript type checking..."
	npm run typecheck

lint:
	@echo "🔧 Running ESLint..."
	npm run lint

migrate:
	@echo "🗄️  Running database migrations..."
	npm run prisma:migrate

seed:
	@echo "🌱 Seeding database..."
	npm run prisma:seed

smoke:
	@echo "🧪 Running comprehensive smoke tests..."
	@if [ -f scripts/smoke.sh ]; then \
		chmod +x scripts/smoke.sh && \
		./scripts/smoke.sh; \
	else \
		echo "❌ Smoke test script not found at scripts/smoke.sh"; \
		exit 1; \
	fi

# Portal targets
portal-build:
	@echo "🏗️  Building portal for production..."
	npm run build

portal-start:
	@echo "🚀 Starting production portal server..."
	npm run start

portal-stop:
	@echo "🛑 Stopping production portal server..."
	@if pgrep -f "next start" > /dev/null; then \
		pkill -f "next start" && echo "✅ Portal server stopped"; \
	else \
		echo "ℹ️  No portal server process found"; \
	fi

# Agent targets
agent-build:
	@echo "🔨 Building agent TypeScript..."
	@if [ -d agent ]; then \
		cd agent && npm run build; \
	else \
		echo "❌ Agent directory not found"; \
		exit 1; \
	fi

agent-package:
	@echo "📦 Packaging agent as tgz..."
	@if [ -d agent ]; then \
		mkdir -p dist-artifacts && \
		cd agent && \
		VERSION=$$(node -p "require('./package.json').version") && \
		tar -czf ../dist-artifacts/agent-labportal-$$VERSION.tgz \
			--exclude=node_modules \
			--exclude=.git \
			--exclude=*.log \
			--exclude=.env \
			--exclude=src \
			--exclude=tsconfig.json \
			--exclude=test-connection.js \
			dist/ package.json README.md env.example packaging/ && \
		echo "✅ Agent packaged to dist-artifacts/agent-labportal-$$VERSION.tgz"; \
		echo "🔐 Generating SHA256 checksum..." && \
		cd ../dist-artifacts && \
		sha256sum agent-labportal-$$VERSION.tgz > agent-labportal-$$VERSION.tgz.sha256 && \
		echo "✅ Checksum generated: agent-labportal-$$VERSION.tgz.sha256"; \
		echo "📋 Package includes:"; \
		echo "   - Compiled agent binaries (dist/)"; \
		echo "   - Guided installer (packaging/install-guided.sh)"; \
		echo "   - Configuration template (env.example)"; \
		echo "   - Package metadata (package.json)"; \
		echo "   - Documentation (README.md)"; \
		echo "   - SHA256 checksum file (.sha256)"; \
		echo ""; \
		echo "🔍 To verify the tarball:"; \
		echo "   sha256sum -c agent-labportal-$$VERSION.tgz.sha256"; \
	else \
		echo "❌ Agent directory not found"; \
		exit 1; \
	fi

agent-sign:
	@echo "🔐 Signing agent tarball with GPG..."
	@if [ ! -d dist-artifacts ]; then \
		echo "❌ dist-artifacts directory not found. Run 'make agent-package' first."; \
		exit 1; \
	fi
	@if ! command -v gpg > /dev/null 2>&1; then \
		echo "❌ GPG not found. Please install GPG to sign tarballs."; \
		echo "   Ubuntu/Debian: sudo apt install gnupg"; \
		echo "   CentOS/RHEL:   sudo yum install gnupg2"; \
		echo "   macOS:         brew install gnupg"; \
		exit 1; \
	fi
	@cd dist-artifacts && \
	TARBALL=$$(ls agent-labportal-*.tgz 2>/dev/null | head -1) && \
	if [ -z "$$TARBALL" ]; then \
		echo "❌ No agent tarball found in dist-artifacts/"; \
		echo "   Run 'make agent-package' first to create a tarball."; \
		exit 1; \
	fi && \
	echo "📦 Signing tarball: $$TARBALL" && \
	if gpg --detach-sign --armor "$$TARBALL"; then \
		echo "✅ GPG signature created: $$TARBALL.asc"; \
		echo "🔍 To verify the signature:"; \
		echo "   gpg --verify $$TARBALL.asc"; \
		echo ""; \
		echo "📋 Files in dist-artifacts/:"; \
		ls -la $$TARBALL*; \
	else \
		echo "❌ GPG signing failed"; \
		echo "   Make sure you have a GPG key configured:"; \
		echo "   gpg --list-secret-keys"; \
		exit 1; \
	fi

agent-install:
	@echo "📡 Installing agent on remote host..."
	@if [ -z "$(HOST)" ]; then \
		echo "❌ HOST variable is required. Usage: make agent-install HOST=hostname"; \
		exit 1; \
	fi
	@if [ ! -d agent ]; then \
		echo "❌ Agent directory not found"; \
		exit 1; \
	fi
	@echo "🚀 Installing agent on $(HOST)..."
	@echo "📋 This will:"
	@echo "   1. Copy agent files to /opt/lab-portal-agent on $(HOST)"
	@echo "   2. Create lab-portal user and group"
	@echo "   3. Install systemd service"
	@echo "   4. Start the agent service"
	@echo ""
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		scp -r agent/dist agent/package.json agent/README.md agent/env.example agent/packaging/ $(HOST):/tmp/lab-portal-agent/ && \
		ssh $(HOST) "cd /tmp/lab-portal-agent && chmod +x packaging/*.sh && ./packaging/install.sh" && \
		ssh $(HOST) "rm -rf /tmp/lab-portal-agent" && \
		echo "✅ Agent installed successfully on $(HOST)"; \
	else \
		echo "❌ Installation cancelled"; \
	fi

agent-uninstall:
	@echo "🗑️  Uninstalling agent from remote host..."
	@if [ -z "$(HOST)" ]; then \
		echo "❌ HOST variable is required. Usage: make agent-uninstall HOST=hostname"; \
		exit 1; \
	fi
	@echo "⚠️  This will remove the agent from $(HOST)"
	@echo "📋 This will:"
	@echo "   1. Stop the lab-portal-agent service"
	@echo "   2. Disable the systemd service"
	@echo "   3. Remove service files"
	@echo "   4. Remove agent files from /opt/lab-portal-agent"
	@echo "   5. Remove lab-portal user and group"
	@echo ""
	@read -p "Continue? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		scp agent/packaging/uninstall.sh $(HOST):/tmp/ && \
		ssh $(HOST) "chmod +x /tmp/uninstall.sh && /tmp/uninstall.sh" && \
		ssh $(HOST) "rm -f /tmp/uninstall.sh" && \
		echo "✅ Agent uninstalled successfully from $(HOST)"; \
	else \
		echo "❌ Uninstallation cancelled"; \
	fi

# Individual target help messages
dev-help:
	@echo "🚀 Start development server with hot reload"

typecheck-help:
	@echo "🔍 Run TypeScript type checking without emitting files"

lint-help:
	@echo "🔧 Run ESLint to check code quality and style"

migrate-help:
	@echo "🗄️  Run database migrations to update schema"

seed-help:
	@echo "🌱 Seed database with initial data and test records"

smoke-help:
	@echo "🧪 Run comprehensive smoke tests for critical functionality"

portal-build-help:
	@echo "🏗️  Build portal application for production deployment"

portal-start-help:
	@echo "🚀 Start production portal server (requires build first)"

portal-stop-help:
	@echo "🛑 Stop running production portal server"

agent-build-help:
	@echo "🔨 Compile agent TypeScript source to JavaScript"

agent-package-help:
	@echo "📦 Package agent as compressed tar.gz to dist-artifacts/"

agent-sign-help:
	@echo "🔐 Sign agent tarball with GPG (requires GPG key configured)"

agent-install-help:
	@echo "📡 Install agent on remote host (requires HOST=hostname)"

agent-uninstall-help:
	@echo "🗑️  Remove agent from remote host (requires HOST=hostname)"
