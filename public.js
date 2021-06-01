let State = {};
function emptyToken() {
    // remove already genearated token when state changes
    document.getElementById("token").innerHTML = "";
    document.getElementById("clipboard-status").innerHTML = "";
}

function showCandidateList(list, candidates, param) {
    list.innerHTML = "";
    console.log(list);
    for (let i = 0; i < candidates.length; i++) {
        let name = candidates[i];
        list.innerHTML += `<li>${name} <input type="checkbox" onclick="selectCandidate(this, '${name}', ${param}, ${i})"></li>`;
    }
}

function parsePassedData() {
    // parses the data passed through URL. extracts public key and candidates list
    let urlParams = new URLSearchParams(window.location.search);
    let data = JSON.parse(decodeURI(urlParams.get("data")));

    State.publicKey = data.publicKey;
    State.candidates = data.candidates;
    State.categories = data.categories;
    State.choices = data.choices;
    State.selections = State.categories.map(c => {
        return [];
    });

    let n = 0;
    State.candidates.map(c => {
        let id = "candidates-list-" + n;
        document.getElementById(
            "candidates-list",
        ).innerHTML += `<h3> ${State.categories[n]} (Select ${State.choices[n]}) </h3> <ol id="${id}"> </ol>`;
        let list = document.getElementById(id);
        showCandidateList(list, c, n);
        n++;
    });

    // voters may forget to generate keyword
    generateKeyword();
}

function selectCandidate(target, name, category, n) {
    let previous = State.selections;
    if (target.checked) {
        if (State.selections[category].length >= State.choices[category]) {
            target.checked = false;
            return;
        }
        State.selections[category].push(name);
    } else {
        let index = State.selections[category].indexOf(name);
        State.selections[category].splice(index, 1);
    }
    emptyToken();
}

function randomWord() {
    let randInt = Math.floor(Math.random() * (wordList.length - 1));
    return wordList[randInt];
}

function generateKeyword() {
    let keyword = document.getElementById("keyword");
    keyword.innerText = randomWord() + "-" + randomWord() + "-" + randomWord();
    emptyToken();
}

function randomPassword() {
    const chars =
        "!@#$%^&*()_-+=?/.,<>0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let password = "";
    for (let i = 0; i < 16; i++) {
        let randInt = Math.floor(Math.random() * chars.length);
        password += chars[randInt];
    }
    return password;
}

function showError(string) {
    let token = document.getElementById("token");
    token.innerText = string;
    token.setAttribute("style", "color:red");
}

function generateToken() {
    let keyword = document.getElementById("keyword").innerText;

    for (let n = 0; n < State.categories.length; n++) {
        let selection = State.selections[n];
        let category = State.categories[n];
        let nChoices = State.choices[n];

        if (selection.length != nChoices) {
            showError(`Number of choices for ${category} invalid`);
            return;
        }
    }

    let random = randomPassword();

    let tokenData = JSON.stringify([keyword, State.selections, random]);

    let rsa = new RSAKey();
    rsa.setPublic(State.publicKey.n, State.publicKey.e);

    let token = rsa.encrypt(tokenData);
    let tokenElement = document.getElementById("token");
    tokenElement.innerHTML = token;
    tokenElement.setAttribute("style", "color:black");
    navigator.clipboard.writeText(token).then(
        function() {
            document.getElementById("clipboard-status").innerText =
                "Token copied to clipboard";
        },
        function() {
            document.getElementById("clipboard-status").innerText =
                "Please copy the token";
        },
    );

    // let inputField = document.getElementById("hidden-token");
    // inputField.value = token;
    // inputField.select();
    // document.execCommand("copy");
}
