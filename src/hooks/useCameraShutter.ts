import { useCallback, useRef } from 'react';

export function useCameraShutter() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playShutter = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Resume if suspended (required by browsers for user gesture)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Create noise buffer for shutter click
      const bufferSize = ctx.sampleRate * 0.08; // 80ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate filtered noise that sounds like a camera shutter
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        // Sharp attack, quick decay envelope
        const envelope = Math.exp(-t * 40) * (1 - Math.exp(-t * 500));
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      // Noise source
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter to shape the click sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;

      // High frequency click
      const highClick = ctx.createOscillator();
      highClick.type = 'sine';
      highClick.frequency.value = 4000;

      const highGain = ctx.createGain();
      highGain.gain.setValueAtTime(0.15, now);
      highGain.gain.setTargetAtTime(0.001, now, 0.005);

      // Master gain
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;

      // Connect nodes
      noise.connect(filter);
      filter.connect(masterGain);
      
      highClick.connect(highGain);
      highGain.connect(masterGain);
      
      masterGain.connect(ctx.destination);

      // Play sounds
      noise.start(now);
      noise.stop(now + 0.1);
      
      highClick.start(now);
      highClick.stop(now + 0.03);

      // Second mechanical click (mirror slap simulation)
      setTimeout(() => {
        if (!audioContextRef.current) return;
        const ctx2 = audioContextRef.current;
        const now2 = ctx2.currentTime;

        const clickBuffer = ctx2.createBuffer(1, ctx2.sampleRate * 0.04, ctx2.sampleRate);
        const clickData = clickBuffer.getChannelData(0);
        
        for (let i = 0; i < clickData.length; i++) {
          const t = i / clickData.length;
          const env = Math.exp(-t * 60);
          clickData[i] = (Math.random() * 2 - 1) * env * 0.3;
        }

        const clickSource = ctx2.createBufferSource();
        clickSource.buffer = clickBuffer;
        
        const clickFilter = ctx2.createBiquadFilter();
        clickFilter.type = 'highpass';
        clickFilter.frequency.value = 1500;

        const clickGain = ctx2.createGain();
        clickGain.gain.value = 0.25;

        clickSource.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(ctx2.destination);
        
        clickSource.start(now2);
        clickSource.stop(now2 + 0.05);
      }, 50);

    } catch (error) {
      console.warn('Could not play shutter sound:', error);
    }
  }, []);

  return { playShutter };
}
