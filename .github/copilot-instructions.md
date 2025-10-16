# GitHub Copilot Instructions for app-desacoplada

## Project Overview

This is a decoupled full-stack application with three main components:
- **Backend**: Node.js/TypeScript REST API with Express
- **Frontend**: React with Vite
- **Mobile**: React Native application

## Technology Stack

### Backend
- **Language**: TypeScript
- **Framework**: Express 5.x
- **Database**: MySQL (using mysql2)
- **Authentication**: JWT with HttpOnly cookies
- **Security**: CSRF protection, rate limiting, Zod validation
- **Logging**: Winston
- **Testing**: Jest with ts-jest

### Frontend
- **Language**: JavaScript/React
- **Build Tool**: Vite
- **Routing**: React Router v7
- **State Management**: Zustand
- **Styling**: Custom CSS

### Mobile
- **Framework**: React Native
- **Navigation**: React Navigation v7
- **Platform**: Android/iOS

## Coding Standards

### General Guidelines
- Follow existing code style and patterns in the repository
- Write clear, concise code with meaningful variable names
- Use Spanish for user-facing text and documentation in Spanish files
- Prefer functional components in React
- Use TypeScript types explicitly in backend code

### TypeScript/JavaScript
- Use `const` and `let` instead of `var`
- Prefer arrow functions for callbacks
- Use async/await over promises chains
- Use template literals for string concatenation
- Import types using `import type { }` when possible

### File Organization
- Backend: Controllers, Services, Repositories pattern
- Frontend: Component-based structure in `src/components`
- Keep related files together (component, styles, tests)

## Security Requirements

### Authentication
- Always use JWT tokens stored in HttpOnly cookies
- Never expose sensitive data in API responses
- Validate all user inputs using Zod schemas
- Implement CSRF protection for POST/PUT/DELETE operations
- Support both cookie-based (web) and header-based (mobile) authentication

### Data Validation
- Validate all user inputs on the backend
- Sanitize HTML content using sanitize-html
- Use parameterized queries for all database operations
- Never trust client-side validation alone

### Rate Limiting
- General limit: 100 requests per minute per IP
- Authentication endpoints: 5 attempts per 15 minutes (production)
- User operations: 10 operations per minute per user

## Database Interactions

### MySQL Patterns
- Use connection pooling (already configured)
- Always use parameterized queries: `connection.execute(query, [params])`
- Handle connection errors gracefully
- Close connections properly in finally blocks
- Use transactions for multi-step operations

### Schema Changes
- Include existence checks in ALTER TABLE statements
- Test migrations in development before production
- Document schema changes in migration files

## Testing Requirements

### Backend Tests
- Write tests for all new services and controllers
- Use Jest with ts-jest configuration
- Place tests in `backend/tests/` directory
- Test file naming: `{feature}.test.ts`
- Mock database connections in unit tests
- Test security features (authentication, authorization, validation)

### Test Structure
```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something specific', async () => {
    // Test implementation
  });
});
```

### Coverage Goals
- Aim for meaningful test coverage of critical paths
- Test edge cases and error conditions
- Test authentication and authorization logic

## API Design

### Endpoints
- Use RESTful conventions
- Prefix all API routes with `/api/`
- Use meaningful route names in Spanish (matching existing pattern)
- Return appropriate HTTP status codes
- Include error messages in Spanish for user-facing errors

### Request/Response Format
- Accept and return JSON
- Use camelCase for JSON properties
- Include proper error messages with status codes
- Validate request bodies with Zod schemas

### Error Handling
- Return structured error responses
- Log errors with Winston
- Don't expose stack traces in production
- Use appropriate HTTP status codes (400, 401, 403, 404, 500, etc.)

## Component Patterns

### React (Frontend)
- Use functional components with hooks
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use React Router for navigation
- Manage global state with Zustand

### React Native (Mobile)
- Use React Navigation for screen navigation
- Handle platform-specific code when necessary
- Use SafeAreaView for proper rendering
- Test on both Android and iOS when possible

## File Paths and Structure

### Backend
- Controllers: `backend/src/controllers/`
- Services: `backend/src/services/`
- Repositories: `backend/src/repositories/`
- Routes: `backend/src/routes/`
- Middlewares: `backend/src/middlewares/`
- Types: `backend/src/types/`
- Tests: `backend/tests/`

### Frontend
- Components: `frontend/src/components/`
- Routes/Pages: `frontend/src/`
- Assets: `frontend/public/`

### Mobile
- Screens: `react-native/mobile/src/screens/`
- Components: `react-native/mobile/src/components/`
- Navigation: `react-native/mobile/src/navigation/`

## Build and Development

### Commands
- Build backend: `npm run build` (from root)
- Start backend: `npm run start:backend` (from root)
- Start frontend: `npm run dev:frontend` (from root)
- Run tests: `npm run test:backend` (from root)
- Run mobile: `npm start` (from `react-native/mobile/`)

### Environment Variables
- Use `.env` files for configuration (never commit these)
- Document required environment variables
- Provide example values in documentation

## Dependencies

### Adding New Dependencies
- Prefer well-maintained, popular packages
- Check for security vulnerabilities before adding
- Update package.json in the appropriate directory (backend/frontend/mobile)
- Run `npm install` after adding dependencies
- Avoid adding unnecessary dependencies

### Dependency Management
- Keep dependencies up to date
- Run `npm audit` regularly
- Review and address security warnings

## Common Patterns

### Authentication Flow
1. User logs in via POST `/api/auth/login`
2. JWT token set in HttpOnly cookie
3. Token validated on protected routes via middleware
4. CSRF token required for state-changing operations

### CSRF Protection
- Web: Uses double-submit cookie pattern
- Mobile: Exempt from CSRF (uses header-based auth)
- Applied to all POST/PUT/DELETE operations

### Image Handling
- Use Jimp for image processing
- Store images with unique filenames
- Validate file types and sizes
- Clean up orphaned files when deleting users/pages

## Documentation

### Code Comments
- Comment complex logic and algorithms
- Explain "why" not "what" when code is clear
- Use JSDoc for public API functions
- Keep comments up to date with code changes

### README Updates
- Update relevant README files when adding features
- Document new API endpoints
- Include usage examples for new features

## Common Pitfalls to Avoid

- Don't bypass authentication checks
- Don't expose sensitive data in logs or responses
- Don't use synchronous file operations in request handlers
- Don't forget to close database connections
- Don't commit secrets or credentials
- Don't remove existing tests unless fixing broken functionality
- Don't modify unrelated code when making targeted fixes

## When Making Changes

1. Understand the existing code structure and patterns
2. Follow the established architectural patterns (Controller → Service → Repository)
3. Write tests for new functionality
4. Update documentation if adding/changing features
5. Ensure security measures are maintained
6. Test changes locally before committing
7. Make minimal, focused changes that solve the specific problem
