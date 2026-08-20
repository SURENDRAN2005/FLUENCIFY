import pandas as pd
from pathlib import Path

INPUT_FILE = "../ml-stuttering-events-dataset/SEP-28k_labels.csv"
OUTPUT_FILE = "../data/metadata.csv"

df = pd.read_csv(INPUT_FILE)

print("Original dataset:")
print("Rows:", len(df))
print("Columns:", len(df.columns))


def assign_label(row):

    labels = []

    if row["NoStutteredWords"] >= 2:
        labels.append("fluent")

    if row["Block"] >= 2:
        labels.append("block")

    if row["SoundRep"] >= 2 or row["WordRep"] >= 2:
        labels.append("repetition")

    if row["Prolongation"] >= 2:
        labels.append("prolongation")

    if row["Interjection"] >= 2:
        labels.append("interjection")

    # Keep only clips with one clear majority class
    if len(labels) == 1:
        return labels[0]

    return None


df["label"] = df.apply(assign_label, axis=1)

# Remove ambiguous samples
df = df.dropna(subset=["label"])

# Remove questionable audio
df = df[
    (df["Unsure"] < 2) &
    (df["PoorAudioQuality"] < 2) &
    (df["DifficultToUnderstand"] < 2) &
    (df["Music"] < 2) &
    (df["NoSpeech"] < 2)
]

# Create unique clip identifier
df["clip_id"] = (
    df["Show"].astype(str)
    + "_"
    + df["EpId"].astype(str)
    + "_"
    + df["ClipId"].astype(str)
)

# Keep useful columns
metadata = df[
    [
        "clip_id",
        "Show",
        "EpId",
        "ClipId",
        "Start",
        "Stop",
        "label"
    ]
]

Path("../data").mkdir(exist_ok=True)

metadata.to_csv(OUTPUT_FILE, index=False)

print("\nFinal dataset:")
print("Rows:", len(metadata))

print("\nClass distribution:")
print(metadata["label"].value_counts())

print("\nClass percentages:")
print(
    metadata["label"]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)

print("\nSaved to:")
print(OUTPUT_FILE)