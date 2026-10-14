/**
 * Renders scene.html to an MP4 (H.264 + AAC), frame by frame.
 *
 *   node render.mjs            full video  -> out/cleancv-promo.mp4
 *   node render.mjs 3          first 3 seconds only (a quick check)
 *
 * The page exposes `setTime(t)`, so each frame is an exact moment of the
 * timeline rather than whatever a real-time capture happened to catch. Frames
 * are encoded inside the browser with WebCodecs and muxed with mp4-muxer; the
 * soundtrack is synthesised with an OfflineAudioContext, so there is nothing
 * to download and nothing licensed.
 */
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(resolve(here, 'out'), { recursive: true });

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const limit = Number(process.argv[2]) || 0;

const server = createServer((req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.end(readFileSync(resolve(here, 'scene.html')));
});
await new Promise((r) => server.listen(4175, '127.0.0.1', r));

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto('http://127.0.0.1:4175/', { waitUntil: 'networkidle0' });
await page.evaluate(() => window.__ready);
await page.addScriptTag({ path: resolve(here, 'node_modules/mp4-muxer/build/mp4-muxer.js') });

const total = await page.evaluate(() => window.__END);
const seconds = limit > 0 ? Math.min(limit, total) : total;
const frames = Math.round(seconds * FPS);

/** Everything below runs in the page. */
await page.evaluate(
  async ({ fps, width, height, seconds }) => {
    const SR = 48000;

    // ---------- soundtrack ----------
    const synth = async () => {
      const ctx = new OfflineAudioContext(2, Math.ceil(SR * (seconds + 0.5)), SR);
      const master = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;
      comp.attack.value = 0.01;
      comp.release.value = 0.25;
      master.connect(comp).connect(ctx.destination);

      const end = seconds;
      master.gain.setValueAtTime(0.0001, 0);
      master.gain.exponentialRampToValueAtTime(0.9, 1.2);
      master.gain.setValueAtTime(0.9, Math.max(1.3, end - 2.0));
      master.gain.exponentialRampToValueAtTime(0.0001, end);

      // a short noisy impulse for the reverb
      const impulse = ctx.createBuffer(2, SR * 2.6, SR);
      for (let c = 0; c < 2; c += 1) {
        const d = impulse.getChannelData(c);
        for (let i = 0; i < d.length; i += 1) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.4);
      }
      const verb = ctx.createConvolver();
      verb.buffer = impulse;
      const verbGain = ctx.createGain();
      verbGain.gain.value = 0.45;
      verb.connect(verbGain).connect(master);

      const noise = ctx.createBuffer(1, SR * 4, SR);
      const nd = noise.getChannelData(0);
      for (let i = 0; i < nd.length; i += 1) nd[i] = Math.random() * 2 - 1;

      const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
      const BEAT = 0.6; // 100 bpm
      const CHORDS = [
        { root: 45, notes: [57, 60, 64] }, // Am
        { root: 41, notes: [53, 57, 60] }, // F
        { root: 48, notes: [60, 64, 67] }, // C
        { root: 43, notes: [55, 59, 62] }, // G
      ];
      const CH = BEAT * 8; // two bars per chord

      // pads + sub
      for (let t = 0, i = 0; t < end; t += CH, i += 1) {
        const chord = CHORDS[i % 4];
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(500 + 1500 * Math.min(1, t / 20), t);
        lp.frequency.linearRampToValueAtTime(900 + 2200 * Math.min(1, t / 20), t + CH);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.16, t + 1.4);
        g.gain.setValueAtTime(0.16, t + CH - 0.6);
        g.gain.linearRampToValueAtTime(0, t + CH + 1.2);
        lp.connect(g);
        g.connect(master);
        g.connect(verb);
        chord.notes.forEach((n) => {
          [-7, 7].forEach((cents) => {
            const o = ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = hz(n);
            o.detune.value = cents;
            o.connect(lp);
            o.start(t);
            o.stop(t + CH + 1.4);
          });
        });
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = hz(chord.root - 12);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0, t);
        sg.gain.linearRampToValueAtTime(0.34, t + 0.4);
        sg.gain.linearRampToValueAtTime(0, t + CH + 0.3);
        sub.connect(sg).connect(master);
        sub.start(t);
        sub.stop(t + CH + 0.5);
      }

      const kick = (t, vol = 0.7) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + 0.4);
      };
      const hat = (t, vol = 0.07) => {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.value = 7000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        s.connect(f).connect(g).connect(master);
        s.start(t, Math.random() * 2);
        s.stop(t + 0.08);
      };
      const clap = (t) => {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1700;
        f.Q.value = 0.8;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        s.connect(f).connect(g);
        g.connect(master);
        g.connect(verb);
        s.start(t, Math.random() * 2);
        s.stop(t + 0.3);
      };
      const pluck = (t, n, vol = 0.1) => {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = hz(n);
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(3600, t);
        f.frequency.exponentialRampToValueAtTime(700, t + 0.35);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.connect(f).connect(g);
        g.connect(master);
        g.connect(verb);
        o.start(t);
        o.stop(t + 0.55);
      };
      const boom = (t, vol = 0.9) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(95, t);
        o.frequency.exponentialRampToValueAtTime(30, t + 1.1);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
        o.connect(g);
        g.connect(master);
        g.connect(verb);
        o.start(t);
        o.stop(t + 1.5);
        const s = ctx.createBufferSource();
        s.buffer = noise;
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(5000, t);
        f.frequency.exponentialRampToValueAtTime(200, t + 0.9);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.35, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        s.connect(f).connect(ng);
        ng.connect(master);
        ng.connect(verb);
        s.start(t, 0.5);
        s.stop(t + 1);
      };
      const sweep = (t, dur, from, to, vol) => {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        s.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.Q.value = 1.4;
        f.frequency.setValueAtTime(from, t);
        f.frequency.exponentialRampToValueAtTime(to, t + dur);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.92);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        s.connect(f).connect(g);
        g.connect(master);
        g.connect(verb);
        s.start(t);
        s.stop(t + dur + 0.05);
      };
      const blip = (t, f0, f1, vol = 0.16) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g);
        g.connect(master);
        g.connect(verb);
        o.start(t);
        o.stop(t + 0.35);
      };

      // intro: slow heartbeat under the question
      for (let t = 0.6; t < 4.6; t += 1.2) {
        kick(t, 0.5);
        kick(t + 0.3, 0.32);
      }
      sweep(0.6, 4.0, 220, 5200, 0.2);
      boom(4.0 + 0.0, 0.5); // stamp
      boom(5.0, 0.95);
      blip(7.7, 700, 1400, 0.2);
      boom(10.6, 0.8);

      // groove from the free card onwards
      const grooveFrom = 10.6;
      const grooveTo = Math.min(end, 49.4);
      for (let t = grooveFrom, b = 0; t < grooveTo; t += BEAT, b += 1) {
        const lighter = t >= 39.1;
        if (!lighter || b % 2 === 0) kick(t, lighter ? 0.5 : 0.62);
        hat(t + BEAT / 2, 0.06);
        if (b % 4 === 1 || b % 4 === 3) clap(t);
        const chord = CHORDS[Math.floor((t / CH) % 4)];
        const n = chord.notes[b % 3] + (b % 6 >= 3 ? 12 : 0);
        pluck(t, n, 0.09);
        pluck(t + BEAT / 2, chord.notes[(b + 1) % 3] + 12, 0.06);
      }

      // transitions
      [17.6, 21.9, 26.2, 30.5, 34.8, 39.1].forEach((t) => sweep(t - 0.35, 0.5, 400, 5200, 0.16));
      sweep(45.0, 4.4, 300, 7000, 0.28);
      boom(49.4, 1.0);
      [50.2, 51.2].forEach((t) => blip(t, 600, 1200, 0.14));
      // final shimmer
      CHORDS[0].notes.forEach((n, i) => pluck(51.6 + i * 0.18, n + 24, 0.08));

      return ctx.startRendering();
    };

    // ---------- encoders ----------
    const target = new Mp4Muxer.ArrayBufferTarget();
    const muxer = new Mp4Muxer.Muxer({
      target,
      video: { codec: 'avc', width, height, frameRate: fps },
      audio: { codec: 'aac', sampleRate: SR, numberOfChannels: 2 },
      fastStart: 'in-memory',
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('video', e),
    });
    videoEncoder.configure({
      codec: 'avc1.640028',
      latencyMode: 'realtime',
      // One encoder for the whole run. The hardware one dropped out part-way
      // and the software one took over with different parameter sets, which
      // left the first half of the file undecodable.
      hardwareAcceleration: 'prefer-software',
      width,
      height,
      bitrate: 10_000_000,
      framerate: fps,
      avc: { format: 'avc' },
    });

    window.__addFrame = async (b64, index) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }));
      const frame = new VideoFrame(bitmap, {
        timestamp: Math.round((index * 1e6) / fps),
        duration: Math.round(1e6 / fps),
      });
      videoEncoder.encode(frame, { keyFrame: index % 60 === 0 });
      frame.close();
      bitmap.close();
      while (videoEncoder.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 5));
    };

    window.__finish = async () => {
      await videoEncoder.flush();

      const audio = await synth();
      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error('audio', e),
      });
      audioEncoder.configure({ codec: 'mp4a.40.2', sampleRate: SR, numberOfChannels: 2, bitrate: 192000 });

      const left = audio.getChannelData(0);
      const right = audio.getChannelData(1);
      const length = Math.min(left.length, Math.round(seconds * SR));
      const step = 4800;

      for (let at = 0; at < length; at += step) {
        const n = Math.min(step, length - at);
        const data = new Float32Array(n * 2);
        data.set(left.subarray(at, at + n), 0);
        data.set(right.subarray(at, at + n), n);
        const chunk = new AudioData({
          format: 'f32-planar',
          sampleRate: SR,
          numberOfFrames: n,
          numberOfChannels: 2,
          timestamp: Math.round((at / SR) * 1e6),
          data,
        });
        audioEncoder.encode(chunk);
        chunk.close();
      }

      await audioEncoder.flush();
      muxer.finalize();

      return target.buffer.byteLength;
    };

    window.__chunk = (offset, size) => {
      const view = new Uint8Array(target.buffer, offset, Math.min(size, target.buffer.byteLength - offset));
      let s = '';
      for (let i = 0; i < view.length; i += 0x8000) s += String.fromCharCode.apply(null, view.subarray(i, i + 0x8000));

      return btoa(s);
    };
  },
  { fps: FPS, width: WIDTH, height: HEIGHT, seconds },
);

const started = Date.now();
for (let i = 0; i < frames; i += 1) {
  await page.evaluate((t) => window.setTime(t), i / FPS);
  const shot = await page.screenshot({ type: 'jpeg', quality: 93, encoding: 'base64' });
  await page.evaluate((b64, index) => window.__addFrame(b64, index), shot, i);

  if (i % 60 === 0) {
    const elapsed = (Date.now() - started) / 1000;
    console.log(`frame ${i}/${frames}  ${(elapsed / Math.max(1, i + 1) * (frames - i)).toFixed(0)}s left`);
  }
}

console.log('encoding audio and finishing...');
const size = await page.evaluate(() => window.__finish());
const parts = [];
const CHUNK = 6 * 1024 * 1024;
for (let at = 0; at < size; at += CHUNK) {
  parts.push(Buffer.from(await page.evaluate((o, s) => window.__chunk(o, s), at, CHUNK), 'base64'));
}
const outPath = resolve(here, 'out', limit > 0 ? 'preview.mp4' : 'cleancv-promo.mp4');
writeFileSync(outPath, Buffer.concat(parts));
console.log('wrote', outPath, (size / 1e6).toFixed(1), 'MB');

await browser.close();
server.close();


