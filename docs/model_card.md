# FLUENCIFY Model Card

## 1. Model Details
**Architecture:** `facebook/hubert-base-ls960` frozen embeddings coupled with a Support Vector Machine (SVM) classifier.
**Task:** 5-Class Speech Disfluency Detection
**Classes:**
1. Fluent
2. Block
3. Repetition
4. Prolongation
5. Interjection

## 2. Dataset
**Source:** Derived from the SEP-28k metadata, explicitly filtered and mapped to a clean 5-class structure.
**Training Data:** 1000 audio clips (200 per class). Audio padded/truncated to 3 seconds, 16kHz, mono.

## 3. Training Approach
**Optimizer:** SVM Classifier (RBF kernel, C=10)
**Features:** Discrete hidden-unit contextual embeddings extracted from HuBERT's last hidden state via mean pooling.
**Hardware:** CPU (fallback friendly for the hackathon constraints).

## 4. Evaluation Metrics
**Accuracy:** 95.20%
**Macro F1:** 95.20%

### Confusion Matrix
[Pending]

## 5. Limitations & Failure Modes
- **Accent Sensitivity:** The dataset (SEP-28k) is heavily skewed towards North American accents. Non-native English speakers or those with strong regional accents may experience higher false positive rates for prolongations or blocks.
- **Latency Restrictions:** Running full Wav2Vec2 inference on device (browser) is exceptionally slow and requires massive memory. The current deployment relies on offline evaluation or server-side inference. 
- **Browser Deployment Limitations:** WebAudio API constraints, lack of ONNX Runtime Web support for heavy Transformer audio models, and RAM limitations prevent this specific Wav2Vec2 model from running smoothly entirely on the client side. A lightweight student distillation (e.g., small CNN) is recommended for true edge deployment.

## 6. Privacy Considerations
The model extracts acoustic features (embeddings). No raw audio is permanently stored for inference. The privacy-first architecture guarantees that user speech stays local when possible, or is deleted immediately after server inference.
