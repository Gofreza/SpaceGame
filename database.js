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

    /*db.run(`CREATE TABLE IF NOT EXISTS character_resources2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    iron INTEGER,
    steel INTEGER,
    copper INTEGER,
    components INTEGER,
    petrol FLOAT,
    plastic INTEGER,
    money INTEGER,
    crystal FLOAT,
    FOREIGN KEY (character_id) REFERENCES characters(id)
    );`)
     */

    db.run(`CREATE TABLE IF NOT EXISTS building_characteristics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_id INTEGER,
    level INTEGER,
    production_bonus FLOAT,
    storage_capacity INTEGER,
    population_capacity INTEGER,
    mission_count INTEGER,
    ship_capacity INTEGER,
    unlocked_ships TEXT,
    FOREIGN KEY (building_id) REFERENCES buildings (id)
    );`)

    db.run(`CREATE TABLE IF NOT EXISTS smelting_conversion_rate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource TEXT,
    level INTEGER,
    raw_resource INTEGER,
    process_resource INTEGER,
    process_speed INTEGER
    );`)

    db.run(`CREATE TABLE IF NOT EXISTS character_population (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    current_pop INTEGER,
    worker_pop INTEGER,
    free_pop INTEGER,
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

    /*  =======================
         MISC FUNCTIONS
         ======================= */

        async function isIntegerOrFloat(value) {
        const parsedValue = parseFloat(value);
        return Number.isInteger(parsedValue) ? parsedValue : parsedValue.toFixed(1);
    }

    /*  =======================
         USER FUNCTIONS
         ======================= */

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

    /*  =======================
         CHARACTER FUNCTIONS
         ======================= */

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
            let sql = `INSERT INTO characters (name, level, class, combat, industry, technology, imgurl, user_id) VALUES (?, ?, ?, 5, 5, 5, ?, ?)`;

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
                sql = `INSERT INTO character_resources (character_id, iron, steel, copper, components, petrol, plastic, money, crystal) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                db.run(sql, [this.lastID, 1000, 300, 600, 200, 400, 200, 20000, 0], (err) => {
                    if (err) {
                        console.error('Error inserting resources:', err.message);
                    } else {
                        console.log('Resources inserted successfully.');
                    }
                });

                //Insert default population

                sql = `INSERT INTO character_population (character_id, current_pop, worker_pop, free_pop)
                    VALUES (?, ?, ?, ?)`

                db.run(sql, [this.lastID, 70, 50, 20], (err) => {
                    if (err) {
                        console.error('Error inserting default population : ', err.message);
                    }
                    else {
                        console.log('Default population inserted successfully');
                    }
                });

                console.log(`Character ${name} added with ID ${this.lastID}`);
                callback(null, this.lastID);
            });
        }

        async function findCharacterByUserId(userId, callback) {
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

                //console.log('Character found:', row);
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

                                const sql = `DELETE FROM character_population WHERE character_id = ?`

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

    /*  =======================
         BUILDING FUNCTIONS
         ======================= */

        async function getCharacterBuildingInfo(characterId, callback) {
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


        async function getBuildingData(buildingId, callback) {
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


        async function getBuildingLevelUpCost(buildingId, level, callback) {
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

        function dbGetAsync(db, sql, params) {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }

        async function canUpdateBuilding(userId, level, buildingId) {
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
                    console.log('deleteCharacter : Character not found.');
                    return false;
                }

                const sql = `SELECT level FROM character_buildings WHERE character_id = ? AND building_id = 1`;

                const life_support_level = await dbGetAsync(db, sql, [character.id]);

                //console.log(character.id);
                //console.log(life_support_level);

                if (buildingId !== 1) {
                    return life_support_level.level > level;
                } else {
                    return true
                }

            } catch (err) {
                console.error('Error finding character or querying database:', err.message);
                return false;
            }
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

        async function getSmeltingRate(resource, level) {
            return new Promise((resolve, reject) => {
                const sql = `SELECT * FROM smelting_conversion_rate WHERE resource = ? AND level = ?`;
                db.get(sql, [resource, level], (err, row) => {
                    if (err) {
                        console.error('Error:', err);
                        reject(err);
                    } else {
                        // If no record found, return null
                        const smeltingRate = row || null;
                        resolve(smeltingRate);
                    }
                });
            });
        }

        //Pour la route de création des bâtiments
        async function getSmeltingRates(resource, level, callback) {
        const sql = `SELECT * FROM smelting_conversion_rate WHERE resource = ? AND level = ?`
        db.get(sql, [resource, level], (err, row) => {
            if (err) {
                callback(err, null)
            }

            callback(null, row)
        })
    }


    /*  =======================
         MINES FUNCTIONS
         ======================= */

        async function getCharacterMinesInfo(characterId, callback) {
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

        async function getMineData(mineId, callback) {
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

        async function getMineLevelUpCost(mineId, level, callback) {
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

    /*  =======================
        RESOURCE FUNCTIONS
        ======================= */

        // Function to add or update resources for a character
        async function addOrUpdateResourcesForCharacter(characterId, resources, callback) {
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
        let fractionalResources = {
            iron: 0,
            copper: 0,
            petrol: 0,
            crystal: 0
        };

        async function updateCharacterResources(userId, characterId, resourcesToAdd, mineId) {

            const updatedResources = await isIntegerOrFloat(resourcesToAdd);

            await getCharacteristics(userId, 7, async (err, characteristics) => {
                if (err) {
                    console.log("updateCharacterResources : Error characteristics not found")
                } else {
                    //console.log("Characterisrics : ", characteristics)
                    const maxCapacity = characteristics.storage_capacity

                    await getResourcesForCharacter(userId, async (err, resources) => {
                        if (err) {
                            console.log("updateCharacterResources : Error resources")
                        } else {
                            if (resources === null) {
                                console.log('Character resources not found.');
                            } else {
                                //console.log('Resources for character:', resources);

                                if (mineId === 1) {
                                    if (resources.iron < maxCapacity) {
                                        fractionalResources.iron += updatedResources;
                                    }
                                } else if (mineId === 2) {
                                    if (resources.copper < maxCapacity) {
                                        fractionalResources.copper += updatedResources;
                                    }
                                } else if (mineId === 3) {
                                    if (resources.petrol < maxCapacity) {
                                        fractionalResources.petrol += parseFloat(updatedResources);
                                    }
                                } else if (mineId === 4) {
                                    if (resources.crystal < maxCapacity) {
                                        fractionalResources.crystal += parseFloat(updatedResources);
                                    }
                                }

                                //console.log("F:", fractionalResources)

                                for (const resource in fractionalResources) {
                                    const value = fractionalResources[resource];
                                    const wholePart = Math.floor(value);
                                    if (wholePart > 0) {
                                        // Update the database with the whole number part
                                        await updateResourceInDatabase(resource, wholePart, characterId);
                                        // Subtract the whole number part from the accumulated value
                                        fractionalResources[resource] -= wholePart;
                                    }
                                }

                            }
                        }
                    });
                }
            })

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

            //console.log("HERE");
            //console.log(character);

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

    /*
        REFINING
     */

            async function refineCharacterResources(userId, characterId, resourceType) {
                const maxCapacity = await new Promise((resolve, reject) => {
                    getCharacteristics(userId, 7, (err, characteristics) => {
                        if (err) {
                            reject(new Error("Error characteristics not found"));
                        } else {
                            resolve(characteristics.storage_capacity);
                        }
                    });
                });

                const resources = await new Promise((resolve, reject) => {
                    getResourcesForCharacter(userId, (err, resources) => {
                        if (err) {
                            reject(new Error("Error fetching character resources"));
                        } else {
                            if (resources === null) {
                                reject(new Error('Character resources not found.'));
                            } else {
                                resolve(resources);
                            }
                        }
                    });
                });

                const buildingsData = await new Promise((resolve, reject) => {
                    getCharacterBuildingInfo(characterId, (err, level) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(level);
                        }
                    });
                });

                const smeltingData = buildingsData.find((building) => building.building_id === 8);
                const level = smeltingData.level;

                const rate = await getSmeltingRate(resourceType, level).catch((err) => {
                    console.error('Error fetching smelting rate', err.message);
                    throw err;
                });

                const { resource, raw_resource, process_speed, process_resource } = rate;

                // Simulate processing time using setTimeout and async/await
                await new Promise((resolve) => setTimeout(resolve, process_speed * 1000));

                // Calculate the refined resources
                let raw;
                switch (resourceType) {
                    case 'steel':
                        raw = 'iron';
                        break;
                    case 'components':
                        raw = 'copper';
                        break;
                    case 'plastic':
                        raw = 'petrol';
                        break;
                    default:
                        raw = 'Error';
                        break;
                }

                const currentResource = resources[resource];

                if (currentResource < maxCapacity) {
                    await subtractResourceInDatabase(raw, raw_resource, characterId);
                    await updateResourceInDatabase(resource, process_resource, characterId);
                    //console.log(`Resource ${resource} refined: ${process_resource}`);
                } else {
                    console.log(`RefineCharacterResources: ${resource} MaxCapacity`);
                }
            }

            async function refineSteel(userId, characterId) {
                await refineCharacterResources(userId, characterId, 'steel');
            }

            async function refineComponents(userId, characterId) {
                await refineCharacterResources(userId, characterId, 'components');
            }

            async function refinePlastic(userId, characterId) {
                await refineCharacterResources(userId, characterId, 'plastic');
            }

        /*
            END REFINING
         */

        async function updateResourceInDatabase(resource, value, characterId) {
            const updateSql = `UPDATE character_resources SET ${resource} = ${resource} + ? WHERE character_id = ?`;
            await db.run(updateSql, [value, characterId], (err) => {
                if (err) {
                    console.error('Error updating resources:', err.message);
                } else {
                    //console.log('Resources updated successfully.');
                }
            });
        }

        async function subtractResourceInDatabase(resource, value, characterId) {
            const updateSql = `UPDATE character_resources SET ${resource} = ${resource} - ? WHERE character_id = ?`;
            await db.run(updateSql, [value, characterId], (err) => {
                if (err) {
                    console.error('Error subtracting resources:', err.message);
                } else {
                    //console.log('Resources updated successfully.');
                }
            });
        }

    /*  =======================
        BUILDING CHARACTERISTIC
        ======================= */

        async function getCharacteristics(userId, buildingId, callback) {

            const character = await new Promise((resolve, reject) => {
                findCharacterByUserId(userId, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });

            const sql = `SELECT level FROM character_buildings WHERE character_id = ? AND building_id = ?`

            await db.get(sql, [character.id, buildingId], async (err, level) => {
                if (err) {
                    console.error('Error fetching building data:', err.message);
                    callback(err)
                }

                //console.log("ID : ", buildingId)
                //console.log("Level : ", level.level)

                const sql = `SELECT * FROM building_characteristics WHERE building_id = ? AND level = ?`

                await db.get(sql, [buildingId, level.level], (err, characteristics) => {
                    if (err) {
                        console.error('Error retrieving characteristics:', err.message);
                        callback(err, null);
                    } else {
                        if (!characteristics) {
                            console.log('Character characteristic not found.');
                            callback(null, null);
                        } else {
                            callback(null, characteristics)
                        }
                    }
                })
            })
        }

    /*  =======================
         POPULATION FUNCTIONS
         ======================= */

        async function getCharacterPopulation(userId, callback) {

            const character = await new Promise((resolve, reject) => {
                findCharacterByUserId(userId, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            });

            const sqlCurrentPop = `SELECT current_pop FROM character_population WHERE character_id = ?`;
            const sqlWorkerPop = `SELECT worker_pop FROM character_population WHERE character_id = ?`;
            const sqlFreePop = `SELECT free_pop FROM character_population WHERE character_id = ?`;

            const [current_pop, worker_pop, free_pop] = await Promise.all([
                new Promise((resolve, reject) => {
                    db.get(sqlCurrentPop, [character.id], (err, current_pop) => {
                        if (err) {
                            console.error('Error retrieving current_pop:', err.message);
                            reject(err);
                        } else {
                            resolve(current_pop);
                        }
                    });
                }),
                new Promise((resolve, reject) => {
                    db.get(sqlWorkerPop, [character.id], (err, worker_pop) => {
                        if (err) {
                            console.error('Error retrieving worker_pop:', err.message);
                            reject(err);
                        } else {
                            resolve(worker_pop);
                        }
                    });
                }),
                new Promise((resolve, reject) => {
                    db.get(sqlFreePop, [character.id], (err, free_pop) => {
                        if (err) {
                            console.error('Error retrieving free_pop:', err.message);
                            reject(err);
                        } else {
                            resolve(free_pop);
                        }
                    });
                })
            ]);

            callback(null, { current_pop, worker_pop, free_pop });
        }

        async function getCurrentPop(userId) {
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

                const sql = `SELECT current_pop FROM character_population WHERE character_id = ?`;

                const current_pop = await new Promise((resolve, reject) => {
                    db.get(sql, [character.id], (err, current_pop) => {
                        if (err) {
                            console.error('Error retrieving current_pop:', err.message);
                            reject(err);
                        } else {
                            resolve(current_pop);
                        }
                    });
                });

                if (!current_pop) {
                    console.log('Character current_pop not found.');
                    return null;
                }

                return current_pop;
            } catch (err) {
                console.error('Error in getCurrentPop:', err.message);
                return null;
            }
        }

        async function getWorkerPop(userId, callback) {
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

                const sql = `SELECT worker_pop FROM character_population WHERE character_id = ?`;

                await db.get(sql, [character.id], (err, worker_pop) => {
                    if (err) {
                        console.error('Error retrieving worker_pop:', err.message);
                        callback(err, null);
                    } else {
                        if (!worker_pop) {
                            console.log('Character worker_pop not found.');
                            callback(null, null);
                        } else {
                            callback(null, worker_pop);
                        }
                    }
                });
            } catch (err) {
                console.error('Error in getWorkerPop:', err.message);
                callback(err, null);
            }
        }

        async function getFreePop(userId, callback) {
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

                const sql = `SELECT free_pop FROM character_population WHERE character_id = ?`;

                await db.get(sql, [character.id], (err, free_pop) => {
                    if (err) {
                        console.error('Error retrieving free_pop:', err.message);
                        callback(err, null);
                    } else {
                        if (!free_pop) {
                            console.log('Character free_pop not found.');
                            callback(null, null);
                        } else {
                            callback(null, free_pop);
                        }
                    }
                });
            } catch (err) {
                console.error('Error in getFreePop:', err.message);
                callback(err, null);
            }
        }

        async function setCurrentPop(userId, resourceToAdd) {
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

                const sql = `UPDATE character_population SET current_pop = current_pop + ? WHERE character_id = ?`;

                db.run(sql, [resourceToAdd, character.id], (err) => {
                    if (err) {
                        console.error('Error updating current_pop:', err.message);
                    }
                });
            } catch (err) {
                console.error('Error in setCurrentPop:', err.message);
            }
        }

        async function setWorkerPop(userId, resourceToAdd) {
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

                const sql = `UPDATE character_population SET worker_pop = worker_pop + ? WHERE character_id = ?`;

                db.run(sql, [resourceToAdd, character.id], (err) => {
                    if (err) {
                        console.error('Error updating worker_pop:', err.message);
                    }
                });
            } catch (err) {
                console.error('Error in setWorkerPop:', err.message);
            }
        }

        async function setFreePop(userId, resourceToAdd) {
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

                const sql = `UPDATE character_population SET free_pop = free_pop + ? WHERE character_id = ?`;

                db.run(sql, [resourceToAdd, character.id], (err) => {
                    if (err) {
                        console.error('Error updating free_pop:', err.message);
                    }
                });
            } catch (err) {
                console.error('Error in setFreePop:', err.message);
            }
        }

        async function updatePopulation(userId) {
            try {
                const {current_pop} = await getCurrentPop(userId);

                const { worker_pop } = await new Promise((resolve, reject) => {
                    getWorkerPop(userId, (err, workerPop) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(workerPop);
                        }
                    });
                });

                const character = await new Promise((resolve, reject) => {
                    findCharacterByUserId(userId, (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });

                const buildingsData = await new Promise((resolve, reject) => {
                    getCharacterBuildingInfo(character.id, (err, level) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(level);
                        }
                    });
                });

                const housingData = buildingsData.find(building => building.building_id === 3);

                const max_pop = await new Promise((resolve, reject) => {
                    getCharacteristics(userId, housingData.building_id, (err, maxPop) => {
                        if (err) {
                            console.log('Route: Character characteristic not found!');
                            resolve(200); // Default population if characteristic not found
                        } else {
                            resolve(maxPop.population_capacity || 200); // Default population if characteristic not found
                        }
                    });
                });

                if (current_pop < max_pop) {
                    if (worker_pop < max_pop * 0.25) {
                        // Add workers
                        await setCurrentPop(userId, 1);
                        await setWorkerPop(userId, 1);
                    } else {
                        // Add free people
                        await setCurrentPop(userId, 1);
                        await setFreePop(userId, 1);
                    }
                }
            } catch (err) {
                console.error('Error in updatePopulation:', err.message);
            }
        }

    return {
        //Users
        createUser, findUserByUsername, addCharacter, findCharacterByUserId, deleteCharacter, changePassword, getCharacterAttributesByUserId, hasCharacter,
        //Buildings
        getBuildingLevelUpCost, canUpdateBuilding, getBuildingData, getCharacterBuildingInfo, updateBuildingLevel,
        //Resources
        addOrUpdateResourcesForCharacter, updateCharacterResources, getResourcesForCharacter,
        //Refining
        getSmeltingRates, refineSteel, refineComponents, refinePlastic,
        //Mines
        updateMineLevel, getCharacterMinesInfo, getMineData, getMineLevelUpCost,
        //Characteristics
        getCharacteristics,
        //Populations
        getCharacterPopulation, getCurrentPop, getWorkerPop, getFreePop, setCurrentPop, setWorkerPop, setFreePop, updatePopulation
    };
}

module.exports = setupDatabase;
