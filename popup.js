const API_KEY = "";

let hintLevel = 0;
let currentTitle = "";
let allHints = [];

// Buttons
const getHintBtn = document.getElementById("getTitle");
const nextHintBtn = document.getElementById("nextHint");
const showAllBtn = document.getElementById("showAllHints");
const askBtn = document.getElementById("askBtn");

// AUTO LOAD TITLE WHEN POPUP OPENS
document.addEventListener("DOMContentLoaded", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: getTitleFromPage,
    },
    (results) => {
      if (results && results[0] && results[0].result) {
        currentTitle = results[0].result;

        document.getElementById("problemTitle").innerText = currentTitle;
      } else {
        document.getElementById("problemTitle").innerText =
          "Open a LeetCode problem page";
      }
    }
  );
});

// 🔹 GET HINT
getHintBtn.addEventListener("click", async () => {
  hintLevel = 1;
  allHints = [];

  document.getElementById("hintText").innerText = "Generating hint...";

  let hint = await getHintFromAI(currentTitle, hintLevel);

  let formatted = `Hint ${hintLevel}:\n${hint}`;
  allHints.push(formatted);

  document.getElementById("hintText").innerText = formatted;

  getHintBtn.disabled = true;
  nextHintBtn.disabled = false;
  showAllBtn.style.display = "none";
});

// NEXT HINT
nextHintBtn.addEventListener("click", async () => {
  if (!currentTitle) return;

  if (hintLevel >= 4) {
    document.getElementById("hintText").innerText =
      "Final hint reached. Try solving now 💪";

    nextHintBtn.disabled = true;
    showAllBtn.style.display = "block";
    return;
  }

  hintLevel++;

  document.getElementById("hintText").innerText = "Generating next hint...";

  let hint = await getHintFromAI(currentTitle, hintLevel);

  let formatted = `Hint ${hintLevel}:\n${hint}`;
  allHints.push(formatted);

  document.getElementById("hintText").innerText = formatted;
});

// SHOW ALL HINTS
showAllBtn.addEventListener("click", () => {
  if (allHints.length === 0) return;

  document.getElementById("hintText").innerText =
    allHints.join("\n\n");
});

// CHAT FEATURE (independent)
askBtn.addEventListener("click", async () => {
  let question = document.getElementById("userQuestion").value;

  if (!question) {
    document.getElementById("chatResponse").innerText =
      "Please enter a question.";
    return;
  }

  document.getElementById("chatResponse").innerText = "Thinking...";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: getTitleFromPage,
    },
    async (results) => {
      if (results && results[0] && results[0].result) {
        let title = results[0].result;

        let answer = await askAI(title, question);

        document.getElementById("chatResponse").innerText = answer;
      } else {
        document.getElementById("chatResponse").innerText =
          "Open a problem page first.";
      }
    }
  );
});

// Extract title
function getTitleFromPage() {
  let selectors = [
    'div[data-cy="question-title"]',
    'h1',
    '.text-title-large'
  ];

  for (let sel of selectors) {
    let el = document.querySelector(sel);
    if (el) return el.innerText;
  }

  return null;
}

// HINT AI
async function getHintFromAI(title, level) {
  try {
    let response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are a coding tutor giving step-by-step hints."
            },
            {
              role: "user",
              content: `
Problem: ${title}

Give ONLY hint content for level ${level}.

Rules:
- No labels
- No markdown
- No code
- Max 2 lines
`
            }
          ],
        }),
      }
    );

    let data = await response.json();
    let raw = data.choices[0].message.content;

    return raw
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/Hint\s*\d*:?/gi, "")
      .replace(/\n+/g, " ")
      .trim();

  } catch {
    return "Error getting hint";
  }
}

// CHAT AI
async function askAI(title, question) {
  try {
    let response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a coding tutor. Explain clearly in plain text without formatting."
            },
            {
              role: "user",
              content: `
Problem: ${title}

Question: ${question}

Rules:
- No markdown
- No headings
- No bullet points
- No full solution
- Max 3 lines
`
            }
          ],
        }),
      }
    );

    let data = await response.json();
    let raw = data.choices[0].message.content;

    return raw
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/•/g, "-")
      .replace(/\n+/g, " ")
      .trim();

  } catch {
    return "Error getting response";
  }
}
