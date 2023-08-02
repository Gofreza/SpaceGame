const express = require('express');
const router = express.Router();
const {requireAuth, requireNotAuth, levelUpBuilding, levelUpMine, showBuildingPage} = require('../functions')

const database = require('../database')
const {startRefining, stopRefining, startRefiningSteel, startRefiningComponents, startRefiningPlastic,
    stopRefiningSteel, stopRefiningComponents
} = require("../updateResources");
const db = database()

router.get('/dashboard', requireAuth, async (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session
    const username = req.session.username;

    const userId = req.session.userId
    const attributesToGet = ['name', 'imgurl', 'level', 'combat', 'industry', 'technology'];
    let imgUrl;
    let name;
    let level, combat, industry, technology;

    db.getCharacterAttributesByUserId(userId, attributesToGet)
        .then((attributeValues) => {
            if (attributeValues === null) {
                console.log('dashboard - getCharacterAttributesByUserId : Character not found.');
            } else {
                //console.log('Attributes for the character with ID', userId, ':', attributeValues);
                //console.log('Name:', attributeValues.name);
                name = attributeValues.name;
                //console.log('ImgUrl:', attributeValues.imgurl);
                imgUrl = "/imgs/characters/" + attributeValues.imgurl;
                level = attributeValues.level;
                combat = attributeValues.combat;
                industry = attributeValues.industry
                technology = attributeValues.technology

                db.getResourcesForCharacter(userId, (err, resources) => {
                    if (err) {
                        // Handle error
                    } else {
                        if (resources === null) {
                            console.log('Character resources not found.');
                        } else {
                            //console.log('Resources for character:', resources);

                            res.render("../views/pages/dashboard.pug", {
                                title: "Dashboard",
                                flash: flashMessages,
                                username: username,
                                imgUrl: imgUrl,
                                name:name,
                                level:level,
                                combat_stat:combat,
                                industry_stat:industry,
                                technology_stat:technology,
                                resources:resources,
                                showMenuBar: true
                            });
                        }
                    }
                });
            }
        })
        .catch((err) => {
            console.error('Error:', err);
        });

});

router.get('/', requireNotAuth, (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session
    res.render("../views/pages/login.pug", {title: "Home", flash: flashMessages});
});

router.get('/profile', requireAuth, async (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session
    const username = req.session.username;

    const userId = req.session.userId
    const attributesToGet = ['name', 'imgurl'];
    let imgUrl;
    let name;

    db.getCharacterAttributesByUserId(userId, attributesToGet)
        .then((attributeValues) => {
            if (attributeValues === null) {
                console.log('profile - getCharacterAttributesByUserId : Character not found.');
            } else {
                //console.log('Attributes for the character with ID', userId, ':', attributeValues);
                //console.log('Name:', attributeValues.name);
                name = attributeValues.name
                //console.log('ImgUrl:', attributeValues.imgurl);
                imgUrl = "/imgs/characters/" + attributeValues.imgurl

                res.render("../views/pages/profile.pug", {
                    title: "Profile",
                    userId: userId,
                    flash: flashMessages,
                    username: username,
                    imgUrl: imgUrl,
                    name:name
                });
            }
        })
        .catch((err) => {
            console.error('Error:', err);
        });

});

router.post('/profile', requireAuth, (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    db.changePassword(req, res, currentPassword, newPassword, confirmPassword);
});

router.get('/planet-menu', requireAuth, (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session
    res.render("../views/pages/planet/planet-menu.pug", {title: "Menu", flash: flashMessages});
});

router.get('/base', requireAuth, (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session

    const centerItemArray = [];
    const circleItemArray = [];

    db.findCharacterByUserId(req.session.userId, (err, character) => {
        if (err) {
            console.error('Error finding character:', err.message);
            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
            return;
        }

        if (!character) {
            console.log('Character not found.');
            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
            return;
        }

        db.getCharacterBuildingInfo(character.id, (err, characterBuildings) => {
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

                // Get the data about the building
                db.getBuildingData(buildingId, (err, buildingData) => {
                    if (err) {
                        console.error('Error fetching building data:', err.message);
                        return;
                    }

                    // Get the level-up cost data for the building
                    db.getBuildingLevelUpCost(buildingId, level, (err, levelUpCostData) => {
                        if (err) {
                            console.error('Error fetching level-up cost data:', err.message);
                            return;
                        }

                        const buildingInfo = {
                            index: buildingData.building_index,
                            name: buildingData.name,
                            src: buildingData.img_src,
                            info: buildingData.description,
                            level: characterBuilding.level,
                            costToLevelUp: levelUpCostData,
                        };

                        if (buildingData.building_index === 0) {
                            centerItemArray.push(buildingInfo);
                        } else {
                            circleItemArray.push(buildingInfo);
                        }

                        // Check if all building data has been collected
                        if (centerItemArray.length + circleItemArray.length === characterBuildings.length) {
                            // Sort circleItemArray based on building_index
                            circleItemArray.sort((a, b) => a.index - b.index);

                            //console.log(centerItemArray);
                            //console.log(circleItemArray);

                            db.getResourcesForCharacter(req.session.userId, (err, resources) => {
                                if (err) {
                                    // Handle error
                                } else {
                                    if (resources === null) {
                                        console.log('Character resources not found.');
                                    } else {
                                        //console.log('Resources for character:', resources);

                                        res.render("../views/pages/planet/base.pug", {
                                            title: "Base",
                                            flash: flashMessages,
                                            centerItem: centerItemArray,
                                            circleItems: circleItemArray,
                                            resources:resources,
                                            showMenuBar: true
                                        });
                                    }
                                }
                            });

                        }
                    });
                });
            }
        });
    });
});

router.post('/level-up-building/:type/:index', requireAuth,(req, res) => {
    const index = req.params.index; // Get the building index from the request
    const type = req.params.type;

    if (type === "base") {
        levelUpBuilding(index, req, res); // Call the levelUpBuilding function with the index
    }
    else if (type === "planet") {
        levelUpMine(index, req, res);
    }

});

router.get('/building-page/:index', requireAuth, (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session
    const index = parseInt(req.params.index);

    let title;
    switch (index) {
        case 0: title = "Life Support System"; break;
        case 1: title = "HQ"; break;
        case 2: title = "Housing Module"; break;
        case 3: title = "Commercial Hub"; break;
        case 4: title = "Space Hangar"; break;
        case 5: title = "Space Yard"; break;
        case 6: title = "Storage Room"; break;
        case 7: title = "Smelting Facility"; break;
        case 8: title = "Workshop"; break;
        default: title = "Error"; break;
    }

    db.getResourcesForCharacter(req.session.userId, async (err, resources) => {
        if (err) {
            // Handle error
        } else {
            if (resources === null) {
                console.log('Character resources not found.');
            } else {

                const character = await new Promise((resolve, reject) => {
                    db.findCharacterByUserId(req.session.userId, (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });

                let smeltingRates = [];

                if (index === 7) {

                    const buildingsData = await new Promise((resolve, reject) => {
                        db.getCharacterBuildingInfo(character.id, (err, level) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(level);
                            }
                        });
                    });

                    //console.log(buildingsData)
                    const smeltingData = buildingsData.find(building => building.building_id === index + 1);
                    //console.log(smeltingData.level)
                    const level = smeltingData.level

                    let resources = ["steel", "components", "plastic"];

                    for (let resource of resources) { // Use 'of' instead of 'in' to iterate over values
                        const res = await new Promise((resolve, reject) => {
                            db.getSmeltingRates(resource, level, (err, row) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(row);
                                }
                            });
                        });

                        smeltingRates.push(res); // Push 'res' into the 'result' array
                    }

                }

                //console.log(smeltingRates)

                res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
                    title: title,
                    flash: flashMessages,
                    index: index,
                    resources: resources,
                    smeltingRates: smeltingRates,
                    showMenuBar: true
                });
            }
        }
    });
});

// POST route to handle form submission and redirect to building page
router.post('/building-page', requireAuth, (req, res) => {
    // Parse the index from the form submission
    const index = parseInt(req.body.index);

    // Redirect to the corresponding building page using the GET route
    res.redirect(`/building-page/${index}`);
});

router.post('/refining', requireAuth, async (req, res) => {
    const progress = req.body.progress;
    const character = await new Promise((resolve, reject) => {
        db.findCharacterByUserId(req.session.userId, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });

    const userId = req.session.userId;
    const characterID = character.id

    if (progress === "start") {
        startRefining(userId, characterID);
    } else if (progress === "startSteel") {
        startRefiningSteel(userId, characterID)
    } else if (progress === "startComponents") {
        startRefiningComponents(userId, characterID)
    } else if (progress === "startPlastic") {
        startRefiningPlastic(userId, characterID)
    } else if (progress === "stopSteel") {
        stopRefiningSteel()
    } else if (progress === "stopComponents") {
        stopRefiningComponents()
    } else if (progress === "stopPlastic") {
        stopRefining()
    } else {
        stopRefining();
    }

    const referer = req.headers.referer;
    if (referer) {
        res.redirect(referer);
    } else {
        // If the referer is not available, redirect to a default page
        res.redirect('/dashboard');
    }
});

router.get('/planet', requireAuth, (req, res) => {
    const flashMessages = req.flash(); // Retrieve flash messages from the session

    const squareItemArray = [];

    db.findCharacterByUserId(req.session.userId, (err, character) => {
        if (err) {
            console.error('Error finding character:', err.message);
            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
            return;
        }

        if (!character) {
            console.log('Character not found.');
            res.redirect('/'); // Handle the error as needed, redirecting to the appropriate page
            return;
        }

        db.getCharacterMinesInfo(character.id, (err, characterMines) => {
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

                //console.log("CharacterMine : ", characterMine)
                //console.log("mineId : ", mineId)

                // Get the data about the building
                db.getMineData(mineId, (err, mineData) => {
                    if (err) {
                        console.error('Error fetching mine data:', err.message);
                        return;
                    }

                    // Get the level-up cost data for the building
                    db.getMineLevelUpCost(mineId, level, (err, levelUpCostData) => {
                        if (err) {
                            console.error('Error fetching level-up cost data:', err.message);
                            return;
                        }

                        //console.log(mineData)

                        const mineInfo = {
                            index: mineData.mine_index,
                            name: mineData.name,
                            src: mineData.img_src,
                            info: mineData.description,
                            level: characterMine.level,
                            costToLevelUp: levelUpCostData,
                        };

                        squareItemArray.push(mineInfo);


                        // Check if all building data has been collected
                        if (squareItemArray.length === characterMines.length) {
                            // Sort circleItemArray based on building_index
                            squareItemArray.sort((a, b) => a.index - b.index);

                            //console.log(centerItemArray);
                            //console.log(circleItemArray);

                            db.getResourcesForCharacter(req.session.userId, (err, resources) => {
                                if (err) {
                                    // Handle error
                                } else {
                                    if (resources === null) {
                                        console.log('Character resources not found.');
                                    } else {
                                        //console.log('Resources for character:', resources);

                                        res.render("../views/pages/planet/planet.pug", {
                                            title: "Base",
                                            flash: flashMessages,
                                            squareItem: squareItemArray,
                                            resources:resources,
                                            showMenuBar: true
                                        });
                                    }
                                }
                            });

                        }
                    });
                });
            }
        });
    });
});

module.exports = router;