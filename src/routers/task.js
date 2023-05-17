const express = require('express')
const Task = require('../models/task') // 把它当成 table/collection
const auth = require('../middleware/auth')
const User = require('../models/user')
const router = new express.Router()

// CREATE
// change to async function, now the function  change to always returning a Promise
router.post('/tasks', auth, async (req, res) => {

    const task = new Task({
        ...req.body, // copy over properties from req.body
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(404).send()
    }
})

// READ
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=ceratedAt:asc
router.get('/tasks', auth, async(req, res) => {
    const match = {}
    const sort = {}
    
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1

    }

    try {
        // Method 1: find by find() function
        // const tasks = await Task.find({ owner: req.user._id })
        // Method 2: find user first -> populate virtual tasks property then shows it via send()
        await req.user.populate({
            path: 'tasks', // populate the virtual property: tasks
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (! task) {
            return res.status(404).send()
        }res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

// UPDATE
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (! isValidOperation) {
        return res.status(400).send('Invalid updates')
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

// Delete
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        // console.log(req.user._id, task)
        if (!task) {
            return res.status(404).send('Invalid task id')
        }

        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router