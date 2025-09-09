# Change Log

All notable changes to the Crowe Language Support extension will be documented in this file.

## [0.2.0] - 2025-01-09

### Added
- Full Language Server Protocol (LSP) support with real-time diagnostics
- Enhanced syntax highlighting for all Crowe language constructs
- IntelliSense auto-completion for components, state, computed, actions, stores, streams, and AI operations
- Hover information showing type details and documentation
- Compilation commands with context menu integration
- Watch mode for automatic recompilation on file changes
- Performance profiling and caching support
- Support for source maps generation
- Auto-compile on save option (configurable)

### Improved
- Better error messages and diagnostics with line/column information
- Enhanced code completion with context-aware suggestions
- Improved file association and language detection
- Better integration with Crowe CLI compiler

### Fixed
- Fixed syntax highlighting edge cases with nested expressions
- Resolved issues with component parameter parsing
- Fixed completion provider timing issues

## [0.1.0] - 2025-01-08

### Added
- Initial release of Crowe Language Support
- Basic syntax highlighting for Crowe language constructs:
  - Components and render blocks
  - State declarations and assignments
  - Computed properties
  - Effects and lifecycle hooks
  - Action methods
  - Store definitions
  - Stream declarations
  - AI operations and model bindings
- Language configuration for bracket matching and commenting
- File association for `.crowe` files
- Basic compilation command integration

### Features
- Syntax highlighting using TextMate grammar
- Language server integration for future extensibility
- VS Code command palette integration
- Context menu actions for compilation

---

## Upcoming Features

### [0.3.0] - Planned
- Advanced refactoring support (rename symbols, extract components)
- Code snippets for common patterns
- Integrated debugging support with source maps
- Hot module replacement (HMR) integration
- Package manager integration for dependency management
- Advanced error recovery and suggestions
- Performance analytics and optimization hints
- Multi-file project support with workspace diagnostics

### [0.4.0] - Planned
- Visual component tree explorer
- Real-time preview integration
- Advanced AI model configuration and testing tools
- Stream connection debugging and monitoring
- Store state visualization and time-travel debugging
- Integration with React DevTools
- Automated testing support and test generation