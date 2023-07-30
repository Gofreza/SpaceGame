const express = require('express');
const router = express.Router();
const {requireAuth} = require('../functions')

const database = require('../database')
const db = database()

router.get('/api/resources', requireAuth, (req, res) => {
    db.getResourcesForCharacter(req.session.userId, (err, resources) => {
        if (err) {
            // Handle error
        } else {
            if (resources === null) {
                console.log('Character resources not found.');
            } else {
                //console.log('Resources for character:', resources);
                //console.log(resources)
                res.json(resources)
            }
        }
    })
})

module.exports = router;