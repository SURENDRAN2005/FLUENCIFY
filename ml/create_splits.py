import pandas as pd
from pathlib import Path

METADATA_FILE = "../data/metadata.csv"
EXTENDED_FILE = "../ml-stuttering-events-dataset/SEP-28k-Extended_clips.csv"

metadata = pd.read_csv(METADATA_FILE)
extended = pd.read_csv(EXTENDED_FILE)

print("Our metadata:", metadata.shape)
print("Extended metadata:", extended.shape)

keys = ["Show", "EpId", "ClipId"]

for col in keys:
    metadata[col] = metadata[col].astype(str)
    extended[col] = extended[col].astype(str)

extended_small = extended[
    [
        "Show",
        "EpId",
        "ClipId",
        "speaker",
        "is_probably_host",
        "clip_silhouette_score",
        "SEP28k-E",
        "SEP28k-T",
        "SEP28k-D"
    ]
].copy()

merged = metadata.merge(
    extended_small,
    on=keys,
    how="inner"
)

print("\nMerged dataset:", merged.shape)

# Remove records where speaker identity is unavailable.
missing_speaker = merged["speaker"].isna().sum()
print("Missing speaker values:", missing_speaker)

merged = merged.dropna(subset=["speaker"]).copy()

print("Dataset after removing missing speakers:", merged.shape)

print("\nSEP28k-E split:")
print(merged["SEP28k-E"].value_counts(dropna=False))

# Use the speaker-exclusive SEP28k-E partition.
train = merged[merged["SEP28k-E"] == "train"].copy()
validation = merged[merged["SEP28k-E"] == "dev"].copy()
test = merged[merged["SEP28k-E"] == "test"].copy()

print("\nTRAIN:", len(train))
print("VALIDATION:", len(validation))
print("TEST:", len(test))

print("\nTRAIN class distribution:")
print(train["label"].value_counts())

print("\nVALIDATION class distribution:")
print(validation["label"].value_counts())

print("\nTEST class distribution:")
print(test["label"].value_counts())

# Verify speaker separation.
train_speakers = set(train["speaker"])
validation_speakers = set(validation["speaker"])
test_speakers = set(test["speaker"])

print("\nSpeaker overlap:")
print(
    "Train-Val:",
    len(train_speakers & validation_speakers)
)

print(
    "Train-Test:",
    len(train_speakers & test_speakers)
)

print(
    "Validation-Test:",
    len(validation_speakers & test_speakers)
)

Path("../data").mkdir(exist_ok=True)

train.to_csv("../data/train.csv", index=False)
validation.to_csv("../data/validation.csv", index=False)
test.to_csv("../data/test.csv", index=False)

print("\nSaved:")
print("../data/train.csv")
print("../data/validation.csv")
print("../data/test.csv")