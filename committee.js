const State = {candidates: [], categories: [], choices: []};

function clearLink() {
    document.getElementById("public-link").innerHTML = "";
    document.getElementById("public-link-clipboard-status").innerHTML = "";
    document.getElementById("tokens-list").innerHTML = "";
}

function generateKeys() {
    let rsa = new RSAKey();
    let e = "65537";
    rsa.generate(1024, e);
    let public = {n: linebrk(rsa.n.toString(16), 64), e: e};
    document.getElementById("public-key").innerHTML = public.n;
    State.publicKey = public;
    State.rsa = rsa;
    clearLink();
}

function validCandidate(candidate, n) {
    return State.candidates[n].indexOf(candidate) != -1;
}

function onlyOnce(item, list) {
    // checks if item appears multiple times in the list
    return list.indexOf(item) == list.lastIndexOf(item);
}

function isValidToken(token) {
    if (token == null) {
        return false;
    }
    let selections = token[1];
    for (let n = 0; n < State.categories.length; n++) {
        let selection = selections[n];
        if (selection.length != State.choices[n]) {
            console.log("length mismatch");
            return false;
        }
        for (let j = 0; j < selection.length; j++) {
            let c = selection[j];
            if (!validCandidate(c, n)) {
                console.log("invalid candidate " + c + "," + n);
            } else if (!onlyOnce(c, selection)) {
                console.log("duplicated " + c);
            }
            if (!validCandidate(c, n) || !onlyOnce(c, selection)) return false;
        }
    }
    return true;
}

function decrypt(tokenString) {
    let decryptedToken = JSON.parse(State.rsa.decrypt(tokenString));
    if (isValidToken(decryptedToken)) {
        return decryptedToken;
    } else {
        return null;
    }
}

function addCandidate(categoryNumber) {
    let name = document.getElementById("candidate-name-" + categoryNumber);
    let value = name.value.replaceAll("'", "").replaceAll('"', "");
    let list = document.getElementById("candidates" + categoryNumber);
    list.innerHTML += "<li>" + value + "</li>";

    State.candidates[categoryNumber].push(value);
    name.value = "";
    clearLink();
}

function addCategory() {
    let name = document.getElementById("category-name");
    let value = name.value.replaceAll("'", "").replaceAll('"', "");
    let choose2 = document.getElementById("choose-two-candidates").checked;
    let categories = document.getElementById("categories");

    let n = State.categories.length;
    let id = "candidates" + n;
    let inputId = "candidate-name-" + n;

    categories.innerHTML += `<br/> <h3>${value}</h3> <div id="${id}"> </div> <input type="text" id="${inputId}" /> <button onclick="addCandidate(${n})"> Add Candidate </button> <br/>`;
    State.categories.push(value);
    State.candidates.push([]);
    State.choices.push(choose2 ? 2 : 1);

    name.value = "";
    clearLink();
}

function generateLink() {
    // generate link to distribute. contains candidate list and public key.
    if (State.publicKey == null) {
        document.getElementById("public-link").innerText =
            "Generate keys first!";
        return;
    }

    let publicData = {
        publicKey: State.publicKey,
        candidates: State.candidates,
        choices: State.choices,
        categories: State.categories,
    };

    let link = "./public.html?data=" + encodeURI(JSON.stringify(publicData));
    document.getElementById("public-link").innerHTML =
        '<a target="_blank" href="' + link + '"> Link for voting </a>';
    navigator.clipboard.writeText(new URL(link, window.location).href).then(
        function() {
            document.getElementById("public-link-clipboard-status").innerText =
                "Link copied to clipboard";
        },
        function() {
            document.getElementById("public-link-clipboard-status").innerText =
                "Please copy the token";
        },
    );
}

function addToken() {
    // add a token to tokens list, and increment roll number
    let roll = document.getElementById("roll-number");
    let token = document.getElementById("token");
    let list = document.getElementById("tokens-list");

    let count = list.children.length;
    let id = "token" + count;
    let style = "style='color:black'";
    if (decrypt(token.value) == null) {
        style = "style='color:red'";
    }
    list.innerHTML += `<div ${style} token="${token.value}" id="${id}"><br/> ${roll.value} : ${token.value} <button onClick="removeToken('${id}')"> Remove </button><div/>`;

    roll.value = (parseInt(roll.value) + 1).toString();
    token.value = "";
}

function removeToken(id) {
    //removes a token from tokens list
    document.getElementById(id).remove();
}

function shuffle(array) {
    if (array == null) return array;
    // Fisher-Yates Shuffle; from https://github.com/Daplie/knuth-shuffle/blob/master/index.js
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;

    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function checkTokenInput() {
    let element = document.getElementById("token");
    let token = element.value;
    if (State.rsa == null) {
        document.getElementById("token").value = "Generate Keys First!!";
        return;
    }
    if (decrypt(token) == null) {
        element.setAttribute("style", "color:red");
    } else {
        element.setAttribute("style", "color:black");
    }
}

function decryptTokens() {
    // decrypt all tokens. show invalid tokens in red and return decrypted tokens
    // only when all tokens are valid
    let decrypted = [];
    let list = document.getElementById("tokens-list");
    for (let i = 0; i < list.children.length; i++) {
        let token = list.children[i].getAttribute("token");
        let decryptedToken = decrypt(token);
        if (decryptedToken == null) {
            list.children[i].setAttribute("style", "color:red");
            decrypted = null;
            break;
        } else {
            decrypted.push(decryptedToken);
        }
    }
    State.tokens = shuffle(decrypted);
    return State.tokens;
}

function arrayOfEmpty(length) {
    let a = Array();
    a.length = length;
    for (let i = 0; i < length; i++) {
        a[i] = [];
    }
    return a;
}

function countVotes() {
    let candidates = State.candidates;
    let tokens = decryptTokens();
    let votes = candidates.map(c => arrayOfEmpty(c.length));

    for (let i = 0; i < tokens.length; i++) {
        let keyword = tokens[i][0];
        let selection = tokens[i][1];

        for (let n = 0; n < State.categories.length; n++) {
            for (let j = 0; j < selection[n].length; j++) {
                let candidateIndex = candidates[n].indexOf(selection[n][j]);
                console.log([n, j, selection[n][j], candidateIndex]);
                votes[n][candidateIndex].push(keyword);
            }
        }
    }

    let rows = "";
    let titleRow = "<tr>";
    for (let n = 0; n < candidates.length; n++) {
        for (let j = 0; j < candidates[n].length; j++) {
            titleRow += `<th> ${candidates[n][j]} <br/> ${State.categories[n]} </th>`;
        }
    }
    titleRow += "</tr>";

    rows = titleRow;

    let maxVotes = votes.reduce(
        (max, cat) => cat.reduce((max, can) => Math.max(max, can.length), max),
        0,
    );

    for (let i = 0; i < maxVotes; i++) {
        let tr = "<tr>";
        for (let n = 0; n < candidates.length; n++) {
            for (let j = 0; j < candidates[n].length; j++) {
                if (votes[n][j][i] != null) {
                    tr += `<td> ${votes[n][j][i]} </td>`;
                } else {
                    tr += `<td> </td>`;
                }
            }
        }
        tr += "</tr>";
        rows += tr;
    }

    let resultRow = "<tr>";
    for (let n = 0; n < candidates.length; n++) {
        for (let j = 0; j < candidates[n].length; j++) {
            resultRow += `<td> ${votes[n][j].length} </td>`;
        }
    }
    resultRow += "</tr>";
    rows += resultRow;

    document.getElementById(
        "votes-table",
    ).innerHTML = `<table border='1'> ${rows} </table>`;

    document.getElementById("s7-final-message").innerHTML =
        "<hr><h2> Remember to close this tab to maintain anonymity of votes.</h2>";
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
