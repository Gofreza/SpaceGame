const express = require('express');
const router = express.Router();
const {requireAuth} = require('../functions')

const database = require('../database')
const db = database()

router.get('/api/resources', requireAuth, async (req, res) => {
    const resources = await db.getResourcesForCharacterBis(req.session.characterId)
    res.json(resources)
})

router.get('/api/population', requireAuth, async (req, res) => {
    await db.getCharacterPopulation(req.session.userId, (err, population) => {
        if (err) {
            // Handle error
        } else {
            if (population === null) {
                console.log('Population not found.');
            } else {
                //console.log('Resources for character:', resources);
                //console.log(resources)
                res.json(population)
            }
        }
    });
})

router.get('/api/events', requireAuth, async (req, res) => {
    const event = await db.getEvents()
    res.json(event)
})

router.get('/api/delevent/:id/:difficulty', requireAuth, async (req, res) => {
    const id = parseInt(req.params.id)
    const difficulty = parseInt(req.params.difficulty)
    await db.deleteEvent(id, difficulty)
    res.json(200)
})

module.exports = router;