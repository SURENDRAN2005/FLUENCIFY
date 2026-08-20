import pandas as pd

INPUT_FILE = "../data/train_1000.csv"
OUTPUT_FILE = "../data/train_5class.csv"

KEEP_CLASSES = [
    "fluent",
    "block",
    "repetition",
    "prolongation",
    "interjection"
]

df = pd.read_csv(INPUT_FILE)

df = df[df["label"].isin(KEEP_CLASSES)].copy()
df = df.sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv(OUTPUT_FILE, index=False)

print("Total clips:", len(df))
print("\nClass distribution:")
print(df["label"].value_counts())
print("\nSaved:")
print(OUTPUT_FILE)
