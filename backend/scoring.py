"""
FLUENCIFY — Scoring Module
===========================
Implements the exact Fluency Score formula from the hackathon spec (Section 3.2):

  fluency = 25 × f(speech_rate_stability)
           + 20 × f_inv(block_frequency)
           + 15 × f_inv(prolongation_ratio)
           + 15 × f_inv(repetition_rate)
           + 10 × f(pause_regularity)
           + 10 × f(pitch_smoothness)
           +  5 × f(recovery_speed)

Where f() = min-max normalized against the user's personal baseline.
(We use population averages as fallback when no baseline exists.)
"""


# Population-level reference values for normalisation when no baseline available
_POP_BASELINE = {
    "block_frequency": 1.0,      # avg blocks per 10 words for mild stutter
    "repetition_rate": 1.0,
    "prolongation_ratio": 0.5,
    "speech_rate": 120.0,        # syllables per minute, typical
    "recovery_speed": 2.0,       # seconds
    "pause_regularity": 0.7,
    "pitch_variability": 0.5,
}


def _safe_get(d, *keys, default=0.0):
    for k in keys:
        v = d.get(k)
        if v is not None:
            return float(v)
    return float(default)


def calculate_fluency_score(metrics: dict, baseline=None) -> float:
    """
    Calculate the 0-100 fluency score.

    `metrics` can come from either:
      • The acoustic analyser  → block_count, repetition_count, prolongation_count
      • Legacy format          → block_duration_ms, sound_repetition_count

    `baseline` is a SQLAlchemy PersonalBaseline ORM object (or None).
    """
    if metrics.get("total_words", 10) == 0:
        return 0.0

    total_words = max(_safe_get(metrics, "total_words", default=10), 1)

    # ── Resolve baseline reference values ────────────────────────────────────
    if baseline and "block_frequency" in baseline:
        ref_blocks   = max(float(baseline.get("block_frequency")  or 1.0), 0.01)
        ref_reps     = max(float(baseline.get("repetition_rate")  or 1.0), 0.01)
        ref_prol     = max(float(baseline.get("prolongation_ratio") or 0.5), 0.01)
        ref_rate     = float(baseline.get("speech_rate")          or 120.0)
        ref_recovery = float(baseline.get("recovery_speed")       or 2.0)
    else:
        ref_blocks   = _POP_BASELINE["block_frequency"]
        ref_reps     = _POP_BASELINE["repetition_rate"]
        ref_prol     = _POP_BASELINE["prolongation_ratio"]
        ref_rate     = _POP_BASELINE["speech_rate"]
        ref_recovery = _POP_BASELINE["recovery_speed"]

    # ── Sub-scores (each 0.0 → 1.0) ─────────────────────────────────────────

    # 1. Inverse block frequency (20 pts)
    if "block_count" in metrics and metrics["block_count"] is not None:
        block_freq = _safe_get(metrics, "block_count") / total_words
    elif "block_duration_ms" in metrics:
        # Legacy: avg block ms per word as proxy for frequency
        block_freq = (_safe_get(metrics, "block_duration_ms") / total_words) / 3000.0
    else:
        block_freq = 0.0
    # Normalise against baseline: user at baseline = 0.5 score, 0 blocks = 1.0
    inv_block = max(0.0, 1.0 - (block_freq / max(ref_blocks / total_words, 0.01) * 0.5))
    inv_block = min(1.0, inv_block)

    # 2. Inverse repetition rate (15 pts)
    rep_raw   = _safe_get(metrics, "repetition_count", "sound_repetition_count", default=0)
    rep_freq  = rep_raw / total_words
    inv_rep   = max(0.0, min(1.0, 1.0 - (rep_freq / max(ref_reps / total_words, 0.01) * 0.5)))

    # 3. Inverse prolongation ratio (15 pts)
    prol_raw  = _safe_get(metrics, "prolongation_count", "prolongation_ratio", default=0)
    prol_freq = prol_raw / total_words if "prolongation_count" in metrics else float(prol_raw)
    inv_prol  = max(0.0, min(1.0, 1.0 - (prol_freq / max(ref_prol / total_words, 0.01) * 0.5)))

    # 4. Speech rate stability (25 pts)
    # Ideal = ~120 syllables/min.  Deviation from ideal reduces score.
    actual_rate = _safe_get(metrics, "speech_rate", default=120.0)
    rate_deviation = abs(actual_rate - ref_rate) / max(ref_rate, 1.0)
    speech_rate_stability = max(0.0, min(1.0, 1.0 - rate_deviation * 0.8))

    # 5. Pause regularity (10 pts) — not yet measured acoustically; use 0.8 as neutral
    pause_regularity = 0.8

    # 6. Pitch smoothness (10 pts) — not measured; neutral
    pitch_smoothness = 0.8

    # 7. Recovery speed (5 pts)
    recovery_time = _safe_get(metrics, "recovery_time", default=2.0)
    # Shorter = better; normalise against baseline recovery speed
    inv_recovery = max(0.0, min(1.0, 1.0 - (recovery_time / max(ref_recovery * 2, 1.0))))

    # ── Weighted sum ─────────────────────────────────────────────────────────
    fluency = (
        25 * speech_rate_stability +
        20 * inv_block             +
        15 * inv_prol              +
        15 * inv_rep               +
        10 * pause_regularity      +
        10 * pitch_smoothness      +
         5 * inv_recovery
    )

    return round(min(100.0, max(0.0, fluency)), 1)


def calculate_baseline_comparison(current_metrics: dict, baseline) -> dict:
    """Compare current session against personal baseline."""
    if not baseline or "block_frequency" not in baseline:
        return {
            "improvement_percentage": 0,
            "message": "Complete a few more sessions to see your baseline comparison.",
        }

    baseline_blocks = float(baseline.get("block_frequency") or 0)
    current_blocks  = float(current_metrics.get("block_count", 0))

    if baseline_blocks > 0:
        pct = round((baseline_blocks - current_blocks) / baseline_blocks * 100, 1)
        if pct > 0:
            msg = f"Block frequency reduced by {pct}% since your first session. Keep it up!"
        elif pct < 0:
            msg = f"A tougher session today — that's normal. Take a breath and keep going."
        else:
            msg = "Holding steady against your baseline. Consistency is progress."
    else:
        pct = 0
        msg = "You're building your baseline. A few more sessions will reveal your trend."

    return {"improvement_percentage": pct, "message": msg}
