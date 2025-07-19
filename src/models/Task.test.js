const Task = require('./Task')

describe('Task', () => {
  let task

  beforeEach(() => {
    task = new Task({
      id: '1.0',
      title: 'Test Task',
      completed: false,
      mainTopic: 'Testing',
      description: 'A test task',
      subtasks: [
        { text: 'First subtask', completed: false },
        { text: 'Second subtask', completed: true },
        { text: 'Third subtask', completed: false }
      ],
      requiredTasks: ['None'],
      validation: [
        { text: 'Validation 1', completed: false },
        { text: 'Validation 2', completed: true }
      ]
    })
  })

  describe('constructor', () => {
    test('should create task with provided data', () => {
      expect(task.id).toBe('1.0')
      expect(task.title).toBe('Test Task')
      expect(task.completed).toBe(false)
      expect(task.mainTopic).toBe('Testing')
      expect(task.description).toBe('A test task')
      expect(task.subtasks).toHaveLength(3)
      expect(task.validation).toHaveLength(2)
    })

    test('should create task with default values', () => {
      const emptyTask = new Task()
      expect(emptyTask.id).toBe('')
      expect(emptyTask.title).toBe('')
      expect(emptyTask.completed).toBe(false)
      expect(emptyTask.subtasks).toEqual([])
      expect(emptyTask.validation).toEqual([])
    })
  })

  describe('getProgress', () => {
    test('should calculate progress based on subtasks', () => {
      expect(task.getProgress()).toBe(33) // 1 out of 3 subtasks completed
    })

    test('should return 100% if task is completed and no subtasks', () => {
      const completedTask = new Task({ completed: true, subtasks: [] })
      expect(completedTask.getProgress()).toBe(100)
    })

    test('should return 0% if task is not completed and no subtasks', () => {
      const incompletedTask = new Task({ completed: false, subtasks: [] })
      expect(incompletedTask.getProgress()).toBe(0)
    })
  })

  describe('getValidationProgress', () => {
    test('should calculate validation progress', () => {
      expect(task.getValidationProgress()).toBe(50) // 1 out of 2 validation items completed
    })

    test('should return 100% if no validation items', () => {
      const taskWithoutValidation = new Task({ validation: [] })
      expect(taskWithoutValidation.getValidationProgress()).toBe(100)
    })
  })

  describe('getDependencyIds', () => {
    test('should return empty array for "None" dependencies', () => {
      expect(task.getDependencyIds()).toEqual([])
    })

    test('should return dependency IDs', () => {
      task.requiredTasks = ['1.1', '1.2']
      expect(task.getDependencyIds()).toEqual(['1.1', '1.2'])
    })

    test('should return empty array for case-insensitive "none"', () => {
      task.requiredTasks = ['none']
      expect(task.getDependencyIds()).toEqual([])
    })
  })

  describe('toggleSubtask', () => {
    test('should toggle subtask completion', () => {
      expect(task.subtasks[0].completed).toBe(false)
      const result = task.toggleSubtask(0)
      expect(result).toBe(true)
      expect(task.subtasks[0].completed).toBe(true)
    })

    test('should return false for invalid index', () => {
      const result = task.toggleSubtask(10)
      expect(result).toBe(false)
    })
  })

  describe('toggleValidation', () => {
    test('should toggle validation completion', () => {
      expect(task.validation[0].completed).toBe(false)
      const result = task.toggleValidation(0)
      expect(result).toBe(true)
      expect(task.validation[0].completed).toBe(true)
    })

    test('should return false for invalid index', () => {
      const result = task.toggleValidation(10)
      expect(result).toBe(false)
    })
  })

  describe('findSubtaskByText', () => {
    test('should find subtask by partial text match', () => {
      const index = task.findSubtaskByText('First')
      expect(index).toBe(0)
    })

    test('should return -1 if not found', () => {
      const index = task.findSubtaskByText('Nonexistent')
      expect(index).toBe(-1)
    })

    test('should be case insensitive', () => {
      const index = task.findSubtaskByText('FIRST')
      expect(index).toBe(0)
    })
  })

  describe('findValidationByText', () => {
    test('should find validation by partial text match', () => {
      const index = task.findValidationByText('Validation 1')
      expect(index).toBe(0)
    })

    test('should return -1 if not found', () => {
      const index = task.findValidationByText('Nonexistent')
      expect(index).toBe(-1)
    })
  })

  describe('setCompleted', () => {
    test('should mark task and all subtasks/validation as complete', () => {
      task.setCompleted(true)
      expect(task.completed).toBe(true)
      expect(task.subtasks.every(s => s.completed)).toBe(true)
      expect(task.validation.every(v => v.completed)).toBe(true)
    })

    test('should not affect subtasks/validation when marking incomplete', () => {
      task.setCompleted(false)
      expect(task.completed).toBe(false)
      expect(task.subtasks[1].completed).toBe(true) // Should remain true
    })
  })

  describe('toJSON', () => {
    test('should return JSON representation with calculated fields', () => {
      const json = task.toJSON()
      expect(json).toEqual({
        id: '1.0',
        title: 'Test Task',
        completed: false,
        mainTopic: 'Testing',
        description: 'A test task',
        subtasks: task.subtasks,
        requiredTasks: ['None'],
        validation: task.validation,
        progress: 33,
        validationProgress: 50
      })
    })
  })
})
