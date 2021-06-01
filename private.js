function initialize() {
    // for single class election
    State.candidates = [[]];
    State.categories = ["Class representative"];
    State.choices = [1];
}

function flipCoin() {
    let result = document.getElementById("coinflip-result");
    let randFloat = Math.random();
    if (randFloat >= 0.5) {
        result.innerText = "Head";
    } else {
        result.innerText = "Tails";
    }
}

function fourthYearChoice(input) {
    if (input.checked) {
        State.choices = [2];
    } else {
        State.choices = [1];
    }
}

initialize();
