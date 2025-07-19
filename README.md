# Claude Code Tasks

A powerful command-line task management tool that uses Markdown files as a database. Perfect for developers who want to track project tasks alongside their code.

## Features

- **Markdown-based**: Store tasks in human-readable `.md` files that can be versioned with git
- **Hierarchical tasks**: Support for main tasks and subtasks with completion tracking
- **Dependencies**: Define task dependencies and validate task order
- **Rich querying**: Filter and search tasks by status, topic, or ID
- **Export options**: Export tasks to JSON or HTML for reporting
- **File watching**: Auto-reload when task files change
- **Validation**: Ensure task format consistency across your project

## Installation

Use directly with npx (no installation required):

```bash
npx cc-tasks <command>
```

Or install globally:

```bash
npm install -g cc-tasks
```

Or add to your project:

```bash
npm install --save-dev cc-tasks
```

## Quick Start

1. Create a `tasks.md` file in your project:

```markdown
## Task 1.0: Setup Project
- [ ] **Complete**
**Main Topic:** Initial Setup
**Description:** Set up the project structure and dependencies
**Subtasks:**
- [x] Initialize npm project
- [ ] Install dependencies
- [ ] Create folder structure
**Required Tasks:** None
**Validation:** 
- [ ] package.json exists
- [ ] All dependencies installed
```

2. Validate your task file:

```bash
npx cc-tasks parse
```

3. List all tasks:

```bash
npx cc-tasks list
```

## Commands

### `parse`

Validate the format of your tasks.md file.

```bash
npx cc-tasks parse [file]
# Default: ./tasks.md
```

Options:
- `--file, -f`: Specify task file (default: tasks.md)
- `--strict`: Enable strict validation mode

### `list`

Display all tasks with their status.

```bash
npx cc-tasks list [options]
```

Options:
- `--status, -s`: Filter by status (complete, incomplete, all)
- `--topic, -t`: Filter by main topic
- `--format`: Output format (table, json, minimal)
- `--file, -f`: Specify task file

Examples:

```bash
# List all incomplete tasks
npx cc-tasks list --status incomplete

# List tasks for a specific topic
npx cc-tasks list --topic "UI Components"

# Output as JSON
npx cc-tasks list --format json
```

### `get`

Get detailed information about a specific task.

```bash
npx cc-tasks get <taskId>
```

Example:

```bash
npx cc-tasks get 2.1
# Shows full details for Task 2.1
```

### `status`

Display task statistics and overall progress.

```bash
npx cc-tasks status
```

Output example:
```
Task Statistics:
Total Tasks: 24
Completed: 18 (75%)
In Progress: 4 (17%)
Not Started: 2 (8%)

By Topic:
- UI Components: 8/10 (80%)
- Backend Integration: 6/8 (75%)
- Testing: 4/6 (67%)
```

### `deps`

Show task dependencies and dependency tree.

```bash
npx cc-tasks deps <taskId>
```

Options:
- `--reverse`: Show tasks that depend on this task
- `--tree`: Display as dependency tree

Example:

```bash
npx cc-tasks deps 3.0 --tree
# Task 3.0: Extract Section Components
# └── Requires:
#     ├── Task 1.1: Create Directory Structure
#     ├── Task 1.2: Analyze Current Components
#     └── Task 2.0: Extract Major UI Components
```

### `create`

Create a new task interactively.

```bash
npx cc-tasks create
```

This will prompt you for:
- Task ID
- Task title
- Main topic
- Description
- Subtasks
- Required tasks
- Validation criteria

### `update`

Update task completion status.

```bash
npx cc-tasks update <taskId> <status>
```

Status options: `complete`, `incomplete`

Example:

```bash
npx cc-tasks update 2.1 complete
```

### `check`

Toggle subtask completion status.

```bash
npx cc-tasks check <taskId> <subtaskIndex>
```

Example:

```bash
# Toggle the first subtask of task 2.1
npx cc-tasks check 2.1 1

# Toggle by partial text match
npx cc-tasks check 2.1 "Create directory"
```

### `validate`

Toggle validation criteria completion status.

```bash
npx cc-tasks validate <taskId> <criterionIndex>
```

Example:

```bash
# Toggle the first validation criterion of task 2.1
npx cc-tasks validate 2.1 1

# Toggle by partial text match
npx cc-tasks validate 2.1 "Directory structure exists"

# Mark all validation criteria as complete
npx cc-tasks validate 2.1 --all
```

### `export`

Export tasks to different formats.

```bash
npx cc-tasks export <format> [output]
```

Formats: `json`, `html`, `csv`

Examples:

```bash
# Export to JSON
npx cc-tasks export json tasks.json

# Export to HTML report
npx cc-tasks export html report.html

# Export to stdout
npx cc-tasks export json
```

### `watch`

Watch for changes in task files and display live updates.

```bash
npx cc-tasks watch
```

Options:
- `--command, -c`: Command to run on change
- `--file, -f`: Specify task file to watch

## Task Format Specification

Tasks must follow this Markdown format:

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
3. **Required Fields**: All fields (Main Topic, Description, Subtasks, Required Tasks, Validation) must be present
4. **Subtasks**: At least one subtask is required
5. **Required Tasks**: Use task IDs (e.g., "1.0, 1.1") or "None"

## Configuration

Create a `.cctasksrc` file in your project root:

```json
{
  "taskFile": "tasks.md",
  "validation": {
    "strict": true,
    "requireValidation": true
  },
  "export": {
    "defaultFormat": "json",
    "htmlTemplate": "custom-template.html"
  }
}
```

## Examples

### Project Refactoring Workflow

```bash
# 1. Parse and validate your task file
npx cc-tasks parse

# 2. View current status
npx cc-tasks status

# 3. List incomplete tasks
npx cc-tasks list --status incomplete

# 4. Work on a task and mark subtasks
npx cc-tasks get 2.1
npx cc-tasks check 2.1 1
npx cc-tasks check 2.1 2

# 5. Complete the task
npx cc-tasks update 2.1 complete

# 6. Export progress report
npx cc-tasks export html progress-report.html
```

### Dependency Management

```bash
# Check what needs to be done before starting a task
npx cc-tasks deps 5.0

# See the full dependency tree
npx cc-tasks deps 5.0 --tree

# Find tasks that depend on current task
npx cc-tasks deps 2.0 --reverse
```

## API Usage

You can also use cc-tasks programmatically:

```javascript
const { TaskParser, TaskManager } = require('cc-tasks');

// Parse tasks
const parser = new TaskParser();
const tasks = await parser.parseFile('tasks.md');

// Query tasks
const manager = new TaskManager(tasks);
const incompleteTasks = manager.filter({ status: 'incomplete' });
const uiTasks = manager.filter({ topic: 'UI Components' });

// Update task
await manager.updateTask('2.1', { status: 'complete' });
await manager.toggleSubtask('2.1', 0);

// Export
const json = manager.exportJSON();
const html = manager.exportHTML();
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/peerasak-u/cc-tasks-parser.git
cd cc-tasks-parser

# Install dependencies
npm install

# Run tests
npm test

# Run in development mode
npm run dev
```

## License

MIT © Peerasak Unsakon

## Acknowledgments

- Inspired by the need for simple, version-controllable task management
- Built for developers who prefer plain text over complex tools

## Roadmap

- [ ] GitHub integration for automatic issue creation
- [ ] Task templates for common project types
- [ ] Time tracking functionality
- [ ] Multi-file task support
- [ ] Web UI for task visualization
- [ ] Integration with popular project management tools