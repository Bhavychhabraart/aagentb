// Play a macOS-like screenshot capture sound using Web Audio API
export const playScreenshotSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioContext = new AudioContext();
    
    // Create a short "camera shutter click" sound
    const duration = 0.15;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate a mechanical click sound
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      
      // Initial sharp attack (mechanical click)
      const attack = Math.exp(-t * 80) * Math.sin(t * 2000 * Math.PI * 2);
      
      // Secondary resonance (shutter mechanism)
      const resonance = Math.exp(-t * 40) * Math.sin(t * 800 * Math.PI * 2) * 0.3;
      
      // High frequency transient (crisp click)
      const transient = Math.exp(-t * 200) * (Math.random() * 2 - 1) * 0.4;
      
      data[i] = (attack + resonance + transient) * 0.5;
    }
    
    // Play the sound
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.setValueAtTime(0.6, audioContext.currentTime);
    
    source.start();
    
    // Clean up after sound plays
    source.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    // Silently fail if audio isn't available
    console.debug('Audio playback not available:', error);
  }
};
