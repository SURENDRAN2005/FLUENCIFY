from pathlib import Path
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed

import pandas as pd
from huggingface_hub import HfApi, hf_hub_download


REPO_ID = "b-brave/sep28k"
REPO_TYPE = "dataset"

INPUT_FILE = "../data/train_1000.csv"
OUTPUT_DIR = Path("../audio/train_1000")

MAX_WORKERS = 8

OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ---------------------------------------------------------
# Load dataset
# ---------------------------------------------------------

df = pd.read_csv(INPUT_FILE)

print("Required clips:", len(df))


# ---------------------------------------------------------
# Get repository files
# ---------------------------------------------------------

api = HfApi()

print("Reading Hugging Face file list...")

files = api.list_repo_files(
    repo_id=REPO_ID,
    repo_type=REPO_TYPE
)

wav_files = [
    f for f in files
    if f.lower().endswith(".wav")
]

print(
    "Available WAV files:",
    len(wav_files)
)


file_lookup = {
    Path(f).name: f
    for f in wav_files
}


# ---------------------------------------------------------
# Build download tasks
# ---------------------------------------------------------

tasks = []

for _, row in df.iterrows():

    filename = (
        f"{row['Show']}_"
        f"{int(row['EpId'])}_"
        f"{int(row['ClipId'])}.wav"
    )

    destination = OUTPUT_DIR / filename

    if destination.exists():
        continue

    if filename not in file_lookup:
        continue

    tasks.append(
        (
            filename,
            file_lookup[filename],
            destination
        )
    )


print(
    "Already downloaded:",
    len(df) - len(tasks)
)

print(
    "Remaining:",
    len(tasks)
)


# ---------------------------------------------------------
# Worker
# ---------------------------------------------------------

def download_one(task):

    filename, repo_path, destination = task

    try:

        cached_file = hf_hub_download(
            repo_id=REPO_ID,
            repo_type=REPO_TYPE,
            filename=repo_path
        )

        shutil.copy2(
            cached_file,
            destination
        )

        return filename, "OK", None

    except Exception as e:

        return filename, "FAILED", str(e)


# ---------------------------------------------------------
# Parallel download
# ---------------------------------------------------------

completed = 0
failed = []

print(
    f"\nStarting {MAX_WORKERS} parallel downloads..."
)

with ThreadPoolExecutor(
    max_workers=MAX_WORKERS
) as executor:

    futures = [
        executor.submit(
            download_one,
            task
        )
        for task in tasks
    ]

    for future in as_completed(futures):

        filename, status, error = future.result()

        completed += 1

        if status == "FAILED":

            failed.append(
                (filename, error)
            )

            print(
                f"[{completed}/{len(tasks)}] FAILED: {filename}"
            )

        else:

            print(
                f"[{completed}/{len(tasks)}] OK: {filename}"
            )


# ---------------------------------------------------------
# Save failures
# ---------------------------------------------------------

if failed:

    pd.DataFrame(
        failed,
        columns=["filename", "error"]
    ).to_csv(
        "../data/failed_train_1000.csv",
        index=False
    )


# ---------------------------------------------------------
# Final count
# ---------------------------------------------------------

actual_files = list(
    OUTPUT_DIR.glob("*.wav")
)

print("\n" + "=" * 60)

print(
    "WAV files currently available:",
    len(actual_files)
)

print(
    "Failed this run:",
    len(failed)
)

print("=" * 60)