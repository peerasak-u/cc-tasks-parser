# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**cc-tasks** is a powerful command-line task management tool that uses Markdown files as a database. It's designed for developers who want to track project tasks alongside their code, with full support for hierarchical tasks, dependencies, and rich querying capabilities.

## Project Structure

```
cc-tasks-parser/
├── README.md      # Comprehensive documentation and usage guide
├── tasks.md       # Example task tracking document with structured format
├── index.js       # Main CLI entry point (to be implemented)
├── package.json   # NPM package configuration
└── CLAUDE.md      # This file
```

## Development Commands

Key commands for development and testing:

```bash
# Install dependencies
npm install

# Run tests (when implemented)
npm test

# Development mode (when implemented)
npm run dev

# Build for production (when implemented)
npm run build
```

## Task Document Format

The project uses a specific Markdown format for tracking tasks:

```markdown
## Task <ID>: <Title>
- [x] **Complete** | - [ ] **Complete**
**Main Topic:** <Topic Name>
**Description:** <Detailed description>
**Subtasks:**
- [ ] Subtask description
- [x] Completed subtask
**Required Tasks:** <Comma-separated task IDs or "None">
**Validation:** 
- [ ] Validation criterion 1
- [x] Completed validation
```

### Format Rules
1. **Task ID**: Must follow semantic versioning pattern (e.g., 1.0, 2.1, 3.14)
2. **Completion Status**: Use `- [x]` for complete, `- [ ]` for incomplete
3. **Required Fields**: All fields must be present
4. **Subtasks**: At least one subtask is required
5. **Required Tasks**: Use task IDs or "None"

## CLI Architecture

The tool should implement these core commands:

### Core Commands
- `parse` - Validate task file format
- `list` - Display tasks with filtering options
- `get <taskId>` - Get detailed task information
- `status` - Show task statistics and progress
- `deps <taskId>` - Show task dependencies
- `create` - Interactive task creation
- `update <taskId> <status>` - Update task completion
- `check <taskId> <subtaskIndex>` - Toggle subtask completion
- `validate <taskId> <criterionIndex>` - Toggle validation criteria
- `export <format>` - Export tasks (json, html, csv)
- `watch` - Watch for file changes

### Expected Features
- Markdown-based task storage
- Hierarchical task support with subtasks
- Task dependency management
- Rich filtering and querying
- Multiple export formats
- File watching capabilities
- Configuration via `.cctasksrc`

## Implementation Notes

- Use a robust markdown parser (marked, remark, or similar)
- Implement proper error handling and validation
- Support multiple output formats (table, json, minimal)
- Consider using commander.js or yargs for CLI parsing
- Implement proper dependency resolution and cycle detection
- Support configuration files for project-specific settings

## Testing Strategy

When implementing tests:
- Unit tests for parser functions
- Integration tests for CLI commands
- Validation tests for task format compliance
- End-to-end tests for common workflows