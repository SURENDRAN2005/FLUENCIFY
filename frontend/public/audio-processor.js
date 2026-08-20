/**
 * Audio Processor Worklet
 * Runs on a separate thread to handle raw audio samples without blocking the main UI thread.
 */

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Assuming 16kHz sample rate (set on the AudioContext)
    this.sampleRate = 16000;
    
    // We want a rolling 3-second window with 50% overlap (1.5s step)
    this.bufferSize = this.sampleRate * 3; // 48000 samples
    this.stepSize = this.sampleRate * 1.5; // 24000 samples
    
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    
    // Silence detection heuristic (300ms gap = 4800 samples)
    this.silenceThreshold = 0.01;
    this.silenceDuration = 0;
    this.silenceLimit = this.sampleRate * 0.3;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0 && input[0]) {
      const channelData = input[0]; // Mono
      
      for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i];
        
        // Silence detection heuristic
        if (Math.abs(sample) < this.silenceThreshold) {
          this.silenceDuration++;
        } else {
          this.silenceDuration = 0;
        }

        // Shift buffer if full and send to main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Send a copy to the main thread for model inference
          this.port.postMessage({
            type: 'audio-chunk',
            buffer: this.buffer.slice(0),
            heuristicBlock: this.silenceDuration >= this.silenceLimit
          });
          
          // Shift buffer left by stepSize (50% overlap)
          const remaining = this.bufferSize - this.stepSize;
          this.buffer.copyWithin(0, this.stepSize, this.bufferSize);
          this.bufferIndex = remaining;
        }
        
        this.buffer[this.bufferIndex++] = sample;
      }
    }
    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
