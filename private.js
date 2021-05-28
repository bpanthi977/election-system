let State = {candidates: []};

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

function validCandidate(candidate) {
    return State.candidates.indexOf(candidate) != -1;
}

function isValidToken(token) {
    if (token == null) {
        return false;
    }
    if (!State.fourthYear) {
        return validCandidate(token[1]);
    } else {
        let selections = [token[1][0], token[1][1]];
        if (selections.length == 2) {
            return (
                selections[0] != selections[1] &&
                validCandidate(selections[0]) &&
                validCandidate(selections[1])
            );
        } else {
            return false;
        }
    }
}

function decrypt(tokenString) {
    let decryptedToken = JSON.parse(State.rsa.decrypt(tokenString));
    if (isValidToken(decryptedToken)) {
        return decryptedToken;
    } else {
        return null;
    }
}

function addCandidate() {
    let name = document.getElementById("candidate-name");
    let value = name.value.replaceAll("'", "").replaceAll('"', "");
    let list = document.getElementById("candidates");
    list.innerHTML += "<li>" + value + "</li>";

    State.candidates.push(value);
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

    let fourthYear = document.getElementById("fourth-year-candidates").checked;
    State.fourthYear = fourthYear;
    let publicData = {
        publicKey: State.publicKey,
        candidates: State.candidates,
        fourthYear: fourthYear,
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

function countVotes() {
    let candidates = State.candidates;
    let tokens = decryptTokens();
    let votes = candidates.map(x => []);

    for (let i = 0; i < tokens.length; i++) {
        let keyword = tokens[i][0];
        let selection = tokens[i][1];
        if (!State.fourthYear) {
            let candidateIndex = candidates.indexOf(selection);
            votes[candidateIndex].push(keyword);
        } else {
            let index1 = candidates.indexOf(selection[0]);
            votes[index1].push(keyword);
            let index2 = candidates.indexOf(selection[1]);
            votes[index2].push(keyword);
        }
    }

    let rows = "";
    let titleRow = "<tr>";
    for (let j = 0; j < candidates.length; j++) {
        titleRow += `<th> ${candidates[j]} </th>`;
    }
    titleRow += "</tr>";

    rows = titleRow;
    let maxVotes = votes.reduce((max, b) => Math.max(max, b.length), 0);

    for (let i = 0; i < maxVotes; i++) {
        let tr = "<tr>";
        for (let j = 0; j < candidates.length; j++) {
            if (votes[j][i] != null) {
                tr += `<td> ${votes[j][i]} </td>`;
            } else {
                tr += `<td> </td>`;
            }
        }
        tr += "</tr>";
        rows += tr;
    }

    let resultRow = "<tr>";
    for (let j = 0; j < candidates.length; j++) {
        resultRow += `<td> ${votes[j].length} </td>`;
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
