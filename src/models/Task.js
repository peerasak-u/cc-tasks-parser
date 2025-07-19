class Task {
  constructor (data = {}) {
    this.id = data.id || ''
    this.title = data.title || ''
    this.completed = data.completed || false
    this.mainTopic = data.mainTopic || ''
    this.description = data.description || ''
    this.subtasks = data.subtasks || []
    this.requiredTasks = data.requiredTasks || []
    this.validation = data.validation || []
    this.rawContent = data.rawContent || ''
  }

  getProgress () {
    if (this.subtasks.length === 0) {
      return this.completed ? 100 : 0
    }

    const completedSubtasks = this.subtasks.filter(subtask => subtask.completed).length
    return Math.round((completedSubtasks / this.subtasks.length) * 100)
  }

  getValidationProgress () {
    if (this.validation.length === 0) {
      return 100
    }

    const completedValidation = this.validation.filter(item => item.completed).length
    return Math.round((completedValidation / this.validation.length) * 100)
  }

  getDependencyIds () {
    if (this.requiredTasks.length === 1 && this.requiredTasks[0].toLowerCase() === 'none') {
      return []
    }
    return this.requiredTasks
  }

  toggleSubtask (index) {
    if (index >= 0 && index < this.subtasks.length) {
      this.subtasks[index].completed = !this.subtasks[index].completed
      return true
    }
    return false
  }

  toggleValidation (index) {
    if (index >= 0 && index < this.validation.length) {
      this.validation[index].completed = !this.validation[index].completed
      return true
    }
    return false
  }

  findSubtaskByText (text) {
    return this.subtasks.findIndex(subtask =>
      subtask.text.toLowerCase().includes(text.toLowerCase())
    )
  }

  findValidationByText (text) {
    return this.validation.findIndex(item =>
      item.text.toLowerCase().includes(text.toLowerCase())
    )
  }

  setCompleted (completed) {
    this.completed = completed
    if (completed) {
      this.subtasks.forEach(subtask => { subtask.completed = true })
      this.validation.forEach(item => { item.completed = true })
    }
  }

  toJSON () {
    return {
      id: this.id,
      title: this.title,
      completed: this.completed,
      mainTopic: this.mainTopic,
      description: this.description,
      subtasks: this.subtasks,
      requiredTasks: this.requiredTasks,
      validation: this.validation,
      progress: this.getProgress(),
      validationProgress: this.getValidationProgress()
    }
  }
}

module.exports = Task
