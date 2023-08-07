const database = require('./database')
const db = database()

let refiningOn = false;
let refiningSteelInProgress = false;
let refiningComponentsInProgress = false;
let refiningPlasticInProgress = false;

async function updateResources(userId, characterId) {
    try {
        db.getCharacterMinesInfo(characterId, async (err, characterMines) => {

            for (const mine of characterMines) {

                //console.log("Mine ID : ", mine.mine_id)

                if (mine.mine_id === 1) {
                    // Determine the amount of resources to add based on the mine level
                    // For example, if the mine level is 1, you can add 10 resources per second
                    const resourcesToAdd = mine.level * 1;

                    // Update the character's resources in the database
                    await db.updateCharacterResources(userId, characterId, resourcesToAdd, mine.mine_id);
                    //console.log(`Resources updated for Iron mine with ID ${mine.mine_id}`);
                } else if (mine.mine_id === 2) {
                    // Determine the amount of resources to add based on the mine level
                    // For example, if the mine level is 1, you can add 10 resources per second
                    const resourcesToAdd = mine.level * 1;

                    // Update the character's resources in the database
                    await db.updateCharacterResources(userId, characterId, resourcesToAdd, mine.mine_id);
                    //console.log(`Resources updated for Copper mine with ID ${mine.mine_id}`);
                } else if (mine.mine_id === 3) {
                    // Determine the amount of resources to add based on the mine level
                    // For example, if the mine level is 1, you can add 10 resources per second
                    const resourcesToAdd = mine.level * 1 / 2;

                    // Update the character's resources in the database
                    await db.updateCharacterResources(userId, characterId, resourcesToAdd, mine.mine_id);
                    //console.log(`Resources updated for Petrol mine with ID ${mine.mine_id}`);
                } else if (mine.mine_id === 4) {
                    // Determine the amount of resources to add based on the mine level
                    const resourcesToAdd = (mine.level * 1) / 10;
                    //const updatedCrystal = customRound(resourcesToAdd, 2);

                    // Update the character's resources in the database
                    await db.updateCharacterResources(userId, characterId, resourcesToAdd, mine.mine_id);
                    //console.log(`Resources updated for Crystal mine with ID ${mine.mine_id}`);
                } else {
                    console.error('Error updating precise resources:');
                }

            }

        })

    } catch (err) {
        console.error('Error updating resources:', err.message);
    }
}

async function refineSteel(userId, characterId) {

    try {
        while (refiningSteelInProgress) {
            // Use Promise.all() to execute the three refining functions simultaneously
            await Promise.all([
                db.refineSteel(userId, characterId)
            ]);
        }
    } catch (error) {
        console.error('Error refining resources:', error.message);
    }
}

async function refineComponents(userId, characterId) {

    try {
        while (refiningComponentsInProgress) {
            // Use Promise.all() to execute the three refining functions simultaneously
            await Promise.all([
                db.refineComponents(userId, characterId)
            ]);
        }
    } catch (error) {
        console.error('Error refining resources:', error.message);
    }
}

async function refinePlastic(userId, characterId) {

    try {
        while (refiningPlasticInProgress) {
            // Use Promise.all() to execute the three refining functions simultaneously
            await Promise.all([
                db.refinePlastic(userId, characterId)
            ]);
        }
    } catch (error) {
        console.error('Error refining resources:', error.message);
    }
}

function startRefining(userId, characterID) {
    refiningSteelInProgress = true
    refiningComponentsInProgress = true
    refiningPlasticInProgress = true
    refineSteel(userId, characterID);
    refineComponents(userId, characterID);
    refinePlastic(userId, characterID);
    switchRefiningOn();
}

function startRefiningSteel(userId, characterID) {
    refiningSteelInProgress = true
    refineSteel(userId, characterID)
    switchRefiningOn();
}

function startRefiningComponents(userId, characterID) {
    refiningComponentsInProgress = true
    refineComponents(userId, characterID)
    switchRefiningOn();
}

function startRefiningPlastic(userId, characterID) {
    refiningPlasticInProgress = true
    refinePlastic(userId, characterID)
    switchRefiningOn();
}

function stopRefining() {
    refiningSteelInProgress = false
    refiningComponentsInProgress = false
    refiningPlasticInProgress = false
    switchRefiningOff();
}

function stopRefiningSteel() {
    refiningSteelInProgress = false
    switchRefiningOff();
}

function stopRefiningComponents() {
    refiningComponentsInProgress = false
    switchRefiningOff
}

function stopRefiningPlastic() {
    refiningPlasticInProgress = false
    switchRefiningOff
}

function switchRefiningOn() {
    refiningOn = true;
}
function switchRefiningOff(){
    refiningOn = false;
}
function isRefiningOn() {
    return refiningOn;
}

function isRefiningSteelOn() {
    return refiningSteelInProgress;
}

function isRefiningComponentsOn() {
    return refiningComponentsInProgress;
}

function isRefiningPlasticOn() {
    return refiningPlasticInProgress;
}

/*
    Auto resource function
 */

const activeTimeouts = {}; // Object to store active timeouts

function startUpdateResourcesPeriodically(userId, characterId, req) {
    async function updateResourcesPeriodically(userId, characterId) {
        if (req.session.timeoutStop) {
            return;
        }

        await updateResources(userId, characterId);

        // Call the function again after a delay, only if timeoutStop is not defined
        if (!req.session.timeoutStop) {
            activeTimeouts[req.session.userId] = setTimeout(updateResourcesPeriodically, 1000, userId, characterId); // Store the timeout ID
        }
    }

    // Start the periodic update
    activeTimeouts[req.session.userId] = setTimeout(updateResourcesPeriodically, 1000, userId, characterId); // Store the timeout ID
}

function stopTimeout(req) {
    const timeoutId = activeTimeouts[req.session.userId];
    if (timeoutId) {
        clearTimeout(timeoutId);
        delete activeTimeouts[req.session.userId];
    }
}

module.exports = {
    updateResources,
    startRefining, startRefiningSteel, startRefiningComponents, startRefiningPlastic,
    stopRefining, stopRefiningSteel, stopRefiningComponents, stopRefiningPlastic,
    isRefiningOn, isRefiningSteelOn, isRefiningComponentsOn, isRefiningPlasticOn,
    startUpdateResourcesPeriodically, stopTimeout
};
