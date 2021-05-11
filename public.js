var State = {};

function parsePassedData() {
    // parses the data passed through URL. extracts public key and candidates list
    var urlParams = new URLSearchParams(window.location.search);
    var data = JSON.parse(decodeURI(urlParams.get("data")));

    console.log(data);
    State.publicKey = data.publicKey;
    State.candidates = data.candidates;

    var list = document.getElementById("candidates-list");
    list.innerHTML = "";
    for (var i = 0; i < data.candidates.length; i++) {
        var name = data.candidates[i];
        list.innerHTML += `<li>${name} <button onclick="selectCandidate('${name}')"> Select </button>`;
    }
    return data;
}

function selectCandidate(name) {
    document.getElementById("selected-candidate").innerHTML = name;
}

function randomWord() {
    var randInt = Math.floor(Math.random() * (wordList.length - 1));
    return wordList[randInt];
}

function generateKeyword() {
    var keyword = document.getElementById("keyword");
    keyword.value = randomWord() + "-" + randomWord() + "-" + randomWord();
}

function randomPassword() {
    const chars =
        "!@#$%^&*()_-+=?/.,<>0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var password = "";
    for (var i = 0; i < 16; i++) {
        var randInt = Math.floor(Math.random() * chars.length);
        password += chars[randInt];
    }
    return password;
}

function generateToken() {
    var keyword = document.getElementById("keyword").value;
    var candidate = document.getElementById("selected-candidate").innerText;
    if (candidate === "") {
        return;
    }

    var random = randomPassword();

    var tokenData = JSON.stringify([keyword, candidate, random]);

    var rsa = new RSAKey();
    rsa.setPublic(State.publicKey.n, State.publicKey.e);

    var token = rsa.encrypt(tokenData);
    console.log(token);

    document.getElementById("token").innerHTML = token;
}
