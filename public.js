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
        list.innerHTML += `<li>${name} <button onclick="selectCandidate('${name}', ${param})"> Select </button>`;
    }
}

function parsePassedData() {
    // parses the data passed through URL. extracts public key and candidates list
    let urlParams = new URLSearchParams(window.location.search);
    let data = JSON.parse(decodeURI(urlParams.get("data")));

    State.publicKey = data.publicKey;
    State.candidates = data.candidates;
    State.fourthYear = data.fourthYear;

    let list = document.getElementById("candidates-list");
    showCandidateList(list, State.candidates, 0);

    if (State.fourthYear) {
        // show second candidate list
        let list = document.getElementById("candidates-list2");
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
    let candidate1 = document.getElementById("selected-candidate").innerText;
    if (candidate1 == "" || keyword == "") {
        showError("Make sure to select a candidate");
        return;
    }
    let selection;
    if (!State.fourthYear) {
        selection = candidate1;
    } else {
        let candidate2 = document.getElementById("selected-candidate2")
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

    let random = randomPassword();

    let tokenData = JSON.stringify([keyword, selection, random]);

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
