import io
import math
import struct
import wave

from services.audio_utils import estimate_audio_duration_seconds, get_audio_suffix


def generate_test_wav(duration_seconds=1.5, sample_rate=16_000):
    frame_count = int(duration_seconds * sample_rate)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        for index in range(frame_count):
            t = index / sample_rate
            sample = int(12_000 * math.sin(2 * math.pi * 440 * t))
            wav_file.writeframes(struct.pack("<h", sample))
    return buffer.getvalue()


def test_estimate_audio_duration_uses_wav_header():
    wav_data = generate_test_wav(duration_seconds=1.5)
    duration = estimate_audio_duration_seconds(wav_data, "audio/wav")
    assert 1.45 <= duration <= 1.55


def test_estimate_audio_duration_detects_wav_without_content_type():
    wav_data = generate_test_wav(duration_seconds=2.0)
    duration = estimate_audio_duration_seconds(wav_data, None)
    assert 1.95 <= duration <= 2.05


def test_get_audio_suffix_supports_ios_and_android_upload_types():
    assert get_audio_suffix("audio/mp4") == ".mp4"
    assert get_audio_suffix("video/mp4") == ".mp4"
    assert get_audio_suffix("audio/x-m4a") == ".m4a"
    assert get_audio_suffix("audio/wav") == ".wav"
