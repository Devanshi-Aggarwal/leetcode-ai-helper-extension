console.log("LeetCode Helper Loaded");

// Try multiple selectors (backup approach)
let title =
  document.querySelector('div[data-cy="question-title"]') ||
  document.querySelector('h1') ||
  document.querySelector('.text-title-large');

if (title) {
  console.log("Problem Title:", title.innerText);
} else {
  console.log("Title not found");
}