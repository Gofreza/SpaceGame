const express = require('express');
const router = express.Router();
const {requireAuth, requireNotAuth, levelUpBuilding, levelUpMine, showBuildingPage, areAllIntegers} = require('../functions')

const database = require('../database')
const {isRefiningOn, isRefiningSteelOn, isRefiningComponentsOn, isRefiningPlasticOn} = require("../updateResources");
const db = database()
const craftingRequests = [];

function transformToUnderscoreCase(inputString) {
    // Convert the string to lowercase and replace spaces with underscores
    return inputString.toLowerCase().replace(/ /g, '_');
}
function transformToName(key) {
    // Split the key into words using underscores as separators
    const words = key.split('_');

    // Capitalize the first letter of each word
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));

    // Join the words back together with spaces
    return capitalizedWords.join(' ');
}

router.get('/building-page/:index', requireAuth, async (req, res) => {
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
    const characterId = req.session.characterId

    const resources = await db.getResourcesForCharacterBis(characterId)
    const totalPopulation = await db.getCharacterPopulationBis(characterId)

    let smeltingRates = [];

    const buildingsData = await new Promise((resolve, reject) => {
        db.getCharacterBuildingInfo(characterId, (err, level) => {
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
    //For the Commercial Hub
    else if (index === 3) {

        let resourcesName = [
            "Iron", "Steel",
            "Copper", "Components",
            "Petrol", "Plastic",
            "Money", "Crystal"
        ]

        res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
            title: title,
            flash: flashMessages,
            index: index,
            resourcesName: resourcesName,
            resources: resources,
            showMenuBar: true
        });
    }
    //For the Space Hangar
    else if (index === 4) {

        const characteristics = await db.getCharacteristicsBis(characterId, 5)
        const nb_ships = await db.getUnitsNumber(characterId)

        const unitsCharacteristics = [];
        const unitsNumber = await db.getUnits(characterId)
        const keys = Object.keys(unitsNumber);

        for (const key of keys) {
            const value = unitsNumber[key];
            if (key !== "id" && key !== "character_id"){
                const characteristic = await db.getUnitsCharacteristics(transformToName(key))
                unitsCharacteristics.push(characteristic)
            }
        }

        //console.log(unitsCharacteristics)

        //Check if crafts are finished (after log out the craftingRequests is empty so need to check with the db)
        const crafts = await db.getCraftFromCharacter(characterId)
        //console.log(crafts)
        let isCraft = false

        if (crafts.length !== 0) {
            isCraft = true
        }

        res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
            title: title,
            flash: flashMessages,
            index: index,
            unitsNumber: unitsNumber,
            unitsCharacteristics: unitsCharacteristics,
            nbShips: nb_ships,
            maxShips: characteristics.ship_capacity,
            crafts: isCraft,
            showMenuBar: true
        });
    }
    //For the Space Yard
    else if (index === 5) {

        await db.getCharacterBuildingInfo(characterId, async (err, characterBuildings) => {
            if (err) {
                console.log("Error getCharacterBuildingInfo : can't get buildings info")
            }

            //console.log(characterBuildings)

            for (let i = 0; i < characterBuildings.length; i++) {
                const characterBuilding = characterBuildings[i];
                const buildingId = characterBuilding.building_id;
                const level = characterBuilding.level;

                //The Space Yard of course, yes it's different i don't know where
                //I made a mistake
                if (buildingId === 6) {

                    //Check if crafts are finished (after log out the craftingRequests is empty so need to check with the db)
                    const crafts = await db.getCraftFromCharacter(characterId)
                    //console.log(crafts)

                    let isCraft = false

                    if (crafts.length !== 0) {
                        isCraft = true
                    }

                    if (crafts) {
                        crafts.forEach(craft => {
                            const craftingRequest = {
                                userId: craft.id,
                                shipType: craft.ship_name,
                                craftNumber: craft.craft_number,
                                characterId: craft.character_id,
                                completionTime: craft.completion_time,
                            };
                            craftingRequests.push(craftingRequest);
                        })
                    }

                    const max_ships = await db.getCharacteristicsBis(characterId, 5)

                    //Getting the ships the player have access to
                    //That's ugly need to change it for the bis
                    db.getCharacteristics(userId, buildingId, async (err, characteristics) => {
                        if (err) {
                            console.log("Error getCharacterBuildingInfo : can't get building characteristics")
                        }

                        //console.log(characteristics)
                        const unlocked_ships = characteristics.unlocked_ships

                        if (unlocked_ships !== "Nothing") {
                            const ships = unlocked_ships.split(', ')
                            //console.log(ships)
                            let unit_characteristics = [];

                            await Promise.all(
                                ships.map(async (element, index, arr) => {
                                    const ship = await db.getUnitsCharacteristics(element);
                                    unit_characteristics.push(ship);
                                })
                            );
                            unit_characteristics.sort((a, b) => a.print_order - b.print_order);
                            //console.log(unit_characteristics)

                            let units_costs = []

                            await Promise.all(
                                ships.map(async (element, index, arr) => {
                                    const ship = await db.getUnitsCosts(element);
                                    units_costs.push(ship);
                                })
                            );

                            units_costs.sort((a, b) => a.print_order - b.print_order);
                            //console.log(units_costs)

                            //Getting craft timer is there are
                            const crafts = await db.getCraftFromCharacter(characterId)
                            const nb_ships = await db.getUnitsNumber(characterId)

                            res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
                                title: title,
                                flash: flashMessages,
                                index: index,
                                resources: resources,
                                ships: unit_characteristics,
                                costs: units_costs,
                                population: totalPopulation,
                                crafts: crafts,
                                nbShips: nb_ships,
                                maxShips: max_ships.ship_capacity,
                                isCraft: isCraft,
                                showMenuBar: true
                            });
                        } else {
                            res.render(`../views/pages/planet/buildings/building-${index}.pug`, {
                                title: title,
                                flash: flashMessages,
                                index: index,
                                resources: resources,
                                ship: null,
                                population: totalPopulation,
                                isCraft: isCraft,
                                showMenuBar: true
                            });
                        }

                    })

                }

            }
        })
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

});

// POST route to handle form submission and redirect to building page
router.post('/building-page', requireAuth, (req, res) => {
    // Parse the index from the form submission
    const index = parseInt(req.body.index);

    // Redirect to the corresponding building page using the GET route
    res.redirect(`/building-page/${index}`);
});

router.post('/sell', requireAuth, async (req, res) => {
    const formData = req.body

    const allIntegers = Object.values(formData).every(value => Number.isInteger(parseInt(value, 10)));

    if (allIntegers) {

        const characterId = req.session.characterId
        let hasNotEnoughResource = false

        const characterResources = await db.getResourcesForCharacterBis(characterId)

        const resources = ["iron", "steel", "copper", "components", "petrol", "plastic", "crystal"]
        let money = 0

        //Getting the amount of money and deleting resources
        for (let index = 0; index < formData.commercialArea.length; index++) {
            const value = formData.commercialArea[index];
            const resource = resources[index]

            if (characterResources[resource] >= value) {
                const {price} = await db.getSellingPrice(resources[index]);
                money = money + value * price

                await db.subtractResourceInDatabase(resources[index], value, characterId)
            } else {
                hasNotEnoughResource = true
            }
        }

        await db.updateResourceInDatabase("money", money, characterId)

        if (hasNotEnoughResource) {
            req.flash('error', `Insufficient for selling`)
        } else {
            req.flash('success', `Resources sell for ${money} SpaceMoney`)
        }
    }
    else {
        req.flash('error', 'Value is not int');
    }

    res.redirect('/building-page/3')

})
router.post('/crafting', requireAuth, async (req, res) => {
    const formData = req.body
    const characterId = req.session.characterId

    const costsObject = JSON.parse(formData.costs);
    const craftNumber = JSON.parse(formData.craftArea)

    const characteristics = await db.getCharacteristicsBis(characterId, 5)
    if (characteristics !== null) {
        //console.log(characteristics)

        //Calcul ship number
        const nb_ships = await db.getCharacterUnitsNumber(characterId)

        //Can craft
        if (nb_ships.ship_number + craftNumber <= characteristics.ship_capacity) {
            // Access individual properties
            const name = costsObject.name;
            const steel = parseInt(costsObject.steel, 10) * craftNumber;
            const components = parseInt(costsObject.components, 10) * craftNumber;
            const plastic = parseInt(costsObject.plastic, 10) * craftNumber;
            const money = parseInt(costsObject.money, 10) * craftNumber;
            const population = parseInt(costsObject.population, 10) * craftNumber;

            const resources = await db.getResourcesForCharacterBis(characterId)
            const totalPopulation = await db.getCharacterPopulationBis(characterId)

            //console.log("pop", totalPopulation)

            //Enough resources
            if (resources.steel >= steel && resources.components >= components && resources.plastic >= plastic && resources.money >= money) {
                const {free_pop} = totalPopulation.free_pop

                //Enough freePop
                if (free_pop >= population) {

                    //Deleting resources
                    await db.subtractResourceInDatabase("steel", steel, characterId)
                    await db.subtractResourceInDatabase("components", components, characterId)
                    await db.subtractResourceInDatabase("plastic", plastic, characterId)
                    await db.subtractResourceInDatabase("money", money, characterId)

                    await db.subtractPop("free_pop", characterId, population)

                    //Getting ending date
                    const unitsCharacteristics = await db.getUnitsCharacteristics(name)

                    const craftingTime = unitsCharacteristics.crafting_time
                    const time = parseInt(craftingTime.replace(" ", "")) * craftNumber

                    const craftingRequest = {
                        userId: req.session.userId,
                        shipType: name,
                        craftNumber: craftNumber,
                        characterId: characterId,
                        completionTime: Date.now() + time,
                    };

                    await db.addCraftToCharacter(characterId, name, craftNumber, Date.now() + time)

                    req.flash('success', "Construction began")
                    craftingRequests.push(craftingRequest);
                }
                //Not enough freePop so going with workerPop
                else if (totalPopulation.worker_pop >= population) {
                    //Deleting resources
                    await db.subtractResourceInDatabase("steel", steel, characterId)
                    await db.subtractResourceInDatabase("components", components, characterId)
                    await db.subtractResourceInDatabase("plastic", plastic, characterId)
                    await db.subtractResourceInDatabase("money", money, characterId)

                    await db.subtractPop("worker_pop", characterId, population)

                    //Getting ending date
                    const unitsCharacteristics = await db.getUnitsCharacteristics(name)

                    const craftingTime = unitsCharacteristics.crafting_time
                    const time = parseInt(craftingTime.replace(" ", "")) * craftNumber

                    const craftingRequest = {
                        userId: req.session.userId,
                        shipType: name,
                        craftNumber: craftNumber,
                        characterId: characterId,
                        completionTime: Date.now() + time,
                    };

                    await db.addCraftToCharacter(characterId, name, craftNumber, Date.now() + time)

                    req.flash('success', "Construction began")
                    craftingRequests.push(craftingRequest);
                }
                //Not enough population
                else {
                    req.flash('error', `Insufficient population`)
                }

            }
            //Not enough resources
            else{
                req.flash('error', `Insufficient resources`)
            }
        }
        //Cannot
        else {
            req.flash('error', "Not enough place in the Space Hangar")
        }
    }

    res.redirect('building-page/5')
})

const completedRequests = new Set();

//Interval for crafts timer
setInterval(async () => {
    const currentTime = Date.now();

    for (const request of craftingRequests) {
        const requestIdentifier = `${request.shipType}-${request.characterId}`;

        if (currentTime >= request.completionTime && !completedRequests.has(requestIdentifier)) {
            // Craft the ship and update user's inventory
            const message = await db.addUnit(transformToUnderscoreCase(request.shipType), request.craftNumber, request.characterId);

            // Add the request identifier to the Set of completed requests
            completedRequests.add(requestIdentifier);

            // Remove the crafting request
            const index = craftingRequests.indexOf(request);
            craftingRequests.splice(index, 1);
            await db.deleteCraftFromCharacter(request.characterId, request.shipType);
        }
    }
}, 1000);

module.exports = router;