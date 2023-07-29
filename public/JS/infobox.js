let show_limit = 0;

function showInfo(index) {
    if(show_limit === 0){
        const infoBox = document.getElementById(`info-${index}`);
        infoBox.style.display = "block";
        show_limit += 1;
    }

}

function hideInfo(index) {
    const infoBox = document.getElementById(`info-${index}`);
    infoBox.style.display = "none";
    show_limit -= 1;
}

document.querySelectorAll('.level-up-button').forEach((button) => {
    button.addEventListener('click', () => {
        const index = button.dataset.index; // Get the index from the data-index attribute
        const type = button.dataset.type;

        // Send a POST request to the server-side function with the index as JSON data
        fetch(`/level-up-building/${type}/${index}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.reloadPage) {
                    window.location.reload(); // Reload the page
                } else {
                    // Handle other responses from the server, if needed
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
    });
});