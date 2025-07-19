const TaskParser = require('./TaskParser')
const fs = require('fs-extra')
const path = require('path')

describe('TaskParser', () => {
  let parser
  let tempFile

  beforeEach(() => {
    parser = new TaskParser()
    tempFile = path.join(__dirname, 'test-tasks.md')
  })

  afterEach(async () => {
    if (await fs.pathExists(tempFile)) {
      await fs.remove(tempFile)
    }
  })

  describe('parseContent', () => {
    test('should parse valid task content', () => {
      const content = `
## Task 1.0: Test Task
- [x] **Complete**
**Main Topic:** Testing
**Description:** A test task description
**Subtasks:**
- [x] First subtask
- [ ] Second subtask
**Required Tasks:** None
**Validation:** 
- [x] Test passes
- [ ] Documentation updated
`

      const result = parser.parseContent(content)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.tasks).toHaveLength(1)

      const task = result.tasks[0]
      expect(task.id).toBe('1.0')
      expect(task.title).toBe('Test Task')
      expect(task.completed).toBe(true)
      expect(task.mainTopic).toBe('Testing')
      expect(task.description).toBe('A test task description')
      expect(task.subtasks).toHaveLength(2)
      expect(task.subtasks[0].completed).toBe(true)
      expect(task.subtasks[1].completed).toBe(false)
      expect(task.validation).toHaveLength(2)
      expect(task.requiredTasks).toEqual(['None'])
    })

    test('should parse multiple tasks', () => {
      const content = `
## Task 1.0: First Task
- [ ] **Complete**
**Main Topic:** Testing
**Description:** First task
**Subtasks:**
- [ ] Subtask 1
**Required Tasks:** None
**Validation:** 
- [ ] Validation 1

## Task 2.0: Second Task  
- [x] **Complete**
**Main Topic:** Development
**Description:** Second task
**Subtasks:**
- [x] Subtask 1
- [x] Subtask 2
**Required Tasks:** 1.0
**Validation:** 
- [x] Done
`

      const result = parser.parseContent(content)

      expect(result.isValid).toBe(true)
      expect(result.tasks).toHaveLength(2)
      expect(result.tasks[0].id).toBe('1.0')
      expect(result.tasks[1].id).toBe('2.0')
      expect(result.tasks[1].requiredTasks).toEqual(['1.0'])
    })

    test('should handle tasks with multiple dependencies', () => {
      const content = `
## Task 3.0: Third Task
- [ ] **Complete**
**Main Topic:** Integration
**Description:** Task with multiple dependencies
**Subtasks:**
- [ ] Subtask 1
**Required Tasks:** 1.0, 2.0, 2.1
**Validation:** 
- [ ] Integration tests pass
`

      const result = parser.parseContent(content)

      expect(result.isValid).toBe(true)
      expect(result.tasks[0].requiredTasks).toEqual(['1.0', '2.0', '2.1'])
    })

    test('should detect validation errors', () => {
      const content = `
## Task invalid: Invalid ID
- [ ] **Complete**
**Main Topic:** Testing
**Description:** Task with invalid ID
**Subtasks:**
- [ ] Subtask 1
**Required Tasks:** None
**Validation:** 
- [ ] Validation 1
`

      const result = parser.parseContent(content)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid task header format: ## Task invalid: Invalid ID')
    })

    test('should detect missing required fields', () => {
      const content = `
## Task 1.0: Incomplete Task
- [ ] **Complete**
**Subtasks:**
- [ ] Subtask 1
**Required Tasks:** None
**Validation:** 
- [ ] Validation 1
`

      const result = parser.parseContent(content)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Task 1.0: Main Topic is required')
      expect(result.errors).toContain('Task 1.0: Description is required')
    })
  })

  describe('parseFile', () => {
    test('should parse file successfully', async () => {
      const content = `
## Task 1.0: File Test
- [ ] **Complete**
**Main Topic:** File Testing
**Description:** Testing file parsing
**Subtasks:**
- [ ] Read file
**Required Tasks:** None
**Validation:** 
- [ ] File parsed correctly
`

      await fs.writeFile(tempFile, content)

      const result = await parser.parseFile(tempFile)

      expect(result.isValid).toBe(true)
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].mainTopic).toBe('File Testing')
    })

    test('should throw error for non-existent file', async () => {
      await expect(parser.parseFile('non-existent.md')).rejects.toThrow()
    })
  })

  describe('parseTaskHeader', () => {
    test('should parse valid task header', () => {
      const task = parser.parseTaskHeader('Task 1.0: Test Task Title')
      expect(task.id).toBe('1.0')
      expect(task.title).toBe('Test Task Title')
    })

    test('should return null for invalid header', () => {
      const task = parser.parseTaskHeader('Invalid Header')
      expect(task).toBeNull()
    })

    test('should handle complex task IDs', () => {
      const task = parser.parseTaskHeader('Task 1.2.3: Complex Task')
      expect(task.id).toBe('1.2.3')
      expect(task.title).toBe('Complex Task')
    })
  })

  describe('parseCheckboxList', () => {
    test('should parse checkbox list items', () => {
      const items = [
        { text: '[x] Completed item' },
        { text: '[ ] Incomplete item' },
        { text: '[x] Another completed item' }
      ]

      const result = parser.parseCheckboxList(items)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ text: 'Completed item', completed: true })
      expect(result[1]).toEqual({ text: 'Incomplete item', completed: false })
      expect(result[2]).toEqual({ text: 'Another completed item', completed: true })
    })
  })

  describe('parseRequiredTasks', () => {
    test('should parse "None" as special case', () => {
      const result = parser.parseRequiredTasks('None')
      expect(result).toEqual(['None'])
    })

    test('should parse comma-separated task IDs', () => {
      const result = parser.parseRequiredTasks('1.0, 2.1, 3.0')
      expect(result).toEqual(['1.0', '2.1', '3.0'])
    })

    test('should handle extra whitespace', () => {
      const result = parser.parseRequiredTasks(' 1.0 , 2.1 , 3.0 ')
      expect(result).toEqual(['1.0', '2.1', '3.0'])
    })
  })

  describe('validateTask', () => {
    test('should validate complete task', () => {
      const task = {
        id: '1.0',
        title: 'Valid Task',
        mainTopic: 'Testing',
        description: 'A valid task description',
        subtasks: [{ text: 'Subtask 1', completed: false }],
        requiredTasks: ['None'],
        validation: [{ text: 'Validation 1', completed: false }]
      }

      const result = parser.validateTask(task)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect missing fields', () => {
      const task = {
        id: '',
        title: '',
        mainTopic: '',
        description: '',
        subtasks: [],
        requiredTasks: [],
        validation: []
      }

      const result = parser.validateTask(task)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Task ID is required')
      expect(result.errors).toContain('Task title is required')
      expect(result.errors).toContain('Main Topic is required')
      expect(result.errors).toContain('Description is required')
      expect(result.errors).toContain('At least one subtask is required')
      expect(result.errors).toContain('Required Tasks field is required (use "None" if no dependencies)')
    })

    test('should validate task ID format', () => {
      const task = {
        id: 'invalid-id',
        title: 'Task',
        mainTopic: 'Topic',
        description: 'Description',
        subtasks: [{ text: 'Subtask', completed: false }],
        requiredTasks: ['None'],
        validation: []
      }

      const result = parser.validateTask(task)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Task ID must follow semantic versioning pattern (e.g., 1.0, 2.1, 3.14)')
    })
  })

  describe('isValidTaskId', () => {
    test('should validate correct task IDs', () => {
      expect(parser.isValidTaskId('1.0')).toBe(true)
      expect(parser.isValidTaskId('2.1')).toBe(true)
      expect(parser.isValidTaskId('10.5.3')).toBe(true)
      expect(parser.isValidTaskId('1')).toBe(true)
    })

    test('should reject invalid task IDs', () => {
      expect(parser.isValidTaskId('1.0.0.0')).toBe(false)
      expect(parser.isValidTaskId('v1.0')).toBe(false)
      expect(parser.isValidTaskId('1.0-beta')).toBe(false)
      expect(parser.isValidTaskId('invalid')).toBe(false)
      expect(parser.isValidTaskId('')).toBe(false)
    })
  })

  describe('strict mode', () => {
    test('should require validation in strict mode', () => {
      parser.setStrictMode(true)

      const task = {
        id: '1.0',
        title: 'Task',
        mainTopic: 'Topic',
        description: 'Description',
        subtasks: [{ text: 'Subtask', completed: false }],
        requiredTasks: ['None'],
        validation: []
      }

      const result = parser.validateTask(task)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('At least one validation criterion is required in strict mode')
    })

    test('should not require validation in normal mode', () => {
      parser.setStrictMode(false)

      const task = {
        id: '1.0',
        title: 'Task',
        mainTopic: 'Topic',
        description: 'Description',
        subtasks: [{ text: 'Subtask', completed: false }],
        requiredTasks: ['None'],
        validation: []
      }

      const result = parser.validateTask(task)
      expect(result.isValid).toBe(true)
    })
  })
})
