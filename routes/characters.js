const express = require('express');
const router = express.Router();
const {requireNoCharacter, requireAuth} = require('../functions')

const database = require('../database')
const {readdir} = require("fs");
const sharp = require("sharp");
const db = database()

// GET create_character page
router.get('/create_character', requireAuth, requireNoCharacter, (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session

    const charactersPath = "/Users/theodusehu/WebstormProjects/nodetest/public/imgs/characters";
    readdir(charactersPath, async (err, images) => {
        if (err) {
            console.error('Error reading images:', err.message);
            return res.status(500).send('Error reading images.');
        }
        try {
            // Iterate over each image filename in the array
            for (let i = 0; i < images.length; i++) {
                const imageName = images[i];
                const imagePath = "/Users/theodusehu/WebstormProjects/nodetest/public/imgs/characters/" + imageName;

                // Resize the image and await the result
                const resizedImage = await sharp(imagePath).resize(100, 100).toBuffer();

                // Update the `imageNames` array with the resized image Buffer
                images[i] = { name: imageName, data: resizedImage };
            }
        } catch (err) {
            console.error('Error resizing images:', err.message);
            res.status(500).send('Error resizing images.');
        }

            // Display the form to create a new user with the list of image names
            res.render('../views/pages/create_character.pug', {
                title: "Create Character",
                flash: flashMessages,
                images
            });
        }
    )
        ;
    });

// POST create_character data
router.post('/create_character',requireAuth ,requireNoCharacter, (req, res) => {
    const { name, class_name, selectedImage } = req.body;
    const userId = req.session.userId;
    console.log(selectedImage);

    //Double check because why not
    db.hasCharacter(userId, (error, hasCharacter) => {
        if (error) {
            console.error('Error occurred while querying the database:', error);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (hasCharacter) {
            //Character found
            req.flash('error', 'A character is already link to the account !');
            res.redirect('/dashboard');
        }

        db.addCharacter(name, 0, class_name, selectedImage, userId, (error) => {
            if (error) {
                console.error('Error occurred while creating user:', error);
                res.status(500).send('Internal Server Error');
                return;
            }

            // Registration successful
            res.redirect('/dashboard');
        })

    });
});

router.post('/delete-character/:userId', requireAuth, (req, res) => {
    const userId = req.params.userId;

    // Call the function to delete the character from the database
    db.deleteCharacter(userId, (err, deleted) => {
        if (err) {
            console.error('Error deleting character:', err.message);
            req.flash('error', 'Failed to delete character.');
        } else {
            if (deleted) {
                req.flash('success', 'Character deleted successfully.');
            } else {
                req.flash('error', 'Character not found.');
            }
        }

        res.redirect('/logout');
    });
});

module.exports = router;