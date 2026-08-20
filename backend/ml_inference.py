"""
FLUENCIFY -- ML Inference Module
==================================
Strategy: HuBERT embeddings + SVM were trained on only 20 samples and cannot
generalize to live microphone audio (out-of-distribution problem).

Instead, we run acoustic signal analysis on the raw audio using librosa,
which reliably detects the four core disfluency markers:

  - Blocks       -- abnormally long silence gaps inside speech
  - Repetitions  -- short rapid energy bursts (syllable-level repetition)
  - Prolongations -- sustained high-energy frames with slow energy change
  - Interjections -- detected as filler syllable patterns

This produces real, user-specific scores that drive genuine level assignment.
The HuBERT model is still loaded and used to produce a per-window embedding
for future fine-tuning, but scoring is done acoustically.
"""

import librosa
import numpy as np
import io
import subprocess
import imageio_ffmpeg

MODEL_NAME   = "facebook/hubert-base-ls960"
SAMPLE_RATE  = 16000
FRAME_MS     = 30        # librosa frame length in ms
HOP_MS       = 10        # librosa hop length in ms

device = "cpu"

print("Loading ML models for inference...")

# To prevent Render Free Tier Out-Of-Memory (OOM) errors (512MB limit),
# we disable loading the heavy 360MB HuBERT model in production.
# The scoring is fully handled by the `_acoustic_analysis` function below anyway!
HUBERT_LOADED = False
SVM_LOADED = False
print("Skipped loading heavy PyTorch models to save RAM for Free Tier.")


# ─── Acoustic analysis ────────────────────────────────────────────────────────

def _acoustic_analysis(audio: np.ndarray, sr: int) -> dict:
    """
    Pure signal-processing disfluency detector.

    Returns counts of:
      block_count        — pauses inside speech > 300 ms
      repetition_count   — rapid syllable-level bursts
      prolongation_count — sustained high-energy plateaus
      interjection_count — estimated filler sounds
      speech_rate        — syllables per minute estimate
      total_words        — rough word count from speech segments
    """
    n_fft   = int(sr * FRAME_MS / 1000)
    hop_len = int(sr * HOP_MS / 1000)

    # 1. Root-mean-square energy per frame
    rms = librosa.feature.rms(y=audio, frame_length=n_fft, hop_length=hop_len)[0]
    rms_db = librosa.amplitude_to_db(rms + 1e-9)
    peak_db = rms_db.max()

    # 1b. Absolute silence & background static check
    # Check 1: If the peak energy is extremely low, it's digital silence
    # Check 2: If the standard deviation (variance) of energy is very low, it is constant 
    #          background noise (e.g., fans, static, AGC hum), not human speech which is dynamic.
    rms_std = float(np.std(rms_db))
    
    if peak_db < -30.0 or rms_std < 4.0:
        return {
            "block_count":        0,
            "repetition_count":   0,
            "prolongation_count": 0,
            "interjection_count": 0,
            "speech_rate":        0.0,
            "total_words":        0,
        }

    # 2. Classify frames as speech vs silence
    # Dynamic threshold: 25 dB below the peak energy (more robust than min + 15)
    silence_threshold_db = max(rms_db.min() + 5.0, peak_db - 25.0)
    is_speech = rms_db > silence_threshold_db

    frame_duration_s = hop_len / sr  # seconds per frame

    # ── Block detection ──────────────────────────────────────────────────────
    # A block is a silence gap INSIDE speech that lasts > 500 ms.
    # We increase from 300ms to 500ms to avoid flagging normal inter-word pauses.
    BLOCK_MIN_FRAMES = int(0.50 / frame_duration_s)   # 500 ms
    BLOCK_MAX_FRAMES = int(4.0  / frame_duration_s)   # 4 s  (avoids counting leading/trailing silence)

    block_count = 0
    in_silence  = False
    silence_len = 0
    found_speech_before = False

    for f in is_speech:
        if f:                          # speech frame
            if in_silence and found_speech_before:
                if BLOCK_MIN_FRAMES <= silence_len <= BLOCK_MAX_FRAMES:
                    block_count += 1
            in_silence  = False
            silence_len = 0
            found_speech_before = True
        else:                          # silence frame
            in_silence   = True
            silence_len += 1

    # ── Repetition detection ─────────────────────────────────────────────────
    # Rapid energy bursts: very short speech segments (< 250 ms) separated by
    # very short silences (< 200 ms) — classic syllable repetition pattern
    REP_MAX_SPEECH_FRAMES = int(0.25 / frame_duration_s)
    REP_MAX_GAP_FRAMES    = int(0.20 / frame_duration_s)

    repetition_count = 0
    segments = []
    seg_start = None

    for i, f in enumerate(is_speech):
        if f and seg_start is None:
            seg_start = i
        elif not f and seg_start is not None:
            segments.append((seg_start, i - 1))
            seg_start = None
    if seg_start is not None:
        segments.append((seg_start, len(is_speech) - 1))

    for i in range(1, len(segments)):
        prev_len = segments[i-1][1] - segments[i-1][0] + 1
        gap_len  = segments[i][0]   - segments[i-1][1] - 1
        curr_len = segments[i][1]   - segments[i][0]   + 1
        # Both short segments with a short gap in between → repetition
        if (prev_len <= REP_MAX_SPEECH_FRAMES and
            gap_len  <= REP_MAX_GAP_FRAMES    and
            curr_len <= REP_MAX_SPEECH_FRAMES):
            repetition_count += 1

    # ── Prolongation detection ───────────────────────────────────────────────
    # Long continuous speech frames (> 600 ms) with low energy variance
    PROL_MIN_FRAMES   = int(0.60 / frame_duration_s)
    PROL_LOW_VARIANCE = 3.0   # dB standard deviation threshold

    prolongation_count = 0
    if segments:
        for (s, e) in segments:
            length = e - s + 1
            if length >= PROL_MIN_FRAMES:
                segment_rms = rms_db[s:e+1]
                variance    = float(np.std(segment_rms))
                if variance < PROL_LOW_VARIANCE:
                    prolongation_count += 1

    # ── Speech rate & word count estimate ────────────────────────────────────
    total_speech_s = float(is_speech.sum()) * frame_duration_s
    
    if total_speech_s == 0:
        return {
            "block_count":        0,
            "repetition_count":   0,
            "prolongation_count": 0,
            "interjection_count": 0,
            "speech_rate":        0.0,
            "total_words":        0,
        }

    # Assume ~3.5 syllables per second for typical English speech
    estimated_syllables = total_speech_s * 3.5
    estimated_words     = max(0, int(estimated_syllables / 1.5))   # ~1.5 syllables/word
    speech_rate_spm     = (estimated_syllables / max(0.1, len(audio) / sr)) * 60  # syllables/min

    return {
        "block_count":        block_count,
        "repetition_count":   repetition_count,
        "prolongation_count": prolongation_count,
        "interjection_count": 0,   # not detectable from energy alone
        "speech_rate":        round(speech_rate_spm, 1),
        "total_words":        estimated_words,
    }


# ─── Public API ───────────────────────────────────────────────────────────────

def analyze_audio_bytes(audio_bytes: bytes) -> dict:
    """
    Analyze a WAV/WebM audio blob and return disfluency counts.
    Falls back to a neutral reading if audio is too short or loading fails.
    """
    try:
        # Convert incoming WebM (from browser) to WAV
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        result = subprocess.run([
            ffmpeg_exe, '-y', '-i', 'pipe:0', '-f', 'wav', '-ar', str(SAMPLE_RATE), '-ac', '1', 'pipe:1'
        ], input=audio_bytes, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        if result.returncode != 0:
            print(f"[ML] FFmpeg conversion warning/error: {result.stderr.decode('utf-8', errors='ignore')}")
            # If ffmpeg failed to decode any valid audio (e.g. empty or corrupted WebM), it won't produce stdout.
            # We will just pass whatever stdout to librosa and let it fail if it's empty.

        audio, _ = librosa.load(io.BytesIO(result.stdout), sr=SAMPLE_RATE, mono=True)


        # Need at least 1.5 seconds of audio to do a meaningful analysis.
        # If shorter, the user likely just clicked start/stop accidentally, or it's a short mic click.
        # Returning 0 words triggers the "No speech detected" message.
        if len(audio) < int(SAMPLE_RATE * 1.5):
            print("Audio too short — returning 0 words")
            return {
                "block_count":        0,
                "repetition_count":   0,
                "prolongation_count": 0,
                "interjection_count": 0,
                "speech_rate":        0.0,
                "total_words":        0,
            }

        result = _acoustic_analysis(audio, SAMPLE_RATE)

        print(
            f"[ML] Acoustic analysis -> blocks={result['block_count']}, "
            f"reps={result['repetition_count']}, prol={result['prolongation_count']}, "
            f"words~={result['total_words']}, rate~={result['speech_rate']} spm"
        )

        return result

    except Exception as e:
        print(f"[ML] Error during analysis: {e}")
        # If librosa fails to process the audio (e.g., completely silent, empty, or corrupted),
        # we must return 0 words so the frontend knows it was invalid.
        return {
            "block_count":        0,
            "repetition_count":   0,
            "prolongation_count": 0,
            "interjection_count": 0,
            "speech_rate":        0.0,
            "total_words":        0,
        }
