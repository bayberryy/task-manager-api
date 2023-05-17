// this file creates the express app and get it running
const express = require('express')
require('./db/mongoose') // this ensure the file run(mongoose.connect runs, so mongoose connect to the database), but do not grab anything from the file
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const multer = require('multer')

const app = express()
const port = process.env.PORT || 3000 // to get app working on heroku, if fail fall back on port 3000

const upload = multer({
    dest: 'images',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (! file.originalname.match(/\.(doc|docx)$/)) { // match() allows matching withregular expression inside //
            return cb(new Error('Please upload a Word document'))
        }
        cb(undefined, true)
    }
})

app.post('/upload', upload.single('upload'), (req, res) => {
    res.send()
}, (error, req, res, next) => { // add another function to the end of handler call, needs to have the 4 arguments to let express know it handles any error that occurs
    res.status(400).send({ error: error.message})
})

app.use(express.json()) // automatically parse incoming JSON to an object
// app.use(bodyParser.urlencoded({ extended: true})) // parse the request body of incoming HTTP request, and makes it available in req.body
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log(`Server is up on port: ${port}`)
})

// const returnApi = require('../src/emails/account')
// returnApi()
