const database = require('./database')
const db = database()

async function updateResources(userId, characterId) {
    try {
        db.getCharacterMinesInfo(characterId, async (err, characterMines) => {

            for (const mine of characterMines) {

                console.log("Mine ID : ", mine.mine_id)

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
                    // For example, if the mine level is 1, you can add 10 resources per second
                    const resourcesToAdd = mine.level * 1 / 10;

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

module.exports = { updateResources };
