var State = {candidates: []};

function clearLink() {
    document.getElementById("public-link").innerHTML = "";
    document.getElementById("public-link-clipboard-status").innerHTML = "";
    document.getElementById("tokens-list").innerHTML = "";
}

function generateKeys() {
    var rsa = new RSAKey();
    var e = "65537";
    rsa.generate(1024, e);
    var public = {n: linebrk(rsa.n.toString(16), 64), e: e};
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
        var selections = [token[1][0], token[1][1]];
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
    var decryptedToken = JSON.parse(State.rsa.decrypt(tokenString));
    if (isValidToken(decryptedToken)) {
        return decryptedToken;
    } else {
        return null;
    }
}

function addCandidate() {
    var name = document.getElementById("candidate-name");
    var value = name.value.replaceAll("'", "").replaceAll('"', "");
    var list = document.getElementById("candidates");
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

    var fourthYear = document.getElementById("fourth-year-candidates").checked;
    State.fourthYear = fourthYear;
    var publicData = {
        publicKey: State.publicKey,
        candidates: State.candidates,
        fourthYear: fourthYear,
    };
    var link = "./public.html?data=" + encodeURI(JSON.stringify(publicData));
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
    var roll = document.getElementById("roll-number");
    var token = document.getElementById("token");
    var list = document.getElementById("tokens-list");

    var count = list.children.length;
    var id = "token" + count;
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
    var currentIndex = array.length,
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
    var element = document.getElementById("token");
    var token = element.value;
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
    var decrypted = [];
    var list = document.getElementById("tokens-list");
    for (var i = 0; i < list.children.length; i++) {
        var token = list.children[i].getAttribute("token");
        var decryptedToken = decrypt(token);
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
    var candidates = State.candidates;
    var tokens = decryptTokens();
    var votes = candidates.map(x => []);

    for (var i = 0; i < tokens.length; i++) {
        var keyword = tokens[i][0];
        var selection = tokens[i][1];
        if (!State.fourthYear) {
            var candidateIndex = candidates.indexOf(selection);
            votes[candidateIndex].push(keyword);
        } else {
            var index1 = candidates.indexOf(selection[0]);
            votes[index1].push(keyword);
            var index2 = candidates.indexOf(selection[1]);
            votes[index2].push(keyword);
        }
    }

    var rows = "";
    var titleRow = "<tr>";
    for (var j = 0; j < candidates.length; j++) {
        titleRow += `<th> ${candidates[j]} </th>`;
    }
    titleRow += "</tr>";

    rows = titleRow;
    var maxVotes = votes.reduce((max, b) => Math.max(max, b.length), 0);

    for (var i = 0; i < maxVotes; i++) {
        var tr = "<tr>";
        for (var j = 0; j < candidates.length; j++) {
            if (votes[j][i] != null) {
                tr += `<td> ${votes[j][i]} </td>`;
            } else {
                tr += `<td> </td>`;
            }
        }
        tr += "</tr>";
        rows += tr;
    }

    var resultRow = "<tr>";
    for (var j = 0; j < candidates.length; j++) {
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
