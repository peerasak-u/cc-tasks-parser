const { Command } = require('commander')
const chalk = require('chalk')
const fs = require('fs-extra')

const TaskParser = require('../parser/TaskParser')
const TaskManager = require('../models/TaskManager')
const MarkdownUpdater = require('../utils/MarkdownUpdater')

class CLI {
  constructor () {
    this.program = new Command()
    this.parser = new TaskParser()
    this.setupCommands()
  }

  setupCommands () {
    this.program
      .name('cc-tasks')
      .description('A powerful command-line task management tool that uses Markdown files as a database')
      .version('1.0.0')

    this.program
      .command('parse')
      .description('Validate the format of your tasks.md file')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .option('--strict', 'Enable strict validation mode')
      .action(this.parseCommand.bind(this))

    this.program
      .command('list')
      .description('Display all tasks with their status')
      .option('-s, --status <status>', 'Filter by status (complete, incomplete, all)', 'all')
      .option('-t, --topic <topic>', 'Filter by main topic')
      .option('--format <format>', 'Output format (table, json, minimal)', 'table')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.listCommand.bind(this))

    this.program
      .command('get')
      .description('Get detailed information about a specific task')
      .argument('<taskId>', 'Task ID to retrieve')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.getCommand.bind(this))

    this.program
      .command('status')
      .description('Display task statistics and overall progress')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.statusCommand.bind(this))

    this.program
      .command('deps')
      .description('Show task dependencies and dependency tree')
      .argument('<taskId>', 'Task ID to show dependencies for')
      .option('--reverse', 'Show tasks that depend on this task')
      .option('--tree', 'Display as dependency tree')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.depsCommand.bind(this))

    this.program
      .command('create')
      .description('Create a new task interactively')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.createCommand.bind(this))

    this.program
      .command('update')
      .description('Update task completion status')
      .argument('<taskId>', 'Task ID to update')
      .argument('<status>', 'Status: complete or incomplete')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.updateCommand.bind(this))

    this.program
      .command('check')
      .description('Toggle subtask completion status')
      .argument('<taskId>', 'Task ID')
      .argument('<subtaskIndex>', 'Subtask index or partial text match')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.checkCommand.bind(this))

    this.program
      .command('validate')
      .description('Toggle validation criteria completion status')
      .argument('<taskId>', 'Task ID')
      .argument('<criterionIndex>', 'Validation criterion index or partial text match')
      .option('--all', 'Mark all validation criteria as complete')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.validateCommand.bind(this))

    this.program
      .command('export')
      .description('Export tasks to different formats')
      .argument('<format>', 'Export format: json, html, csv')
      .argument('[output]', 'Output file (optional, defaults to stdout)')
      .option('-f, --file <file>', 'Specify task file', 'tasks.md')
      .action(this.exportCommand.bind(this))

    this.program
      .command('watch')
      .description('Watch for changes in task files and display live updates')
      .option('-c, --command <command>', 'Command to run on change')
      .option('-f, --file <file>', 'Specify task file to watch', 'tasks.md')
      .action(this.watchCommand.bind(this))
  }

  async parseCommand (options) {
    try {
      this.parser.setStrictMode(options.strict)
      const result = await this.parser.parseFile(options.file)

      console.log(chalk.blue(`Parsing ${options.file}...`))

      if (result.isValid) {
        console.log(chalk.green('✓ Task file is valid'))
        console.log(`Found ${result.tasks.length} tasks`)
      } else {
        console.log(chalk.red('✗ Task file has validation errors:'))
        result.errors.forEach(error => {
          console.log(chalk.red(`  • ${error}`))
        })
        process.exit(1)
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async loadTasks (filePath) {
    const result = await this.parser.parseFile(filePath)
    if (!result.isValid) {
      console.error(chalk.red('Task file has validation errors:'))
      result.errors.forEach(error => {
        console.error(chalk.red(`  • ${error}`))
      })
      process.exit(1)
    }
    return new TaskManager(result.tasks)
  }

  async listCommand (options) {
    try {
      const manager = await this.loadTasks(options.file)
      const filterOptions = {
        status: options.status === 'all' ? undefined : options.status,
        topic: options.topic
      }

      const tasks = manager.filter(filterOptions)

      if (options.format === 'json') {
        console.log(JSON.stringify(tasks.map(task => task.toJSON()), null, 2))
      } else if (options.format === 'minimal') {
        tasks.forEach(task => {
          const status = task.completed ? chalk.green('✓') : chalk.red('○')
          console.log(`${status} ${task.id}: ${task.title}`)
        })
      } else {
        const Table = require('cli-table3')
        const table = new Table({
          head: ['ID', 'Title', 'Status', 'Topic', 'Progress'],
          style: { head: ['cyan'] }
        })

        tasks.forEach(task => {
          const status = task.completed ? chalk.green('Complete') : chalk.yellow('Incomplete')
          const progress = `${task.getProgress()}%`
          table.push([
            task.id,
            task.title.length > 40 ? task.title.substring(0, 37) + '...' : task.title,
            status,
            task.mainTopic.length > 20 ? task.mainTopic.substring(0, 17) + '...' : task.mainTopic,
            progress
          ])
        })

        console.log(table.toString())
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async getCommand (taskId, options) {
    try {
      const manager = await this.loadTasks(options.file)
      const task = manager.getTask(taskId)

      if (!task) {
        console.error(chalk.red(`Task ${taskId} not found`))
        process.exit(1)
      }

      console.log(chalk.blue(`\n📋 Task ${task.id}: ${task.title}\n`))
      console.log(`${chalk.cyan('Topic:')} ${task.mainTopic}`)
      console.log(`${chalk.cyan('Status:')} ${task.completed ? chalk.green('Complete') : chalk.yellow('Incomplete')}`)
      console.log(`${chalk.cyan('Progress:')} ${task.getProgress()}% (${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length} subtasks)`)

      if (task.validation.length > 0) {
        console.log(`${chalk.cyan('Validation:')} ${task.getValidationProgress()}% (${task.validation.filter(v => v.completed).length}/${task.validation.length} criteria)`)
      }

      console.log(`\n${chalk.cyan('Description:')}`)
      console.log(task.description)

      console.log(`\n${chalk.cyan('Subtasks:')}`)
      task.subtasks.forEach((subtask, index) => {
        const status = subtask.completed ? chalk.green('✓') : chalk.red('○')
        console.log(`  ${index + 1}. ${status} ${subtask.text}`)
      })

      if (task.validation.length > 0) {
        console.log(`\n${chalk.cyan('Validation Criteria:')}`)
        task.validation.forEach((item, index) => {
          const status = item.completed ? chalk.green('✓') : chalk.red('○')
          console.log(`  ${index + 1}. ${status} ${item.text}`)
        })
      }

      const deps = task.getDependencyIds()
      if (deps.length > 0 && deps[0] !== 'None') {
        console.log(`\n${chalk.cyan('Dependencies:')} ${deps.join(', ')}`)
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async statusCommand (options) {
    try {
      const manager = await this.loadTasks(options.file)
      const stats = manager.getStatistics()

      console.log(chalk.blue('\n📊 Task Statistics:\n'))
      console.log(`${chalk.cyan('Total Tasks:')} ${stats.total}`)
      console.log(`${chalk.green('Completed:')} ${stats.completed} (${stats.completionRate}%)`)
      console.log(`${chalk.yellow('Incomplete:')} ${stats.incomplete} (${100 - stats.completionRate}%)`)

      if (Object.keys(stats.topics).length > 0) {
        console.log(chalk.blue('\n📋 By Topic:\n'))
        Object.entries(stats.topics).forEach(([topic, data]) => {
          const rate = Math.round((data.completed / data.total) * 100)
          console.log(`${chalk.cyan(topic)}: ${data.completed}/${data.total} (${rate}%)`)
        })
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async depsCommand (taskId, options) {
    try {
      const manager = await this.loadTasks(options.file)
      const task = manager.getTask(taskId)

      if (!task) {
        console.error(chalk.red(`Task ${taskId} not found`))
        process.exit(1)
      }

      if (options.reverse) {
        const dependents = manager.getDependents(taskId)
        console.log(chalk.blue(`\n🔗 Tasks that depend on ${taskId}:\n`))

        if (dependents.length === 0) {
          console.log(chalk.gray('No tasks depend on this task'))
        } else {
          dependents.forEach(dep => {
            console.log(`  • ${dep.id}: ${dep.title}`)
          })
        }
      } else if (options.tree) {
        const tree = manager.getDependencyTree(taskId)
        console.log(chalk.blue(`\n🌳 Dependency tree for ${taskId}:\n`))
        this.printDependencyTree(tree, 0)
      } else {
        const dependencies = manager.getDependencies(taskId)
        console.log(chalk.blue(`\n🔗 Dependencies for ${taskId}:\n`))

        if (dependencies.length === 0) {
          console.log(chalk.gray('No dependencies'))
        } else {
          dependencies.forEach(dep => {
            const status = dep.completed ? chalk.green('✓') : chalk.red('○')
            console.log(`  ${status} ${dep.id}: ${dep.title}`)
          })
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  printDependencyTree (tree, depth) {
    if (!tree) return

    const indent = '  '.repeat(depth)
    const status = tree.task.completed ? chalk.green('✓') : chalk.red('○')
    console.log(`${indent}${status} ${tree.task.id}: ${tree.task.title}`)

    if (tree.dependencies && tree.dependencies.length > 0) {
      tree.dependencies.forEach(dep => {
        this.printDependencyTree(dep, depth + 1)
      })
    }
  }

  async createCommand (options) {
    const inquirer = require('inquirer')

    try {
      console.log(chalk.blue('\n📝 Create New Task\n'))

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'id',
          message: 'Task ID (e.g., 1.0, 2.1):',
          validate: input => {
            if (!/^(\d+)(\.\d+)*$/.test(input)) {
              return 'Task ID must follow semantic versioning pattern (e.g., 1.0, 2.1, 3.14)'
            }
            return true
          }
        },
        {
          type: 'input',
          name: 'title',
          message: 'Task title:',
          validate: input => input.trim().length > 0 || 'Title is required'
        },
        {
          type: 'input',
          name: 'mainTopic',
          message: 'Main topic:',
          validate: input => input.trim().length > 0 || 'Main topic is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          validate: input => input.trim().length > 0 || 'Description is required'
        },
        {
          type: 'input',
          name: 'subtasks',
          message: 'Subtasks (comma-separated):',
          validate: input => input.trim().length > 0 || 'At least one subtask is required'
        },
        {
          type: 'input',
          name: 'requiredTasks',
          message: 'Required tasks (comma-separated, or "None"):',
          default: 'None'
        },
        {
          type: 'input',
          name: 'validation',
          message: 'Validation criteria (comma-separated, optional):'
        }
      ])

      const taskMarkdown = this.generateTaskMarkdown(answers)

      if (await fs.pathExists(options.file)) {
        const content = await fs.readFile(options.file, 'utf8')
        await fs.writeFile(options.file, content + '\n' + taskMarkdown)
      } else {
        await fs.writeFile(options.file, taskMarkdown)
      }

      console.log(chalk.green(`\n✓ Task ${answers.id} created successfully in ${options.file}`))
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  generateTaskMarkdown (answers) {
    const subtasks = answers.subtasks.split(',').map(s => `- [ ] ${s.trim()}`).join('\n')
    const validation = answers.validation
      ? answers.validation.split(',').map(v => `- [ ] ${v.trim()}`).join('\n')
      : '- [ ] Task completed successfully'

    return `
## Task ${answers.id}: ${answers.title}
- [ ] **Complete**
**Main Topic:** ${answers.mainTopic}
**Description:** ${answers.description}
**Subtasks:**
${subtasks}
**Required Tasks:** ${answers.requiredTasks}
**Validation:** 
${validation}
`.trim()
  }

  async updateCommand (taskId, status, options) {
    try {
      const manager = await this.loadTasks(options.file)
      const task = manager.getTask(taskId)

      if (!task) {
        console.error(chalk.red(`Task ${taskId} not found`))
        process.exit(1)
      }

      const completed = status.toLowerCase() === 'complete'
      const updater = new MarkdownUpdater(options.file)

      await updater.updateTask(taskId, { completed })

      console.log(chalk.green(`✓ Task ${taskId} marked as ${completed ? 'complete' : 'incomplete'}`))
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async checkCommand (taskId, subtaskIndex, options) {
    try {
      const manager = await this.loadTasks(options.file)
      const task = manager.getTask(taskId)

      if (!task) {
        console.error(chalk.red(`Task ${taskId} not found`))
        process.exit(1)
      }

      let index = subtaskIndex
      if (isNaN(subtaskIndex)) {
        index = task.findSubtaskByText(subtaskIndex)
        if (index === -1) {
          console.error(chalk.red(`Subtask "${subtaskIndex}" not found in task ${taskId}`))
          process.exit(1)
        }
      } else {
        index = parseInt(subtaskIndex) - 1
      }

      if (index < 0 || index >= task.subtasks.length) {
        console.error(chalk.red(`Invalid subtask index ${subtaskIndex} for task ${taskId}`))
        process.exit(1)
      }

      const updater = new MarkdownUpdater(options.file)
      await updater.toggleSubtask(taskId, index)

      const newStatus = !task.subtasks[index].completed
      console.log(chalk.green(`✓ Subtask ${index + 1} of task ${taskId} marked as ${newStatus ? 'complete' : 'incomplete'}`))
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async validateCommand (taskId, criterionIndex, options) {
    try {
      const manager = await this.loadTasks(options.file)
      const task = manager.getTask(taskId)

      if (!task) {
        console.error(chalk.red(`Task ${taskId} not found`))
        process.exit(1)
      }

      if (task.validation.length === 0) {
        console.error(chalk.red(`Task ${taskId} has no validation criteria`))
        process.exit(1)
      }

      const updater = new MarkdownUpdater(options.file)

      if (options.all) {
        const updatedValidation = task.validation.map(item => ({
          ...item,
          completed: true
        }))

        await updater.updateTask(taskId, { validation: updatedValidation })
        console.log(chalk.green(`✓ All validation criteria for task ${taskId} marked as complete`))
        return
      }

      let index = criterionIndex
      if (isNaN(criterionIndex)) {
        index = task.findValidationByText(criterionIndex)
        if (index === -1) {
          console.error(chalk.red(`Validation criterion "${criterionIndex}" not found in task ${taskId}`))
          process.exit(1)
        }
      } else {
        index = parseInt(criterionIndex) - 1
      }

      if (index < 0 || index >= task.validation.length) {
        console.error(chalk.red(`Invalid validation index ${criterionIndex} for task ${taskId}`))
        process.exit(1)
      }

      await updater.toggleValidation(taskId, index)

      const newStatus = !task.validation[index].completed
      console.log(chalk.green(`✓ Validation criterion ${index + 1} of task ${taskId} marked as ${newStatus ? 'complete' : 'incomplete'}`))
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async exportCommand (format, output, options) {
    try {
      const manager = await this.loadTasks(options.file)
      let exportData

      switch (format.toLowerCase()) {
        case 'json':
          exportData = JSON.stringify(manager.exportJSON(), null, 2)
          break
        case 'html':
          exportData = manager.exportHTML()
          break
        case 'csv':
          exportData = manager.exportCSV()
          break
        default:
          console.error(chalk.red(`Unsupported format: ${format}`))
          process.exit(1)
      }

      if (output) {
        await fs.writeFile(output, exportData)
        console.log(chalk.green(`✓ Exported to ${output}`))
      } else {
        console.log(exportData)
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`))
      process.exit(1)
    }
  }

  async watchCommand (options) {
    const chokidar = require('chokidar')

    console.log(chalk.blue(`👀 Watching ${options.file} for changes...`))
    console.log(chalk.gray('Press Ctrl+C to stop'))

    const watcher = chokidar.watch(options.file, { persistent: true })

    watcher.on('change', async () => {
      console.log(chalk.yellow(`\n📝 ${options.file} changed, reloading...`))

      if (options.command) {
        const { spawn } = require('child_process')
        const child = spawn('sh', ['-c', options.command], { stdio: 'inherit' })
        child.on('close', (code) => {
          console.log(chalk.gray(`Command exited with code ${code}`))
        })
      } else {
        try {
          await this.statusCommand(options)
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`))
        }
      }
    })

    watcher.on('error', error => {
      console.error(chalk.red(`Watcher error: ${error.message}`))
    })
  }

  run () {
    this.program.parse()
  }
}

module.exports = CLI
