import { getToken } from './api'

const SOUND_STORAGE_KEY = 'kds_sound_enabled'
const ALERT_MP3 = '/sounds/tinhtinh.mp3'

let currentAudio = null
let currentFinish = null
let audioCtx = null
let draining = false
let aborted = false
let kdsActive = false
const queue = []

function unlock() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) {
      if (!audioCtx) audioCtx = new AudioContext()
      if (audioCtx.state === 'suspended') audioCtx.resume()
    }
  } catch {
    // ignore
  }
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio = null
  }
  const finish = currentFinish
  currentFinish = null
  finish?.()
}

function stop() {
  aborted = true
  queue.length = 0
  try {
    window.speechSynthesis?.cancel()
  } catch {
    // ignore
  }
  stopCurrentAudio()
  draining = false
}

function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    if (!audioCtx) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const ctx = audioCtx
    const now = ctx.currentTime

    const beep = (freq, start, duration, volume) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + start)
      gain.gain.setValueAtTime(0.0001, now + start)
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + duration + 0.05)
    }

    beep(880, 0, 0.35, 0.28)
    beep(1175, 0.14, 0.45, 0.32)
  } catch (err) {
    console.warn('AudioContext play error:', err)
  }
}

function splitVietnameseChunks(text, maxLen = 160) {
  const clean = String(text).replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= maxLen) return [clean]

  const parts = []
  let rest = clean
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(' ', maxLen)
    if (cut < 40) cut = maxLen
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

function playAudioUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url)
    currentAudio = audio
    const done = () => {
      if (currentFinish !== done) return
      currentFinish = null
      if (currentAudio === audio) currentAudio = null
      audio.onended = null
      audio.onerror = null
      resolve()
    }
    currentFinish = done
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  })
}

async function playAlertMp3() {
  try {
    await playAudioUrl(`${ALERT_MP3}?v=1`)
  } catch {
    playChime()
    await wait(400)
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function speakWithGoogle(text) {
  const token = getToken()
  const res = await fetch(`/api/v1/tts?text=${encodeURIComponent(text)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error('tts-failed')
  }
  const blob = await res.blob()
  if (!blob || blob.size < 100) {
    throw new Error('tts-empty')
  }
  const url = URL.createObjectURL(blob)
  try {
    await playAudioUrl(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function speakWithBrowser(text) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('no-speech-synthesis'))
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'vi-VN'
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('browser-tts-error'))
    window.speechSynthesis.speak(utterance)
  })
}

async function playJob({ text, playAlert }) {
  const chunks = splitVietnameseChunks(text)
  if (playAlert) {
    await playAlertMp3()
    if (aborted) return
  }
  for (const chunk of chunks) {
    if (aborted) return
    try {
      await speakWithGoogle(chunk)
    } catch {
      if (aborted) return
      await speakWithBrowser(chunk)
    }
  }
}

async function drain() {
  if (draining) return
  draining = true
  unlock()
  while (queue.length && !aborted && getSoundEnabled()) {
    const job = queue.shift()
    try {
      await playJob(job)
    } catch (err) {
      console.warn('Cannot speak Vietnamese announcement:', err)
      playChime()
    }
    if (!aborted && queue.length) {
      await wait(250)
    }
  }
  draining = false
}

function enqueue(text, { playAlert = false, replaceReminders = false } = {}) {
  if (!kdsActive || !text || typeof window === 'undefined' || !getSoundEnabled()) return
  aborted = false
  if (replaceReminders) {
    for (let i = queue.length - 1; i >= 0; i -= 1) {
      if (queue[i].kind === 'reminder') queue.splice(i, 1)
    }
  }
  if (queue.some(job => job.text === text)) return
  queue.push({ text, playAlert, kind: replaceReminders ? 'reminder' : 'announce' })
  drain()
}

function speakText(text, options = {}) {
  enqueue(text, options)
}

function countItems(items = []) {
  return items.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1
}

function announceNewOrder({ tableName, itemCount, items } = {}) {
  const count = itemCount || countItems(items)
  enqueue(`Có đơn mới. ${tableName || 'Có bàn'}. ${count} món.`, { playAlert: true })
}

function announcePendingQueue(groups = []) {
  if (!groups.length) return
  groups.forEach(group => {
    enqueue(`Có đơn chờ pha chế. ${group.tableName}. ${countItems(group.items)} món.`, { playAlert: true })
  })
}

function remindPending(count) {
  if (!count) return
  if (draining || queue.length) return
  enqueue(`Nhắc nhở. Còn ${count} đơn đang chờ pha chế.`, { playAlert: true, replaceReminders: true })
}

function setKdsActive(active) {
  kdsActive = Boolean(active)
  if (!kdsActive) stop()
}

function getSoundEnabled() {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem(SOUND_STORAGE_KEY)
  return saved !== null ? JSON.parse(saved) : true
}

function setSoundEnabled(enabled) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(enabled))
  if (!enabled) stop()
}

export const audioService = {
  playChime,
  speakText,
  announceNewOrder,
  announcePendingQueue,
  remindPending,
  getSoundEnabled,
  setSoundEnabled,
  setKdsActive,
  unlock,
  stop,
}
