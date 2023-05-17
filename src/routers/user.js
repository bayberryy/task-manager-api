const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user') // 把它当成 table/collection
const { ConnectionCheckOutFailedEvent } = require('mongodb')
const auth = require('../middleware/auth')
const router = new express.Router()


// CREATE
// change to async function, now the function  change to always returning a Promise
router.post('/users', async (req, res) => { // post for resource creation
    const user = new User(req.body)
    try { // try something, if there is error, catch will catch the error
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token}) // default status for succcess is 200
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)    // try find user by email and varify the password, return the user
        const token = await user.generateAuthToken()
        res.send({ user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send()

    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutALL', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()

    } catch (e) {
        res.status(500).send()
    }
})

// READ
router.get('/users/me', auth , async (req, res) => {   // 1. someone make get requst to '/user' -> pass through middleware, with next() -> then the async function 
    res.send(req.user)
})

// UPDATE

router.patch('/users/me', auth, async (req, res) => { // patch is for update
    const updates = Object.keys(req.body) // return keys of the object
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))  // update() test whether all elements in an array pass a particular test implemented
    
    if (! isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }

    try {                                                                                   
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)

    } catch (e) {
        res.status(400).send(e)
    }
}) 

// Delete
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// upload & delete files with multer
const upload = multer({
    //dest: 'images', // remove this, so files are not automatically save to the destination image
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        const fileName = file.originalname
        const rightFormat = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')
        if (! rightFormat) {
            cb(new Error('File format should only be: .jpg or .jpeg or .png'))
        } else {
            cb(undefined, true)
        }
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send('File uploaded successfully!')
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if ( !user || !user.avatar ) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send()
    }
})

module.exports = router