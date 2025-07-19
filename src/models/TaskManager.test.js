const TaskManager = require('./TaskManager')
const Task = require('./Task')

describe('TaskManager', () => {
  let manager
  let tasks

  beforeEach(() => {
    tasks = [
      new Task({
        id: '1.0',
        title: 'First Task',
        completed: true,
        mainTopic: 'Setup',
        description: 'Setup project',
        subtasks: [
          { text: 'Initialize repo', completed: true },
          { text: 'Create structure', completed: true }
        ],
        requiredTasks: ['None'],
        validation: [{ text: 'Project created', completed: true }]
      }),
      new Task({
        id: '2.0',
        title: 'Second Task',
        completed: false,
        mainTopic: 'Development',
        description: 'Implement features',
        subtasks: [
          { text: 'Design API', completed: true },
          { text: 'Write code', completed: false },
          { text: 'Add tests', completed: false }
        ],
        requiredTasks: ['1.0'],
        validation: [
          { text: 'API documented', completed: false },
          { text: 'Tests pass', completed: false }
        ]
      }),
      new Task({
        id: '2.1',
        title: 'Subtask of Second',
        completed: false,
        mainTopic: 'Development',
        description: 'Implement specific feature',
        subtasks: [
          { text: 'Research solution', completed: true },
          { text: 'Implement', completed: false }
        ],
        requiredTasks: ['2.0'],
        validation: [{ text: 'Feature works', completed: false }]
      })
    ]

    manager = new TaskManager(tasks)
  })

  describe('constructor', () => {
    test('should create manager with tasks', () => {
      expect(manager.getTasks()).toHaveLength(3)
    })

    test('should create manager with empty array', () => {
      const emptyManager = new TaskManager()
      expect(emptyManager.getTasks()).toHaveLength(0)
    })
  })

  describe('addTask', () => {
    test('should add new task', () => {
      const newTask = new Task({ id: '3.0', title: 'Third Task' })
      manager.addTask(newTask)
      expect(manager.getTasks()).toHaveLength(4)
      expect(manager.getTask('3.0')).toBe(newTask)
    })
  })

  describe('getTask', () => {
    test('should return task by ID', () => {
      const task = manager.getTask('1.0')
      expect(task.title).toBe('First Task')
    })

    test('should return undefined for non-existent task', () => {
      const task = manager.getTask('999.0')
      expect(task).toBeUndefined()
    })
  })

  describe('filter', () => {
    test('should filter by status - complete', () => {
      const completed = manager.filter({ status: 'complete' })
      expect(completed).toHaveLength(1)
      expect(completed[0].id).toBe('1.0')
    })

    test('should filter by status - incomplete', () => {
      const incomplete = manager.filter({ status: 'incomplete' })
      expect(incomplete).toHaveLength(2)
      expect(incomplete.map(t => t.id)).toEqual(['2.0', '2.1'])
    })

    test('should filter by topic', () => {
      const devTasks = manager.filter({ topic: 'Development' })
      expect(devTasks).toHaveLength(2)
      expect(devTasks.map(t => t.id)).toEqual(['2.0', '2.1'])
    })

    test('should filter by topic case-insensitive', () => {
      const devTasks = manager.filter({ topic: 'development' })
      expect(devTasks).toHaveLength(2)
    })

    test('should filter by ID', () => {
      const task = manager.filter({ id: '1.0' })
      expect(task).toHaveLength(1)
      expect(task[0].id).toBe('1.0')
    })

    test('should return all tasks with no filters', () => {
      const allTasks = manager.filter({})
      expect(allTasks).toHaveLength(3)
    })
  })

  describe('getStatistics', () => {
    test('should calculate correct statistics', () => {
      const stats = manager.getStatistics()

      expect(stats.total).toBe(3)
      expect(stats.completed).toBe(1)
      expect(stats.incomplete).toBe(2)
      expect(stats.completionRate).toBe(33)

      expect(stats.topics).toEqual({
        Setup: { total: 1, completed: 1 },
        Development: { total: 2, completed: 0 }
      })
    })

    test('should handle empty task list', () => {
      const emptyManager = new TaskManager([])
      const stats = emptyManager.getStatistics()

      expect(stats.total).toBe(0)
      expect(stats.completed).toBe(0)
      expect(stats.incomplete).toBe(0)
      expect(stats.completionRate).toBe(0)
      expect(stats.topics).toEqual({})
    })
  })

  describe('getDependencies', () => {
    test('should return task dependencies', () => {
      const deps = manager.getDependencies('2.0')
      expect(deps).toHaveLength(1)
      expect(deps[0].id).toBe('1.0')
    })

    test('should return empty array for task with no dependencies', () => {
      const deps = manager.getDependencies('1.0')
      expect(deps).toHaveLength(0)
    })

    test('should return null for non-existent task', () => {
      const deps = manager.getDependencies('999.0')
      expect(deps).toBeNull()
    })
  })

  describe('getDependents', () => {
    test('should return tasks that depend on given task', () => {
      const dependents = manager.getDependents('1.0')
      expect(dependents).toHaveLength(1)
      expect(dependents[0].id).toBe('2.0')
    })

    test('should return empty array for task with no dependents', () => {
      const dependents = manager.getDependents('2.1')
      expect(dependents).toHaveLength(0)
    })
  })

  describe('getDependencyTree', () => {
    test('should build dependency tree', () => {
      const tree = manager.getDependencyTree('2.1')

      expect(tree.task.id).toBe('2.1')
      expect(tree.circular).toBe(false)
      expect(tree.dependencies).toHaveLength(1)
      expect(tree.dependencies[0].task.id).toBe('2.0')
      expect(tree.dependencies[0].dependencies).toHaveLength(1)
      expect(tree.dependencies[0].dependencies[0].task.id).toBe('1.0')
    })

    test('should return null for non-existent task', () => {
      const tree = manager.getDependencyTree('999.0')
      expect(tree).toBeNull()
    })
  })

  describe('updateTask', () => {
    test('should update existing task', async () => {
      await manager.updateTask('1.0', { title: 'Updated Title' })
      const task = manager.getTask('1.0')
      expect(task.title).toBe('Updated Title')
    })

    test('should throw error for non-existent task', async () => {
      await expect(manager.updateTask('999.0', { title: 'New Title' }))
        .rejects.toThrow('Task 999.0 not found')
    })
  })

  describe('toggleSubtask', () => {
    test('should toggle subtask by index', async () => {
      const task = await manager.toggleSubtask('2.0', 1)
      expect(task.subtasks[1].completed).toBe(true)
    })

    test('should toggle subtask by text', async () => {
      const task = await manager.toggleSubtask('2.0', 'Write code')
      expect(task.subtasks[1].completed).toBe(true)
    })

    test('should throw error for non-existent task', async () => {
      await expect(manager.toggleSubtask('999.0', 0))
        .rejects.toThrow('Task 999.0 not found')
    })

    test('should throw error for invalid subtask index', async () => {
      await expect(manager.toggleSubtask('2.0', 10))
        .rejects.toThrow('Invalid subtask index 10 for task 2.0')
    })
  })

  describe('toggleValidation', () => {
    test('should toggle validation by index', async () => {
      const task = await manager.toggleValidation('2.0', 0)
      expect(task.validation[0].completed).toBe(true)
    })

    test('should toggle validation by text', async () => {
      const task = await manager.toggleValidation('2.0', 'API documented')
      expect(task.validation[0].completed).toBe(true)
    })

    test('should throw error for non-existent task', async () => {
      await expect(manager.toggleValidation('999.0', 0))
        .rejects.toThrow('Task 999.0 not found')
    })
  })

  describe('exportJSON', () => {
    test('should export tasks as JSON', () => {
      const json = manager.exportJSON()

      expect(json).toHaveProperty('tasks')
      expect(json).toHaveProperty('statistics')
      expect(json).toHaveProperty('exportedAt')
      expect(json.tasks).toHaveLength(3)
      expect(json.statistics.total).toBe(3)
    })
  })

  describe('exportCSV', () => {
    test('should export tasks as CSV', () => {
      const csv = manager.exportCSV()

      expect(csv).toContain('ID,Title,Status,Topic,Progress,Validation Progress,Dependencies')
      expect(csv).toContain('1.0,"First Task",Complete,"Setup",100%,100%,"None"')
      expect(csv).toContain('2.0,"Second Task",Incomplete,"Development"')
    })
  })

  describe('exportHTML', () => {
    test('should export tasks as HTML', () => {
      const html = manager.exportHTML()

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<title>Task Report</title>')
      expect(html).toContain('First Task')
      expect(html).toContain('Second Task')
      expect(html).toContain('Task Management Report')
    })
  })

  describe('validateDependencies', () => {
    test('should return empty array for valid dependencies', () => {
      const errors = manager.validateDependencies()
      expect(errors).toHaveLength(0)
    })

    test('should detect missing dependencies', () => {
      tasks[1].requiredTasks = ['999.0']
      const errors = manager.validateDependencies()
      expect(errors).toContain('Task 2.0 depends on non-existent task 999.0')
    })
  })
})
