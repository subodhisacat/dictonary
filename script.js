// base URL ends with slash — we'll append the word
const baseUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const result = document.getElementById("result");
const sound = document.getElementById("sound");
const btn = document.getElementById("search-btn");

// Example: if you rely on specialWords, make sure it's defined
const specialWords = ["foo", "bar"]; // replace or remove if not used

btn.addEventListener("click", doLookup);
document.getElementById("inp-word").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLookup();
});

function doLookup() {
  const inpWord = document.getElementById("inp-word").value.trim().toLowerCase();
  if (!inpWord) return;

  // clear previous
  result.innerHTML = `<p>Loading...</p>`;
  sound.removeAttribute("src"); // clear old audio

  if (Array.isArray(specialWords) && specialWords.includes(inpWord)) {
    result.innerHTML = `
      <div class="word"><h3>${inpWord.toUpperCase()}</h3></div>
      <p class="word-meaning">Special word handling (custom content)</p>`;
    return;
  }

  const fetchUrl = baseUrl + encodeURIComponent(inpWord);

  fetch(fetchUrl)
    .then((res) => {
      if (!res.ok) throw new Error("Word not found");
      return res.json();
    })
    .then((data) => {
      // defensive extraction
      const entry = data && data[0];
      if (!entry) throw new Error("No data");

      // try a few spots for phonetic text
      const phoneticText =
        entry.phonetic ||
        (entry.phonetics && entry.phonetics.find((p) => p.text)?.text) ||
        "";

      // try to find an audio url
      const phoneticsArr = entry.phonetics || [];
      let audioUrl = phoneticsArr.find((p) => p.audio && p.audio.trim())?.audio || "";

      // normalize audio url
      if (audioUrl && audioUrl.startsWith("//")) audioUrl = "https:" + audioUrl;
      else if (audioUrl && audioUrl.startsWith("/")) audioUrl = "https://api.dictionaryapi.dev" + audioUrl;

      const meaning = entry.meanings && entry.meanings[0];
      const definition = meaning?.definitions?.[0]?.definition || "Definition not available";
      const example = meaning?.definitions?.[0]?.example || "";

      result.innerHTML = `
        <div class="word">
          <h3>${escapeHtml(inpWord)}</h3>
          ${audioUrl ? `<button id="play-btn"><i class="fas fa-volume-up"></i></button>` : ""}
        </div>
        <div class="details">
          <p>${escapeHtml(meaning?.partOfSpeech || "")}</p>
          <p>/${escapeHtml(phoneticText)}/</p>
        </div>
        <p class="word-meaning">${escapeHtml(definition)}</p>
        <p class="word-example">${escapeHtml(example)}</p>
      `;

      if (audioUrl) {
        sound.setAttribute("src", audioUrl);
        const playBtn = document.getElementById("play-btn");
        if (playBtn) playBtn.addEventListener("click", () => sound.play().catch(()=>{}));
      } else {
        sound.removeAttribute("src");
      }
    })
    .catch((err) => {
      console.error(err);
      result.innerHTML = `<h3 class="error">Couldn't Find The Word</h3>`;
      sound.removeAttribute("src");
    });
}

// small helper to avoid XSS when injecting text into innerHTML
function escapeHtml(s) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
