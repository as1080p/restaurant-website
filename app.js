const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const restaurantRoutes = require('./routes/restaurant');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 5000;  // Changed from 3000 to 5000

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/jalsa_new');

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Use express-ejs-layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using https
}));

// Middleware to make userId available to all views
app.use((req, res, next) => {
    res.locals.userId = req.session.userId;
    next();
});

// Routes
app.use('/', restaurantRoutes);

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${server.address().port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, trying the next available port...`);
        server.listen(0); // 0 means to use any available port
    } else {
        console.error('Error starting server:', err);
    }
});