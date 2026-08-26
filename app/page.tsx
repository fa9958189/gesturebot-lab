'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HandLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { RobotFigure } from './components/RobotFigure';
import {
  fingerCurls,
  NEUTRAL_POSE,
  poseFromHand,
  smoothPose,
  type MotionPose,
} from './lib/motion';

const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const fingers = [
  { key: '01', label: 'Polegar', action: 'Quadril + joelho E', color: 'lime' },
  { key: '02', label: 'Indicador', action: 'Ombro + cotovelo E', color: 'amber' },
  { key: '03', label: 'Médio', action: 'Cabeça X / Y', color: 'cyan' },
  { key: '04', label: 'Anelar', action: 'Ombro + cotovelo D', color: 'amber' },
  { key: '05', label: 'Mínimo', action: 'Quadril + joelho D', color: 'lime' },
];

type Phase = 'idle' | 'loading' | 'running' | 'error';

function pointColor(index: number) {
  if (index <= 4) return '#ccf46f';
  if (index <= 8) return '#ffb454';
  if (index <= 12) return '#73e4dc';
  if (index <= 16) return '#ffb454';
  return '#ccf46f';
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  landmarksList: NormalizedLandmark[][],
) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();

  ctx.fillStyle = 'rgba(2, 7, 4, 0.15)';
  ctx.fillRect(0, 0, width, height);

  landmarksList.forEach((landmarks) => {
    HAND_CONNECTIONS.forEach(([start, end]) => {
      const from = landmarks[start];
      const to = landmarks[end];
      ctx.beginPath();
      ctx.moveTo((1 - from.x) * width, from.y * height);
      ctx.lineTo((1 - to.x) * width, to.y * height);
      ctx.lineWidth = Math.max(1.5, width / 520);
      ctx.strokeStyle = end > 0 ? `${pointColor(end)}bb` : '#eaf1e8aa';
      ctx.shadowColor = pointColor(end);
      ctx.shadowBlur = 7;
      ctx.stroke();
    });

    landmarks.forEach((landmark, index) => {
      const x = (1 - landmark.x) * width;
      const y = landmark.y * height;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, width / 240), 0, Math.PI * 2);
      ctx.fillStyle = index === 0 ? '#ffffff' : pointColor(index);
      ctx.shadowColor = pointColor(index);
      ctx.shadowBlur = 11;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(5, width / 170), 0, Math.PI * 2);
      ctx.lineWidth = Math.max(1, width / 900);
      ctx.strokeStyle = 'rgba(255,255,255,.52)';
      ctx.stroke();
    });
  });
  ctx.shadowBlur = 0;
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const lastInferenceRef = useRef(0);
  const lastUiUpdateRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsStartRef = useRef(0);
  const poseRef = useRef<MotionPose>({ ...NEUTRAL_POSE });

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [pose, setPose] = useState<MotionPose>(NEUTRAL_POSE);
  const [curls, setCurls] = useState<number[]>([0, 0, 0, 0, 0]);
  const [telemetry, setTelemetry] = useState({ hands: 0, fps: 0, latency: 0, confidence: 0, side: '—' });

  const stopTracking = useCallback(() => {
    activeRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    poseRef.current = { ...NEUTRAL_POSE };
    setPose(NEUTRAL_POSE);
    setCurls([0, 0, 0, 0, 0]);
    setTelemetry({ hands: 0, fps: 0, latency: 0, confidence: 0, side: '—' });
    setPhase('idle');
  }, []);

  useEffect(() => () => {
    activeRef.current = false;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    landmarkerRef.current?.close();
  }, []);

  const startTracking = useCallback(async () => {
    if (phase === 'running') {
      stopTracking();
      return;
    }

    setError('');
    setPhase('loading');

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported-camera');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('video-not-ready');
      video.srcObject = stream;
      await video.play();

      if (!landmarkerRef.current) {
        const { FilesetResolver, HandLandmarker: HandLandmarkerClass } = await import('@mediapipe/tasks-vision');
        const vision = await FilesetResolver.forVisionTasks(WASM_ROOT);
        const options = {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' as const },
          runningMode: 'VIDEO' as const,
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.5,
        };

        try {
          landmarkerRef.current = await HandLandmarkerClass.createFromOptions(vision, options);
        } catch {
          landmarkerRef.current = await HandLandmarkerClass.createFromOptions(vision, {
            ...options,
            baseOptions: { modelAssetPath: MODEL_URL },
          });
        }
      }

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('canvas-not-ready');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      activeRef.current = true;
      lastVideoTimeRef.current = -1;
      lastInferenceRef.current = 0;
      lastUiUpdateRef.current = 0;
      frameCountRef.current = 0;
      fpsStartRef.current = performance.now();
      setPhase('running');

      const renderLoop = (now: number) => {
        if (!activeRef.current || !videoRef.current || !canvasRef.current || !landmarkerRef.current) return;
        const liveVideo = videoRef.current;
        const liveCanvas = canvasRef.current;
        const ctx = liveCanvas.getContext('2d');

        if (liveVideo.videoWidth && (liveCanvas.width !== liveVideo.videoWidth || liveCanvas.height !== liveVideo.videoHeight)) {
          liveCanvas.width = liveVideo.videoWidth;
          liveCanvas.height = liveVideo.videoHeight;
        }

        if (ctx && liveVideo.readyState >= 2 && liveVideo.currentTime !== lastVideoTimeRef.current && now - lastInferenceRef.current >= 33) {
          const started = performance.now();
          const result = landmarkerRef.current.detectForVideo(liveVideo, now);
          const latency = performance.now() - started;
          lastVideoTimeRef.current = liveVideo.currentTime;
          lastInferenceRef.current = now;
          frameCountRef.current += 1;
          drawFrame(ctx, liveVideo, result.landmarks);

          const activeLandmarks = result.landmarks[0];
          const nextCurls = activeLandmarks ? fingerCurls(activeLandmarks) : [0, 0, 0, 0, 0];
          const target = activeLandmarks ? poseFromHand(activeLandmarks, nextCurls) : NEUTRAL_POSE;
          poseRef.current = smoothPose(poseRef.current, target);

          if (now - lastUiUpdateRef.current >= 80) {
            const elapsed = Math.max(now - fpsStartRef.current, 1);
            const measuredFps = Math.round((frameCountRef.current * 1000) / elapsed);
            if (elapsed > 1000) {
              frameCountRef.current = 0;
              fpsStartRef.current = now;
            }
            const handedness = result.handedness?.[0]?.[0];
            setCurls(nextCurls);
            setPose({ ...poseRef.current });
            setTelemetry({
              hands: result.landmarks.length,
              fps: measuredFps,
              latency: Math.round(latency),
              confidence: handedness ? Math.round(handedness.score * 100) : 0,
              side: handedness?.categoryName === 'Left' ? 'Esquerda' : handedness ? 'Direita' : '—',
            });
            lastUiUpdateRef.current = now;
          }
        }

        frameRef.current = requestAnimationFrame(renderLoop);
      };

      frameRef.current = requestAnimationFrame(renderLoop);
    } catch (caught) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      const cameraError = caught as DOMException | Error;
      if (cameraError.name === 'NotAllowedError') {
        setError('A câmera foi bloqueada. Libere a permissão no navegador e tente novamente.');
      } else if (cameraError.message === 'unsupported-camera') {
        setError('Este navegador não oferece acesso à câmera. Abra o projeto em um navegador moderno.');
      } else {
        setError('Não foi possível iniciar o rastreamento. Verifique a câmera e tente outra vez.');
      }
      setPhase('error');
    }
  }, [phase, stopTracking]);

  const isRunning = phase === 'running';
  const isLoading = phase === 'loading';
  const sync = telemetry.hands ? telemetry.confidence : 0;

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /></div>
          <div><p className="eyebrow">Motion interface</p><h1>GestureBot <b>Lab</b></h1></div>
        </div>

        <div className="session-status">
          <span className={`status-dot ${isRunning ? 'online' : ''}`} />
          <div>
            <p>{isRunning ? (telemetry.hands ? 'Mão detectada' : 'Procurando mão') : isLoading ? 'Preparando modelo' : 'Sessão pronta'}</p>
            <span>{isRunning ? `${telemetry.side} · processamento local` : 'aguardando câmera'}</span>
          </div>
        </div>

        <div className="top-actions">
          <button className="ghost-button" type="button" onClick={() => document.querySelector('#mapeamento')?.scrollIntoView({ behavior: 'smooth' })}>Mapeamento</button>
          <button className={`power-button ${isRunning ? 'stop' : ''}`} type="button" onClick={startTracking} disabled={isLoading} aria-pressed={isRunning}>
            <span>{isRunning ? '■' : '↗'}</span> {isLoading ? 'Carregando' : isRunning ? 'Parar' : 'Iniciar'}
          </button>
        </div>
      </header>

      <section className="workspace">
        <div className="camera-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Entrada ao vivo</p><h2>Rastreamento das mãos</h2></div>
            <div className="telemetry-row" aria-label="Telemetria">
              <span><i className={`live-dot ${isRunning ? 'online' : ''}`} /> {isRunning ? 'LIVE' : 'OFF'}</span>
              <span>{telemetry.hands} {telemetry.hands === 1 ? 'mão' : 'mãos'}</span>
              <span>{telemetry.fps || '--'} FPS</span>
            </div>
          </div>

          <div className={`camera-stage ${isRunning ? 'has-feed' : ''}`}>
            <video ref={videoRef} className="source-video" playsInline muted aria-hidden="true" />
            <canvas ref={canvasRef} className="tracking-canvas" aria-label="Vídeo da câmera com os pontos rastreados sobre as mãos" />
            <div className="corner corner-tl" /><div className="corner corner-tr" />
            <div className="corner corner-bl" /><div className="corner corner-br" />

            {!isRunning && (
              <div className="camera-empty" role={phase === 'error' ? 'alert' : undefined}>
                <div className={`palm-preview ${isLoading ? 'is-loading' : ''}`} aria-hidden="true">
                  <span className="palm-dot dot-1" /><span className="palm-dot dot-2" /><span className="palm-dot dot-3" />
                  <span className="palm-dot dot-4" /><span className="palm-dot dot-5" /><span className="palm-dot dot-base" />
                  <i className="palm-line line-1" /><i className="palm-line line-2" /><i className="palm-line line-3" />
                  <i className="palm-line line-4" /><i className="palm-line line-5" />
                </div>
                <p>{isLoading ? 'Preparando o rastreamento' : phase === 'error' ? 'A câmera não iniciou' : 'Mostre sua mão para começar'}</p>
                <span>{error || (isLoading ? 'Carregando o modelo de visão computacional…' : 'Permita o acesso à câmera. O processamento acontece no seu dispositivo.')}</span>
                {!isLoading && <button type="button" onClick={startTracking}>{phase === 'error' ? 'Tentar novamente' : 'Ativar câmera'} <b>→</b></button>}
              </div>
            )}

            <div className="stage-note"><span>01</span>{isRunning ? 'Dobre os dedos; mova o médio para orientar a cabeça' : 'Mantenha mãos e pulsos visíveis'}</div>
          </div>
        </div>

        <aside className="robot-panel">
          <div className="panel-heading compact">
            <div><p className="eyebrow">Saída</p><h2>Unidade GB—01</h2></div>
            <span className={`idle-pill ${telemetry.hands ? 'active' : ''}`}>{telemetry.hands ? 'Vinculado' : 'Neutro'}</span>
          </div>

          <div className="robot-stage">
            <div className="axis-label axis-y">Y</div><div className="axis-label axis-x">X</div>
            <RobotFigure pose={pose} live={telemetry.hands > 0} />
            <div className="head-readout" aria-label="Orientação da cabeça">
              <span>Cabeça</span>
              <strong>X {Math.round(pose.headYaw)}°</strong>
              <strong>Y {Math.round(pose.headPitch)}°</strong>
            </div>
            <div className="robot-caption"><span>Sincronia</span><strong>{String(sync).padStart(2, '0')}%</strong></div>
          </div>

          <div className="robot-stats">
            <div><span>Latência</span><strong>{telemetry.latency || '—'} ms</strong></div>
            <div><span>Confiança</span><strong>{telemetry.confidence || '—'}%</strong></div>
            <div><span>Modo</span><strong>Espelho</strong></div>
          </div>
        </aside>
      </section>

      <section className="mapping-strip" id="mapeamento">
        <div className="mapping-title"><p className="eyebrow">Mapa de controle · mão ativa</p><h2>Cada dedo. Um movimento.</h2></div>
        <div className="finger-map">
          {fingers.map((finger, index) => (
            <div className={`finger-card ${curls[index] > .32 ? 'active' : ''}`} key={finger.key}>
              <span className={`finger-index ${finger.color}`}>{finger.key}</span>
              <div><p>{finger.label}</p><strong>{finger.action}</strong></div>
              <span className="finger-value">{Math.round(curls[index] * 100)}%</span>
              <span className="finger-meter"><i className={finger.color} style={{ width: `${Math.round(curls[index] * 100)}%` }} /></span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
