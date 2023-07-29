const circleContainer = document.querySelector('.circle-container');
const circleItems = document.querySelectorAll('.circle-item');

const centerX = circleContainer.offsetWidth / 2;
const centerY = circleContainer.offsetHeight / 2;
const radius = 250; // Adjust the radius as needed

const totalItems = circleItems.length;
const angleIncrement = (2 * Math.PI) / totalItems;

circleItems.forEach((item, index) => {
    const angle = angleIncrement * index;
    const x = centerX + radius * Math.cos(angle) - item.offsetWidth / 2; // Adjust for item width
    const y = centerY + radius * Math.sin(angle) - item.offsetHeight / 2; // Adjust for item height
    item.style.left = x + 'px';
    item.style.top = y + 'px';

});

