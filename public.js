const State = {};

function emptyToken() {
  // remove already genearated token when state changes
  document.getElementById("token").innerHTML = "";
  document.getElementById("clipboard-status").innerHTML = "";
}

function showCandidateList(list, candidates, param) {
  list.innerHTML = "";
  console.log(list);
  candidates.forEach((name) => {
    list.innerHTML += `<li>${name} <button onclick="selectCandidate('${name}', ${param})"> Select </button>`;
  });
}

function parsePassedData() {
  // parses the data passed through URL. extracts public key and candidates list
  const urlParams = new URLSearchParams(window.location.search);
  const data = JSON.parse(decodeURI(urlParams.get("data")));

  State.publicKey = data.publicKey;
  State.candidates = data.candidates;
  State.fourthYear = data.fourthYear;

  const list = document.getElementById("candidates-list");
  showCandidateList(list, State.candidates, 0);

  if (State.fourthYear) {
    // show second candidate list
    const list2 = document.getElementById("candidates-list2");
    document.getElementById("s3-candidate2").hidden = false;
    showCandidateList(list2, State.candidates, 1);
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
  const randInt = Math.floor(Math.random() * (wordList.length - 1));
  return wordList[randInt];
}

function generateKeyword() {
  const keyword = document.getElementById("keyword");
  keyword.innerText = randomWord() + "-" + randomWord() + "-" + randomWord();
  emptyToken();
}

function randomPassword() {
  const chars =
    "!@#$%^&*()_-+=?/.,<>0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let password = "";
  for (var i = 0; i < 16; i++) {
    const randInt = Math.floor(Math.random() * chars.length);
    password += chars[randInt];
  }
  return password;
}

function showError(string) {
  const token = document.getElementById("token");
  token.innerText = string;
  token.setAttribute("style", "color:red");
}

function generateToken() {
  const keyword = document.getElementById("keyword").innerText;
  const candidate1 = document.getElementById("selected-candidate").innerText;
  if (candidate1 == "" || keyword == "") {
    showError("Make sure to select a candidate");
    return;
  }
  let selection;
  if (!State.fourthYear) {
    selection = candidate1;
  } else {
    const candidate2 = document.getElementById("selected-candidate2").innerText;
    if (candidate2 == "") {
      selection = [candidate1];
    } else if (candidate1 != candidate2) {
      selection = [candidate1, candidate2];
    } else {
      showError("Select different candidates");
      return;
    }
  }

  const random = randomPassword();

  const tokenData = JSON.stringify([keyword, selection, random]);

  const rsa = new RSAKey();
  rsa.setPublic(State.publicKey.n, State.publicKey.e);

  const token = rsa.encrypt(tokenData);
  const tokenElement = document.getElementById("token");
  tokenElement.innerHTML = token;
  tokenElement.setAttribute("style", "color:black");
  navigator.clipboard.writeText(token).then(
    () => {
      document.getElementById("clipboard-status").innerText =
        "Token copied to clipboard";
    },
    () => {
      document.getElementById("clipboard-status").innerText =
        "Please copy the token";
    }
  );

  // var inputField = document.getElementById("hidden-token");
  // inputField.value = token;
  // inputField.select();
  // document.execCommand("copy");
}
