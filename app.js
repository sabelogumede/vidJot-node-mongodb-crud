const express = require('express');
const exphbs  = require('express-handlebars');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Map global promise - get rid of warning
mongoose.Promise = global.Promise;
// Connect to mongoose
mongoose.connect('mongodb://localhost/vidjot-dev', {
  // useMongoClient: true
})
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log( err));

// Load Idea Model
require('./models/Idea');
const Idea = mongoose.model('ideas');

// Handlebars Middleware
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Body parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Method overide Middleware
app.use(methodOverride('_method'));

// Express session Middleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
  // cookie: { secure: true }
}));

// flash Middleware
app.use(flash());

// Global variables - Middleware
app.use(function(req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});


// Index Route
app.get('/', (req, res) => {
  const title = 'Welcome';
  res.render('index', {
    title: title
  });
});

// About Route
app.get('/about', (req, res) => {
  res.render('about');
});

//  Idea index Page - Route
app.get('/ideas', (req, res) => {
    Idea.find({})
    .sort({date: 'desc'})
    .then(ideas => {
        res.render('ideas/index', {
            ideas:ideas
        });
    });
});

// Add Idea Form - Route
app.get('/ideas/add', (req, res) => {
  res.render('ideas/add');
});

// Edit Idea Form - Route (gets choosen id: form information for editing)
app.get('/ideas/edit/:id', (req, res) => {
    Idea.findOne({
        _id: req.params.id
    })
    .then(idea => {
        res.render('ideas/edit', {
            idea:idea
        });
    });
});

// Process Form - Route
app.post('/ideas', (req, res) => {
    let errors = [];
    // if there is no title input
    if(!req.body.title){
        errors.push({text: 'Please add a title'});
    }
    // if there is no details input
    if(!req.body.details){
        errors.push({text: 'Please add some details'});
    }
    // if there are errors // handle the submission-MongoDB
    if(errors.length > 0){
        // render the form again with errors
        //also load already provided input area back
        res.render('ideas/add', {
            errors: errors,
            title: req.body.title,
            details: req.body.details
        });
    }
    // else save inputed data to our database
    // ..and then(promise) redirect to our ideas page
     else {
         const newUser = {
             title: req.body.title,
             details: req.body.details
         }
        new Idea(newUser)
        .save()
        .then(idea => {
            req.flash('success_msg', 'Video idea added');
            res.redirect('/ideas');
        })
    }
});

// Edit Form process - Route (from edit form id: update in the database)
app.put('/ideas/:id', (req, res) => {
    Idea.findOne({
        _id: req.params.id
    })
    .then(idea => {
        // new values
        idea.title = req.body.title;
        idea.details = req.body.details;

        idea.save()
         .then(idea => {
             req.flash('success_msg', 'Video idea updated');
            res.redirect('/ideas');
         })
    });
});

// Delete Idea
app.delete('/ideas/:id', (req, res) => {
    Idea.remove({_id: req.params.id})
    .then(() => {
        req.flash('success_msg', 'Video idea removed');
        res.redirect('/ideas');
    });
});

//listen on port
const port = 5000;
app.listen(port, () =>{
  console.log(`Server started on port ${port}`);
});
