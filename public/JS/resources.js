async function updateResources(){
    try {
        const response = await fetch('/api/resources');
        const data = await response.json();

        document.getElementById('iron').textContent = data.iron;
        document.getElementById('steel').textContent = data.steel;
        document.getElementById('copper').textContent = data.copper;
        document.getElementById('components').textContent = data.components;
        document.getElementById('petrol').textContent = data.petrol;
        document.getElementById('plastic').textContent = data.plastic;
        document.getElementById('money').textContent = data.money;
        document.getElementById('crystal').textContent = data.crystal;

    } catch (err) {
        console.error('Error fetching resource data:', err);
    }
}

setInterval(updateResources, 1000);