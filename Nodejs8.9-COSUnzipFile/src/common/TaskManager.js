const { extend, find, findIndex, noop } = require('lodash')

class TaskManager {
  constructor({
    status = 'waiting',
    list = [],
    onStart,
    onCancel = noop,
    onFinish = noop,
    batchLimit = 2
  }) {
    extend(this, {
      status,
      list: [],
      onStart,
      onCancel,
      onFinish,
      batchLimit,
      currentList: []
    })

    if (list.length) {
      this.addTaskList({ list })
    }
  }

  addTaskList({ list = [] }) {
    const markedList = list.map(task => {
      return {
        ...task,
        status: 'waiting',
        uuid: this.getUUID()
      }
    })
    this.list.push(...markedList)
  }

  getUUID() {
    return `${(new Date()).getTime()}_${Math.random() * 1000}`
  }

  getTask(params) {
    return find(this.list, params)
  }

  start() {
    if (this.status === 'running') {
      return
    }
    this.runTaskList()
  }

  startPromise() {
    return new Promise((resolve, reject) => {
      const _onFinish = this.onFinish
      this.onFinish = (...args) => {
        _onFinish(...args)
        resolve(...args)
      }
      this.start()
    })
  }

  cancel() {
    if (this.status === 'canceled') {
      return
    }
    this.status = 'canceled'
    for (const task of this.currentList) {
      this.cancelTask(task)
    }
    this.onFinish({
      status: this.status,
      list: this.list
    })
  }

  runTaskList() {
    while (this.batchLimit > this.currentList.length && this.status !== 'canceled') {
      const task = this.getTask({ status: 'waiting' })
      if (task) {
        this.status = 'running'
        this.runTaskOnce(task)
      } else {
        if (!this.currentList.length) {
          this.status = 'finish'
          this.onFinish({
            status: this.status,
            list: this.list
          })
        }
        break
      }
    }
  }

  runTaskOnce(task) {
    if (task.status !== 'waiting') {
      return
    }
    this._onStart({ task })
  }

  cancelTask({ uuid }) {
    const task = this.getTask({ uuid })
    this.onCancel(task)
    this.updateCurrentList({ task, action: 'remove' })
    this.updateTaskStatus({ task, status: 'canceled' })
    this.runTaskList()
  }

  _onStart({ task }) {
    this.updateCurrentList({ task, action: 'add' })
    this.updateTaskStatus({ task, status: 'running' })
    this.onStart({
      task,
      onFinish: (error, result) => {
        this._onFinish({ task, error, result })
      }
    })
  }

  _onFinish({ task, error, result }) {
    extend(task, { error, result })
    this.updateCurrentList({ task, action: 'remove' })
    this.updateTaskStatus({ task, status: error ? 'error' : 'success' })
    this.runTaskList()
  }

  updateTaskStatus({ task, status }) {
    if (task && status) {
      task.status = status
    }
  }

  updateCurrentList({ task, action }) {
    const { currentList } = this
    if (action === 'add') {
      currentList.push(task)
    } else {
      const index = findIndex(currentList, { uuid: task.uuid })
      if (index > -1) {
        currentList.splice(index, 1)
      }
    }
  }
}

module.exports = TaskManager