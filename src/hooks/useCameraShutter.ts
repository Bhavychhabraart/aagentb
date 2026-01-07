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

      // === MECHANICAL SHUTTER CLICK ===
      const shutterBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
      const shutterData = shutterBuffer.getChannelData(0);

      for (let i = 0; i < shutterData.length; i++) {
        const t = i / shutterData.length;
        const envelope = Math.exp(-t * 50) * (1 - Math.exp(-t * 800));
        shutterData[i] = (Math.random() * 2 - 1) * envelope;
      }

      const shutterSource = ctx.createBufferSource();
      shutterSource.buffer = shutterBuffer;

      const shutterFilter = ctx.createBiquadFilter();
      shutterFilter.type = 'bandpass';
      shutterFilter.frequency.value = 2500;
      shutterFilter.Q.value = 0.8;

      const shutterGain = ctx.createGain();
      shutterGain.gain.value = 0.3;

      shutterSource.connect(shutterFilter);
      shutterFilter.connect(shutterGain);
      shutterGain.connect(ctx.destination);

      shutterSource.start(now);
      shutterSource.stop(now + 0.08);

      // === SATISFYING DING SOUND ===
      // Primary tone
      const ding1 = ctx.createOscillator();
      ding1.type = 'sine';
      ding1.frequency.value = 1200;

      const ding1Gain = ctx.createGain();
      ding1Gain.gain.setValueAtTime(0.25, now + 0.03);
      ding1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      // Harmonic overtone
      const ding2 = ctx.createOscillator();
      ding2.type = 'sine';
      ding2.frequency.value = 2400;

      const ding2Gain = ctx.createGain();
      ding2Gain.gain.setValueAtTime(0.12, now + 0.03);
      ding2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      // Third harmonic for shimmer
      const ding3 = ctx.createOscillator();
      ding3.type = 'sine';
      ding3.frequency.value = 3600;

      const ding3Gain = ctx.createGain();
      ding3Gain.gain.setValueAtTime(0.06, now + 0.03);
      ding3Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      // Connect ding oscillators
      ding1.connect(ding1Gain);
      ding1Gain.connect(ctx.destination);

      ding2.connect(ding2Gain);
      ding2Gain.connect(ctx.destination);

      ding3.connect(ding3Gain);
      ding3Gain.connect(ctx.destination);

      // Start and stop ding sounds
      ding1.start(now + 0.03);
      ding1.stop(now + 0.5);

      ding2.start(now + 0.03);
      ding2.stop(now + 0.3);

      ding3.start(now + 0.03);
      ding3.stop(now + 0.2);

    } catch (error) {
      console.warn('Could not play shutter sound:', error);
    }
  }, []);

  return { playShutter };
}
