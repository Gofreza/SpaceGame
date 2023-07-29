const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

function setupDatabase() {
    const db = new sqlite3.Database('./database/database.db');

    /*
        CREATE TABLES
     */

    // Create the user table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL
    )`);

    // Create the character table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    class TEXT NOT NULL,
    combat INTEGER NOT NULL,
    industry INTEGER NOT NULL,
    technology INTEGER NOT NULL,
    imgurl TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Create the 'buildings' table to store building information
    db.run(`CREATE TABLE IF NOT EXISTS buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    img_src TEXT NOT NULL,
    building_index INTEGER NOT NULL,
    description TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    img_src TEXT NOT NULL,
    mine_index INTEGER NOT NULL,
    description TEXT NOT NULL
    )`);

    /*
        Combat = bonus to fleet attack
        Industry = bonus to planet production
        Technology = bonus to fleet speed

     */
    db.run(`CREATE TABLE IF NOT EXISTS character_classes (
    id INTEGER PRIMARY KEY,
    class_name TEXT NOT NULL,
    combat_bonus INTEGER NOT NULL,
    industry_bonus INTEGER NOT NULL,
    technology_bonus INTEGER NOT NULL
    )`);

    // Create the 'level_up_costs' table to store costs of leveling up each building
    db.run(`CREATE TABLE IF NOT EXISTS buildings_level_up_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    steel INTEGER NOT NULL,
    plastic INTEGER NOT NULL,
    components INTEGER NOT NULL,
    money INTEGER NOT NULL,
    FOREIGN KEY (building_id) REFERENCES buildings (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS mines_level_up_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mine_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    steel INTEGER NOT NULL,
    plastic INTEGER NOT NULL,
    components INTEGER NOT NULL,
    money INTEGER NOT NULL,
    FOREIGN KEY (mine_id) REFERENCES mines (id)
    )`);

    // Create the 'character_buildings' table to store data about the buildings for each character
    db.run(`CREATE TABLE IF NOT EXISTS character_buildings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    building_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters (id),
    FOREIGN KEY (building_id) REFERENCES buildings (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS character_mines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    mine_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters (id),
    FOREIGN KEY (mines_id) REFERENCES mines (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS character_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    iron INTEGER,
    steel INTEGER,
    copper INTEGER,
    components INTEGER,
    petrol INTEGER,
    plastic INTEGER,
    money INTEGER,
    crystal INTEGER,
    FOREIGN KEY (character_id) REFERENCES characters(id)
    );`)

    /*
        FILL TABLES
     */

    // Check if data already exists in the table
    db.get('SELECT COUNT(*) as count FROM character_classes', (err, row) => {
        if (err) {
            console.error('Error checking for data in table:', err.message);
        } else {
            const rowCount = row.count;
            if (rowCount === 0) {
                // Table is empty, insert the initial data
                const insertSql = `
                INSERT INTO character_classes (class_name, combat_bonus, industry_bonus, technology_bonus)
                  VALUES
                  ('Adventurer', 70, 50, 80),
                  ('Merchant', 30, 100, 70),
                  ('Soldier', 100, 30, 70),
                  ('Researcher', 20, 50, 130)
                `;
                // Execute the query to insert the data
                db.run(insertSql, (err) => {
                    if (err) {
                        console.error('Error inserting data:', err.message);
                    } else {
                        console.log('Data inserted successfully.');
                    }
                });
            }
        }
    });

/*
    db.run(`INSERT INTO buildings (name, img_src, building_index, description)
            VALUES ("Life Support System", "/imgs/base/life_support_room.png", 0, "A Life Support System"),
                   ("HQ", "/imgs/base/hq_room.png", 1, "The base HQ"), 
                   ("Housing Module", "/imgs/base/housing_module.png", 2, "The habitation zone, increase the population cap."),
                   ("Commercial Hub", "/imgs/base/commercial_hub.png", 3, "The commercial Hub"),
                   ("Space Hangar", "/imgs/base/space_hangar.png", 4, "The Space Hangar"),
                   ("Space Yard", "/imgs/base/space_yard.png", 5, "The Space Yard"),
                   ("Storage Room", "/imgs/base/storage_room.png", 6, "The storage room"),
                   ("Smelting Facility", "/imgs/base/smelting_facility.png", 7, "The smelting facility"),
                   ("Workshop", "/imgs/base/workshop.png", 8, "The workshop")`);


    db.run(`INSERT INTO mines (name, img_src, building_index, description)
            VALUES ("Iron Mine", "/imgs/mine/iron_mine.png", 0, "An iron mine."),
                   ("Copper Mine", "/imgs/mine/copper_mine.png", 1, "A copper mine."), 
                   ("Petrol Mine", "/imgs/mine/petrol_mine.png", 2, "Petrol mining facility."),
                   ("Crystal Mine", "/imgs/mine/crystal_mine.png", 3, "The crystal mine.")
    `);

 */
/*
    db.run(`INSERT INTO mines_level_up_costs (mine_id, level, steel, plastic, components, money)
        VALUES  (1, 1, 100, 50, 30, 200), (1, 2, 200, 100, 60, 400), (1, 3, 300, 150, 90, 600),
                (1, 4, 400, 200, 120, 800), (1, 5, 500, 250, 150, 1000),
                (2, 1, 100, 50, 30, 200), (2, 2, 200, 100, 60, 400), (2, 3, 300, 150, 90, 600),
                (2, 4, 400, 200, 120, 800), (2, 5, 500, 250, 150, 1000),
                (3, 1, 100, 50, 30, 200), (3, 2, 200, 100, 60, 400), (3, 3, 300, 150, 90, 600),
                (3, 4, 400, 200, 120, 800), (3, 5, 500, 250, 150, 1000),
                (4, 1, 100, 50, 30, 200), (4, 2, 200, 100, 60, 400), (4, 3, 300, 150, 90, 600),
                (4, 4, 400, 200, 120, 800), (4, 5, 500, 250, 150, 1000)
    `);

 */

    /*
        MISC
     */

    async function isIntegerOrFloat(value) {
        const parsedValue = parseFloat(value);
        return Number.isInteger(parsedValue) ? parsedValue : parsedValue.toFixed(2);
    }

    /*
        USER FUNCTIONS
     */
    function createUser(username, password, callback) {
        bcrypt.hash(password, 10, (error, hashedPassword) => {
            if (error) {
                callback(error);
                return;
            }

            db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (queryError) => {
                if (queryError) {
                    callback(queryError);
                    return;
                }

                callback(null);
            });
        });
    }

    function findUserByUsername(username, callback) {
        db.get('SELECT * FROM users WHERE username = ?', [username], (error, user) => {
            if (error) {
                callback(error);
                return;
            }

            callback(null, user);
        });
    }

    function changePassword(req, res, currentPassword, newPassword, confirmPassword) {
        const userId = req.session.userId;

        // Check if the passwords match
        if (newPassword !== confirmPassword) {
            req.flash('error', 'Passwords do not match. Please try again.');
            return res.redirect('/profile');
        }

        // Retrieve the hashed password from the database
        const sql = `SELECT password FROM users WHERE id = ?`;
        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error('Error retrieving password from the database:', err.message);
                req.flash('error', 'Failed to change password.');
                return res.redirect('/profile');
            }

            if (!row) {
                req.flash('error', 'User not found.');
                return res.redirect('/profile');
            }

            const storedPassword = row.password;

            // Compare the current password with the stored hashed password
            bcrypt.compare(currentPassword, storedPassword, (err, isMatch) => {
                if (err) {
                    console.error('Error comparing passwords:', err.message);
                    req.flash('error', 'Failed to change password.');
                    return res.redirect('/profile');
                }

                if (!isMatch) {
                    req.flash('error', 'Current password is incorrect.');
                    return res.redirect('/profile');
                }

                // Hash the new password before updating the database
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        console.error('Error generating salt:', err.message);
                        req.flash('error', 'Failed to change password.');
                        return res.redirect('/profile');
                    }

                    bcrypt.hash(newPassword, salt, (err, hashedPassword) => {
                        if (err) {
                            console.error('Error hashing password:', err.message);
                            req.flash('error', 'Failed to change password.');
                            return res.redirect('/profile');
                        }

                        // Update the password in the database
                        const updateSql = `UPDATE users SET password = ? WHERE id = ?`;
                        db.run(updateSql, [hashedPassword, userId], (err) => {
                            if (err) {
                                console.error('Error updating password:', err.message);
                                req.flash('error', 'Failed to change password.');
                            } else {
                                req.flash('success', 'Password changed successfully.');
                            }
                            res.redirect('/profile');
                        });
                    });
                });
            });
        });
    }

    /*
        CHARACTER FUNCTIONS
     */

    // Add a new function to insert buildings for a character into the character_buildings table
    function insertCharacterBuildings(characterId, buildings) {
        for (const building of buildings) {
            db.run(`INSERT INTO character_buildings (character_id, building_id, level)
                VALUES (?, ?, ?)`,
                [characterId, building.building_id, building.level]);
        }
    }

    function insertCharacterMines(characterId, mines) {
        for (const mine of mines) {
            db.run(`INSERT INTO character_mines (character_id, mine_id, level)
                VALUES (?, ?, ?)`,
                [characterId, mine.mine_id, mine.level]);
        }
    }

    // Function to add a new character to the characters table
    function addCharacter(name, level, characterClass, imgurl, userId, callback) {
        const sql = `INSERT INTO characters (name, level, class, combat, industry, technology, imgurl, user_id) VALUES (?, ?, ?, 5, 5, 5, ?, ?)`;

        db.run(sql, [name, level, characterClass, imgurl, userId], function (err) {
            if (err) {
                console.error('Error adding character:', err.message);
                return callback(err);
            }

            const buildingsData = [
                { building_id: 1, level: 0},
                { building_id: 2, level: 0},
                { building_id: 3, level: 0},
                { building_id: 4, level: 0},
                { building_id: 5, level: 0},
                { building_id: 6, level: 0},
                { building_id: 7, level: 0},
                { building_id: 8, level: 0},
                { building_id: 9, level: 0},
            ];

            // Insert buildings for the new character into the character_buildings table
            insertCharacterBuildings(this.lastID, buildingsData);

            const minesData = [
                { mine_id: 1, level:0},
                { mine_id: 2, level:0},
                { mine_id: 3, level:0},
                { mine_id: 4, level:0},
            ];

            insertCharacterMines(this.lastID, minesData);

            // Insert resource line
            let sql = `INSERT INTO character_resources (character_id, iron, steel, copper, components, petrol, plastic, money, crystal) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.run(sql, [this.lastID, 1000, 300, 600, 200, 400, 200, 20000, 0], (err) => {
                if (err) {
                    console.error('Error inserting resources:', err.message);
                } else {
                    console.log('Resources inserted successfully.');
                }
            });

            console.log(`Character ${name} added with ID ${this.lastID}`);
            callback(null, this.lastID);
        });
    }

    function findCharacterByUserId(userId, callback) {
        const sql = `SELECT * FROM characters WHERE user_id = ?`;

        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error('Error finding character:', err.message);
                return callback(err);
            }

            if (!row) {
                console.log('findCharacterByUserId : Character not found.');
                return callback(null, null);
            }

            console.log('Character found:', row);
            callback(null, row);
        });
    }

    async function getCharacterAttributesByUserId(userId, attributes) {
        try {
            const character = await new Promise((resolve, reject) => {
                findCharacterByUserId(userId, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });

            if (!character) {
                // Character not found, return null
                return null;
            }

            // Create an object to store the attributes and their values
            const attributeValues = {};

            // Loop through the attributes array and extract the values
            for (const attribute of attributes) {
                attributeValues[attribute] = character[attribute];
            }

            return attributeValues;
        } catch (err) {
            console.error('Error:', err);
            return null; // or throw the error if needed
        }
    }

    function deleteCharacter(userId, callback) {
        // Find the character by user ID first
        findCharacterByUserId(userId, (err, character) => {
            if (err) {
                console.error('Error finding character:', err.message);
                return callback(err);
            }

            if (!character) {
                console.log('deleteCharacter : Character not found.');
                return callback(null, false);
            }

            // Delete the character from the database
            const sql = `DELETE FROM characters WHERE id = ?`;

            db.run(sql, [character.id], (err) => {
                if (err) {
                    console.error('Error deleting character from the database:', err.message);
                    return callback(err);
                }

                const sql = `DELETE FROM character_buildings WHERE character_id = ?`

                db.run(sql, [character.id], (err) => {

                    if (err) {
                        console.error('Error deleting character_buildings from the database:', err.message);
                        return callback(err);
                    }

                    const sql = `DELETE FROM character_mines WHERE character_id = ?`

                    db.run(sql, [character.id], (err) => {

                        if (err) {
                            console.error('Error deleting character_buildings from the database:', err.message);
                            return callback(err);
                        }

                        const sql = `DELETE FROM character_resources WHERE character_id = ?`

                        db.run(sql, [character.id], (err) => {

                            if (err) {
                                console.error('Error deleting character_resources from the database:', err.message);
                                return callback(err);
                            }

                            console.log('Character deleted from the database.');
                            callback(null, true);

                        })
                    })

                })

            });
        });
    }

    // Function to check if there is a character linked to the user
    function hasCharacter(userId, callback) {
        const sql = `SELECT COUNT(*) AS count FROM characters WHERE user_id = ?`;

        db.get(sql, [userId], (err, row) => {
            if (err) {
                console.error('Error checking character:', err.message);
                return callback(err);
            }

            const hasCharacter = row && row.count > 0;
            console.log(`User ${userId} has character: ${hasCharacter}`);
            callback(null, hasCharacter);
        });
    }

    /*
        BUILDING FUNCTIONS
     */

    function getCharacterBuildingInfo(characterId, callback) {
        const sql = `SELECT * FROM character_buildings WHERE character_id = ?`;
        db.all(sql, [characterId], (err, rows) => {
            if (err) {
                console.error('Error:', err);
                callback(err, null);
                return;
            }

            // If no records found, return an empty array
            const characterBuildings = rows || [];

            callback(null, characterBuildings);
        });
    }


    function getBuildingData(buildingId, callback) {
        const sql = `SELECT * FROM buildings WHERE id = ?`;
        db.get(sql, [buildingId], (err, row) => {
            if (err) {
                console.error('Error:', err);
                callback(err, null);
                return;
            }

            // If no record found, return null
            const buildingData = row || null;

            callback(null, buildingData);
        });
    }


    function getBuildingLevelUpCost(buildingId, level, callback) {
        const sql = `SELECT steel, plastic, components, money FROM buildings_level_up_costs WHERE building_id = ? AND level = ?`;
        db.get(sql, [buildingId, level+1], (err, row) => {
            if (err) {
                console.error('Error:', err);
                callback(err, null);
                return;
            }

            // If no record found, return null
            const levelUpCostData = row || null;

            callback(null, levelUpCostData);
        });
    }

    /*
        MINES FUNCTIONS
     */

    function getCharacterMinesInfo(characterId, callback) {
        const sql = `SELECT * FROM character_mines WHERE character_id = ?`;
        db.all(sql, [characterId], (err, rows) => {
            if (err) {
                console.error('Error:', err);
                callback(err, null);
                return;
            }

            // If no records found, return an empty array
            const characterMines = rows || [];

            callback(null, characterMines);
        });
    }

    function getMineData(mineId, callback) {
        const sql = `SELECT * FROM mines WHERE id = ?`;
        db.get(sql, [mineId], (err, row) => {
            if (err) {
                console.error('Error:', err);
                callback(err, null);
                return;
            }

            // If no record found, return null
            const mineData = row || null;

            callback(null, mineData);
        });
    }

    function getMineLevelUpCost(mineId, level, callback) {
        const sql = `SELECT steel, plastic, components, money FROM mines_level_up_costs WHERE mine_id = ? AND level = ?`;
        db.get(sql, [mineId, level+1], (err, row) => {
            if (err) {
                console.error('Error:', err);
                callback(err, null);
                return;
            }

            // If no record found, return null
            const levelUpCostData = row || null;

            callback(null, levelUpCostData);
        });
    }

    /*
        RESOURCE FUNCTIONS
     */

    // Function to add or update resources for a character
    function addOrUpdateResourcesForCharacter(characterId, resources, callback) {
        const sql = `SELECT * FROM character_resources WHERE character_id = ?`;

        db.get(sql, [characterId], (err, row) => {
            if (err) {
                console.error('Error retrieving resources:', err.message);
                callback(err);
            } else {
                if (!row) {
                    // Character resources not found, insert new row
                    const insertSql = `INSERT INTO character_resources (character_id, iron, steel, copper, components, petrol, plastic, money, crystal) 
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                    db.run(insertSql, [characterId, resources.iron, resources.steel, resources.copper, resources.components, resources.petrol, resources.plastic, resources.money, resources.crystal], (err) => {
                        if (err) {
                            console.error('Error adding resources:', err.message);
                            callback(err);
                        } else {
                            console.log('Resources added successfully.');
                            callback(null);
                        }
                    });
                } else {
                    // Character resources found, update existing row
                    const updateSql = `UPDATE character_resources SET 
                                   iron = ?,
                                   steel = ?,
                                   copper = ?,
                                   components = ?,
                                   petrol = ?,
                                   plastic = ?,
                                   money = ?,
                                   crystal = ?
                                   WHERE character_id = ?`;

                    db.run(updateSql, [resources.iron, resources.steel, resources.copper, resources.components, resources.petrol, resources.plastic, resources.money, resources.crystal, characterId], (err) => {
                        if (err) {
                            console.error('Error updating resources:', err.message);
                            callback(err);
                        } else {
                            console.log('Resources updated successfully.');
                            callback(null);
                        }
                    });
                }
            }
        });
    }

    //Update resources auto
    async function updateCharacterResources(userId, characterId, resourcesToAdd, mineId) {

        const updatedResources = await isIntegerOrFloat(resourcesToAdd);

        await getResourcesForCharacter(userId, async (err, resources) => {
             if (err) {
                 // Handle error
             } else {
                 if (resources === null) {
                     console.log('Character resources not found.');
                 } else {
                     //console.log('Resources for character:', resources);
                     if (mineId === 1) {
                         const updateSql = `UPDATE character_resources SET iron = iron + ? WHERE character_id = ?`
                         await db.run(updateSql, [updatedResources, characterId], (err) => {
                             if (err) {
                                 console.error('Error updating resources:', err.message);
                             } else {
                                 //console.log('Resources updated successfully.');
                             }
                         });
                     }
                     else if (mineId === 2) {
                         const updateSql = `UPDATE character_resources SET copper = copper + ? WHERE character_id = ?`
                         await db.run(updateSql, [updatedResources, characterId], (err) => {
                             if (err) {
                                 console.error('Error updating resources:', err.message);
                             } else {
                                 //console.log('Resources updated successfully.');
                             }
                         });
                     }
                     else if (mineId === 3) {
                         const updateSql = `UPDATE character_resources SET petrol = petrol + ? WHERE character_id = ?`
                         await db.run(updateSql, [updatedResources, characterId], (err) => {
                             if (err) {
                                 console.error('Error updating resources:', err.message);
                             } else {
                                 //console.log('Resources updated successfully.');
                             }
                         });
                     }
                     else if (mineId === 4) {
                         const updateSql = `UPDATE character_resources SET crystal = crystal + ? WHERE character_id = ?`
                         await db.run(updateSql, [updatedResources, characterId], (err) => {
                             if (err) {
                                 console.error('Error updating resources:', err.message);
                             } else {
                                 //console.log('Resources updated successfully.');
                             }
                         });
                     }
                     else {
                         console.log('updateCharacterResources : no mine_id.');
                     }

                 }
             }
        });

    }

    // Function to retrieve the amount of resources for a character
    async function getResourcesForCharacter(userId, callback) {

        const character = await new Promise((resolve, reject) => {
            findCharacterByUserId(userId, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        console.log("HERE");
        console.log(character);

        const sql = `SELECT * FROM character_resources WHERE character_id = ?`;

        db.get(sql, [character.id], (err, row) => {
            if (err) {
                console.error('Error retrieving resources:', err.message);
                callback(err, null);
            } else {
                if (!row) {
                    console.log('Character resources not found.');
                    callback(null, null);
                } else {
                    const resources = {
                        iron: row.iron,
                        steel: row.steel,
                        copper: row.copper,
                        components: row.components,
                        petrol: row.petrol,
                        plastic: row.plastic,
                        money: row.money,
                        crystal: row.crystal
                    };
                    callback(null, resources);
                }
            }
        });
    }

    async function updateBuildingLevel(characterId, buildingId, newLevel) {
        try {
            const sql = `UPDATE character_buildings SET level = ? WHERE character_id = ? AND building_id = ?`;
            await db.run(sql, [newLevel, characterId, buildingId]);
            console.log(`Building with ID ${buildingId} for character with ID ${characterId} updated to level ${newLevel}.`);
            return true; // Return true if the update was successful
        } catch (err) {
            console.error('Error updating building level:', err);
            return false; // Return false if there was an error updating the level
        }
    }

    async function updateMineLevel(characterId, mineId, newLevel) {
        try {
            const sql = `UPDATE character_mines SET level = ? WHERE character_id = ? AND mine_id = ?`;
            await db.run(sql, [newLevel, characterId, mineId]);
            console.log(`Building with ID ${mineId} for character with ID ${characterId} updated to level ${newLevel}.`);
            return true; // Return true if the update was successful
        } catch (err) {
            console.error('Error updating building level:', err);
            return false; // Return false if there was an error updating the level
        }
    }

    return {
        createUser,
        findUserByUsername,
        addCharacter,
        findCharacterByUserId,
        deleteCharacter,
        changePassword,
        getCharacterAttributesByUserId,
        hasCharacter,
        getBuildingLevelUpCost,
        getBuildingData,
        getCharacterBuildingInfo,
        addOrUpdateResourcesForCharacter,
        updateCharacterResources,
        getResourcesForCharacter,
        updateBuildingLevel,
        updateMineLevel,
        getCharacterMinesInfo,
        getMineData,
        getMineLevelUpCost
    };
}

module.exports = setupDatabase;
