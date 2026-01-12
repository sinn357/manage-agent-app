/**
 * 알림 소리 재생 유틸리티
 */

let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;

/**
 * Web Audio API로 부드러운 벨 소리 생성
 */
function createBellSound(context: AudioContext): AudioBuffer {
  const sampleRate = context.sampleRate;
  const duration = 0.5; // 0.5초
  const numSamples = sampleRate * duration;
  const buffer = context.createBuffer(1, numSamples, sampleRate);
  const channel = buffer.getChannelData(0);

  // 부드러운 벨 소리 (C6 음 - 1046.5 Hz)
  const frequency = 1046.5;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // 사인파 + 배음 (2배, 3배 주파수) + 감쇠
    const decay = Math.exp(-t * 5);
    channel[i] = decay * (
      0.5 * Math.sin(2 * Math.PI * frequency * t) + // 기본 주파수
      0.3 * Math.sin(2 * Math.PI * frequency * 2 * t) + // 2배 배음
      0.2 * Math.sin(2 * Math.PI * frequency * 3 * t)   // 3배 배음
    );
  }

  return buffer;
}

/**
 * 알림 소리 재생
 */
export async function playNotificationSound(): Promise<void> {
  try {
    // AudioContext 초기화 (한 번만)
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // 버퍼 생성 (한 번만)
    if (!audioBuffer) {
      audioBuffer = createBellSound(audioContext);
    }

    // 소리 재생
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    // 볼륨 조절 (30%)
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.3;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    source.start(0);
  } catch (error) {
    console.error('[NotificationSound] Failed to play sound:', error);
  }
}

/**
 * 사용자 설정 기반 소리 재생 여부 확인
 */
export function shouldPlaySound(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const settings = localStorage.getItem('notification-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.enabled && parsed.sound !== false; // sound 설정이 없으면 기본 true
    }
  } catch (error) {
    console.error('[NotificationSound] Failed to read settings:', error);
  }

  return true; // 기본값: 소리 재생
}
