const express = require('express');
const router = express.Router();
const {requireAuth, beginCombat, calculateDistance} = require('../functions')

const database = require('../database')
const db = database()
const combatRequests = []

router.get('/stars_map', requireAuth, async (req, res) => {

    const flashMessages = req.flash(); // Retrieve flash messages from the session

    //Reset all events
    await db.deleteAllEvents()

    const combats = await db.checkIfThereAreCombats(req.session.characterId)
    if (combats) {
        combatRequests.push({
            characterId: combats.character_id,
            eventId: combats.mission_id,
            difficulty: combats.difficulty,
            completionTime: combats.completion_time,
            returnTime: combats.return_time,
            distance: combats.distance,
            // Add other relevant data specific to combat requests
        });
        //console.log(combatRequests)
    }

    res.render("../views/pages/stars_map.pug", {
        title: "Stars Map",
        flash: flashMessages,
        combats: combats,
        showMenuBar: true
    });
})

router.get('/sendfleet/:centerX/:centerY/:eventX/:eventY/:event_info', requireAuth, async (req, res) => {
    const centerX = req.params.centerX
    const centerY = req.params.centerY
    //console.log(centerX, centerY)
    const eventX = req.params.eventX
    const eventY = req.params.eventY
    //console.log(eventX, eventY)
    const data = req.params.event_info
    //Data[0] = ID, Data[2] = difficulty
    console.log("eventInfo:", data[0], data[2])

    //Check fleet before + HD mission slot
    //TO DO

    const distance = calculateDistance(centerX, centerY, eventX, eventY)
    const completionTime = await db.addCombat(req.session.characterId, distance, data)

    // Add the combat request to the array
    combatRequests.push({
        characterId: req.session.characterId,
        eventId: data[0], // Use the appropriate event identifier here
        difficulty: data[2],
        completionTime: completionTime,
        distance: distance,
        // Add other relevant data specific to combat requests
    });

    //console.log("api:",completionTime)

    res.json(completionTime)

})

const completedRequests = new Set();

setInterval(async () => {
    const currentTime = Date.now();

    for (const request of combatRequests) {
        //console.log(request)
        const requestIdentifier = `${request.eventId}-${request.characterId}`;
        if (currentTime >= request.completionTime && !completedRequests.has(requestIdentifier)) {
            // Handle the completion of the combat request
            // You can add your logic here to process the completed combat requestx@
            // For example, update user's statistics or rewards
            console.log("Arrive for combat !")

            //Combat System
            const returnTime = await beginCombat(request.characterId, request.eventId, request.difficulty, request.distance)

            console.log("End combat")

            // Add the request identifier to the Set of completed requests
            // But don't remove the request from combatsRequests, the client need it to check the return time
            // I should stop this interval and let the other run
            completedRequests.add(requestIdentifier);

            // Function to handle post-combat actions
            async function handlePostCombatActions(request) {
                // Restore fleet
                const fleet = await db.getCombatFleet(request.characterId, request.eventId, request.difficulty);

                if (fleet.length !== 0) {
                    const fleetData = fleet[0].fleet.split(', ');

                    for (let i = 0; i < fleetData.length; i += 2) {
                        const shipName = fleetData[i];
                        const shipCount = parseInt(fleetData[i + 1], 10); // Parse the number as an integer

                        await db.restoreUnits(shipName, shipCount, request.characterId);
                    }
                }

                // Remove the combat request
                const index = combatRequests.indexOf(request);
                combatRequests.splice(index, 1);

                await db.deleteEvent(request.eventId, request.difficulty);
                await db.deleteCombat(request.characterId, request.eventId, request.difficulty);

                // Additional cleanup or processing specific to combat requests can be done here
            }

            await handlePostCombatActions(request);

        }
    }
}, 1000);

//Put the timer for return outside and add a new array for it
//Mandatory if the user deco during the return
//Set return timer
/*
const returnId = setInterval(() => {
    const currentTime = Date.now();
    console.log("returning...")
    if (currentTime > returnTime) {
        console.log("RETURNED !")
        // Call the function to handle post-combat actions
        handlePostCombatActions(request);
        clearInterval(returnId); // Stop the interval once the actions are handled
    }
}, 1000); // Check every second
 */


module.exports = router;