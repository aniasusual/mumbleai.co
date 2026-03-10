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
 * @param {function} [onReady] - Called right before audio.play() so the caller can show the message in sync
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
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (audio) {
      audio.pause();
      audio.src = "";
    }
  };

  let fallbackTimer = null;

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
        // Fallback: signal ready on actual playback start and play without karaoke
        audio.addEventListener("playing", () => {
          if (!stopped && onReady) {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            onReady();
            onReady = null;
          }
        }, { once: true });
        audio.play();
        return;
      }

      // Schedule karaoke + show text ONLY when audio is ACTUALLY playing
      audio.addEventListener("playing", () => {
        if (stopped) return;
        if (fallbackTimer) clearTimeout(fallbackTimer);

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

        // NOW render the message — audio is playing through speakers
        if (onReady) {
          onReady();
          onReady = null;
        }
      }, { once: true });
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
      if (onReady) onReady();
      if (!stopped) onComplete();
    };

    // Timeout fallback: if playing event never fires within 3s, show text anyway
    fallbackTimer = setTimeout(() => {
      if (!stopped && onReady) {
        onReady();
        onReady = null;
      }
    }, 3000);

    // Trigger metadata load
    audio.load();
  } catch (e) {
    if (onReady) onReady();
    onComplete();
  }

  return { stop: cleanup };
};
