var State = {};
function emptyToken() {
    // remove already genearated token when state changes
    document.getElementById("token").innerHTML = "";
    document.getElementById("clipboard-status").innerHTML = "";
}

function showCandidateList(list, candidates, param) {
    list.innerHTML = "";
    console.log(list);
    for (var i = 0; i < candidates.length; i++) {
        var name = candidates[i];
        list.innerHTML += `<li>${name} <button onclick="selectCandidate('${name}', ${param})"> Select </button>`;
    }
}

function parsePassedData() {
    // parses the data passed through URL. extracts public key and candidates list
    var urlParams = new URLSearchParams(window.location.search);
    var data = JSON.parse(decodeURI(urlParams.get("data")));

    State.publicKey = data.publicKey;
    State.candidates = data.candidates;
    State.fourthYear = data.fourthYear;

    var list = document.getElementById("candidates-list");
    showCandidateList(list, State.candidates, 0);

    if (State.fourthYear) {
        // show second candidate list
        var list = document.getElementById("candidates-list2");
        document.getElementById("s3-candidate2").hidden = false;
        showCandidateList(list, State.candidates, 1);
    }

    // voters may forget to generate keyword
    generateKeyword();
}

function selectCandidate(name, order) {
    if (order == 0) {
        document.getElementById("selected-candidate").innerHTML = name;
    } else if (order == 1) {
        document.getElementById("selected-candidate2").innerHTML = name;
    }
    emptyToken();
}

function randomWord() {
    var randInt = Math.floor(Math.random() * (wordList.length - 1));
    return wordList[randInt];
}

function generateKeyword() {
    var keyword = document.getElementById("keyword");
    keyword.innerText = randomWord() + "-" + randomWord() + "-" + randomWord();
    emptyToken();
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

function showError(string) {
    var token = document.getElementById("token");
    token.innerText = string;
    token.setAttribute("style", "color:red");
}

function generateToken() {
    var keyword = document.getElementById("keyword").innerText;
    var candidate1 = document.getElementById("selected-candidate").innerText;
    if (candidate1 == "" || keyword == "") {
        showError("Make sure to select a candidate");
        return;
    }
    var selection;
    if (!State.fourthYear) {
        selection = candidate1;
    } else {
        var candidate2 = document.getElementById("selected-candidate2")
            .innerText;
        if (candidate2 == "") {
            showError("Select second candidate");
            return;
        } else if (candidate1 != candidate2) {
            selection = [candidate1, candidate2];
        } else {
            showError("Select different candidates");
            return;
        }
    }

    var random = randomPassword();

    var tokenData = JSON.stringify([keyword, selection, random]);

    var rsa = new RSAKey();
    rsa.setPublic(State.publicKey.n, State.publicKey.e);

    var token = rsa.encrypt(tokenData);
    var tokenElement = document.getElementById("token");
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

    // var inputField = document.getElementById("hidden-token");
    // inputField.value = token;
    // inputField.select();
    // document.execCommand("copy");
}
