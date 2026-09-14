/**
 * Web Audio API Ambient Sound Generator
 * Generates soothing ambient focus sounds (Rain, Deep Focus Noise, Soft Wind)
 * without external MP3 dependencies.
 */

let audioCtx = null;
let activeNode = null;
let gainNode = null;

export function playAmbientSound(type = 'rain', volume = 0.3) {
  stopAmbientSound();

  if (type === 'off') return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink / Brown / Rain Noise Synthesis
    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'rain') {
        // Rain / Pink noise algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      } else if (type === 'deep') {
        // Brown noise / Deep Focus
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      } else {
        // Soft Wind / Filtered White Noise
        output[i] = white * 0.15;
      }
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter node for warmth
    const filter = audioCtx.createBiquadFilter();
    filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.value = type === 'rain' ? 1000 : 400;

    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    whiteNoise.start(0);
    activeNode = whiteNoise;
  } catch (err) {
    console.error('Ambient audio playback error:', err);
  }
}

export function setAmbientVolume(volume) {
  if (gainNode && audioCtx) {
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  }
}

export function stopAmbientSound() {
  if (activeNode) {
    try {
      activeNode.stop();
      activeNode.disconnect();
    } catch (e) {}
    activeNode = null;
  }
}
