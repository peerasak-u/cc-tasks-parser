const fs = require('fs-extra')

class MarkdownUpdater {
  constructor (filePath) {
    this.filePath = filePath
  }

  async updateTask (taskId, updates) {
    const content = await fs.readFile(this.filePath, 'utf8')
    const lines = content.split('\n')
    const updatedLines = [...lines]

    let taskStartIndex = -1
    let taskEndIndex = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.match(new RegExp(`^## Task ${this.escapeRegex(taskId)}:`))) {
        taskStartIndex = i
        continue
      }

      if (taskStartIndex !== -1 && line.match(/^## Task \d+(\.\d+)*:/)) {
        taskEndIndex = i - 1
        break
      }
    }

    if (taskStartIndex === -1) {
      throw new Error(`Task ${taskId} not found in file`)
    }

    if (taskEndIndex === -1) {
      taskEndIndex = lines.length - 1
    }

    if (updates.completed !== undefined) {
      for (let i = taskStartIndex + 1; i <= taskEndIndex; i++) {
        const line = lines[i]
        if (line.match(/^- \[[ x]\] \*\*Complete\*\*/)) {
          updatedLines[i] = updates.completed ? '- [x] **Complete**' : '- [ ] **Complete**'
          break
        }
      }
    }

    if (updates.subtasks) {
      for (let i = taskStartIndex + 1; i <= taskEndIndex; i++) {
        const line = lines[i]
        if (line.trim() === '**Subtasks:**') {
          let j = i + 1
          while (j <= taskEndIndex && lines[j].match(/^- \[[ x]\]/)) {
            j++
          }

          const newSubtasks = updates.subtasks.map(subtask =>
            `- [${subtask.completed ? 'x' : ' '}] ${subtask.text}`
          )

          updatedLines.splice(i + 1, j - i - 1, ...newSubtasks)
          break
        }
      }
    }

    if (updates.validation) {
      for (let i = taskStartIndex + 1; i <= taskEndIndex; i++) {
        const line = lines[i]
        if (line.trim() === '**Validation:**') {
          let j = i + 1
          while (j <= taskEndIndex && lines[j].match(/^- \[[ x]\]/)) {
            j++
          }

          const newValidation = updates.validation.map(item =>
            `- [${item.completed ? 'x' : ' '}] ${item.text}`
          )

          updatedLines.splice(i + 1, j - i - 1, ...newValidation)
          break
        }
      }
    }

    await fs.writeFile(this.filePath, updatedLines.join('\n'))
  }

  async toggleSubtask (taskId, subtaskIndex) {
    const content = await fs.readFile(this.filePath, 'utf8')
    const lines = content.split('\n')
    const updatedLines = [...lines]

    let taskStartIndex = -1
    let taskEndIndex = -1
    let subtaskStartIndex = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.match(new RegExp(`^## Task ${this.escapeRegex(taskId)}:`))) {
        taskStartIndex = i
        continue
      }

      if (taskStartIndex !== -1 && line.match(/^## Task \d+(\.\d+)*:/)) {
        taskEndIndex = i - 1
        break
      }

      if (taskStartIndex !== -1 && line.trim() === '**Subtasks:**') {
        subtaskStartIndex = i + 1
      }
    }

    if (taskStartIndex === -1) {
      throw new Error(`Task ${taskId} not found in file`)
    }

    if (taskEndIndex === -1) {
      taskEndIndex = lines.length - 1
    }

    if (subtaskStartIndex === -1) {
      throw new Error(`Subtasks section not found for task ${taskId}`)
    }

    let subtaskCount = 0
    for (let i = subtaskStartIndex; i <= taskEndIndex; i++) {
      const line = lines[i]
      if (line.match(/^- \[[ x]\]/)) {
        if (subtaskCount === subtaskIndex) {
          const isCompleted = line.includes('[x]')
          updatedLines[i] = line.replace(/\[[ x]\]/, isCompleted ? '[ ]' : '[x]')
          break
        }
        subtaskCount++
      } else if (line.trim() && !line.match(/^- \[[ x]\]/)) {
        break
      }
    }

    if (subtaskCount <= subtaskIndex) {
      throw new Error(`Subtask index ${subtaskIndex} out of range for task ${taskId}`)
    }

    await fs.writeFile(this.filePath, updatedLines.join('\n'))
  }

  async toggleValidation (taskId, validationIndex) {
    const content = await fs.readFile(this.filePath, 'utf8')
    const lines = content.split('\n')
    const updatedLines = [...lines]

    let taskStartIndex = -1
    let taskEndIndex = -1
    let validationStartIndex = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.match(new RegExp(`^## Task ${this.escapeRegex(taskId)}:`))) {
        taskStartIndex = i
        continue
      }

      if (taskStartIndex !== -1 && line.match(/^## Task \d+(\.\d+)*:/)) {
        taskEndIndex = i - 1
        break
      }

      if (taskStartIndex !== -1 && line.trim() === '**Validation:**') {
        validationStartIndex = i + 1
      }
    }

    if (taskStartIndex === -1) {
      throw new Error(`Task ${taskId} not found in file`)
    }

    if (taskEndIndex === -1) {
      taskEndIndex = lines.length - 1
    }

    if (validationStartIndex === -1) {
      throw new Error(`Validation section not found for task ${taskId}`)
    }

    let validationCount = 0
    for (let i = validationStartIndex; i <= taskEndIndex; i++) {
      const line = lines[i]
      if (line.match(/^- \[[ x]\]/)) {
        if (validationCount === validationIndex) {
          const isCompleted = line.includes('[x]')
          updatedLines[i] = line.replace(/\[[ x]\]/, isCompleted ? '[ ]' : '[x]')
          break
        }
        validationCount++
      } else if (line.trim() && !line.match(/^- \[[ x]\]/)) {
        break
      }
    }

    if (validationCount <= validationIndex) {
      throw new Error(`Validation index ${validationIndex} out of range for task ${taskId}`)
    }

    await fs.writeFile(this.filePath, updatedLines.join('\n'))
  }

  escapeRegex (string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
}

module.exports = MarkdownUpdater
