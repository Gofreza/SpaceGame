const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash')
const bodyParser = require('body-parser');

const app = express();
const hostname = '127.0.0.1';
const port = 8000;

// Set up middleware
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

// Set up routes
const authRoutes = require('./routes/auth');
const globalRoutes = require('./routes/globale')
const createCharacterRoute = require('./routes/characters')
const apiRoute = require('./routes/api')
const buildingsRoute = require('./routes/buildings')
app.use(authRoutes, globalRoutes, createCharacterRoute, apiRoute, buildingsRoute);

//Start the server
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});