import io
import wave
from typing import Optional


WAV_CONTENT_TYPES = {
    "audio/wav",
    "audio/x-wav",
    "audio/wave",
}

CONTENT_TYPE_SUFFIX_MAP = {
    "audio/webm": ".webm",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/wave": ".wav",
    "audio/mp3": ".mp3",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/mp4": ".mp4",
    "audio/m4a": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/aac": ".aac",
    "audio/mp4a-latm": ".aac",
    "video/mp4": ".mp4",
}

FALLBACK_AUDIO_BITRATES = {
    "audio/webm": 16_000,
    "audio/ogg": 16_000,
    "audio/mp3": 128_000,
    "audio/mpeg": 128_000,
    "audio/mp4": 64_000,
    "audio/m4a": 64_000,
    "audio/x-m4a": 64_000,
    "audio/aac": 64_000,
    "audio/mp4a-latm": 64_000,
    "video/mp4": 64_000,
}


def normalize_audio_content_type(content_type: Optional[str]) -> str:
    return (content_type or "").split(";", 1)[0].strip().lower()


def get_audio_suffix(content_type: Optional[str]) -> str:
    normalized = normalize_audio_content_type(content_type)
    return CONTENT_TYPE_SUFFIX_MAP.get(normalized, ".webm")


def _is_wav_bytes(audio_bytes: bytes) -> bool:
    return len(audio_bytes) >= 12 and audio_bytes[:4] == b"RIFF" and audio_bytes[8:12] == b"WAVE"


def _estimate_wav_duration_seconds(audio_bytes: bytes) -> Optional[float]:
    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wav_file:
            frame_rate = wav_file.getframerate()
            if frame_rate <= 0:
                return None
            return wav_file.getnframes() / frame_rate
    except wave.Error:
        return None


def estimate_audio_duration_seconds(audio_bytes: bytes, content_type: Optional[str]) -> float:
    normalized = normalize_audio_content_type(content_type)

    if normalized in WAV_CONTENT_TYPES or (not normalized and _is_wav_bytes(audio_bytes)):
        wav_duration = _estimate_wav_duration_seconds(audio_bytes)
        if wav_duration is not None:
            return max(1.0, wav_duration)

    bitrate = FALLBACK_AUDIO_BITRATES.get(normalized, 16_000)
    return max(1.0, len(audio_bytes) * 8 / bitrate)
