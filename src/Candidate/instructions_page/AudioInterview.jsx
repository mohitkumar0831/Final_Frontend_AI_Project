import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Timer from '../../RecruiterAdmin/Component/Timer.jsx';
import aiAvatar from '../../img/interviewer.png';
import * as blazeface from '@tensorflow-models/blazeface';
import '@tensorflow/tfjs';

export default function AudioInterview({
  questions = [],
  candidateId, // from GiveTest
  questionSetId, // from GiveTest
  baseUrl = window.REACT_APP_BASE_URL || 'http://127.0.0.1:5000',
  onClose = () => {},
  onComplete = () => {},
  showMultipleFaces = false,
  faceEventRef = null,
  showTabSwitch = false,
  remainingTime = null,
  onAudioTimeUp = null,
  updateRemainingTime = null,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const qaListRef = useRef([]);
  const isPlayingRef = useRef(false); // Guard to prevent concurrent TTS calls
  const firstQuestionPlayedRef = useRef(false); // Guard to ensure first question plays only once
  const firstQuestionTimeoutRef = useRef(null); // Store timeout ID for cleanup

  const modelRef = useRef(null);
  const detectLoopRef = useRef(null);
  const [localMultipleFaces, setLocalMultipleFaces] = useState(false);
  const missCountRef = useRef(0);
  const prevReasonRef = useRef(null);
  const multipleFacesLoggedRef = useRef(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState('idle');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answerLanguage, setAnswerLanguage] = useState('en');
  // Removed unused loadingMedia state

  // Unified getter for question prompt
  const getPrompt = (q) =>
    q?.question || q?.prompt_text || q?.content?.prompt || '';

  // Audio recorder
  // const startAudioRecording = () => {
  //   if (!streamRef.current) return;
  //   if (isListening) stopSpeechRecognition(); // prevent conflict

  //   try {
  //     audioChunksRef.current = [];
  //     const recorder = new MediaRecorder(streamRef.current);
  //     recorder.ondataavailable = (e) => {
  //       if (e.data.size > 0) audioChunksRef.current.push(e.data);
  //     };
  //     recorder.start(500);
  //     audioRecorderRef.current = recorder;

  //     setIsRecordingAudio(true);
  //     setStatus('Recording audio answer...');
  //   } catch {
  //     alert('Cannot start audio recording.');
  //   }
  // };

  // const stopAudioRecording = () => {
  //   return new Promise((resolve) => {
  //     const recorder = audioRecorderRef.current;
  //     if (!recorder) {
  //       setIsRecordingAudio(false);
  //       setStatus('Recorded audio');
  //       return resolve();
  //     }

  //     const onStop = () => {
  //       try { recorder.removeEventListener('stop', onStop); } catch (e) {}
  //       audioRecorderRef.current = null;
  //       setIsRecordingAudio(false);
  //       setStatus('Recorded audio');
  //       resolve();
  //     };

  //     try {
  //       recorder.addEventListener('stop', onStop);
  //       try { recorder.stop(); } catch (e) { onStop(); }
  //     } catch (e) {
  //       onStop();
  //     }
  //   });
  // };

  // Initialize camera + mic
  useEffect(() => {
    let mounted = true;

    async function initMedia() {
      try {
        // Removed setLoadingMedia(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true; // Chrome autoplay
        }

        // Auto-start audio recording once media stream is ready
        try { startAudioRecording(); } catch (e) {}
      } catch (err) {
        console.error('Media error', err);
        alert('Please allow camera and microphone access.');
      } finally {
        // Removed setLoadingMedia(false);
      }
    }

    initMedia();

    return () => {
      mounted = false;
      // Stop all tracks
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
      // Ensure recorder is stopped
      try {
        if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
          audioRecorderRef.current.stop();
        }
      } catch (e) {}
    };
  }, []);

  // TTS playback (server + fallback)
  const playQuestionTTS = React.useCallback(
    async (text) => {
      if (!text) return;
      
      // Prevent concurrent TTS calls
      if (isPlayingRef.current) {
        console.log('[AudioInterview] TTS already playing, skipping duplicate call');
        return;
      }
      
      isPlayingRef.current = true;

      window.speechSynthesis.cancel();
      setStatus('Speaking question...');
  
      try {
        // Validate baseUrl is a string
        const finalBaseUrl = typeof baseUrl === 'string' ? baseUrl : 'http://127.0.0.1:5000';
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
          const res = await fetch(`${finalBaseUrl}/tts_question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (res.ok) {
            const data = await res.json();
            if (data?.status === 'success' && data?.tts_url) {
              try {
                const audio = new Audio(`${finalBaseUrl}${data.tts_url}`);
                await audio.play();
                await new Promise((resolve) => (audio.onended = resolve));
                setStatus('Awaiting answer');
                isPlayingRef.current = false;
                return;
              } catch (audioErr) {
                console.warn('Audio playback failed, using browser fallback.', audioErr);
              }
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          console.warn('Server TTS failed, using browser fallback.', fetchErr.message);
        }
      } catch (err) {
        console.warn('TTS error:', err.message);
      }

      // Browser fallback
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = answerLanguage === 'hi' ? 'hi-IN' : 'en-US';
        window.speechSynthesis.speak(u);
        await new Promise((resolve) => {
          u.onend = resolve;
          setTimeout(resolve, 15000); // max wait fallback
        });
      } catch (err) {
        console.error('Browser TTS failed:', err);
      }
      setStatus('Awaiting answer');
      isPlayingRef.current = false;
    },
    [baseUrl, answerLanguage]
  );

  // Audio recorder
  const startAudioRecording = () => {
    if (!streamRef.current) return;
    if (isListening) stopSpeechRecognition(); // prevent conflict

    try {
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(streamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(500);
      audioRecorderRef.current = recorder;

      setIsRecordingAudio(true);
      setStatus('Recording audio answer...');
    } catch {
      alert('Cannot start audio recording.');
    }
  };

  const stopAudioRecording = () => {
    return new Promise((resolve) => {
      const recorder = audioRecorderRef.current;
      if (!recorder) {
        setIsRecordingAudio(false);
        setStatus('Recorded audio');
        return resolve();
      }

      const onStop = () => {
        try { recorder.removeEventListener('stop', onStop); } catch (e) {}
        audioRecorderRef.current = null;
        setIsRecordingAudio(false);
        setStatus('Recorded audio');
        resolve();
      };

      try {
        recorder.addEventListener('stop', onStop);
        try { recorder.stop(); } catch (e) { onStop(); }
      } catch (e) {
        onStop();
      }
    });
  };

  // STT
  const startSpeechRecognition = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert('Speech recognition not supported.');
      return;
    }
    if (isRecordingAudio) stopAudioRecording(); // prevent conflict

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = answerLanguage === 'hi' ? 'hi-IN' : 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setStatus('🎤 Listening...');
    };
    rec.onresult = (event) => {
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
      }
      if (final.trim()) setCurrentAnswer((prev) => prev + ' ' + final.trim());
    };
    rec.onerror = (e) => console.error('STT error', e);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    rec.start();
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  // Submit answer
  const submitCurrentAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert('Please provide an answer.');
      return;
    }

    let audioFile = null;
    // Ensure recorder is stopped and final chunk is collected
    if (isRecordingAudio) await stopAudioRecording();

    if (audioChunksRef.current.length) {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const filename = `answer_${candidateId}_${currentIndex}.webm`;
      audioFile = new File([blob], filename, { type: 'audio/webm' });
    }

    const questionText = getPrompt(questions[currentIndex]);
    const qa = {
      question: questionText,
      questionId: questions[currentIndex]?.id || null,
      answer: currentAnswer.trim(),
      audioFile,
      timestamp: new Date().toISOString(),
    };

    // accumulate this QA so we have answers for all questions
    qaListRef.current.push(qa);

    // Call onComplete after last question with the full list
    if (currentIndex + 1 >= questions.length) {
      onComplete([...qaListRef.current]);
      // stop stream
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      // clear accumulated list for safety
      qaListRef.current = [];
    }
    setCurrentAnswer('');
    stopSpeechRecognition();
    audioChunksRef.current = [];

    // save to backend (best effort)
    const fd = new FormData();
    fd.append('candidate_id', candidateId);
    fd.append("question_set_id", questionSetId);
    fd.append("qa_data", JSON.stringify([qa]));
    if (audioFile) fd.append('audio', audioFile);
    fetch(`${baseUrl}/v1/upload_audio`, { method: 'POST', body: fd }).catch(() => {});

    // Move to next question
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setStatus('Click "Replay Question" to hear the next question.');
    } else {
      setStatus('Interview complete');
    }
  };

  // Face detection on the movable preview: reuse BlazeFace logic used elsewhere
  useEffect(() => {
    let mounted = true;
    const startLoop = () => {
      detectLoopRef.current = setInterval(async () => {
        try {
          const videoEl = videoRef.current;
          if (!videoEl || videoEl.readyState < 2 || !modelRef.current) return;
          const faces = await modelRef.current.estimateFaces(videoEl, false);
          console.log('[AudioInterview][faceDetect] faces=', faces?.length || 0);
          if (faces && faces.length > 1) {
            if (!multipleFacesLoggedRef.current) {
              console.log('[AudioInterview] detected >1 face');
              multipleFacesLoggedRef.current = true;
            }
            missCountRef.current = 0;
            setLocalMultipleFaces(true);
            try { faceEventRef?.current?.({ type: 'multiple_faces', count: faces.length }); } catch (e) {}
            return;
          }

          if (faces && faces.length === 1) {
            missCountRef.current = 0;
            setLocalMultipleFaces(false);
            try { faceEventRef?.current?.({ type: 'single_face' }); } catch (e) {}
            return;
          }

          // No faces: allow a couple misses before treating as no-face
          missCountRef.current += 1;
          if (missCountRef.current >= 2) {
            missCountRef.current = 0;
            setLocalMultipleFaces(false);
            try { faceEventRef?.current?.({ type: 'no_face' }); } catch (e) {}
          }
        } catch (err) {
          // ignore detect errors
        }
      }, 1500);
    };

    const init = async () => {
      try {
        modelRef.current = await blazeface.load();
        if (!mounted) return;
        startLoop();
      } catch (err) {
        console.warn('AudioInterview face model load failed', err);
      }
    };

    init();

    return () => {
      mounted = false;
      clearInterval(detectLoopRef.current);
    };
  }, []);

  // Determine the current alert reason and whether UI should be blurred
  const currentReason = showMultipleFaces || localMultipleFaces ? 'multiple_faces' : showTabSwitch ? 'tab_switch' : null;
  const effectiveMultiple = !!currentReason;

  // Raise a single alert when we transition into any alert reason, and log changes
  useEffect(() => {
    if (currentReason) {
      // Only show alert if no alert is currently shown (prevReasonRef is null)
      if (prevReasonRef.current === null) {
        if (currentReason === 'multiple_faces') {
          console.log('[AudioInterview] Multiple faces detected (effective).');
          try { alert('🚨 Multiple faces detected — page blurred. Please ensure only you are on camera.'); } catch (e) {}
        } 
        // else if (currentReason === 'tab_switch') {
        //   console.log('[AudioInterview] Tab switch detected (effective).');
        //   try { alert('⚠️ Tab switch detected — page blurred. Please return to the test tab.'); } catch (e) {}
        // }
        prevReasonRef.current = currentReason;
      }
    } else if (!currentReason && prevReasonRef.current) {
      // Clear alert only when reason becomes null
      console.log('[AudioInterview] Alert cleared.');
      prevReasonRef.current = null;
    }
  }, [currentReason]);

  // Auto-play first question (only once on mount)
  useEffect(() => {
    // Stop any existing speech to prevent duplicates
    window.speechSynthesis.cancel();
    
    if (questions.length > 0 && !firstQuestionPlayedRef.current) {
      firstQuestionPlayedRef.current = true;
      isPlayingRef.current = false; // Ensure flag is reset for this call
      setTimeout(() => playQuestionTTS(getPrompt(questions[0])), 500);
    }
    
    return () => {
      // Cleanup for StrictMode
      window.speechSynthesis.cancel();
    };
  }, []); // Empty dependency array - run only once on mount

  if (!candidateId || !questionSetId) {
    return (
      <div className="flex h-dvh max-h-dvh w-full items-center justify-center overflow-hidden bg-[#eef0f4] px-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 24 }}
          className="w-full max-w-md rounded-2xl border-2 border-red-200 bg-white p-8 text-center shadow-xl"
        >
          <div className="text-4xl text-amber-500">⚠</div>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Session error</h2>
          <p className="mt-2 text-sm text-gray-600">Candidate or question set ID is missing. Return to the test and try again.</p>
        </motion.div>
      </div>
    );
  }

  const questionText = getPrompt(questions[currentIndex]) || 'Loading…';

  return (
    <div className="relative z-50 flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-[#eef0f4] font-sans text-gray-900 antialiased">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 120% 80% at 50% -30%, rgba(124, 105, 239, 0.08), transparent), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(124, 105, 239, 0.06), transparent)',
        }}
      />

      {effectiveMultiple && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-14 z-[70] max-w-[92vw] -translate-x-1/2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs font-semibold text-amber-950 shadow-lg sm:text-sm">
            Multiple faces detected — stay alone in frame.
          </div>
        </>
      )}

      <header
        className={`relative z-10 flex shrink-0 items-center justify-between gap-2 border-b border-gray-200/80 bg-white/95 px-3 py-2 shadow-md backdrop-blur-md sm:gap-4 sm:px-4 sm:py-2.5 ${
          effectiveMultiple ? 'pointer-events-none blur-sm' : ''
        }`}
        style={{ boxShadow: '0 4px 24px rgba(124, 105, 239, 0.06), inset 0 -1px 0 rgba(255,255,255,0.8)' }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C69EF] to-[#a855f7] text-white shadow-md sm:h-10 sm:w-10">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">Online assessment</p>
            <p className="truncate text-sm font-bold text-gray-900 sm:text-base">
              Audio interview ·{' '}
              <span className="text-[#7C69EF]">Q{currentIndex + 1}</span>
              <span className="font-semibold text-gray-400"> / {questions.length}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden h-8 w-px bg-gray-200 sm:block" aria-hidden />
          <div className="[&>div]:rounded-lg [&>div]:px-2 [&>div]:py-1 [&>div]:text-sm [&>div]:font-bold">
            <Timer
              timeLeft={typeof remainingTime === 'number' ? remainingTime : null}
              onTimeUp={() => {
                if (onAudioTimeUp) onAudioTimeUp();
              }}
            />
          </div>
          <select
            value={answerLanguage}
            onChange={(e) => setAnswerLanguage(e.target.value)}
            className="rounded-xl border border-gray-200 bg-[#f3f4f6] py-1 pl-2 pr-7 text-xs font-semibold text-gray-800 focus:border-[#7C69EF] focus:outline-none focus:ring-2 focus:ring-[#7C69EF]/20 sm:py-1.5 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:h-9 sm:w-9"
            title="Close"
            onClick={() => {
              if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
              onClose();
            }}
          >
            <span className="text-lg leading-none">×</span>
          </motion.button>
        </div>
      </header>

      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-3 lg:flex-row lg:gap-4 lg:p-4 ${
          effectiveMultiple ? 'pointer-events-none blur-sm' : ''
        }`}
      >
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="flex max-h-[min(36vh,280px)] min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden lg:max-h-none lg:h-auto lg:w-[min(360px,34vw)] lg:max-w-md lg:shrink-0"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md">
            <div className="flex shrink-0 items-center gap-3 border-b border-gray-100 p-3 sm:p-4">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-[#7C69EF]/15 blur-md" />
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border-2 border-[#7C69EF]/30 shadow-md ring-2 ring-white sm:h-[4.25rem] sm:w-[4.25rem]">
                  <img src={aiAvatar} alt="AI interviewer" className="h-full w-full object-cover" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#7C69EF] text-[9px] font-bold text-white shadow-md">
                  AI
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-gray-900 sm:text-base">AI interviewer</h2>
                <p className="text-[11px] text-gray-500 sm:text-xs">Listen, then speak or type.</p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
              <p className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#7C69EF]">Question</p>
              <div className="mt-2 min-h-0 flex-1 rounded-xl border border-dashed border-[#7C69EF]/35 bg-[#7C69EF]/[0.06] p-3 shadow-inner">
                <p
                  className="text-sm font-semibold leading-snug text-gray-900 line-clamp-[8] sm:line-clamp-[11] sm:text-[15px] sm:leading-relaxed"
                  title={questionText}
                >
                  <span className="text-[#7C69EF]">Q{currentIndex + 1}.</span> {questionText}
                </p>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.99 }}
                className="mt-3 w-full shrink-0 rounded-xl bg-[#7C69EF] py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#6d5ce0]"
                onClick={() => playQuestionTTS(getPrompt(questions[currentIndex]))}
              >
                Replay question
              </motion.button>
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-gray-50/90 px-3 py-2 sm:px-4 sm:py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Status</p>
              <p className="truncate text-xs font-semibold text-gray-800 sm:text-sm">{status}</p>
            </div>
          </div>
        </motion.aside>

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320, delay: 0.04 }}
          className="relative flex min-h-0 min-w-0 flex-1 flex-col"
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7C69EF] to-[#a855f7] text-[10px] font-bold text-white shadow-md sm:h-9 sm:w-9 sm:text-xs">
                  You
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-gray-900 sm:text-sm">{String(candidateId)}</p>
                  <p className="text-[10px] text-gray-500 sm:text-xs">Camera · microphone on</p>
                </div>
              </div>
              {isRecordingAudio && (
                <div className="flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md sm:text-xs">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  Recording
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
              {/* Single camera preview — one fixed size (medium 16:9), used for display + face detection */}
              <div className="flex shrink-0 flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500">Camera preview</span>
                <div className="relative aspect-video w-full max-w-[260px] overflow-hidden rounded-xl border-2 border-[#7C69EF]/30 bg-[#1a1a1e] shadow-md">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <label className="shrink-0 text-[11px] font-semibold text-gray-700 sm:text-xs">
                  {answerLanguage === 'hi' ? 'आपका उत्तर' : 'Your answer'}
                </label>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className={`mt-2 min-h-0 flex-1 resize-none rounded-xl border bg-[#f3f4f6] px-3 py-2.5 text-sm text-gray-900 transition focus:outline-none focus:ring-2 sm:min-h-[100px] sm:px-3.5 sm:py-3 ${
                    isListening
                      ? 'border-emerald-400 ring-2 ring-emerald-100'
                      : 'border-gray-200 focus:border-[#7C69EF] focus:ring-[#7C69EF]/20'
                  }`}
                  placeholder={
                    answerLanguage === 'hi' ? 'टाइप करें या वॉइस…' : 'Type or use voice input…'
                  }
                />
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-3 py-2.5 sm:px-4 sm:py-3">
              <div className="flex flex-wrap items-stretch gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className={`min-h-[40px] flex-1 rounded-xl px-3 text-xs font-semibold shadow-sm transition sm:min-h-[42px] sm:flex-none sm:px-5 sm:text-sm ${
                    isListening
                      ? 'border border-rose-200 bg-rose-600 text-white hover:bg-rose-700'
                      : 'border border-gray-200 bg-gray-800 text-white hover:bg-gray-900'
                  }`}
                  onClick={() => (isListening ? stopSpeechRecognition() : startSpeechRecognition())}
                >
                  {isListening ? 'Stop voice' : 'Voice input'}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="min-h-[40px] flex-[1.15] rounded-xl bg-gradient-to-r from-[#7C69EF] to-[#a855f7] px-3 text-xs font-semibold text-white shadow-md transition hover:opacity-95 sm:min-h-[42px] sm:flex-1 sm:px-6 sm:text-sm"
                  onClick={submitCurrentAnswer}
                >
                  {currentIndex < questions.length - 1 ? 'Next question' : 'Finish'}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}
