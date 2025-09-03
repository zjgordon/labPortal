# Lab Portal Documentation

Welcome to the Lab Portal documentation! This comprehensive guide covers everything you need to know about setting up, configuring, and operating the Lab Portal system.

## 📚 Documentation Overview

Lab Portal is a modern, cyberpunk-styled laboratory control panel and control plane built with Next.js 14. It provides real-time service monitoring, drag-and-drop card management, host and service control, and a sleek dark theme perfect for network laboratories.

## 🗂️ Table of Contents

### 🏗️ Architecture & Design
- [Control System Finite State Machine](architecture/CONTROL_SYSTEM_FSM.md) - System design and state management

### 🔌 API Reference
- [Agent API](api/AGENT_API.md) - Complete agent system API documentation
- [Control Actions API](api/CONTROL_ACTIONS_API.md) - Control plane action management
- [Public API](api/PUBLIC_API.md) - Public endpoints and status APIs
- [Queue Endpoint Behavior](api/QUEUE_ENDPOINT_BEHAVIOR.md) - Action queue semantics and behavior
- [Agent Endpoint Hardening](api/AGENT_ENDPOINT_HARDENING.md) - Security and hardening guidelines

### 🤖 Agent System
- [Agent Behavior](agent/AGENT_BEHAVIOR.md) - Agent behavior and configuration
- [Agent Summary](agent/AGENT_SUMMARY.md) - High-level agent overview
- [Local Action Execution](agent/LOCAL_ACTION_EXECUTION.md) - Local system control and execution
- [Lab Portal Agent Service](agent/lab-portal-agent.service) - Systemd service configuration

### 🚀 Operations & Deployment
- [Docker Configuration](ops/docker-compose.yml) - Development Docker setup
- [Production Docker](ops/docker-compose.prod.yaml) - Production Docker configuration
- [Dockerfile](ops/Dockerfile) - Development container definition
- [Production Dockerfile](ops/Dockerfile.prod) - Production container definition
- [Docker Entrypoint](ops/docker-entrypoint.sh) - Container startup script
- [Setup Script](ops/setup.sh) - System setup and configuration
- [Sudoers Configuration](ops/SUDOERS_CONFIGURATION.md) - System permissions setup

### 🧪 Development & Testing
- [Smoke Testing](dev/SMOKE_TESTING.md) - Comprehensive testing guide
- [Testing Documentation](dev/TESTING.md) - Testing framework and practices
- [Status Testing](dev/STATUS_TESTING.md) - Status system testing guide
- [Testing Framework](../tests/README.md) - Testing guidelines and structure

### 📖 Additional Resources
- [Scripts Documentation](scripts.md) - Utility scripts and automation
- [Project Status](../PROJECT_STATUS.md) - Current project status and roadmap
- [Tests Directory](../tests/README.md) - Testing framework and guidelines

## 🚀 Quick Start

1. **Setup**: Follow the [Setup Script](ops/setup.sh) for initial configuration
2. **Docker**: Use [Docker Configuration](ops/docker-compose.yml) for development
3. **Agent**: Configure agents using [Agent Setup](agent/LOCAL_ACTION_EXECUTION.md)
4. **Testing**: Run [Smoke Tests](dev/SMOKE_TESTING.md) to verify functionality

## 🔧 Configuration

- **Environment**: Copy `env.example` and configure your environment variables
- **Database**: Prisma migrations handle database schema updates
- **Authentication**: Configure admin credentials and agent tokens
- **Services**: Set up systemd services and permissions

## 📞 Support

For issues and questions:
- Check the [Project Status](../PROJECT_STATUS.md) for known issues
- Review [Testing Documentation](dev/TESTING.md) for troubleshooting
- Consult [API Reference](api/) for endpoint details

---

*Last updated: $(date)*
