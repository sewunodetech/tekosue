"""Generate the ad's voice-over, sound effects and background music into public/audio/.

Voice-over comes from ElevenLabs when ELEVENLABS_API_KEY is set (env or .env.local), else macOS `say`.
Run from video/demo:  python3 scripts/make-ad-audio.py [ad|pow]   (default: ad)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)

VOICE = "Samantha"
ELEVEN_VOICE = "EXAVITQu4vr4xnSDxMaL"  # Sarah (premade; library voices need a paid plan)
ELEVEN_MODEL = "eleven_multilingual_v2"
# id, text, `say` words-per-minute, max seconds (slot in Ad.tsx)
LINE_SETS = {
    "ad": [
        ("vo1", "Three countries. Three currencies. One messy group chat.", 255, 2.95),
        ("vo2", "Meet Teko-sue. One pot for the whole trip.", 225, 2.3),
        ("vo3", "Join with just your face.", 190, 3.6),
        ("vo4", "Everyone chips in, once.", 190, 3.6),
        ("vo5", "Spend together. Everyone sees it, instantly.", 200, 3.6),
        ("vo6", "And on the last day, it settles itself.", 195, 3.6),
        ("vo7", "Stressless trips, with Teko-sue.", 180, 4.0),
    ],
    "pow": [
        ("pow-vo1", "Proof of work. Teko-sue, live on Monad testnet.", 190, 3.6),
        ("pow-vo2", "This is our website, live at teko-sue dot x y z.", 190, 7.4),
        ("pow-vo3", "Every tap in the app is a real transaction to our GroupVault contract on Monad.", 190, 8.4),
        ("pow-vo4", "Here is that contract on the Monad explorer. Deposits, payments and receipts, all on-chain.", 190, 11.4),
        ("pow-vo5", "And these are real transactions, read straight from Monad testnet. Create, join, chip in, pay, and settle. Every one succeeded.", 190, 13.4),
        ("pow-vo6", "Open source, and verifiable by anyone.", 190, 5.4),
    ],
}
SET = sys.argv[1] if len(sys.argv) > 1 else "ad"
LINES = LINE_SETS[SET]


def eleven_key() -> str | None:
    if os.environ.get("ELEVENLABS_API_KEY"):
        return os.environ["ELEVENLABS_API_KEY"]
    env_file = Path(__file__).resolve().parent.parent / ".env.local"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    return None


def eleven_tts(key: str, text: str, out: Path) -> None:
    body = json.dumps({
        "text": text,
        "model_id": ELEVEN_MODEL,
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True},
    }).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVEN_VOICE}?output_format=mp3_44100_128",
        data=body,
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        out.write_bytes(r.read())


def duration(path: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def write_wav(path: Path, x: np.ndarray) -> None:
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def env(n: int, attack: float, decay: float) -> np.ndarray:
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


rng = np.random.default_rng(7)

# ---- voice-over -------------------------------------------------------------
durations = {}
key = eleven_key()
print("voice-over:", "ElevenLabs" if key else f"macOS say ({VOICE})")
for vid, text, rate, max_s in LINES:
    raw = OUT / f"{vid}.raw.{'mp3' if key else 'aiff'}"
    wav = OUT / f"{vid}.wav"
    if key:
        eleven_tts(key, text, raw)
    else:
        subprocess.run(["say", "-v", VOICE, "-r", str(rate), "-o", str(raw), text], check=True)
    # trim silence, then speed up (pitch-preserving) only if the line overruns its slot
    trim = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
    tmp = OUT / f"{vid}.trim.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw), "-af", trim, str(tmp)], check=True)
    tempo = max(1.0, duration(tmp) / max_s)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(tmp), "-ar", str(SR), "-ac", "1",
         "-af", f"atempo={tempo:.3f},highpass=f=80,acompressor=threshold=-18dB:ratio=3,loudnorm=I=-16:TP=-1.5", str(wav)],
        check=True,
    )
    raw.unlink()
    tmp.unlink()
    with wave.open(str(wav)) as w:
        durations[vid] = w.getnframes() / w.getframerate()

# ---- sound effects ----------------------------------------------------------
# whoosh: band-passed noise sweeping up then down
n = int(0.45 * SR)
t = np.arange(n) / SR
noise = rng.standard_normal(n)
spec = np.fft.rfft(noise)
freqs = np.fft.rfftfreq(n, 1 / SR)
spec *= np.exp(-((freqs - 1800) / 1400) ** 2)
w = np.fft.irfft(spec, n)
shape = np.sin(np.pi * np.clip(t / 0.45, 0, 1)) ** 2
write_wav(OUT / "whoosh.wav", 0.9 * w / np.abs(w).max() * shape)

# pop: short pitch-dropping sine blip
n = int(0.12 * SR)
t = np.arange(n) / SR
f = 900 * np.exp(-t * 18) + 300
write_wav(OUT / "pop.wav", 0.7 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.04))

# chime: two bell partials, major sixth
n = int(1.4 * SR)
t = np.arange(n) / SR
bell = sum(a * np.sin(2 * np.pi * fr * t) * np.exp(-t * d) for fr, a, d in [(1046.5, 0.5, 3), (1568, 0.3, 4), (2093, 0.15, 6)])
off = int(0.12 * SR)
write_wav(OUT / "chime.wav", 0.6 * (bell + 0.7 * np.roll(bell, off) * (np.arange(n) >= off)) * env(n, 0.003, 1.0))

# coin: bright two-note ding
n = int(0.6 * SR)
t = np.arange(n) / SR
c1 = np.sin(2 * np.pi * 1975 * t) * (t < 0.07)
c2 = np.sin(2 * np.pi * 2637 * t) * (t >= 0.07)
write_wav(OUT / "coin.wav", 0.45 * (c1 + c2) * np.exp(-np.maximum(0, t - 0.07) * 7))

# ---- background music: 30 s upbeat loop (~112 bpm) --------------------------
BPM = 112
beat = 60 / BPM
total = 31.0
n = int(total * SR)
t = np.arange(n) / SR
mix = np.zeros(n)


def add(sig: np.ndarray, at: float) -> None:
    i = int(at * SR)
    if i >= n:
        return
    m = min(len(sig), n - i)
    mix[i : i + m] += sig[:m]


def tone(freq: float, dur: float, amp: float, decay: float, harmonics=((1, 1.0), (2, 0.25), (3, 0.08))) -> np.ndarray:
    k = int(dur * SR)
    tt = np.arange(k) / SR
    s = sum(a * np.sin(2 * np.pi * freq * h * tt) for h, a in harmonics)
    return amp * s * env(k, 0.01, decay)


# I–V–vi–IV in C, one chord per bar
CHORDS = [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]]
BASS = [65.41, 49.0, 55.0, 43.65]
bars = int(total / (4 * beat)) + 1
for b in range(bars):
    start = b * 4 * beat
    ch = CHORDS[b % 4]
    for step in range(8):  # plucky eighth-note chord stabs
        at = start + step * beat / 2
        if step in (0, 3, 4, 6):
            for fr in ch:
                add(tone(fr, 0.5, 0.06, 0.18), at)
    for step in range(4):
        add(tone(BASS[b % 4] * 2, beat, 0.22, 0.35, ((1, 1.0), (2, 0.3))), start + step * beat)
    # light arpeggio on top
    for step in range(8):
        add(tone(ch[step % 3] * 2, 0.3, 0.035, 0.12), start + step * beat / 2 + beat / 4)

beats = int(total / beat) + 1
for k in range(beats):  # soft kick on every beat, clap on 2 and 4, hats on the off-beats
    at = k * beat
    kk = int(0.25 * SR)
    tt = np.arange(kk) / SR
    add(0.5 * np.sin(2 * np.pi * (50 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12), at)
    if k % 2 == 1:
        cl = int(0.15 * SR)
        add(0.12 * rng.standard_normal(cl) * env(cl, 0.001, 0.05), at)
    hh = int(0.05 * SR)
    add(0.04 * np.diff(rng.standard_normal(hh + 1)) * env(hh, 0.001, 0.015), at + beat / 2)

mix *= np.minimum(1, t / 0.6) * np.minimum(1, (total - t) / 1.5)  # fade in/out
mix /= np.abs(mix).max() / 0.8
write_wav(OUT / "music.wav", mix)

(OUT / f"durations-{SET}.json").write_text(json.dumps(durations, indent=2))
print(json.dumps(durations, indent=2))
