const express = require('express');
const router = express.Router();
const {requireAuth, requireNotAuth, levelUpBuilding, levelUpMine, showBuildingPage} = require('../functions')

const database = require('../database')
const {isRefiningOn, isRefiningSteelOn, isRefiningComponentsOn, isRefiningPlasticOn} = require("../updateResources");
const db = database()

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

    const userId = req.session.userId

    db.getResourcesForCharacter(userId, async (err, resources) => {
        if (err) {
            // Handle error
        } else {
            if (resources === null) {
                console.log('Character resources not found.');
            } else {

                const character = await new Promise((resolve, reject) => {
                    db.findCharacterByUserId(userId, (err, row) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    });
                });

                let smeltingRates = [];

                const buildingsData = await new Promise((resolve, reject) => {
                    db.getCharacterBuildingInfo(character.id, (err, level) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(level);
                        }
                    });
                });

                //For the Housing Complex
                if (index === 2) {
                    const housingData = buildingsData.find(building => building.building_id === index + 1);

                    await db.getCharacteristics(userId, housingData.building_id, async (err, row) => {

                        if (err) {
                            console.log('Route : Character characteristic not found !')
                        }

                        if (row === null) {
                            //Population de base
                            row = 200
                        } else {
                            //console.log(row)
                            row = row.population_capacity
                        }

                        const {current_pop} = await db.getCurrentPop(userId);

                        const {worker_pop} = await new Promise((resolve, reject) => {
                            db.getWorkerPop(userId, (err, workerPop) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(workerPop);
                                }
                            });
                        });

                        const {free_pop} = await new Promise((resolve, reject) => {
                            db.getFreePop(userId, (err, freePop) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(freePop);
                                }
                            });
                        });

                        res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
                            title: title,
                            flash: flashMessages,
                            index: index,
                            resources: resources,
                            housingCapacity: row,
                            currentPop: current_pop,
                            workerPop: worker_pop,
                            freePop: free_pop,
                            showMenuBar: true
                        });

                    });

                }
                //For the Storage Room
                else if (index === 6) {
                    const storageData = buildingsData.find(building => building.building_id === index + 1);

                    await db.getCharacteristics(userId, storageData.building_id, (err, row) => {

                        if (err) {
                            console.log('Route : Character characteristic not found !')
                        }

                        if (row === null) {
                            row = 5000
                        }
                        else{
                            //console.log(row)
                            row = row.storage_capacity
                        }

                        res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
                            title: title,
                            flash: flashMessages,
                            index: index,
                            resources: resources,
                            storageCapacity: row,
                            showMenuBar: true
                        });

                    });
                }
                //For Smelting Facility
                else if (index === 7) {

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

                    let refiningStatus = [];

                    if (isRefiningOn()) {
                        refiningStatus.push("on")
                    }else {refiningStatus.push("off")}
                    if (isRefiningSteelOn()) {
                        refiningStatus.push("steelOn")
                    }else {refiningStatus.push("off")}
                    if (isRefiningComponentsOn()) {
                        refiningStatus.push("componentsOn")
                    }else {refiningStatus.push("off")}
                    if (isRefiningPlasticOn()) {
                        refiningStatus.push("plasticOn")
                    }else {refiningStatus.push("off")}

                    //console.log(smeltingRates)

                    res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
                        title: title,
                        flash: flashMessages,
                        index: index,
                        resources: resources,
                        smeltingRates: smeltingRates,
                        refiningStatus:refiningStatus,
                        showMenuBar: true
                    });

                }
                else{
                    //Render without parameters
                    res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
                        title: title,
                        flash: flashMessages,
                        index: index,
                        showMenuBar: true
                    });
                }

                //console.log(smeltingRates)
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

module.exports = router;