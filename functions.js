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

function calculateDistance(x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;

    // Utilisez le théorème de Pythagore pour calculer la distance
    return Math.sqrt(deltaX ** 2 + deltaY ** 2);
}

/* =========
    COMBATS
   ========= */

function calculateDodgeChance(speed) {
    // Define a dodge chance multiplier based on the speed range (adjust as needed)
    const minSpeed = 5;
    const maxSpeed = 30;
    const maxDodgeMultiplier = 0.5; // Adjust this value to control the dodge chance

    // Calculate dodge chance based on speed
    const normalizedSpeed = (speed - minSpeed) / (maxSpeed - minSpeed);
    const dodgeChance = normalizedSpeed * maxDodgeMultiplier;

    // Ensure dodge chance is between 0 and 1 (0% to 100%)
    return Math.max(0, Math.min(1, dodgeChance));
}

function doesShipDodge(ship) {
    const dodgeChance = calculateDodgeChance(ship.speed);
    const randomValue = Math.random(); // Generate a random number between 0 and 1

    return randomValue <= dodgeChance;
}

async function damageShip(attackShip, defendShip) {

    //Dodge
    const dodge = doesShipDodge(defendShip)
    if (!dodge) {
        //Shield
        if (defendShip.shield > 0) {
            defendShip.shield -= attackShip.damage
        }
        else {
            //Life/Armor
            if (defendShip.armor > 0) {
                //Armor take 90% of damage
                const armorDamage = attackShip.damage * 0.9
                const lifeDamage = attackShip.damage * 0.1
                defendShip.armor -= armorDamage
                defendShip.life -= lifeDamage
            }
            else {
                defendShip.life -= attackShip.damage
            }
        }
    }

}

function isCombatFinish(playerFleet, enemyFleet) {
    return playerFleet.length === 0 || enemyFleet.length === 0;
}

async function checkPlayerDestroyShip(playerFleet, characterId) {
    const shipsToRemove = [];

    for (let i = 0; i < playerFleet.length; i++) {
        const ship = playerFleet[i];
        //console.log("PlayerLife:",ship.life)

        if (ship.life < 0) {
            // Delete the ship from the database
            await db.deleteUnit(ship.type, 1, characterId);

            // Mark the ship for removal from the playerFleet array
            shipsToRemove.push(i);
        }
    }

    // Remove the marked ships from playerFleet
    for (let i = shipsToRemove.length - 1; i >= 0; i--) {
        const index = shipsToRemove[i];
        playerFleet.splice(index, 1);
    }

    return playerFleet
}

async function checkEnemyDestroyShip(enemyFleet) {
    const shipsToRemove = [];

    for (let i = 0; i < enemyFleet.length; i++) {
        const ship = enemyFleet[i];
        //console.log("EnemyLife:",ship.life)

        if (ship.life < 0) {
            shipsToRemove.push(i);
        }
    }

    // Remove the marked ships from playerFleet
    for (let i = shipsToRemove.length - 1; i >= 0; i--) {
        const index = shipsToRemove[i];
        enemyFleet.splice(index, 1);
    }

    return enemyFleet
}

async function playOneRound(playerFleet, enemyFleet, playerFleetArray, enemyFleetArray) {

    let allShips = []
    let playerShipsArray = []
    let enemyShipsArray = []

    if (!playerFleetArray && !enemyFleetArray) {
        let shipIdCounter = 1

        // Iterate through the player's fleet
        for (const playerShips of playerFleet) {
            for (const [shipType, count] of Object.entries(playerShips)) {
                const shipStats = await db.getUnitStat(shipType)
                // Create ship objects and add them to 'allShips'
                for (let i = 0; i < count; i++) {
                    const ship = {
                        id: shipIdCounter++, // Unique ship ID
                        type: shipType,      // Ship type
                        owner: 'player',     // Owner is the player
                        life: parseInt(shipStats.life),
                        armor: parseInt(shipStats.armor),
                        shield: parseInt(shipStats.shield),
                        storage_capacity: parseInt(shipStats.storage_capacity),
                        speed: parseInt(shipStats.speed),
                        damage: parseInt(shipStats.damage)
                    }
                    allShips.push(ship);
                    playerShipsArray.push(ship);
                }
            }
        }
        //EnemyFleet
        for (const enemyShips of enemyFleet) {
            for (const [shipType, count] of Object.entries(enemyShips)) {
                const shipStats = await db.getUnitStat(shipType)
                // Create ship objects and add them to 'allShips'
                for (let i = 0; i < count; i++) {
                    const ship = {
                        id: shipIdCounter++, // Unique ship ID
                        type: shipType,      // Ship type
                        owner: 'enemy',     // Owner is the player
                        life: parseInt(shipStats.life),
                        armor: parseInt(shipStats.armor),
                        shield: parseInt(shipStats.shield),
                        storage_capacity: parseInt(shipStats.storage_capacity),
                        speed: parseInt(shipStats.speed),
                        damage: parseInt(shipStats.damage)
                    }
                    allShips.push(ship);
                    enemyShipsArray.push(ship)
                }
            }
        }
    }
    else {

        playerShipsArray.length = 0
        playerShipsArray = playerFleetArray
        enemyShipsArray.length = 0
        enemyShipsArray = enemyFleetArray

        allShips = playerShipsArray.concat(enemyShipsArray)

    }

    //Shuffle allShips for fight order
    for (let i = allShips.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allShips[i], allShips[j]] = [allShips[j], allShips[i]];
    }

    //It's combat time
    //We take the ship in the order of allShips

    allShips.forEach((ship) => {
        //console.log(ship)
        if (ship.owner === 'player') {
            const randomEnemyShipIndex = Math.floor(Math.random() * enemyShipsArray.length);
            //console.log("enemyIndex:",randomEnemyShipIndex)
            damageShip(ship, enemyShipsArray[randomEnemyShipIndex])
        }
        else{
            const randomPlayerShipIndex = Math.floor(Math.random() * playerShipsArray.length);
            //console.log("playerIndex:", randomPlayerShipIndex)
            damageShip(ship, playerShipsArray[randomPlayerShipIndex])
        }
    })

    return {
        playerFleetArray: playerShipsArray,
        enemyFleetArray: enemyShipsArray
    }

}

async function beginCombat(characterId, missionId, difficulty, distance) {

    const playerFleetData = await db.getCombatFleet(characterId, missionId, difficulty)
    const enemyFleetData = await db.getEnemyFleet(missionId, difficulty)

    const playerFleet = playerFleetData.map(playerData => {
        const fleetItems = playerData.fleet.split(', ');
        const fleetObject = {};

        for (let i = 0; i < fleetItems.length; i += 2) {
            const shipType = fleetItems[i];
             // Parse count as an integer
            fleetObject[shipType] = parseInt(fleetItems[i + 1], 10);
        }

        return fleetObject;
    });
    const enemyFleet = enemyFleetData.map(enemyData => {
        const units = enemyData.units.split(', ');
        const fleetObject = {};

        for (let i = 0; i < units.length; i += 2) {
            const unitType = units[i];
             // Parse count as an integer
            fleetObject[unitType] = parseInt(units[i + 1], 10);
        }

        return fleetObject;
    });

    //Play the combat
    let {playerFleetArray, enemyFleetArray} = await playOneRound(playerFleet, enemyFleet, null, null)

    playerFleetArray = await checkPlayerDestroyShip(playerFleetArray, characterId);
    enemyFleetArray = await checkEnemyDestroyShip(enemyFleetArray);

    async function runCombat() {

        while (!isCombatFinish(playerFleetArray, enemyFleetArray)) {

            ({ playerFleetArray, enemyFleetArray } = await playOneRound(null, null, playerFleetArray, enemyFleetArray));
            playerFleetArray = await checkPlayerDestroyShip(playerFleetArray, characterId);
            enemyFleetArray = await checkEnemyDestroyShip(enemyFleetArray);

        }
    }

    await runCombat()

    console.log("Finish Battleling")

    //Rewards
    if (playerFleetArray !== []) {

        const rewards = await db.getReward(missionId, difficulty)
        for (const rewardObject of rewards) {
            for (const key in rewardObject) {
                const value = rewardObject[key];
                const splitValue = value.split(', ')
                //console.log(`Key: ${key}, Value: ${value}`);
                //console.log(splitValue)
                if (splitValue[0] ==='money') {
                    await db.addMoney(characterId, parseInt(splitValue[1]))
                }
            }
        }

    }

    //Update combat fleet
    const fleetComposition = playerFleetArray.reduce((accumulator, ship) => {
        if (ship.owner === 'player') {
            // Extract the ship type and increment its count in the accumulator
            const shipType = ship.type;
            accumulator[shipType] = (accumulator[shipType] || 0) + 1;
        }
        return accumulator;
    }, {});

    // Convert the fleet composition object into the desired string format
    const fleetCompositionString = Object.entries(fleetComposition)
        .map(([shipType, count]) => `${shipType}, ${count}`)
        .join(', ');

    //console.log(fleetCompositionString)
    await db.updateCombatFleet(characterId, fleetCompositionString, missionId, difficulty)

    //Calcul return time
    const fleetSpeed = await db.getCombatFleetSpeed(characterId, fleetCompositionString)
    let travelTime = distance / fleetSpeed
    travelTime = parseFloat(travelTime.toFixed(1))
    travelTime = Math.ceil(travelTime * 60000)
    travelTime = Date.now() + travelTime

    //Update return_time in character_combats
    //Don't work
    await db.updateCombatsTime(characterId, missionId, difficulty, null, travelTime)

    return travelTime

}


module.exports = {
    requireAuth,
    requireNotAuth,
    requireNoCharacter,
    levelUpBuilding,
    levelUpMine,
    calculateDistance,
    beginCombat
};