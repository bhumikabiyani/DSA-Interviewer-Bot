export function speak(text: string) {
  if (!window.speechSynthesis) {
    console.warn("Speech Synthesis not supported.");
    return;
  }

  const utter = new SpeechSynthesisUtterance(text);

  utter.rate = 1;     // speed (0.5–2)
  utter.pitch = 1;    // voice pitch
  utter.volume = 1;   // volume (0–1)

  // Pick a nicer voice if available
  const voices = speechSynthesis.getVoices();
  const englishVoice =
    voices.find(v => v.lang.includes("en") && v.name.includes("Female")) ||
    voices.find(v => v.lang.includes("en")) ||
    voices[0];

  if (englishVoice) {
    utter.voice = englishVoice;
  }

  window.speechSynthesis.cancel(); // stop previous speech
  window.speechSynthesis.speak(utter);
}
