# Lab Portal Tests

This directory contains comprehensive testing for the Lab Portal system.

## 🧪 Testing Structure

### Unit Tests
- **Location**: `src/lib/__tests__/` and `src/app/__tests__/`
- **Framework**: Jest with React Testing Library
- **Coverage**: Core utilities, components, and API routes

### Integration Tests
- **Location**: `scripts/` directory
- **Framework**: Shell scripts with curl and jq
- **Coverage**: End-to-end API validation and smoke testing

### Test Categories

#### 🔐 Authentication Tests
- Admin session validation
- Agent token authentication
- Public API token validation
- CSRF protection validation

#### 🎮 Control System Tests
- Action lifecycle validation
- FSM state transitions
- Agent endpoint hardening
- Queue endpoint behavior

#### 📊 Status System Tests
- Service monitoring
- Status history tracking
- Uptime calculations
- Performance metrics

#### 🚀 API Endpoint Tests
- CRUD operations
- Input validation
- Error handling
- Rate limiting

## 🚀 Running Tests

### Unit Tests
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage report
```

### Smoke Tests
```bash
# Control actions smoke test
./scripts/control-smoke.sh

# Public API testing
./scripts/test-public-api.sh

# Link validation
node scripts/check-links.js
```

### Manual Testing
```bash
# Test environment setup
npm run test-env

# Database seeding
npm run prisma:seed
```

## 📋 Test Requirements

### Prerequisites
- Node.js 20.x
- npm or yarn
- curl and jq for smoke tests
- Docker (optional, for containerized testing)

### Environment Variables
- Copy `env.example` to `.env.local`
- Configure test database and credentials
- Set up test API keys and tokens

## 🔧 Test Configuration

### Jest Configuration
- **File**: `jest.config.js`
- **Setup**: `jest.setup.js`
- **Coverage**: Configured for comprehensive reporting

### Test Utilities
- **Location**: `src/lib/test-utils.tsx`
- **Purpose**: Common testing helpers and mocks
- **Usage**: Import in test files for consistent setup

## 📊 Test Coverage

### Current Coverage
- **Unit Tests**: Core utilities and components
- **Integration Tests**: API endpoints and workflows
- **Smoke Tests**: End-to-end validation
- **Link Tests**: Documentation validation

### Coverage Goals
- **Target**: >90% code coverage
- **Focus**: Critical business logic and API endpoints
- **Quality**: Meaningful tests that catch real issues

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection**: Ensure test database is accessible
2. **Environment Variables**: Check `.env.local` configuration
3. **Dependencies**: Run `npm install` if tests fail to start
4. **Port Conflicts**: Ensure test ports are available

### Debug Mode
```bash
# Verbose test output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="test name"
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](docs/dev/TESTING.md)
- [Smoke Testing Guide](docs/dev/SMOKE_TESTING.md)
