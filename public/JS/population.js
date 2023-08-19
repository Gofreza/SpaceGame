async function updatePopulation(){
    try {
        const response = await fetch('/api/population');
        const data = await response.json();

        document.getElementById('currentPop').textContent = data.current_pop.current_pop;
        document.getElementById('workerPop').textContent = data.worker_pop.worker_pop;
        document.getElementById('freePop').textContent = data.free_pop.free_pop;

    } catch (err) {
        console.error('Error fetching population data:', err);
    }
}

setInterval(updatePopulation, 1000);