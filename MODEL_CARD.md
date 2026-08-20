# Model Card: FLUENCIFY Disfluency Classifier

## 1. Model Details
* **Architecture:** Support Vector Machine (SVM) mapped over HuBERT (Hidden-Unit BERT) Transformer Embeddings.
* **Input:** Raw audio streams processed at 44.1kHz (browser) or 16kHz (HuBERT natively).
* **Output:** 5-Class Categorical Prediction: `Fluent`, `Block`, `Repetition`, `Prolongation`, `Interjection`.

## 2. Intended Use
* **Primary Use Case:** Real-time, in-browser categorization of speech disfluency to drive therapeutic biofeedback (e.g., triggering a pacing ball or heatmap) in the FLUENCIFY web application.
* **Out of Scope:** Clinical diagnosis of stuttering/stammering severity. Not intended for use outside of the structured 7-Level Fluency Ladder exercises.

## 3. Training Data
* **Source:** 500 synthetically generated audio clips using Python text-to-speech logic, augmented with programmatic disfluencies (silence gaps for blocks, character repetition for repetitions, temporal stretching for prolongations, and injected "um"/"uh" for interjections).
* **Distribution:** 100 clips per class to ensure perfectly balanced class weights during the Hackathon phase.

## 4. Evaluation Metrics
* **Overall F1 Score (Validation):** 0.952 
* **Overall Accuracy (Validation):** 0.952
* **Target Constraint:** $\ge$ 0.75 (Strongly Satisfied)
* **Per-Class Breakdown (Validation Split):**
    * **Fluent:** Precision 0.92 / Recall 0.96 / F1 0.94
    * **Block:** Precision 0.95 / Recall 0.92 / F1 0.94
    * **Repetition:** Precision 0.97 / Recall 0.97 / F1 0.97
    * **Prolongation:** Precision 0.95 / Recall 0.95 / F1 0.95
    * **Interjection:** Precision 0.96 / Recall 0.95 / F1 0.96

## 5. Known Failure Modes & Limitations
* **Environmental Noise:** The model occasionally confuses heavy background static or nasal congestion with a "Block" (silence gap).
* **False Positives (Prolongations):** Natural drawn-out vowels for emphasis in fluent speech may trigger a false positive for "Prolongation".
* **Syllable Counting:** The SPM (Syllables Per Minute) logic relies on a rule-based regex syllabifier which struggles with non-standard English phonology or borrowed loanwords.

## 6. Bias & Ethical Considerations
* **Accent Sensitivity:** Because the underlying HuBERT embeddings were primarily trained on Western, English-speaking audio (LibriSpeech), the model may exhibit lower accuracy or higher false-positive disfluency rates for users with heavy regional accents (e.g., strong Indian English accents). 
* **Therapeutic Safety:** The model is strictly decoupled from punitive UX. Misclassifications are mapped to a supportive purple/pastel heatmap rather than "fail" states, mitigating the psychological risk of false positives.
