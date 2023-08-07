const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const database = require('../database')
const {requireNotAuth} = require("../functions");
const {updateResources, refineResources, stopRefining, refineSteel, refineComponents, refinePlastic, startRefining,
    startUpdateResourcesPeriodically, stopTimeout,
} = require("../updateResources");
const db = database()

// GET login page
// Deprecated, move to root
router.get('/login', requireNotAuth, (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session
    res.render('../views/pages/login.pug', {title: "Login", flash: flashMessages});
});

// POST login data
// POST still work because we post on this route
router.post('/login', requireNotAuth, (req, res) => {
    const { username, password } = req.body;

    db.findUserByUsername(username, (error, user) => {
        if (error) {
            console.error('Error occurred while querying the database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (!user) {
            // User not found
            //res.status(401).send('Invalid username or password');
            req.flash('error', 'Invalid username or password');
            res.redirect('/');
            return;
        }

        bcrypt.compare(password, user.password, (bcryptError, bcryptResult) => {
            if (bcryptError) {
                console.error('Error occurred while comparing passwords:', bcryptError);
                res.status(500).send('Internal Server Error');
                return;
            }

            if (!bcryptResult) {
                // Incorrect password
                //res.status(401).send('Invalid username or password');
                req.flash('error', 'Invalid username or password');
                res.redirect('/'); // Redirect back to the previous page
                return;
            }

            // Login successful
            req.session.userId = user.id;
            req.session.username = username;
            //console.log(req.session);
            db.hasCharacter(req.session.userId, (err, hasCharacter) => {
                if (err) {
                    // Handle the error
                    console.log('Error during hasCharacter function');
                    return;
                }

                if (hasCharacter) {
                    // User has a character linked
                    console.log('User has a character linked.');
                    req.flash('success', 'Log in successful !');

                    db.findCharacterByUserId(req.session.userId, (err, character) => {
                        if (err) {
                            console.error('Error finding character:', err.message);
                            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
                            return;
                        }

                        if (!character) {
                            console.log('Character not found.');
                            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
                            return;
                        }

                        req.session.characterId = character.id

                        // Start the interval to update resources every second
                        // Update resources every second (1000 milliseconds)
                        // Save the interval ID in the session so you can clear it later
                        /*req.session.intervalId = setInterval(async () => {
                            //await updateResources(req.session.userId, character.id)
                            //.then(r => console.log("--Update Resources--"));
                            await db.updatePopulation(req.session.userId)
                        }, 1000);

                         */

                        const userId = req.session.userId;
                        const characterId = character.id;

                        req.session.characterId = characterId
                        req.session.timeoutStop = false;

                        startUpdateResourcesPeriodically(userId, characterId, req)

                        res.redirect('/dashboard');

                    })

                } else {
                    // User does not have a character linked
                    console.log('User does not have a character linked.');
                    req.flash('success', 'Log in successful !');
                    res.redirect('/create_character');
                }
            });
        });
    });
});

// GET register page
router.get('/register', (req, res) => {
    res.render('../views/pages/register.pug', {title: "Register"});
});

router.post('/register', (req, res) => {
    const { username, password } = req.body;

    db.createUser(username, password, (error) => {
        if (error) {
            console.error('Error occurred while creating user:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        // Registration successful
        res.redirect('/login');
    });
});

//Get logout page
router.get('/logout', (req, res) => {

    stopTimeout(req)

    req.session.destroy((error) => {
        if (error) {
            console.error('Error occurred while logging out:', error);
        }
        //Can't put flash because there is no session anymore
        res.redirect('/');
    });
});

module.exports = router;
