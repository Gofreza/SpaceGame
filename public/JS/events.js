// Script.js
document.addEventListener('DOMContentLoaded', () => {

    const maxEvents = 5; // Maximum number of events on the map
    const eventRate = 2500; // Rate at which events appear (in milliseconds)
    const eventDuration = 25000; // Duration of each event (in milliseconds)
    const eventQueue = []; // Queue to manage events
    let intervalId = null; // Variable to store the interval ID
    let timeoutId = null; // Variable to store the timeout ID
    let combatInterval = null;

    if (fights) {
        if (fights.completion_time > Date.now()){
            startTimer(fights.completion_time)
        }
        else if (fighs.return_time > Date.now()) {
            startTimer(fights.return_time)
        }
    }

    // Add a beforeunload event listener to stop processes when the page is exited
    window.addEventListener('beforeunload', () => {
        // Stop the event creation interval
        clearInterval(intervalId);

        // Stop the combat interval (if it's running)
        clearInterval(combatInterval);

        // Clear any remaining timeouts
        clearTimeout(timeoutId);
    });

    // Define minimum X and Y coordinates
    const minX = 50; // Minimum X coordinate
    const minY = 50; // Minimum Y coordinate

    const ship = document.createElement('div');
    ship.className = 'ship';
    document.querySelector('.map-container').appendChild(ship);
    const center = document.querySelector('.ship')

    const centerY = center.offsetTop
    const centerX = center.offsetLeft

    let isCreatingEvent = false;

    // Function to create a new event with random position and info
    async function createEvent() {

        if (isCreatingEvent) {
            return Promise.resolve({ status: 200, message: 'Event being created.' });
        }

        if (eventQueue.length < maxEvents) {
            isCreatingEvent = true;
            const event = document.createElement('div');
            event.className = 'event';

            // Generate a unique ID for the event
            const eventId = `event-${Date.now()}`;
            event.id = eventId;

            // Calculate random X and Y coordinates within the specified range
            const maxX = document.querySelector('.map-container').offsetWidth - (event.offsetWidth + 50);
            const maxY = document.querySelector('.map-container').offsetHeight - (event.offsetHeight + 50);
            const randomX = minX + Math.random() * (maxX - minX);
            const randomY = minY + Math.random() * (maxY - minY);

            // Apply the random coordinates to the event's style
            event.style.left = randomX + 'px';
            event.style.top = randomY + 'px';

            //Get an event
            const response = await fetch('/api/events');
            const data = await response.json();
            //console.log(data)
            //console.log(data)
            let event_info = [data[0].id, data[0].difficulty, data]
            current_events.push(event_info);
            const eventCreationTime = Date.now()

            // Add a click event listener to the event
            event.addEventListener('click', () => {
                //console.log(`Event clicked with ID: ${eventId}`);
                // You can add custom logic here to handle the click event.

                // Stop the interval
                clearInterval(intervalId);

                //Remaining timeout time
                const remainingTime = eventDuration - (Date.now() - eventCreationTime);

                // Clear the timeout
                clearTimeout(timeoutId);

                // Create and display the info page
                const infoPage = document.createElement('div');
                infoPage.className = 'info-box';
                infoPage.style.display = 'block'
                infoPage.innerHTML = `<div class="info-content"> <h2>${data[0].name}</h2><p>${data[0].description}</p> <p>Difficulty : ${data[0].difficulty}</p> </div>`;

                document.body.appendChild(infoPage);

                //Add button to send for the mission
                //Maybe add reconnaissance button to show the number of units
                const attackButton = document.createElement('button');
                attackButton.textContent = 'Attack';
                attackButton.addEventListener('click', async () => {
                    const response = await fetch(`/sendfleet/${centerX}/${centerY}/${randomX}/${randomY}/${event_info}`);
                    const completionTime = await response.json();
                    //console.log("data:",completionTime)

                    startEventCreation();

                    const eventIndex = eventQueue.indexOf(event);
                    eventQueue.splice(eventIndex, 1);
                    const apiUrl = `/api/delevent/${data[0].id}/${data[0].difficulty}`
                    fetch(apiUrl)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json(); // Parse the response body as JSON
                        })
                        .catch(error => {
                            // Handle errors
                            console.error('Error:', error);
                        });

                    event.remove();
                    infoPage.remove();

                    startTimer(completionTime)
                })

                infoPage.appendChild(attackButton);

                // Add a close button to the info page
                const closeButton = document.createElement('button');
                closeButton.textContent = 'Close';
                closeButton.addEventListener('click', () => {

                    startEventCreation();

                    // Set a timeout to remove the event after the specified duration
                    timeoutId = setTimeout(() => {
                        event.remove();
                        // Remove the event from the queue
                        const eventIndex = eventQueue.indexOf(event);
                        if (eventIndex !== -1) {
                            eventQueue.splice(eventIndex, 1);
                        }
                        //console.log("timeout:", data[0].id,data[0].difficulty)
                        const apiUrl = `/api/delevent/${data[0].id}/${data[0].difficulty}`
                        fetch(apiUrl)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok');
                                }
                                return response.json(); // Parse the response body as JSON
                            })
                            .catch(error => {
                                // Handle errors
                                console.error('Error:', error);
                            });
                    }, remainingTime);

                    infoPage.remove();
                });

                infoPage.appendChild(closeButton);

            });

            // Append the event to the map container
            document.querySelector('.map-container').appendChild(event);

            // Set a timeout to remove the event after the specified duration
            timeoutId = setTimeout(() => {
                event.remove();
                // Remove the event from the queue
                const eventIndex = eventQueue.indexOf(event);
                if (eventIndex !== -1) {
                    eventQueue.splice(eventIndex, 1);
                }
                console.log("event:", data[0].id,data[0].difficulty)
                const apiUrl = `/api/delevent/${data[0].id}/${data[0].difficulty}`
                fetch(apiUrl)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json(); // Parse the response body as JSON
                    })
                    .then(data => {
                        // Handle the response data here
                        //console.log('Response data:', data);
                    })
                    .catch(error => {
                        // Handle errors
                        console.error('Error star_map:', error);
                    });
            }, eventDuration);

            // Add the event to the queue
            eventQueue.push(event);

            isCreatingEvent = false;

            return Promise.resolve({ status: 200, message: 'Event created successfully' });
        }

        return Promise.resolve({ status: 200, message: 'EventQueue is full' });

    }

    // Function to start creating events
    function startEventCreation() {
        intervalId = setInterval(async () => {
            console.log(isCreatingEvent)
            await createEvent()
                .then(response => {
                    if (response.status === 200) {
                        console.log(response.message); // Log the success message
                    } else {
                        console.error('Error:', response.message); // Log an error message  P
                    }
                });
        }, eventRate);
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    function startTimer(completionTime) {
        const timerElement = document.getElementById('timer');
        // Calculate the time remaining until completionTime
        const now = new Date().getTime();
        let timeRemainingInSeconds = Math.max(0, Math.floor((completionTime - now) / 1000));
        console.log(timeRemainingInSeconds)
        // Update the timer every second
        combatInterval = setInterval(() => {
            if (timeRemainingInSeconds <= 0) {
                clearInterval(combatInterval);
                timerElement.textContent = '00:00'; // Timer expired
                location.reload();
            } else {
                timerElement.textContent = formatTime(timeRemainingInSeconds);
                timeRemainingInSeconds--;
            }
        }, 1000);
    }

    // Start creating events
    startEventCreation();

});
