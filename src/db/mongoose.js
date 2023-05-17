const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {  // connnect to database, with database name
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}); 

// const Cat = mongoose.model('Cat', { name: String }); // create a new collection: Cat with field: name
// const kitty = new Cat({ name: 'Zildjian' }); // create a new document
// kitty.save().then(() => console.log('meow')); // save to database


