/**
 * Audio playback utilities.
 * - playAudioBase64: Simple one-shot playback.
 * - playAudioWithKaraoke: Playback with word-by-word timing callbacks for karaoke highlighting.
 */

export const playAudioBase64 = (base64Audio) => {
  return new Promise((resolve, reject) => {
    try {
      const byteChars = atob(base64Audio);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      audio.play();
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Play audio with karaoke word-by-word highlighting.
 * @param {string} base64Audio - Base64 encoded audio
 * @param {string[]} words - Array of words to highlight in sequence
 * @param {function} onWordChange - Callback(wordIndex) called as each word is "spoken"
 * @param {function} onComplete - Called when playback finishes
 * @returns {{ stop: function }} - Controller to stop playback early
 */
export const playAudioWithKaraoke = (base64Audio, words, onWordChange, onComplete, onReady) => {
  let stopped = false;
  let audio = null;
  let timeouts = [];

  const cleanup = () => {
    stopped = true;
    timeouts.forEach(clearTimeout);
    timeouts = [];
    if (audio) {
      audio.pause();
      audio.src = "";
    }
  };

  try {
    const byteChars = atob(base64Audio);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "audio/mp3" });
    const url = URL.createObjectURL(blob);
    audio = new Audio(url);

    audio.addEventListener("loadedmetadata", () => {
      if (stopped) return;
      const duration = audio.duration; // seconds
      if (!duration || !isFinite(duration) || words.length === 0) {
        if (onReady) onReady();
        audio.play();
        return;
      }

      // Weight word timings by character length for natural pacing
      const totalChars = words.reduce((sum, w) => sum + Math.max(w.length, 1), 0);
      let elapsed = 0;

      for (let i = 0; i < words.length; i++) {
        const wordWeight = Math.max(words[i].length, 1) / totalChars;
        const wordMs = wordWeight * duration * 1000;
        const t = setTimeout(() => {
          if (!stopped) onWordChange(i);
        }, elapsed);
        timeouts.push(t);
        elapsed += wordMs;
      }

      // Signal that audio is ready to play — caller can now show the message
      if (onReady) onReady();
      audio.play();
    });

    audio.onended = () => {
      if (!stopped) {
        URL.revokeObjectURL(url);
        onWordChange(words.length); // Signal all words spoken
        onComplete();
      }
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      // On error, still signal ready so text shows
      if (onReady) onReady();
      if (!stopped) onComplete();
    };

    // Trigger metadata load
    audio.load();
  } catch (e) {
    if (onReady) onReady();
    onComplete();
  }

  return { stop: cleanup };
};
