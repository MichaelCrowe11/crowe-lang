# Contributing to Crowe Language

Thank you for your interest in contributing to Crowe! We're excited to have you join our community of developers building the future of AI-native React development.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read and follow our Code of Conduct to ensure a positive experience for everyone.

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**To report a bug:**
1. Use the [Bug Report Template](https://github.com/MichaelCrowe11/crowe-lang/issues/new?template=bug_report.md)
2. Include a clear title and description
3. Provide steps to reproduce
4. Include code samples and error messages
5. Specify your environment (OS, Node version, Crowe version)

### 💡 Suggesting Enhancements

We love new ideas! To suggest an enhancement:
1. Check if it's already suggested in [Issues](https://github.com/MichaelCrowe11/crowe-lang/issues)
2. Use the [Feature Request Template](https://github.com/MichaelCrowe11/crowe-lang/issues/new?template=feature_request.md)
3. Explain the problem it solves
4. Provide code examples of how it would work
5. Consider implementation complexity

### 📝 Improving Documentation

Documentation improvements are always welcome:
- Fix typos or clarify confusing sections
- Add examples for undocumented features
- Translate documentation to other languages
- Create tutorials or guides

### 🔧 Contributing Code

#### First Time Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" button on GitHub
   git clone https://github.com/YOUR_USERNAME/crowe-lang.git
   cd crowe-lang
   git remote add upstream https://github.com/MichaelCrowe11/crowe-lang.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm run build
   ```

3. **Run tests to verify setup**
   ```bash
   npm test
   ```

#### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add/update tests for your changes
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test                 # Run all tests
   npm run test:watch      # Run tests in watch mode
   npm run lint            # Check code style
   npm run build           # Build all packages
   ```

4. **Test the CLI locally**
   ```bash
   npm link
   crowe compile examples/hello-world.crowe
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add support for async components"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Test additions or fixes
   - `chore:` Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to [Pull Requests](https://github.com/MichaelCrowe11/crowe-lang/pulls)
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Link related issues

## Development Guidelines

### Code Style

We use TypeScript and follow these conventions:
- 2 spaces for indentation
- Single quotes for strings
- No semicolons (except where required)
- Meaningful variable names
- Comments for complex logic

Example:
```typescript
// Good
export function parseComponent(input: string): ComponentNode {
  const lines = input.split('\n')
  
  // Parse component declaration
  const componentMatch = lines[0].match(COMPONENT_REGEX)
  if (!componentMatch) {
    throw new ParseError('Invalid component syntax')
  }
  
  return {
    type: 'component',
    name: componentMatch[1],
    children: parseBody(lines.slice(1))
  }
}

// Avoid
export function parse(s) {
  var l = s.split("\n");
  var m = l[0].match(/.*/);
  if(!m) throw "error";
  return {type:"component",name:m[1],children:parseBody(l.slice(1))};
}
```

### Testing

Every feature should have tests:

```typescript
describe('Component Parser', () => {
  it('should parse basic component', () => {
    const input = `component Button {
      render {
        <button>Click me</button>
      }
    }`
    
    const ast = parseComponent(input)
    expect(ast.type).toBe('component')
    expect(ast.name).toBe('Button')
  })
  
  it('should handle parsing errors gracefully', () => {
    const invalid = 'not a component'
    expect(() => parseComponent(invalid)).toThrow('Invalid component syntax')
  })
})
```

### Performance Considerations

- Avoid unnecessary regex operations
- Cache compiled results
- Use efficient data structures
- Profile before optimizing
- Document performance-critical code

### Security

- Never include secrets in code
- Sanitize user input
- Use parameterized queries
- Follow OWASP guidelines
- Report security issues privately

## Project Structure

```
crowe-lang/
├── packages/
│   ├── crowe-compiler/     # Core compiler
│   ├── crowe-cli/          # Command-line interface
│   ├── crowe-language-server/  # LSP implementation
│   ├── crowe-hmr/          # Hot module replacement
│   ├── crowe-vite-plugin/  # Vite integration
│   └── crowe-create/       # Project scaffolding
├── vscode-extension/       # VS Code extension
├── examples/              # Example Crowe projects
├── docs/                  # Documentation
├── scripts/              # Build and utility scripts
└── tests/               # Integration tests
```

## Pull Request Process

1. **Before submitting:**
   - [ ] Tests pass locally
   - [ ] Code follows style guidelines
   - [ ] Documentation is updated
   - [ ] Commit messages follow conventions
   - [ ] Branch is up to date with main

2. **PR Review Process:**
   - Automated tests run via GitHub Actions
   - Code review by maintainers
   - Discussion and feedback
   - Approval and merge

3. **After merge:**
   - Delete your feature branch
   - Pull latest changes
   - Celebrate your contribution! 🎉

## Working on Specific Areas

### Compiler Development

Located in `packages/crowe-compiler/`:
- `parser.ts` - Syntax parsing
- `ast.ts` - AST definitions
- `generator.ts` - Code generation
- `transformer.ts` - AST transformations

### Language Server

Located in `packages/crowe-language-server/`:
- `server.ts` - Main LSP server
- `diagnostics.ts` - Error checking
- `completion.ts` - Auto-completion
- `hover.ts` - Hover information

### VS Code Extension

Located in `vscode-extension/`:
- `extension.ts` - Extension entry point
- `syntaxes/` - TextMate grammars
- `package.json` - Extension manifest

## Getting Help

- **Discord**: Join our [Discord server](https://discord.gg/crowe-lang)
- **Discussions**: Use [GitHub Discussions](https://github.com/MichaelCrowe11/crowe-lang/discussions)
- **Email**: core-team@crowe-lang.dev

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation
- Invited to contributor meetings
- Eligible for contributor swag

## Release Process

We follow semantic versioning:
- **Patch** (0.0.X): Bug fixes, documentation
- **Minor** (0.X.0): New features, non-breaking changes
- **Major** (X.0.0): Breaking changes

Releases happen:
- Patch: As needed (usually weekly)
- Minor: Monthly
- Major: Quarterly or as needed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions make Crowe better for everyone. We appreciate your time and effort in improving the language and ecosystem.

Happy coding! 🚀