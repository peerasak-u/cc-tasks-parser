const fs = require('fs-extra')
const Task = require('../models/Task')

class TaskParser {
  constructor () {
    this.strictMode = false
  }

  setStrictMode (strict) {
    this.strictMode = strict
  }

  async parseFile (filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8')
      return this.parseContent(content)
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`)
    }
  }

  parseContent (content) {
    const tasks = []
    const errors = []

    const lines = content.split('\n')
    let currentTask = null
    let i = 0

    while (i < lines.length) {
      const line = lines[i].trim()

      if (line.match(/^## Task .+:/)) {
        if (currentTask) {
          const validation = this.validateTask(currentTask)
          if (validation.isValid) {
            tasks.push(new Task(currentTask))
          } else {
            errors.push(...validation.errors.map(err => `Task ${currentTask.id}: ${err}`))
          }
        }

        currentTask = this.parseTaskHeader(line.replace(/^## /, ''))
        if (!currentTask) {
          errors.push(`Invalid task header format: ${line}`)
        }
      } else if (currentTask && line.match(/^- \[[ x]\] \*\*Complete\*\*/)) {
        currentTask.completed = line.includes('[x]')
      } else if (currentTask && line.startsWith('**Main Topic:**')) {
        currentTask.mainTopic = line.replace('**Main Topic:**', '').trim()
      } else if (currentTask && line.startsWith('**Description:**')) {
        currentTask.description = line.replace('**Description:**', '').trim()
      } else if (currentTask && line.startsWith('**Required Tasks:**')) {
        currentTask.requiredTasks = this.parseRequiredTasks(line.replace('**Required Tasks:**', '').trim())
      } else if (currentTask && line === '**Subtasks:**') {
        i++
        const subtasks = []
        while (i < lines.length && lines[i].trim().match(/^- \[[ x]\]/)) {
          const subtaskLine = lines[i].trim()
          const completed = subtaskLine.includes('[x]')
          const text = subtaskLine.replace(/^- \[[ x]\]\s*/, '')
          subtasks.push({ text, completed })
          i++
        }
        currentTask.subtasks = subtasks
        i-- // Back up one since the loop will increment
      } else if (currentTask && line === '**Validation:**') {
        i++
        const validation = []
        while (i < lines.length && lines[i].trim().match(/^- \[[ x]\]/)) {
          const validationLine = lines[i].trim()
          const completed = validationLine.includes('[x]')
          const text = validationLine.replace(/^- \[[ x]\]\s*/, '')
          validation.push({ text, completed })
          i++
        }
        currentTask.validation = validation
        i-- // Back up one since the loop will increment
      }

      i++
    }

    if (currentTask) {
      const validation = this.validateTask(currentTask)
      if (validation.isValid) {
        tasks.push(new Task(currentTask))
      } else {
        errors.push(...validation.errors.map(err => `Task ${currentTask.id}: ${err}`))
      }
    }

    return {
      tasks,
      errors,
      isValid: errors.length === 0
    }
  }

  parseTaskHeader (headerText) {
    const match = headerText.match(/^Task\s+([\d.]+):\s+(.+)$/)
    if (!match) {
      return null
    }

    return {
      id: match[1],
      title: match[2],
      completed: false,
      mainTopic: '',
      description: '',
      subtasks: [],
      requiredTasks: [],
      validation: []
    }
  }

  parseCheckboxList (items) {
    return items.map(item => {
      const text = item.text || ''
      const completed = text.startsWith('[x]')
      const cleanText = text.replace(/^\[[ x]\]\s*/, '')

      return {
        text: cleanText,
        completed
      }
    })
  }

  parseRequiredTasks (text) {
    if (text.toLowerCase() === 'none') {
      return ['None']
    }

    return text.split(',').map(task => task.trim()).filter(task => task.length > 0)
  }

  validateTask (task) {
    const errors = []

    if (!task.id) {
      errors.push('Task ID is required')
    } else if (!this.isValidTaskId(task.id)) {
      errors.push('Task ID must follow semantic versioning pattern (e.g., 1.0, 2.1, 3.14)')
    }

    if (!task.title) {
      errors.push('Task title is required')
    }

    if (!task.mainTopic) {
      errors.push('Main Topic is required')
    }

    if (!task.description) {
      errors.push('Description is required')
    }

    if (task.subtasks.length === 0) {
      errors.push('At least one subtask is required')
    }

    if (task.requiredTasks.length === 0) {
      errors.push('Required Tasks field is required (use "None" if no dependencies)')
    }

    if (this.strictMode && task.validation.length === 0) {
      errors.push('At least one validation criterion is required in strict mode')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  isValidTaskId (id) {
    return /^\d+(\.\d+){0,2}$/.test(id)
  }
}

module.exports = TaskParser
