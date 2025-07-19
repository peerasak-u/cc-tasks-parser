const Task = require('./Task') // eslint-disable-line no-unused-vars

class TaskManager {
  constructor (tasks = []) {
    this.tasks = tasks
  }

  addTask (task) {
    this.tasks.push(task)
  }

  getTask (id) {
    return this.tasks.find(task => task.id === id)
  }

  getTasks () {
    return this.tasks
  }

  filter (options = {}) {
    let filtered = [...this.tasks]

    if (options.status) {
      if (options.status === 'complete') {
        filtered = filtered.filter(task => task.completed)
      } else if (options.status === 'incomplete') {
        filtered = filtered.filter(task => !task.completed)
      }
    }

    if (options.topic) {
      filtered = filtered.filter(task =>
        task.mainTopic.toLowerCase().includes(options.topic.toLowerCase())
      )
    }

    if (options.id) {
      filtered = filtered.filter(task => task.id === options.id)
    }

    return filtered
  }

  getStatistics () {
    const total = this.tasks.length
    const completed = this.tasks.filter(task => task.completed).length
    const incomplete = total - completed

    const topics = {}
    this.tasks.forEach(task => {
      if (!topics[task.mainTopic]) {
        topics[task.mainTopic] = { total: 0, completed: 0 }
      }
      topics[task.mainTopic].total++
      if (task.completed) {
        topics[task.mainTopic].completed++
      }
    })

    return {
      total,
      completed,
      incomplete,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      topics
    }
  }

  getDependencies (taskId) {
    const task = this.getTask(taskId)
    if (!task) {
      return null
    }

    const dependencies = []
    const dependencyIds = task.getDependencyIds()

    for (const depId of dependencyIds) {
      const depTask = this.getTask(depId)
      if (depTask) {
        dependencies.push(depTask)
      }
    }

    return dependencies
  }

  getDependents (taskId) {
    return this.tasks.filter(task =>
      task.getDependencyIds().includes(taskId)
    )
  }

  getDependencyTree (taskId, visited = new Set()) {
    if (visited.has(taskId)) {
      return { task: this.getTask(taskId), circular: true }
    }

    visited.add(taskId)
    const task = this.getTask(taskId)

    if (!task) {
      return null
    }

    const dependencies = []
    const dependencyIds = task.getDependencyIds()

    for (const depId of dependencyIds) {
      const depTree = this.getDependencyTree(depId, new Set(visited))
      if (depTree) {
        dependencies.push(depTree)
      }
    }

    return {
      task,
      dependencies,
      circular: false
    }
  }

  validateDependencies () {
    const errors = []

    for (const task of this.tasks) {
      const dependencyIds = task.getDependencyIds()

      for (const depId of dependencyIds) {
        if (depId === 'None') continue

        const depTask = this.getTask(depId)
        if (!depTask) {
          errors.push(`Task ${task.id} depends on non-existent task ${depId}`)
        }
      }

      const tree = this.getDependencyTree(task.id)
      if (tree && tree.circular) {
        errors.push(`Circular dependency detected involving task ${task.id}`)
      }
    }

    return errors
  }

  async updateTask (taskId, updates) {
    const task = this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    Object.assign(task, updates)
    return task
  }

  async toggleSubtask (taskId, subtaskIndex) {
    const task = this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    if (typeof subtaskIndex === 'string') {
      subtaskIndex = task.findSubtaskByText(subtaskIndex)
      if (subtaskIndex === -1) {
        throw new Error(`Subtask "${subtaskIndex}" not found in task ${taskId}`)
      }
    }

    const success = task.toggleSubtask(subtaskIndex)
    if (!success) {
      throw new Error(`Invalid subtask index ${subtaskIndex} for task ${taskId}`)
    }

    return task
  }

  async toggleValidation (taskId, validationIndex) {
    const task = this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    if (typeof validationIndex === 'string') {
      validationIndex = task.findValidationByText(validationIndex)
      if (validationIndex === -1) {
        throw new Error(`Validation criterion "${validationIndex}" not found in task ${taskId}`)
      }
    }

    const success = task.toggleValidation(validationIndex)
    if (!success) {
      throw new Error(`Invalid validation index ${validationIndex} for task ${taskId}`)
    }

    return task
  }

  exportJSON () {
    return {
      tasks: this.tasks.map(task => task.toJSON()),
      statistics: this.getStatistics(),
      exportedAt: new Date().toISOString()
    }
  }

  exportCSV () {
    const headers = ['ID', 'Title', 'Status', 'Topic', 'Progress', 'Validation Progress', 'Dependencies']
    const rows = this.tasks.map(task => {
      const deps = task.getDependencyIds()
      const depString = deps.length === 0 || deps[0] === 'None' ? 'None' : deps.join(', ')
      return [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        task.completed ? 'Complete' : 'Incomplete',
        `"${task.mainTopic.replace(/"/g, '""')}"`,
        `${task.getProgress()}%`,
        `${task.getValidationProgress()}%`,
        `"${depString}"`
      ]
    })

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  exportHTML () {
    const stats = this.getStatistics()

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; color: #333; }
        .stat-label { color: #666; font-size: 0.9em; }
        .task { background: white; border: 1px solid #ddd; margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
        .task-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .task-title { margin: 0; color: #333; }
        .task-meta { color: #666; font-size: 0.9em; margin-top: 5px; }
        .task-body { padding: 15px; }
        .progress-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s; }
        .subtasks, .validation { margin: 10px 0; }
        .subtask, .validation-item { margin: 5px 0; }
        .completed { color: #28a745; }
        .incomplete { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Task Management Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">Total Tasks</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.completed}</div>
            <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.incomplete}</div>
            <div class="stat-label">Incomplete</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.completionRate}%</div>
            <div class="stat-label">Completion Rate</div>
        </div>
    </div>

    <h2>Tasks</h2>
    ${this.tasks.map(task => `
        <div class="task">
            <div class="task-header">
                <h3 class="task-title">Task ${task.id}: ${task.title}</h3>
                <div class="task-meta">
                    Topic: ${task.mainTopic} | 
                    Status: <span class="${task.completed ? 'completed' : 'incomplete'}">
                        ${task.completed ? 'Complete' : 'Incomplete'}
                    </span>
                </div>
            </div>
            <div class="task-body">
                <p><strong>Description:</strong> ${task.description}</p>
                
                <div>
                    <strong>Progress:</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.getProgress()}%"></div>
                    </div>
                    ${task.getProgress()}% (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} subtasks)
                </div>

                <div class="subtasks">
                    <strong>Subtasks:</strong>
                    ${task.subtasks.map(subtask => `
                        <div class="subtask ${subtask.completed ? 'completed' : 'incomplete'}">
                            ${subtask.completed ? '✓' : '○'} ${subtask.text}
                        </div>
                    `).join('')}
                </div>

                ${task.validation.length > 0
? `
                    <div class="validation">
                        <strong>Validation:</strong>
                        ${task.validation.map(item => `
                            <div class="validation-item ${item.completed ? 'completed' : 'incomplete'}">
                                ${item.completed ? '✓' : '○'} ${item.text}
                            </div>
                        `).join('')}
                    </div>
                `
: ''}

                ${task.getDependencyIds().length > 0 && task.getDependencyIds()[0] !== 'None'
? `
                    <p><strong>Dependencies:</strong> ${task.getDependencyIds().join(', ')}</p>
                `
: ''}
            </div>
        </div>
    `).join('')}
</body>
</html>`

    return html.trim()
  }
}

module.exports = TaskManager
