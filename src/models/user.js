const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 7,
        trim: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true // default is false
})

userSchema.virtual('tasks', { // name for virtual field; property
    ref: 'Task', // referenece to Task model
    localField: '_id',  // primary key for matching with foreign key
    foreignField: 'owner' // foreign key for matching with local key
}) 

userSchema.methods.generateAuthToken = async function () { // functions that are defined on the individual instances
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_ENV)
    user.tokens = user.tokens.concat({ token })
    await user.save()
    return token
} 

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject() // change everything to oject (eg. tokens originally in array -> object)
    
    delete userObject.password // remove sensitive data (passwords & tokens) from returned user object
    delete userObject.tokens
    delete userObject.avatar // remove avatar as it is large, increase app speed

    return userObject
}

userSchema.statics.findByCredentials = async (email, password) => { // functions that are defined on the Model 
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// MIDDLEWARE
// Hash plain text password before saving
userSchema.pre('save', async function (next) {  // use standard function, not arrow function as it doesn't have binding(this)
    const user = this
    
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next() 
} ) 

/*
the next function is called at the end of the callback function, 
after any asynchronous operations have completed. 
This signals to Mongoose that the middleware has 
completed its processing, and control can be passed to the next
middleware or operation in the call stack. 
*/

// Delete user tasks when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)
module.exports = User