const State = { candidates: [] };

function clearLink() {
  document.getElementById("public-link").innerHTML = "";
  document.getElementById("public-link-clipboard-status").innerHTML = "";
  document.getElementById("tokens-list").innerHTML = "";
}

function generateKeys() {
  const rsa = new RSAKey();
  const e = "65537";
  rsa.generate(1024, e);
  const public = { n: linebrk(rsa.n.toString(16), 64), e: e };
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
    const selections = token[1];
    switch (selections.length) {
      case 1:
        return validCandidate(selections[0]);
      case 2:
        return (
          selections[0] != selections[1] &&
          validCandidate(selections[0]) &&
          validCandidate(selections[1])
        );
      default:
        return false;
    }
  }
}

function decrypt(tokenString) {
  const decryptedToken = JSON.parse(State.rsa.decrypt(tokenString));
  return isValidToken(decryptedToken) ? decryptedToken : null;
}

function addCandidate() {
  const name = document.getElementById("candidate-name");
  const value = name.value.replaceAll("'", "").replaceAll('"', "");
  const list = document.getElementById("candidates");
  list.innerHTML += `<li>${value}</li>`;

  State.candidates.push(value);
  name.value = "";
  clearLink();
}

function generateLink() {
  // generate link to distribute. contains candidate list and public key.
  if (State.publicKey == null) {
    document.getElementById("public-link").innerText = "Generate keys first!";
    return;
  }

  const fourthYear = document.getElementById("fourth-year-candidates").checked;
  State.fourthYear = fourthYear;
  const publicData = {
    publicKey: State.publicKey,
    candidates: State.candidates,
    fourthYear: fourthYear,
  };
  const link = "./public.html?data=" + encodeURI(JSON.stringify(publicData));
  document.getElementById(
    "public-link"
  ).innerHTML = `<a target="_blank" href="${link}"> Link for voting </a>`;
  navigator.clipboard.writeText(new URL(link, window.location).href).then(
    () => {
      document.getElementById("public-link-clipboard-status").innerText =
        "Link copied to clipboard";
    },
    () => {
      document.getElementById("public-link-clipboard-status").innerText =
        "Please copy the token";
    }
  );
}

function addToken() {
  // add a token to tokens list, and increment roll number
  const roll = document.getElementById("roll-number");
  const token = document.getElementById("token");
  const list = document.getElementById("tokens-list");

  const count = list.children.length;
  const id = "token" + count;
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
  let currentIndex = array.length;

  while (0 !== currentIndex) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    const temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function checkTokenInput() {
  if (State.rsa == null) {
    document.getElementById("token").value = "Generate Keys First!!";
    return;
  }
  const element = document.getElementById("token");
  const token = element.value;
  const color_style = decrypt(token) === null ? "red" : "black";
  element.setAttribute("style", `color:${color_style}`);
}

function decryptTokens() {
  // decrypt all tokens. show invalid tokens in red and return decrypted tokens
  // only when all tokens are valid
  let decrypted = [];
  const list = document.getElementById("tokens-list");
  for (const element of list.children) {
    const token = element.getAttribute("token");
    const decryptedToken = decrypt(token);
    if (decryptedToken == null) {
      element.setAttribute("style", "color:red");
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
  const candidates = State.candidates;
  const tokens = decryptTokens();
  const votes = candidates.map(() => []);

  tokens.forEach((token) => {
    const keyword = token[0];
    const selection = token[1];
    if (!State.fourthYear) {
      const candidateIndex = candidates.indexOf(selection);
      votes[candidateIndex].push(keyword);
    } else {
      const index1 = candidates.indexOf(selection[0]);
      votes[index1].push(keyword);
      if (selection.length == 2) {
        const index2 = candidates.indexOf(selection[1]);
        votes[index2].push(keyword);
      }
    }
  });

  let titleRow = "<tr>";
  candidates.forEach((candidate) => {
    titleRow += `<th>${candidate}</th>`;
  });
  titleRow += "</tr>";

  let rows = titleRow;
  const maxVotes = votes.reduce((max, b) => Math.max(max, b.length), 0);

  for (let i = 0; i < maxVotes; i++) {
    let tr = "<tr>";
    for (let j = 0; j < candidates.length; j++) {
      if (votes[j][i] != null) {
        tr += `<td>${votes[j][i]}</td>`;
      } else {
        tr += "<td></td>";
      }
    }
    tr += "</tr>";
    rows += tr;
  }

  let resultRow = "<tr>";
  for (let j = 0; j < candidates.length; j++) {
    resultRow += `<td>${votes[j].length}</td>`;
  }
  resultRow += "</tr>";
  rows += resultRow;

  document.getElementById(
    "votes-table"
  ).innerHTML = `<table border='1'>${rows}</table>`;
}

function flipCoin() {
  const result = document.getElementById("coinflip-result");
  const randFloat = Math.random();
  result.innerText = randFloat >= 0.5 ? "Head" : "Tails";
}
