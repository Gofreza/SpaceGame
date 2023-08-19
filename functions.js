const database = require('./database')
const db = database()

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        // User is authenticated
        next();
    } else {
        // User is not authenticated
        req.flash('error', 'Can\'t access this page while not being log ! Please log in !');
        res.redirect('/');
    }
}

function requireNotAuth(req, res, next) {
    if (req.session && req.session.userId) {
        // User is authenticated
        req.flash('error', 'Can\'t access login page while being log !');
        res.redirect('/dashboard');
    } else {
        // User is not authenticated
        next();
    }
}

// Middleware to check if the user has no character linked
function requireNoCharacter(req, res, next) {
    const userId = req.session.userId; // Assuming you store the user ID in the session
    if (!userId) {
        // User not authenticated, redirect to login or handle as needed
        return res.redirect('/');
    }

    // Check if the user has a character linked
    db.hasCharacter(userId, (err, hasCharacter) => {
        if (err) {
            // Handle the error
            return res.status(500).send('Error checking character');
        }

        if (hasCharacter) {
            // User has a character linked, redirect to a route or display a message
            return res.redirect('/dashboard');
        }

        // User doesn't have a character linked, continue to the next middleware/route handler
        next();
    });
}

// Be prepare it's a lot to digest
async function levelUpBuilding(index, req, res) {

    let responseData = {};

    const characterId = req.session.characterId

    db.getCharacterBuildingInfo(characterId, async (err, characterBuildings) => {
        if (err) {
            console.error('Error fetching character buildings:', err.message);
            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
            return;
        }

        // Loop through each character building
        for (let i = 0; i < characterBuildings.length; i++) {
            const characterBuilding = characterBuildings[i];
            const buildingId = characterBuilding.building_id;
            const level = characterBuilding.level;

            const canUpdate = await db.canUpdateBuilding(characterId, level, characterBuilding.building_id);

            if (buildingId === (parseInt(index) + 1)) {

                if (canUpdate) {

                    // Get the level-up cost data for the building
                    db.getBuildingLevelUpCost(buildingId, level, async (err, levelUpCostData) => {
                        if (err) {
                            console.error('Error fetching level-up cost data:', err.message);
                            return;
                        }

                        const resources = await db.getResourcesForCharacterBis(characterId)


                        //console.log('Resources for character:', resources);

                        //Yeah he got enough
                        if (resources.steel >= levelUpCostData.steel && resources.components >= levelUpCostData.components
                            && resources.plastic >= levelUpCostData.plastic && resources.money >= levelUpCostData.money) {

                            db.updateBuildingLevel(characterId, buildingId, level + 1)
                                .then((result) => {
                                    if (result) {
                                        // Update was successful
                                        //console.log('Building level updated successfully.');
                                        // You can perform additional actions here if needed

                                        const newresources = {
                                            iron: resources.iron,
                                            steel: resources.steel - levelUpCostData.steel,
                                            copper: resources.copper,
                                            components: resources.components - levelUpCostData.components,
                                            petrol: resources.petrol,
                                            plastic: resources.plastic - levelUpCostData.plastic,
                                            money: resources.money - levelUpCostData.money,
                                            crystal: resources.crystal
                                        }

                                        db.addOrUpdateResourcesForCharacter(characterId, newresources)
                                            .then(() => {
                                                responseData.reloadPage = true;
                                                responseData.flashMessage = "Level up Success!";
                                                res.json(responseData);
                                            })
                                            .catch(err => {
                                                console.error('levelUpBuilding : Error updating resources:', err.message);
                                            });

                                    } else {
                                        // There was an error updating the level
                                        console.log('Failed to update building level.');
                                    }
                                })
                                .catch((err) => {
                                    console.error('Error:', err);
                                });

                        } else {
                            responseData.reloadPage = false;
                            responseData.flashMessage = "Not enough resources to level up !";
                            res.json(responseData);
                        }
                    });
                } else {
                    req.flash("Error, Life Support Module level not high enough !")
                    responseData.reloadPage = false;
                    responseData.flashMessage = "Error, Life Support Module level not high enough !";
                    res.json(responseData);
                }
            }

        }
    });

}

function levelUpMine(index, req, res) {

    const characterId = req.session.characterId

    db.getCharacterMinesInfo(characterId, (err, characterMines) => {
        if (err) {
            console.error('Error fetching character buildings:', err.message);
            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
            return;
        }

        // Loop through each character building
        for (let i = 0; i < characterMines.length; i++) {
            const characterMine = characterMines[i];
            const mineId = characterMine.mine_id;
            const level = characterMine.level;

            if(mineId === (parseInt(index) + 1)){

                // Get the level-up cost data for the building
                db.getMineLevelUpCost(mineId, level, async (err, levelUpCostData) => {
                    if (err) {
                        console.error('Error fetching level-up cost data:', err.message);
                        return;
                    }

                    const resources = await db.getResourcesForCharacterBis(characterId)

                    //Yeah he got enough
                    if (resources.steel >= levelUpCostData.steel && resources.components >= levelUpCostData.components
                        && resources.plastic >= levelUpCostData.plastic && resources.money >= levelUpCostData.money) {

                        db.updateMineLevel(characterId, mineId, level + 1)
                            .then((result) => {
                                if (result) {
                                    // Update was successful
                                    console.log('Building level updated successfully.');
                                    // You can perform additional actions here if needed

                                    const newresources = {
                                        iron: resources.iron,
                                        steel: resources.steel - levelUpCostData.steel,
                                        copper: resources.copper,
                                        components: resources.components - levelUpCostData.components,
                                        petrol: resources.petrol,
                                        plastic: resources.plastic - levelUpCostData.plastic,
                                        money: resources.money - levelUpCostData.money,
                                        crystal: resources.crystal
                                    }

                                    db.addOrUpdateResourcesForCharacter(characterId, newresources)
                                        .then(() => {
                                            res.json({reloadPage: true});
                                        })
                                        .catch(err => {
                                            console.log("addOrUpdateResourcesForCharacter : error add resources")
                                        });

                                } else {
                                    // There was an error updating the level
                                    console.log('Failed to update building level.');
                                }
                            })
                            .catch((err) => {
                                console.error('Error:', err);
                            });

                    }

                });

            }
        }
    });
}

module.exports = {
    requireAuth,
    requireNotAuth,
    requireNoCharacter,
    levelUpBuilding,
    levelUpMine
};