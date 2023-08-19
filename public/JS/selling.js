// Direct resources check

let ironTextArea = document.getElementById('quantityIron')
let steelTextArea = document.getElementById('quantitySteel')
let copperTextArea = document.getElementById('quantityCopper')
let componentsTextArea = document.getElementById('quantityComponents')
let petrolTextArea = document.getElementById('quantityPetrol')
let plasticTextArea = document.getElementById('quantityPlastic')
let crystalTextArea = document.getElementById('quantityCrystal')

const ironCharacterResource = document.getElementById('iron').textContent
const steelCharacterResource = document.getElementById('steel').textContent
const copperCharacterResource = document.getElementById('copper').textContent
const componentsCharacterResource = document.getElementById('components').textContent
const petrolCharacterResource = document.getElementById('petrol').textContent
const plasticCharacterResource = document.getElementById('plastic').textContent
const crystalCharacterResource = document.getElementById('crystal').textContent

ironTextArea.addEventListener('focusout', () => {
    const newQuantity = parseInt(ironTextArea.value, 10);
    if (newQuantity > ironCharacterResource) {
        ironTextArea.value = ironCharacterResource
    }
})

steelTextArea.addEventListener('focusout', () => {
    const newQuantity = parseInt(steelTextArea.value, 10);
    if (newQuantity > steelCharacterResource) {
        steelTextArea.value = steelCharacterResource
    }
})

copperTextArea.addEventListener('focusout', () => {
    const newQuantity = parseInt(copperTextArea.value, 10);
    if (newQuantity > copperCharacterResource) {
        copperTextArea.value = copperCharacterResource
    }
})

componentsTextArea.addEventListener('focusout', () => {
    const newQuantity = parseInt(componentsTextArea.value, 10);
    if (newQuantity > componentsCharacterResource) {
        componentsTextArea.value = componentsCharacterResource
    }
})

petrolTextArea.addEventListener('focusout', () => {
    const newQuantity = parseInt(petrolTextArea.value, 10);
    if (newQuantity > petrolCharacterResource) {
        petrolTextArea.value = petrolCharacterResource
    }
})

plasticTextArea.addEventListener('focusout', () => {
    const newQuantity = parseInt(plasticTextArea.value, 10);
    if (newQuantity > plasticCharacterResource) {
        plasticTextArea.value = plasticCharacterResource
    }
})

crystalTextArea.addEventListener('focusout', () => {
    const newQuantity = parseInt(crystalTextArea.value, 10);
    if (newQuantity > crystalCharacterResource) {
        crystalTextArea.value = crystalCharacterResource
    }
})

// Buttons

const ironPlus = document.getElementById('buttonPlusIron')
const ironMinus = document.getElementById('buttonMinusIron')
const steelPlus = document.getElementById('buttonPlusSteel')
const steelMinus = document.getElementById('buttonMinusSteel')
const copperPlus = document.getElementById('buttonPlusCopper')
const copperMinus = document.getElementById('buttonMinusCopper')
const componentsPlus = document.getElementById('buttonPlusComponents')
const componentsMinus = document.getElementById('buttonMinusComponents')
const petrolPlus = document.getElementById('buttonPlusPetrol')
const petrolMinus = document.getElementById('buttonMinusPetrol')
const plasticPlus = document.getElementById('buttonPlusPlastic')
const plasticMinus = document.getElementById('buttonMinusPlastic')
const crystalPlus = document.getElementById('buttonPlusCrystal')
const crystalMinus = document.getElementById('buttonMinusCrystal')

function handleResourceButtonClick(resourceTextArea, operation, characterResource) {
    const currentValue = parseInt(resourceTextArea.value, 10);
    const maxValue = characterResource

    let newValue;
    if (operation === 'plus') {
        newValue = currentValue + 1;
    } else {
        newValue = currentValue - 1;
        if (newValue < 0) {
            newValue = 0; // Prevent negative values
        }
    }

    if (newValue > maxValue) {
        newValue = maxValue; // Prevent exceeding maximum value
    }

    resourceTextArea.value = newValue.toString();
}

const resourceButtons = [
    { button: ironPlus, textArea: ironTextArea, characterResource: ironCharacterResource },
    { button: ironMinus, textArea: ironTextArea, characterResource: ironCharacterResource },
    { button: steelPlus, textArea: steelTextArea, characterResource: steelCharacterResource },
    { button: steelMinus, textArea: steelTextArea, characterResource: steelCharacterResource },
    { button: copperPlus, textArea: copperTextArea, characterResource: copperCharacterResource },
    { button: copperMinus, textArea: copperTextArea, characterResource: copperCharacterResource },
    { button: componentsPlus, textArea: componentsTextArea, characterResource: componentsCharacterResource },
    { button: componentsMinus, textArea: componentsTextArea, characterResource: componentsCharacterResource },
    { button: petrolPlus, textArea: petrolTextArea, characterResource: petrolCharacterResource },
    { button: petrolMinus, textArea: petrolTextArea, characterResource: petrolCharacterResource },
    { button: plasticPlus, textArea: plasticTextArea, characterResource: plasticCharacterResource },
    { button: plasticMinus, textArea: plasticTextArea, characterResource: plasticCharacterResource },
    { button: crystalPlus, textArea: crystalTextArea, characterResource: crystalCharacterResource },
    { button: crystalMinus, textArea: crystalTextArea, characterResource: crystalCharacterResource }
];

resourceButtons.forEach(({ button, textArea, characterResource }) => {
    const operation = button.id.includes('Plus') ? 'plus' : 'minus';
    button.addEventListener('click', () => handleResourceButtonClick(textArea, operation, characterResource));
});