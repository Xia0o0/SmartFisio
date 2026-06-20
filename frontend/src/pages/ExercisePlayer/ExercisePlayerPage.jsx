import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ExercisePlayerPage.css';

// Algoritmo do MovementAnalyzer (portado para JS a partir do Python original)
class MovementAnalyzer {
  constructor() {
    this.state = 'INICIO';
    this.repCount = 0;
    this.angles = [];
    this.alertCount = 0;
    this.ANGLE_CLOSE = 80;
    this.ANGLE_FAR = 81;
    this.ANGLE_ALERT = 140;
  }

  calcAngle(p1, p2, p3) {
    const a = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const b = Math.hypot(p3[0] - p2[0], p3[1] - p2[1]);
    const c = Math.hypot(p3[0] - p1[0], p3[1] - p1[1]);
    if (a === 0 || b === 0) return 0;
    const cosC = (a * a + b * b - c * c) / (2 * a * b);
    return (Math.acos(Math.max(-1, Math.min(1, cosC))) * 180) / Math.PI;
  }

  analyze(shoulder, elbow, wrist) {
    const angle = this.calcAngle(shoulder, elbow, wrist);
    this.angles.push(angle);
    const postureAlert = angle > this.ANGLE_ALERT;
    if (postureAlert) this.alertCount++;

    if (angle < this.ANGLE_CLOSE) {
      if (this.state === 'PERFEITO' || this.state === 'LONGE') {
        this.repCount++;
      }
      this.state = 'PERTO';
    } else if (angle <= this.ANGLE_ALERT) {
      this.state = 'PERFEITO';
    } else {
      this.state = 'LONGE';
    }

    return { angle, state: this.state, reps: this.repCount, alert: postureAlert };
  }

  avgAngle() {
    if (!this.angles.length) return 0;
    return this.angles.reduce((a, b) => a + b, 0) / this.angles.length;
  }

  maxAngle() {
    return Math.max(...this.angles, 0);
  }
}

const POSE_LANDMARKS = {
  LEFT_SHOULDER: 11, LEFT_ELBOW: 13, LEFT_WRIST: 15,
  RIGHT_SHOULDER: 12, RIGHT_ELBOW: 14, RIGHT_WRIST: 16,
};

export default function ExercisePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analyzerRef = useRef(new MovementAnalyzer());
  const startTimeRef = useRef(Date.now());
  const alertsRef = useRef([]);
  const poseRef = useRef(null);
  const cameraRef = useRef(null);
  const animRef = useRef(null);

  const [exercise, setExercise] = useState(null);
  const [reps, setReps] = useState(0);
  const [angle, setAngle] = useState(0);
  const [postureStatus, setPostureStatus] = useState('waiting');
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    api.exercises.get(id).then(setExercise).catch(() => navigate('/dashboard'));
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // When cameraReady flips to true, the component re-renders and a NEW video element
  // is mounted. We must re-attach the stream to this new element.
  useEffect(() => {
    if (!cameraReady || !streamRef.current) return;
    const video = videoRef.current;
    if (video && !video.srcObject) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {});
    }
  }, [cameraReady]);

  useEffect(() => {
    if (!cameraReady || !exercise) return;

    // Start drawing camera feed immediately (even before MediaPipe loads)
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const drawFallback = () => {
      if (!canvas || !video) return;
      if (video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      // Only keep this loop if MediaPipe hasn't taken over
      if (!poseRef.current) {
        animRef.current = requestAnimationFrame(drawFallback);
      }
    };
    animRef.current = requestAnimationFrame(drawFallback);

    // Try to load MediaPipe Pose on top
    initPose();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [cameraReady, exercise]);

  const initPose = async () => {
    const Pose = window.Pose;
    if (!Pose) {
      console.warn('MediaPipe Pose não disponível — mostrando câmera sem esqueleto.');
      return; // fallback loop already shows camera feed
    }

    try {
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults(onResults);
      poseRef.current = pose;

      // Cancel fallback loop, MediaPipe takes over
      if (animRef.current) cancelAnimationFrame(animRef.current);

      const video = videoRef.current;
      const processFrame = async () => {
        if (video && video.readyState >= 2) {
          await pose.send({ image: video });
        }
        animRef.current = requestAnimationFrame(processFrame);
      };
      animRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('Erro ao inicializar MediaPipe Pose:', err);
      // Fallback loop is still running, camera feed still visible
    }
  };

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    // Match canvas size to video natural size
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the live camera frame from the video element
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      // Draw skeleton connections
      drawConnections(ctx, results.poseLandmarks, canvas.width, canvas.height);
      drawLandmarks(ctx, results.poseLandmarks, canvas.width, canvas.height);

      // Extract keypoints (use right side by default)
      const lms = results.poseLandmarks;
      const shoulder = [lms[POSE_LANDMARKS.RIGHT_SHOULDER].x, lms[POSE_LANDMARKS.RIGHT_SHOULDER].y];
      const elbow = [lms[POSE_LANDMARKS.RIGHT_ELBOW].x, lms[POSE_LANDMARKS.RIGHT_ELBOW].y];
      const wrist = [lms[POSE_LANDMARKS.RIGHT_WRIST].x, lms[POSE_LANDMARKS.RIGHT_WRIST].y];

      const result = analyzerRef.current.analyze(shoulder, elbow, wrist);
      setReps(result.reps);
      setAngle(Math.round(result.angle));

      if (result.alert) {
        setPostureStatus('danger');
        alertsRef.current.push({
          joint: 'cotovelo_direito',
          detected_angle: result.angle,
          expected_angle: 90,
          exercise_id: id,
        });
      } else if (result.state === 'PERFEITO') {
        setPostureStatus('good');
      } else {
        setPostureStatus('neutral');
      }

      // Draw angle on elbow
      const ex = Math.round(lms[POSE_LANDMARKS.RIGHT_ELBOW].x * canvas.width);
      const ey = Math.round(lms[POSE_LANDMARKS.RIGHT_ELBOW].y * canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.fillText(`${Math.round(result.angle)}°`, ex + 16, ey);
    }
    ctx.restore();
  };

  function drawConnections(ctx, lms, w, h) {
    const pairs = [[11,13],[13,15],[12,14],[14,16],[11,12],[23,24],[11,23],[12,24],
                   [23,25],[24,26],[25,27],[26,28]];
    ctx.strokeStyle = 'rgba(76, 175, 130, 0.8)';
    ctx.lineWidth = 3;
    pairs.forEach(([a, b]) => {
      if (!lms[a] || !lms[b]) return;
      ctx.beginPath();
      ctx.moveTo(lms[a].x * w, lms[a].y * h);
      ctx.lineTo(lms[b].x * w, lms[b].y * h);
      ctx.stroke();
    });
  }

  function drawLandmarks(ctx, lms, w, h) {
    const highlight = Object.values(POSE_LANDMARKS);
    lms.forEach((lm, i) => {
      const x = lm.x * w;
      const y = lm.y * h;
      ctx.beginPath();
      ctx.arc(x, y, highlight.includes(i) ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = highlight.includes(i) ? '#4CAF82' : 'rgba(76,175,130,0.4)';
      ctx.fill();
    });
  }

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleFinish = async () => {
    setSaving(true);
    try {
      const sessionData = {
        exercise_id: id,
        started_at: new Date(startTimeRef.current).toISOString(),
        finished_at: new Date().toISOString(),
        repetitions: analyzerRef.current.repCount,
        average_angle: analyzerRef.current.avgAngle(),
        max_angle: analyzerRef.current.maxAngle(),
        duration_seconds: elapsed,
      };
      const session = await api.sessions.create(sessionData);
      // Post each unique alert (max 5 to avoid spam)
      const alerts = alertsRef.current.slice(0, 5);
      for (const alert of alerts) {
        await api.sessions.createAlert({ ...alert, activity_log_id: session?.id }).catch(() => {});
      }
      navigate('/progress');
    } catch (err) {
      alert('Erro ao salvar sessão: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const statusConfig = {
    waiting: { label: 'Aguardando movimento...', color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
    good:    { label: '✓ Postura Correta', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    neutral: { label: '➤ Continue o movimento', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    danger:  { label: '⚠ Atenção à Postura!', color: '#E05252', bg: 'rgba(224,82,82,0.15)' },
  };

  const currentStatus = statusConfig[postureStatus];

  return (
    <div className="player-page">
      {/* Header */}
      <header className="player-header">
        <button id="btn-back" className="player-back" onClick={() => navigate('/dashboard')}>
          ← Voltar
        </button>
        <div className="player-header__info">
          <h2>{exercise?.name || 'Carregando...'}</h2>
          <span className="badge badge-success">{exercise?.category?.name}</span>
        </div>
        <div className="player-timer">
          <span className="timer-icon">⏱</span>
          <span>{formatTime(elapsed)}</span>
        </div>
      </header>

      <div className="player-body">
        {/* Left: Demo Video */}
        <div className="player-panel player-panel--guide">
          <h3 className="panel-title">Como fazer</h3>
          <div className="guide-video-wrap">
            <img
              src={`https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80`}
              alt="Demonstração do exercício"
              className="guide-video-placeholder"
            />
            <div className="guide-overlay">
              <span>📹 Vídeo demonstrativo</span>
            </div>
          </div>
          {exercise && (
            <div className="guide-instructions">
              <p>{exercise.description}</p>
              <ul className="guide-tips">
                <li>🔹 Realize o movimento de forma controlada</li>
                <li>🔹 Respire normalmente durante os exercícios</li>
                <li>🔹 Pare imediatamente se sentir dor</li>
              </ul>
            </div>
          )}
        </div>

        {/* Right: Camera */}
        <div className="player-panel player-panel--camera">
          <h3 className="panel-title">Sua Câmera</h3>

          {!cameraReady ? (
            <div className="camera-permission-card">
              <div className="camera-permission-icon">📷</div>
              <h4>Ativar Câmera</h4>
              <p>Precisamos de acesso à sua câmera para analisar seus movimentos. Nenhuma imagem é salva ou enviada.</p>
              <button
                id="btn-enable-camera"
                className="btn btn-dark btn-lg"
                onClick={() => {
                  navigator.mediaDevices.getUserMedia({ video: true })
                    .then((stream) => {
                      streamRef.current = stream;
                      if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                      }
                      setCameraReady(true);
                    })
                    .catch(() => setCameraError(true));
                }}
              >
                🔒 Ativar Câmera com Privacidade Total
              </button>
              {cameraError && (
                <p className="camera-error">Não foi possível acessar a câmera. Verifique as permissões do navegador.</p>
              )}
            </div>
          ) : (
            <div className="camera-wrap">
              {/* Video is hidden — canvas renders the annotated frame on top */}
              <video ref={videoRef} className="camera-video" autoPlay playsInline muted style={{ display: 'none' }} />
              <canvas ref={canvasRef} className="camera-canvas" />

              <div className="posture-feedback" style={{ background: currentStatus.bg, color: currentStatus.color }}>
                {currentStatus.label}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="player-stats">
            <div className="stat-box">
              <span className="stat-label">Repetições</span>
              <span className="stat-value" id="rep-counter">{reps}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Ângulo Atual</span>
              <span className="stat-value" id="angle-display">{angle}°</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Alertas</span>
              <span className="stat-value" style={{ color: analyzerRef.current?.alertCount > 0 ? 'var(--color-danger)' : 'var(--color-brand)' }}>
                {analyzerRef.current?.alertCount || 0}
              </span>
            </div>
          </div>

          <button
            id="btn-finish-session"
            className="btn btn-danger btn-block btn-lg"
            onClick={handleFinish}
            disabled={saving}
          >
            {saving ? <span className="loading-spinner" /> : '✓ Concluir Sessão'}
          </button>
        </div>
      </div>
    </div>
  );
}
