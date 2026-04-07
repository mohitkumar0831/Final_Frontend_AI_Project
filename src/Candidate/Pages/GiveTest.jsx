// import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
// import { useLocation, useOutletContext } from 'react-router-dom';
// import Webcam from 'react-webcam';
// import { useParams } from 'react-router-dom';
// import { testApi } from '../../RecruiterAdmin/api/tests.js';
// import McqQuestion from '../../RecruiterAdmin/Component/McqQuestion.jsx';
// import CodingQuestion from '../../RecruiterAdmin/Component/CodingQuestion';
// import InstructionsPage from '../instructions_page/InstructionsPage.jsx';
// import ActivityMonitor from '../instructions_page/ActivityMonitor.jsx';
// import FaceDetection from '../instructions_page/FaceDetection.jsx';
// import AudioInterview from '../instructions_page/AudioInterview.jsx'; // adjust the path as needed
// import WebcamPreview from '../Component/WebcamPreview.jsx';
// import MicLevelWaveform from '../Component/MicLevelWaveform.jsx';
// import { emitViolation } from '../../RecruiterAdmin/api/socket.js';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { pythonUrl } from '../../utils/ApiConstants';

// function getFullscreenElement() {
//   return (
//     document.fullscreenElement ||
//     document.webkitFullscreenElement ||
//     document.msFullscreenElement ||
//     null
//   );
// }

// async function requestDocumentFullscreen() {
//   const el = document.documentElement;
//   try {
//     if (el.requestFullscreen) await el.requestFullscreen();
//     else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
//     else if (el.msRequestFullscreen) el.msRequestFullscreen();
//   } catch (e) {
//     console.warn('GiveTest: requestFullscreen failed', e);
//   }
// }

// const FULLSCREEN_EXIT_GRACE_SEC = 45;

// // ------------------------------
// // Embedded WebCamRecorder (merged into GiveTest to avoid mount/unmount timing issues)
// // ------------------------------

// const WebCamRecorder = forwardRef(
//   (
//     {
//       questions = [],
//       candidateId,
//       questionSetId,
//       onComplete = () => { },
//       showMultipleFaces = false,
//       sharedStream = null,
//       autoStart = true,
//       // If true, component will only show a preview and won't record or upload
//       previewOnly = false,
//       // If false, internal "Upload & Submit" button and uploadRecording will be disabled
//       allowUpload = true,
//     },
//     ref
//   ) => {
//     // Set to true during local debugging to see detailed recorder logs
//     const VERBOSE_LOG = false;
//     const vlog = (...args) => { if (VERBOSE_LOG) console.log(...args); };
//     const videoRef = useRef(null);
//     const streamRef = useRef(null);
//     const monitorRef = useRef(null);
//     const sharedStreamWarnedRef = useRef(false);
//     // Keep a reference to the *source* stream (shared or created) for preview/health checks
//     const sourceStreamRef = useRef(null);
//     // Use a dedicated recording stream made of cloned tracks so other components stopping the shared stream
//     // won't break this recording.
//     const recordingStreamRef = useRef(null);
//     const clonedTracksRef = useRef([]);
//     const createdStreamRef = useRef(false);
//     const mediaRecorderRef = useRef(null);
//     const chunksRef = useRef([]);
//     const startedOnceRef = useRef(false);

//     const [interviewStarted, setInterviewStarted] = useState(false);
//     const [interviewEnded, setInterviewEnded] = useState(false);
//     const [currentAnswer, setCurrentAnswer] = useState("");
//     const [currentIndex, setCurrentIndex] = useState(0);
//     const qaListRef = useRef([]);
//     const [status, setStatus] = useState("Idle");
//     const [uploading, setUploading] = useState(false);

//     // Initialize qa list with question metadata so indices exist and ids are preserved
//     useEffect(() => {
//       try {
//         qaListRef.current = (questions || []).map((q) => ({
//           question_id: q.question_id || q.id || q._id || null,
//           question: (q.prompt_text || q.question) || '',
//           answer: '',
//         }));
//         vlog('WebCamRecorder: initialized qaListRef with', qaListRef.current);
//       } catch (e) { console.warn('qaList init failed', e); }
//     }, [questions]);

//     const prompt =
//       (questions[currentIndex]?.prompt_text || questions[currentIndex]?.question) ||
//       "Please answer this question.";

//     // ---------------------------------------------------------
//     // Initialize Camera + MediaRecorder
//     // ---------------------------------------------------------
//     useEffect(() => {
//       vlog('WebCamRecorder: useEffect init() running now, sharedStream present?', !!sharedStream);
//       const initRecorder = async () => {
//         // Avoid double-initializing recorder (can happen in StrictMode/dev remounts)
//         if (mediaRecorderRef.current) {
//           vlog('WebCamRecorder: initRecorder called but recorder already exists; skipping');
//           return;
//         }
//         try {
//           let stream = sharedStream;
//           vlog('WebCamRecorder: init called, sharedStream present?', !!sharedStream);

//           // Check if shared stream is viable
//           if (stream) {
//             const videoTracks = stream.getVideoTracks();
//             const audioTracks = stream.getAudioTracks();
//             vlog('WebCamRecorder: checking sharedStream - video tracks:', videoTracks.length, 'audio tracks:', audioTracks.length);

//             // Check if tracks are actually alive
//             let tracksAlive = false;
//             if (videoTracks.length > 0) {
//               videoTracks.forEach((t, i) => {
//                 vlog(`WebCamRecorder: video track ${i} - enabled: ${t.enabled}, readyState: ${t.readyState}`);
//                 if (t.readyState === 'live' && t.enabled) tracksAlive = true;
//               });
//             }

//             if (!tracksAlive) {
//               if (!sharedStreamWarnedRef.current) {
//                 console.warn('WebCamRecorder: shared stream tracks are dead/ended, requesting fresh stream');
//                 sharedStreamWarnedRef.current = true;
//               } else {
//                 vlog('WebCamRecorder: shared stream tracks dead -> requesting fresh stream (suppressed repeat warning)');
//               }
//               stream = null;
//             }
//           }

//           // If no viable shared stream, request fresh media
//           if (!stream) {
//             vlog('WebCamRecorder: requesting fresh camera stream');
//             stream = await navigator.mediaDevices.getUserMedia({
//               video: true,
//               audio: true,
//             });
//             createdStreamRef.current = true;
//           }

//           // Source stream is either sharedStream or a newly created stream
//           sourceStreamRef.current = stream;

//           // Build a dedicated recording stream with cloned tracks.
//           // This prevents recording from stopping if some other component stops/ends tracks on the shared stream.
//           try {
//             // Stop any previous cloned tracks (defensive)
//             try { (clonedTracksRef.current || []).forEach(t => { try { t.stop(); } catch (e) { } }); } catch (e) { }
//             clonedTracksRef.current = [];

//             const recStream = new MediaStream();
//             const v0 = stream.getVideoTracks && stream.getVideoTracks()[0];
//             const a0 = stream.getAudioTracks && stream.getAudioTracks()[0];

//             if (v0) {
//               const vClone = v0.clone();
//               recStream.addTrack(vClone);
//               clonedTracksRef.current.push(vClone);
//             }
//             if (a0) {
//               const aClone = a0.clone();
//               recStream.addTrack(aClone);
//               clonedTracksRef.current.push(aClone);
//             }

//             recordingStreamRef.current = recStream;
//           } catch (e) {
//             console.warn('WebCamRecorder: failed to create cloned recording stream, falling back to source stream', e);
//             recordingStreamRef.current = stream;
//           }

//           // Use recordingStreamRef for MediaRecorder; keep streamRef.current pointing to recording stream
//           streamRef.current = recordingStreamRef.current || stream;

//           if (videoRef.current) {
//             try { videoRef.current.srcObject = stream; } catch (e) { }
//           }

//           // If previewOnly is set, skip creating MediaRecorder and only attach preview
//           if (previewOnly) {
//             vlog('WebCamRecorder: previewOnly=true, skipping MediaRecorder setup');
//             setStatus('Preview');
//             setInterviewStarted(true);
//             return;
//           }

//           // Check stream tracks are active
//           const videoTracks = (streamRef.current || stream).getVideoTracks();
//           const audioTracks = (streamRef.current || stream).getAudioTracks();
//           vlog('WebCamRecorder: final video tracks:', videoTracks.length, 'audio tracks:', audioTracks.length);

//           // Enable all tracks to ensure they're active
//           videoTracks.forEach((t, i) => {
//             t.enabled = true;
//             vlog(`WebCamRecorder: enabled video track ${i}, readyState: ${t.readyState}`);
//           });
//           audioTracks.forEach((t, i) => {
//             t.enabled = true;
//             vlog(`WebCamRecorder: enabled audio track ${i}, readyState: ${t.readyState}`);
//           });

//           if (videoTracks.length === 0) {
//             throw new Error('Stream missing video tracks - camera access required');
//           }

//           // Audio is preferred but not strictly required for recording
//           if (audioTracks.length === 0) {
//             console.warn('WebCamRecorder: No audio tracks available - recording video only');
//           }

//           // Find supported MIME type
//           let mimeType = 'video/webm;codecs=vp8,opus';
//           const supportedTypes = [
//             'video/webm;codecs=vp8,opus',
//             'video/webm;codecs=vp9,opus',
//             'video/webm',
//             'video/mp4',
//           ];

//           for (const type of supportedTypes) {
//             if (MediaRecorder.isTypeSupported(type)) {
//               mimeType = type;
//               vlog('WebCamRecorder: using MIME type:', mimeType);
//               break;
//             }
//           }

//           mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
//             mimeType: mimeType,
//           });

//           mediaRecorderRef.current.ondataavailable = (e) => {
//             if (e.data && e.data.size > 0) {
//               chunksRef.current.push(e.data);
//               vlog('WebCamRecorder: chunk added, total chunks now:', chunksRef.current.length);
//             }
//           };

//           mediaRecorderRef.current.onstop = () => {
//             console.log('WebCamRecorder: onstop fired, final chunks collected:', chunksRef.current.length);
//             setInterviewEnded(true);
//           };

//           // Auto-start recording once recorder is ready (only if autoStart prop is true)
//           try {
//             if (autoStart) {
//               if (!startedOnceRef.current) {
//                 chunksRef.current = [];
//               }
//               // Start the recorder and log a single start message
//               mediaRecorderRef.current.start(1000); // Request data every 1 second
//               if (!startedOnceRef.current) {
//                 startedOnceRef.current = true;
//                 console.log('WebCamRecorder: Recording started');
//               }

//               // Monitor stream health while recording
//               monitorRef.current = setInterval(() => {
//                 const rec = mediaRecorderRef.current;
//                 if (!rec || rec.state !== 'recording') {
//                   clearInterval(monitorRef.current);
//                   monitorRef.current = null;
//                   return;
//                 }
//                 const vTracks = streamRef.current?.getVideoTracks() || [];
//                 const aTracks = streamRef.current?.getAudioTracks() || [];
//                 vlog('WebCamRecorder: [MONITOR] recorder state:', rec.state, 'video enabled:', vTracks[0]?.enabled, 'audio enabled:', aTracks[0]?.enabled);
//               }, 2000);

//               setInterviewStarted(true);
//               setStatus("Recording...");
//             } else {
//               console.log('WebCamRecorder: autoStart=false, NOT starting recorder yet');
//               setStatus("Ready to record");
//             }
//           } catch (e) {
//             console.error('WebCamRecorder: Auto-start recording failed', e);
//           }
//         } catch (err) {
//           console.error("Camera init failed:", err);
//           alert("Camera/microphone access is required!");
//         }
//       };

//       initRecorder();

//       // Cleanup: only stop recorder and tracks on unmount
//       return () => {
//         console.log('WebCamRecorder: cleanup running, recorder state:', mediaRecorderRef.current?.state);
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
//           try { mediaRecorderRef.current.stop(); } catch (e) { console.warn('stop failed', e); }
//         }
//         // Always stop cloned tracks created for recording
//         try {
//           (clonedTracksRef.current || []).forEach((t) => {
//             try { t.stop(); } catch (e) { }
//           });
//         } catch (e) { }
//         clonedTracksRef.current = [];

//         // clear monitor interval if running
//         try { if (monitorRef.current) { clearInterval(monitorRef.current); monitorRef.current = null; } } catch (e) { }

//         // Only stop the source stream tracks if this component created the stream itself
//         if (createdStreamRef.current && sourceStreamRef.current) {
//           try { sourceStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) { }
//         }
//       };
//     }, [sharedStream]);

//     // If autoStart flips from false -> true after init, start the recorder immediately.
//     useEffect(() => {
//       try {
//         if (previewOnly) return;
//         if (!autoStart) return;
//         const rec = mediaRecorderRef.current;
//         if (!rec) return;
//         if (rec.state === 'recording') return;
//         if (!startedOnceRef.current) {
//           chunksRef.current = [];
//           rec.start(1000);
//           startedOnceRef.current = true;
//           console.log('WebCamRecorder: Recording started');
//         } else {
//           rec.start(1000);
//         }
//         setInterviewStarted(true);
//         setStatus("Recording...");
//       } catch (e) {
//         console.warn('WebCamRecorder: autoStart effect failed', e);
//       }
//     }, [autoStart, previewOnly]);

//     // ---------------------------------------------------------
//     // Start Recording
//     // ---------------------------------------------------------
//     const startInterview = () => {
//       try {
//         // IMPORTANT: Do not wipe earlier chunks if recording already started once (prevents losing MCQ+Audio parts)
//         if (!startedOnceRef.current) {
//           chunksRef.current = [];
//           if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
//             mediaRecorderRef.current.start(1000);
//             startedOnceRef.current = true;
//             console.log('WebCamRecorder: Recording started');
//           }
//         } else {
//           if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
//             mediaRecorderRef.current.start(1000);
//           }
//         }
//         setInterviewStarted(true);
//         setStatus("Recording...");
//       } catch (e) {
//         console.warn('startInterview failed', e);
//       }
//     };


//     // ---------------------------------------------------------
//     // Stop Recording
//     // ---------------------------------------------------------
//     const pushAnswerForIndex = (idx, ans) => {
//       let answerText = '';
//       if (typeof ans === 'string') {
//         answerText = ans;
//       } else if (ans && ans.target && typeof ans.target.value === 'string') {
//         answerText = ans.target.value;
//         console.warn('[WebCamRecorder] pushAnswerForIndex received event object instead of string!', ans);
//       } else {
//         console.warn('[WebCamRecorder] pushAnswerForIndex received non-string, non-event:', ans);
//       }
//       const item = {
//         question_id: questions[idx]?.question_id || questions[idx]?.id,
//         question: (questions[idx]?.prompt_text || questions[idx]?.question) || '',
//         answer: answerText.trim(),
//       };
//       qaListRef.current = qaListRef.current || [];
//       qaListRef.current[idx] = item;
//       console.log(`[WebCamRecorder] pushAnswerForIndex idx=${idx} answer='${item.answer}' item=`, item);
//     };

//     // Always keep qaListRef in sync with the text area
//     useEffect(() => {
//       pushAnswerForIndex(currentIndex, currentAnswer);
//       // Debug: log current answer and qaListRef
//       console.log('[WebCamRecorder] Textarea changed:', { currentIndex, currentAnswer, qaList: JSON.parse(JSON.stringify(qaListRef.current)) });
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [currentAnswer, currentIndex]);

//     const endInterview = async () => {
//       try {
//         // push current answer before stopping
//         console.log('WebCamRecorder: endInterview pushing answer for index', currentIndex, 'currentAnswer=', currentAnswer);
//         pushAnswerForIndex(currentIndex, currentAnswer);
//       } catch (e) { }

//       if (mediaRecorderRef.current?.state === "recording") {
//         mediaRecorderRef.current.stop();
//         setStatus("Recording stopped");
//       }
//     };

//     // Wait until recorder 'stop' event fires (returns a Promise)
//     const stopRecordingWait = () => {
//       return new Promise((resolve) => {
//         const rec = mediaRecorderRef.current;
//         if (!rec || rec.state === 'inactive') return resolve();
//         const onStop = () => {
//           try { rec.removeEventListener('stop', onStop); } catch (e) { }
//           resolve();
//         };
//         try {
//           rec.addEventListener('stop', onStop);
//           try { rec.stop(); } catch (e) { onStop(); }
//         } catch (e) {
//           onStop();
//         }
//       });
//     };

//     // ---------------------------------------------------------
//     // Upload Recording to Backend
//     // ---------------------------------------------------------
//     // Upload Recording to Backend (for all questions answered)
//     // ---------------------------------------------------------
//     const uploadRecording = async () => {
//       console.log('WebCamRecorder: uploadRecording called, allowUpload=', allowUpload);
//       if (!allowUpload) {
//         console.log('WebCamRecorder: internal upload disabled (allowUpload=false) - deferring to parent');
//         // Ensure recorder is stopped/flushed so parent recording (if any) can handle finalization
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
//           try { mediaRecorderRef.current.requestData(); } catch (e) { }
//           await stopRecordingWait();
//         }
//         const qa_data = (qaListRef.current || []).map((item, idx) => ({
//           question_id: item?.question_id || questions[idx]?.question_id || questions[idx]?.id,
//           question: item?.question || questions[idx]?.prompt_text || questions[idx]?.question || '',
//           answer: item?.answer || '',
//         }));
//         setStatus('Upload deferred');
//         // Do NOT call onComplete because parent will handle upload
//         setUploading(false);
//         return { qa_data, skipped: true };
//       }
//       console.log('WebCamRecorder: uploadRecording called, current chunks:', chunksRef.current.length);
//       console.log('WebCamRecorder: recorder state before stop:', mediaRecorderRef.current?.state);
//       setUploading(true);

//       // ensure recorder has flushed final chunks
//       if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
//         console.log('WebCamRecorder: MediaRecorder still recording, requesting final data and stopping');
//         // Request final data flush before stopping
//         try {
//           mediaRecorderRef.current.requestData();
//           console.log('WebCamRecorder: requestData called');
//         } catch (e) { console.warn('requestData failed', e); }

//         // Wait a bit for ondataavailable to fire
//         await new Promise(resolve => setTimeout(resolve, 100));

//         await stopRecordingWait();
//       }

//       console.log('WebCamRecorder: after stopRecordingWait, final chunks:', chunksRef.current.length);
//       if (!chunksRef.current.length) {
//         console.error('WebCamRecorder: No video chunks recorded! Check if MediaRecorder was recording.');
//         alert("No video recorded! Ensure camera/microphone permissions are enabled and try again.");
//         setUploading(false);
//         return null;
//       }

//       const blob = new Blob(chunksRef.current, { type: "video/webm" });
//       const filename = `video_${candidateId}_${Date.now()}.webm`;

//       const file = new File([blob], filename, { type: "video/webm" });

//       // use accumulated QA list
//       // ensure we have a safe copy of QA data
//       const qa_data = (qaListRef.current || []).map((item, idx) => ({
//         question_id: item?.question_id || questions[idx]?.question_id || questions[idx]?.id,
//         question: item?.question || questions[idx]?.prompt_text || questions[idx]?.question || '',
//         answer: item?.answer || '',
//       }));

//       // Debug: log before upload
//       console.log('[WebCamRecorder] Uploading video with:', { qaList: JSON.parse(JSON.stringify(qaListRef.current)), qa_data, currentIndex, currentAnswer });
//       console.log('WebCamRecorder: uploading video with qa_data=', qa_data, 'chunksCount=', chunksRef.current.length);

//       const fd = new FormData();
//       fd.append("file", file);
//       fd.append("candidate_id", candidateId);
//       fd.append("question_set_id", questionSetId);
//       fd.append("qa_data", JSON.stringify(qa_data));

//       setStatus("Uploading video...");

//       try {
//         const res = await fetch(`${pythonUrl}/v1/upload_video`, {
//           method: "POST",
//           body: fd,
//         });

//         if (!res.ok) {
//           const txt = await res.text();
//           console.error("Upload failed:", txt);
//           alert("Video upload failed!");
//           setStatus("Upload failed");
//           return { qa_data, error: txt };
//         }

//         const data = await res.json();
//         console.log("Upload success:", data);
//         setStatus("Video uploaded!");
//         // notify parent with qa_data
//         try { onComplete(qa_data); } catch (e) { console.warn('onComplete callback failed', e); }
//         return { qa_data, response: data };

//       } catch (err) {
//         console.error("Upload error:", err);
//         alert("Failed to upload video!");
//         setStatus("Upload failed");
//         return { qa_data, error: err };
//       } finally {
//         setUploading(false);
//       }
//     }
//     // ---------------------------------------------------------
//     // Exposed methods for parent component (GiveTest.jsx)
//     // ---------------------------------------------------------
//     useImperativeHandle(ref, () => ({
//       startInterview,
//       endInterview,
//       uploadRecording,
//       stopAll: () => {
//         try {
//           endInterview();
//           if (createdStreamRef.current) {
//             streamRef.current?.getTracks().forEach((t) => t.stop());
//           }
//         } catch { }
//       },
//     }));

//     return (
//       <div className="p-4 bg-white rounded shadow relative">
//         {showMultipleFaces && (
//           <>
//             <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50" />
//             <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-60 bg-yellow-400 text-black px-4 py-2 rounded shadow">
//               🚨 Multiple faces detected — page blurred
//             </div>
//           </>
//         )}
//         <h2 className="text-xl font-bold mb-4">Video Interview</h2>

//         {/* Live Camera Feed */}
//         <video
//           ref={videoRef}
//           autoPlay
//           playsInline
//           muted
//           className="w-full h-72 bg-black rounded"
//         />

//         {/* Question */}
//         <div className="mt-4">
//           <h3 className="font-semibold mb-2">Question:</h3>
//           <p className="p-3 bg-gray-100 rounded">{prompt}</p>
//         </div>

//         {/* Text Answer */}
//         <textarea
//           value={typeof currentAnswer === 'string' ? currentAnswer : ''}
//           onChange={e => {
//             if (typeof e.target.value === 'string') {
//               setCurrentAnswer(e.target.value);
//             } else {
//               console.warn('[WebCamRecorder] textarea onChange non-string value:', e);
//             }
//           }}
//           className="w-full p-3 border rounded mt-4 min-h-[120px]"
//           placeholder="Write your explanation / answer here..."
//         />

//         {/* Buttons */}
//         <div className="flex gap-3 mt-4">
//           {!interviewStarted && (
//             <button
//               onClick={startInterview}
//               className="px-4 py-2 bg-green-600 text-white rounded"
//             >
//               Start Recording
//             </button>
//           )}

//           {interviewStarted && !interviewEnded && (
//             <>
//               <button
//                 onClick={async () => {
//                   // Always save the current answer for this index
//                   pushAnswerForIndex(currentIndex, currentAnswer);
//                   // clear answer and move to next
//                   setCurrentAnswer('');
//                   const next = currentIndex + 1;
//                   if (next < questions.length) {
//                     setCurrentIndex(next);
//                     setTimeout(() => setStatus('Recording...'), 200);
//                   } else {
//                     // last question -> stop recording automatically
//                     await stopRecordingWait();
//                     setInterviewEnded(true);
//                     setStatus('Recording stopped');
//                   }
//                   // --- PATCH: Save all video answers to parent state on every next click ---
//                   if (typeof window !== 'undefined' && window.__saveVideoAnswersToParent) {
//                     window.__saveVideoAnswersToParent(qaListRef.current);
//                   }
//                 }}
//                 className="px-4 py-2 bg-amber-600 text-white rounded"
//               >
//                 Next
//               </button>
//             </>
//           )}

//           {interviewEnded && allowUpload && (
//             <button
//               onClick={uploadRecording}
//               className="px-4 py-2 bg-blue-600 text-white rounded"
//               disabled={(qaListRef.current?.length || 0) < questions.length}
//             >
//               Upload & Submit
//             </button>
//           )}

//           {interviewEnded && !allowUpload && (
//             <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded">Recording complete — final upload will occur when you submit the test.</div>
//           )}
//         </div>

//         {/* Status */}
//         <p className="text-sm text-gray-600 mt-3">Status: {status}</p>
//         {/* Uploading overlay */}
//         {uploading && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center">
//             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
//             <div className="relative z-10 flex flex-col items-center gap-3 p-6 bg-white bg-opacity-90 rounded-lg shadow-lg">
//               <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin" />
//               <div className="text-gray-700 font-medium">Uploading & Submitting...</div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }
// );
// // --- PATCH: Helper to sync video answers from recorder to allAnswers ---
// function syncVideoAnswersToAllAnswers(qaList, setAllAnswers) {
//   if (!Array.isArray(qaList)) return;
//   setAllAnswers(prev => {
//     const next = { ...prev };
//     qaList.forEach(item => {
//       if (item && item.question_id) next[item.question_id] = item.answer || '';
//     });
//     return next;
//   });
// }

// const GiveTest = ({ jdId }) => {
//   const { questionSetId } = useParams();
//   const location = useLocation();
//   const { setHideSidebarForTest } = useOutletContext() || {};

//   // Loading / data / error
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Sections & navigation
//   const [sections, setSections] = useState([]);
//   const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [completedSections, setCompletedSections] = useState(new Set());
//   const [allAnswers, setAllAnswers] = useState({});
//   const [submitting, setSubmitting] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [submissionResults, setSubmissionResults] = useState([]);
//   const candidateIdRef = useRef(`candidate_${Date.now()}`);
//   const finalCandidateId = candidateIdRef.current;
//   const [userInfo] = useState({
//     name: `Candidate_${finalCandidateId}`,
//     email: `candidate_${finalCandidateId}@mail.com`,
//   });
//   const [mediaAllowed, setMediaAllowed] = useState(false);
//   const [localStream, setLocalStream] = useState(null);
//   const streamRef = useRef(null);
//   const videoRef = useRef(null);
//   const webcamRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [floatingPos, setFloatingPos] = useState({ x: 20, y: 80 });
//   const [isVideoPlaying, setIsVideoPlaying] = useState(true);
//   const [hasVideoFrame, setHasVideoFrame] = useState(false);
//   const [tabSwitches, setTabSwitches] = useState(0);
//   const faceEventRef = useRef(null);
//   const webcamInterviewRef = useRef(null);
//   // --- PATCH: Expose a global sync function for video answers ---
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       window.__saveVideoAnswersToParent = (qaList) => {
//         syncVideoAnswersToAllAnswers(qaList, setAllAnswers);
//       };
//     }
//     return () => {
//       if (typeof window !== 'undefined') {
//         window.__saveVideoAnswersToParent = undefined;
//       }
//     };
//   }, []);
//   const webcamPreviewRef = useRef(null);
//   const saveViolationsSentRef = useRef(false);
//   const [showWebcamInterview, setShowWebcamInterview] = useState(false);
//   const [showAudioInterview, setShowAudioInterview] = useState(false);
//   const [audioInterviewResults, setAudioInterviewResults] = useState([]);
//   const [audioInterviewDone, setAudioInterviewDone] = useState(false);
//   const [audioInterviewVisited, setAudioInterviewVisited] = useState(false);
//   const [step, setStep] = useState('entry');
//   const [instructionsVisible, setInstructionsVisible] = useState(true);
//   const [testStarted, setTestStarted] = useState(false);
//   const [micEnabled, setMicEnabled] = useState(true);
//   const [camEnabled, setCamEnabled] = useState(true);
//   const [videoDevices, setVideoDevices] = useState([]);
//   const [selectedDeviceId, setSelectedDeviceId] = useState(null);

//   const [visitedQuestionIds, setVisitedQuestionIds] = useState(() => new Set());
//   /** { [stableQuestionKey]: true } — plain object so React always re-renders on toggle */
//   const [reviewMarks, setReviewMarks] = useState({});
//   const [questionGridPage, setQuestionGridPage] = useState(1);
//   const [candidateDisplayName] = useState(() => {
//     try {
//       const raw = sessionStorage.getItem('candidateData');
//       if (raw) {
//         const p = JSON.parse(raw);
//         if (p?.name) return p.name;
//       }
//     } catch (e) { }
//     return userInfo.name;
//   });
//   const [assessmentJobTitle, setAssessmentJobTitle] = useState('Software Engineer Position');

//   const [showFullscreenExitModal, setShowFullscreenExitModal] = useState(false);
//   const [fullscreenGraceSeconds, setFullscreenGraceSeconds] = useState(null);
//   const hadFullscreenDuringExamRef = useRef(false);
//   const fullscreenPenaltyActiveRef = useRef(false);
//   const fullscreenExitTimeoutRef = useRef(null);
//   const fullscreenExitIntervalRef = useRef(null);
//   const submittingRef = useRef(false);

//   const QUESTIONS_GRID_PAGE_SIZE = 12;
//   const SECTION_TAB_ORDER = ['mcq', 'coding', 'audio', 'video'];

//   // Recording state
//   const [recordingStarted, setRecordingStarted] = useState(false);
//   const recordingStartedRef = useRef(false);
//   const [recordingPermissionAsked, setRecordingPermissionAsked] = useState(false);
//   const [recordingPermissionGranted, setRecordingPermissionGranted] = useState(false);

//   // Is there an actually active candidate stream we can record from?
//   const candidateStreamActive = !!(
//     (streamRef.current && streamRef.current.active) ||
//     (localStream && localStream.active) ||
//     (window.__candidateCameraStream && window.__candidateCameraStream.active)
//   );

//   // Violations tracking
//   const [violations, setViolations] = useState({
//     tab_switches: 0,
//     inactivities: 0,
//     face_not_visible: 0,
//     multiple_faces: 0,
//   });
//   const [orgId, setOrgId] = useState(null);
//   const orgIdRef = useRef(null);
//   const [showMultipleFaces, setShowMultipleFaces] = useState(false);
//   const [showTabSwitch, setShowTabSwitch] = useState(false);
//   const violationsRef = useRef(violations);
//   // Track which toast alerts have already been shown to avoid duplicates
//   const shownToastsRef = useRef(new Set());

//   // Keep refs in sync
//   useEffect(() => {
//     violationsRef.current = violations;
//   }, [violations]);

//   useEffect(() => {
//     submittingRef.current = submitting;
//   }, [submitting]);

//   // attach localStream to video element and cleanup on unmount
//   useEffect(() => {
//     const targetVideo = (webcamRef.current && webcamRef.current.video) || videoRef.current;
//     if (targetVideo && localStream) {
//       try { targetVideo.srcObject = localStream; videoRef.current = targetVideo; } catch (e) { console.warn('attach srcObject failed', e); }
//     }
//     return () => {
//       if (localStream) {
//         try { localStream.getTracks().forEach(t => t.stop()); } catch (e) { }
//       }
//     };
//   }, [localStream]);

//   // track whether <video> is actually playing so we can hide canvas fallback
//   useEffect(() => {
//     const v = videoRef.current || (webcamRef.current && webcamRef.current.video);
//     if (!v) return;
//     const onPlaying = () => setIsVideoPlaying(true);
//     const onPause = () => setIsVideoPlaying(false);
//     v.addEventListener('playing', onPlaying);
//     v.addEventListener('play', onPlaying);
//     v.addEventListener('pause', onPause);
//     v.addEventListener('ended', onPause);
//     return () => {
//       try {
//         v.removeEventListener('playing', onPlaying);
//         v.removeEventListener('play', onPlaying);
//         v.removeEventListener('pause', onPause);
//         v.removeEventListener('ended', onPause);
//       } catch (e) { }
//     };
//   }, [videoRef.current]);

//   // Poll video element to detect whether frames are available (videoWidth>0)
//   useEffect(() => {
//     let intId = null;
//     const check = () => {
//       const v = videoRef.current || (webcamRef.current && webcamRef.current.video);
//       if (v) {
//         const hasFrame = !!(v.videoWidth && v.videoHeight);
//         setHasVideoFrame(hasFrame);
//         if (hasFrame) return true;
//       }
//       return false;
//     };
//     // run a few times for up to ~2s
//     let attempts = 0;
//     intId = setInterval(() => {
//       attempts += 1;
//       const ok = check();
//       if (ok || attempts > 10) {
//         clearInterval(intId);
//       }
//     }, 200);
//     // immediate check
//     check();
//     return () => { if (intId) clearInterval(intId); };
//   }, [localStream, mediaAllowed, step, streamRef.current]);

//   // Request camera+mic permissions (always prompt, don't reuse stored stream)
//   const requestMedia = async () => {
//     try {
//       // Always request fresh permissions - don't reuse existing stream
//       const constraints = {
//         video: camEnabled ? { facingMode: 'user' } : false,
//         audio: micEnabled,
//       };
//       console.log('GiveTest: requesting media with constraints:', constraints);
//       const stream = await navigator.mediaDevices.getUserMedia(constraints);

//       setMediaAllowed(true);
//       setLocalStream(stream);
//       streamRef.current = stream;
//       // Save globally for future pages in same tab
//       try { window.__candidateCameraStream = stream; window.__cameraAllowed = true; } catch (e) { }
//       if (videoRef.current) {
//         try { videoRef.current.srcObject = stream; } catch (e) { console.warn('set srcObject failed', e); }
//       }
//       console.log('GiveTest: media access granted successfully');
//     } catch (err) {
//       console.error('Media permissions error:', err);
//       setMediaAllowed(false);
//       const errorMsg = err.name === 'NotAllowedError'
//         ? 'You denied camera/microphone access. Please enable permissions in your browser settings and refresh the page.'
//         : err.name === 'NotFoundError'
//           ? 'No camera or microphone found on your device.'
//           : `Unable to access camera/microphone: ${err.message}`;
//       alert(errorMsg);
//     }
//   };

//   // On mount, reuse stream from CameraCheck if available
//   useEffect(() => {
//     try {
//       const existing = window.__candidateCameraStream;
//       if (existing && !localStream) {
//         setMediaAllowed(true);
//         setLocalStream(existing);
//         streamRef.current = existing;
//         if (videoRef.current) {
//           try { videoRef.current.srcObject = existing; } catch (e) { console.warn('attach existing on mount failed', e); }
//         }
//       }
//     } catch (e) {
//       // ignore
//     }
//   }, []);

//   // Enumerate devices and prefer a saved device if present
//   useEffect(() => {
//     const list = async () => {
//       try {
//         const devices = await navigator.mediaDevices.enumerateDevices();
//         const vids = devices.filter(d => d.kind === 'videoinput');
//         setVideoDevices(vids);
//         if (!selectedDeviceId && vids.length) setSelectedDeviceId(vids[0].deviceId);
//       } catch (e) { }
//     };
//     list();
//   }, []);

//   // Poll for a global stream (if set by CameraCheck in another part of the app)
//   useEffect(() => {
//     let pollId = null;
//     const tryAttachGlobal = () => {
//       try {
//         const existing = window.__candidateCameraStream;
//         if (existing) {
//           streamRef.current = existing;
//           setLocalStream(existing);
//           setMediaAllowed(true);
//           if (videoRef.current && videoRef.current.srcObject !== existing) {
//             try { videoRef.current.srcObject = existing; const p = videoRef.current.play && videoRef.current.play(); if (p && p.then) p.catch(() => { }); } catch (e) { console.warn('attach global stream failed', e); }
//           }
//           if (pollId) { clearInterval(pollId); pollId = null; }
//         }
//       } catch (e) { }
//     };

//     tryAttachGlobal();
//     if (!streamRef.current) pollId = setInterval(tryAttachGlobal, 300);
//     return () => { if (pollId) clearInterval(pollId); };
//   }, []);

//   // Auto-request media once when the test actually starts (safeguard against missing CameraCheck flow)
//   const _requestedMediaRef = useRef(false);
//   useEffect(() => {
//     if (testStarted && !mediaAllowed && !_requestedMediaRef.current) {
//       _requestedMediaRef.current = true;
//       console.log('GiveTest: auto-requesting media on test start');
//       // attempt to reuse existing or prompt user
//       requestMedia();
//     }
//   }, [testStarted, mediaAllowed]);

//   // Attempt to attach any available stream to the preview video whenever relevant state changes
//   useEffect(() => {
//     try {
//       const candidateStream = streamRef.current || localStream || window.__candidateCameraStream;
//       if (!candidateStream) {
//         console.log('GiveTest: no candidate stream available to attach');
//         return;
//       }

//       const vElem = (videoRef.current) || (webcamRef.current && webcamRef.current.video);
//       if (!vElem) {
//         console.log('GiveTest: preview video element not mounted yet');
//         return;
//       }

//       // attach if not already attached
//       if (vElem.srcObject !== candidateStream) {
//         try {
//           vElem.srcObject = candidateStream;
//           // attempt to play (some browsers require explicit play call)
//           const p = vElem.play && vElem.play();
//           if (p && p.then) p.then(() => { }).catch(() => { });
//           setMediaAllowed(true);
//           videoRef.current = vElem; // ensure other code uses this concrete element
//           console.log('GiveTest: attached candidate stream to preview; stream active=', !!candidateStream.active);
//         } catch (e) {
//           console.warn('GiveTest: failed to attach candidate stream to preview', e);
//         }
//       } else {
//         console.log('GiveTest: preview already attached to stream');
//       }
//     } catch (e) {
//       console.warn('GiveTest: attach effect error', e);
//     }
//   }, [localStream, testStarted, mediaAllowed, step]);

//   // Canvas fallback: draw frames from the video element into canvas if video isn't rendering
//   useEffect(() => {
//     let rafId = null;
//     let imgCapInterval = null;
//     let offscreenVideo = null;
//     const c = canvasRef.current;
//     const v = videoRef.current || (webcamRef.current && webcamRef.current.video);

//     const drawFromVideo = (videoEl) => {
//       try {
//         if (c && videoEl && (videoEl.readyState >= 2 || videoEl.videoWidth)) {
//           const ctx = c.getContext('2d');
//           const w = (c.width = c.clientWidth || 360);
//           const h = (c.height = c.clientHeight || 260);
//           try {
//             ctx.drawImage(videoEl, 0, 0, w, h);
//             // mark that we have a frame so UI can hide black video
//             setHasVideoFrame(true);
//           } catch (e) { }
//         }
//       } catch (e) { }
//       rafId = requestAnimationFrame(() => drawFromVideo(videoEl));
//     };

//     const startImageCaptureLoop = (stream) => {
//       try {
//         const track = stream.getVideoTracks && stream.getVideoTracks()[0];
//         if (!track) return;
//         const ImageCapture = window.ImageCapture || null;
//         if (!ImageCapture) return;
//         const ic = new ImageCapture(track);
//         imgCapInterval = setInterval(async () => {
//           try {
//             const bitmap = await ic.grabFrame();
//             if (bitmap && c) {
//               const ctx = c.getContext('2d');
//               const w = c.width = c.clientWidth || bitmap.width || 360;
//               const h = c.height = c.clientHeight || bitmap.height || 260;
//               try { ctx.drawImage(bitmap, 0, 0, w, h); } catch (e) { }
//               try { bitmap.close && bitmap.close(); } catch (e) { }
//             }
//           } catch (err) {
//             // grabFrame can fail on some browsers/devices; ignore
//           }
//         }, 700);
//       } catch (e) { }
//     };

//     // Start drawing only if there is any candidate stream available
//     const hasStream = streamRef.current || localStream || window.__candidateCameraStream;
//     if (hasStream && c) {
//       try {
//         c.width = c.clientWidth || 360;
//         c.height = c.clientHeight || 260;
//       } catch (e) { }

//       // If video element is playing/rendering frames, draw from it.
//       if (v && isVideoPlaying) {
//         drawFromVideo(v);
//       } else if (v) {
//         // video exists but not playing; still start raf draw to catch frames when available
//         rafId = requestAnimationFrame(() => drawFromVideo(v));
//       } else {
//         // Visible video isn't mounted yet; create an offscreen video attached to the stream
//         try {
//           const candidateStream = streamRef.current || localStream || window.__candidateCameraStream;
//           if (candidateStream) {
//             offscreenVideo = document.createElement('video');
//             offscreenVideo.muted = true;
//             offscreenVideo.playsInline = true;
//             try {
//               offscreenVideo.srcObject = candidateStream;
//             } catch (e) {
//               console.warn('offscreen assign srcObject failed', e);
//             }
//             // try to play; some browsers require user gesture but play() may still resolve
//             const p = offscreenVideo.play && offscreenVideo.play();
//             if (p && p.then) p.catch(() => { });
//             // start RAF draws from the offscreen element
//             rafId = requestAnimationFrame(() => drawFromVideo(offscreenVideo));
//           }
//         } catch (e) {
//           console.warn('failed to create offscreen video fallback', e);
//         }
//       }

//       // Also start ImageCapture fallback to grab frames directly from the track
//       const candidateStream = streamRef.current || localStream || window.__candidateCameraStream;
//       if (candidateStream) startImageCaptureLoop(candidateStream);
//     }

//     return () => {
//       if (rafId) cancelAnimationFrame(rafId);
//       if (imgCapInterval) clearInterval(imgCapInterval);
//       try {
//         if (offscreenVideo) {
//           offscreenVideo.pause();
//           try { offscreenVideo.srcObject = null; } catch (e) { }
//           offscreenVideo = null;
//         }
//       } catch (e) { }
//     };
//   }, [localStream, mediaAllowed, step]);

//   // Always log mount for diagnostics
//   useEffect(() => {
//     try {
//       console.groupCollapsed('GiveTest Mounted');
//       console.log('step', step, 'testStarted', testStarted, 'mediaAllowed', mediaAllowed);
//       console.log('window.__candidateCameraStream present:', !!window.__candidateCameraStream);
//       console.groupEnd();
//     } catch (e) { console.warn('mount log failed', e); }
//   }, []);

//   // DO NOT auto-start test - wait for recording permission first
//   // useEffect(() => {
//   //   setTestStarted(true);
//   // }, []);

//   // Log whenever localStream changes
//   useEffect(() => {
//     try {
//       console.groupCollapsed('GiveTest Stream Update');
//       console.log('localStream set?', !!localStream);
//       console.log('streamRef.current', streamRef.current);
//       console.log('videoRef.current', videoRef.current);
//       console.groupEnd();
//     } catch (e) { console.warn('stream log failed', e); }
//   }, [localStream]);

//   // Cleanup webcam on unload
//   useEffect(() => {
//     const stopCamOnExit = async () => {
//       if (webcamInterviewRef.current && typeof webcamInterviewRef.current.stopAll === 'function') {
//         try {
//           await webcamInterviewRef.current.stopAll();
//         } catch (err) {
//           console.warn('Cleanup webcam error:', err);
//         }
//       }
//       try {
//         if (streamRef.current) {
//           streamRef.current.getTracks().forEach((t) => t.stop());
//           streamRef.current = null;
//         }
//       } catch (e) {
//         // ignore
//       }
//     };
//     window.addEventListener('beforeunload', stopCamOnExit);
//     return () => {
//       stopCamOnExit();
//       window.removeEventListener('beforeunload', stopCamOnExit);
//     };
//   }, []);

//   // Block certain keys and context menu while test active
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (
//         e.key === 'PrintScreen' ||
//         (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
//         (e.ctrlKey && e.key.toLowerCase() === 'p')
//       ) {
//         e.preventDefault();
//         e.stopPropagation();
//         return false;
//       }
//     };

//     const handleContextMenu = (e) => {
//       // Only block if test started and not submitted
//       if (testStarted && !submitted) {
//         e.preventDefault();
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     window.addEventListener('contextmenu', handleContextMenu);

//     return () => {
//       window.removeEventListener('keydown', handleKeyDown);
//       window.removeEventListener('contextmenu', handleContextMenu);
//     };
//   }, [testStarted, submitted]);

//   // Track visibility/tab switches and auto-submit after threshold
//   useEffect(() => {
//     // Centralized visibility/inactivity monitoring is handled by ActivityMonitor component.
//     // This redundant listener in GiveTest is removed to prevent double-counting.
//   }, [testStarted, submitted, allAnswers, sections]);

//   // Disable text selection & copy while test active
//   useEffect(() => {
//     if (!testStarted || submitted) return;

//     const handleSelect = (e) => e.preventDefault();
//     const handleCopy = (e) => e.preventDefault();

//     document.addEventListener('selectstart', handleSelect);
//     document.addEventListener('copy', handleCopy);

//     return () => {
//       document.removeEventListener('selectstart', handleSelect);
//       document.removeEventListener('copy', handleCopy);
//     };
//   }, [testStarted, submitted]);

//   // Fetch test and organize into sections
//   useEffect(() => {
//     const fetchTest = async () => {
//       try {
//         setLoading(true);
//         const queryParams = new URLSearchParams(window.location.search);
//         const orgIdFromUrl = queryParams.get('orgId') || queryParams.get('org_id');
//         if (orgIdFromUrl) {
//           setOrgId(orgIdFromUrl);
//           orgIdRef.current = orgIdFromUrl;
//         }

//         const data = await testApi.startTest(questionSetId, orgIdFromUrl);
//         // console.log("Fetched test data:", data);

//         const mcqQuestions = data.questions.filter(q => q.type === "mcq");
//         const codingQuestions = data.questions.filter(q => q.type === "coding");
//         const audioQuestions = data.questions.filter(q => q.type === "audio");
//         const videoQuestions = data.questions.filter(q => q.type === "video");

//         const organizedSections = [];

//         if (mcqQuestions.length) {
//           organizedSections.push({
//             name: "MCQ",
//             displayName: "Multiple Choice Questions",
//             questions: mcqQuestions,
//             type: "mcq",
//           });
//         }

//         if (codingQuestions.length) {
//           organizedSections.push({
//             name: "Coding",
//             displayName: "Coding Problems",
//             questions: codingQuestions,
//             type: "coding",
//           });
//         }

//         if (audioQuestions.length) {
//           organizedSections.push({
//             name: "Audio",
//             displayName: "Audio Interview",
//             questions: audioQuestions.map(q => ({
//               ...q,
//               content: { prompt_text: q.prompt_text }  // Normalize
//             })),
//             type: "audio",
//           });
//         }

//         if (videoQuestions.length) {
//           organizedSections.push({
//             name: "Video",
//             displayName: "Video Interview",
//             questions: videoQuestions.map(q => ({
//               ...q,
//               content: { prompt_text: q.prompt_text }  // Normalize
//             })),
//             type: "video",
//           });
//         }

//         setSections(organizedSections);

//         setLoading(false);
//       } catch (err) {
//         console.error('Failed to load test:', err);
//         setError('Failed to load test. Please check your link and try again.');
//         setLoading(false);
//       }
//     };

//     fetchTest();
//   }, [questionSetId]);

//   useEffect(() => {
//     try {
//       const raw = sessionStorage.getItem('jobData');
//       if (raw) {
//         const j = JSON.parse(raw);
//         const title = j.title || j.job_title || j.role || j.position;
//         if (title) setAssessmentJobTitle(String(title));
//       }
//     } catch (e) { }
//   }, []);

//   const currentSection = sections[currentSectionIndex];
//   const currentQuestion = currentSection?.questions[currentQuestionIndex];
//   const totalQuestionsInSection = currentSection?.questions.length || 0;

//   useEffect(() => {
//     if (currentQuestion?.id) {
//       setVisitedQuestionIds((prev) => new Set([...prev, currentQuestion.id]));
//     }
//   }, [currentQuestion?.id]);

//   useEffect(() => {
//     setQuestionGridPage(1);
//   }, [currentSectionIndex]);

//   useEffect(() => {
//     const hide = testStarted && step === 'test' && !submitted;
//     if (typeof setHideSidebarForTest === 'function') {
//       setHideSidebarForTest(hide);
//     }
//     return () => {
//       if (typeof setHideSidebarForTest === 'function') {
//         setHideSidebarForTest(false);
//       }
//     };
//   }, [testStarted, step, submitted, setHideSidebarForTest]);

//   // Shared timer for the current question so it continues inside AudioInterview
//   const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
//   // initialize when question changes
//   useEffect(() => {
//     const t = Number(currentQuestion?.time_limit || 60);
//     setQuestionTimeLeft(t);
//   }, [currentSectionIndex, currentQuestionIndex, currentQuestion?.id]);

//   // countdown managed here so it continues while AudioInterview is shown
//   useEffect(() => {
//     if (questionTimeLeft === null) return;
//     if (submitted) return;

//     const id = setInterval(() => {
//       setQuestionTimeLeft((prev) => (typeof prev === 'number' && prev > 0 ? prev - 1 : prev));
//     }, 1000);

//     return () => clearInterval(id);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentQuestion?.id, submitted]);

//   // notify when time reaches zero
//   useEffect(() => {
//     if (typeof questionTimeLeft === 'number' && questionTimeLeft <= 0) {
//       try { handleTimeUp(); } catch (e) { }
//     }
//   }, [questionTimeLeft]);

//   const totalAssessmentMinutes = useMemo(() => {
//     let sec = 0;
//     for (const s of sections) {
//       for (const q of s.questions || []) {
//         sec += Number(q.time_limit) || 60;
//       }
//     }
//     return Math.max(1, Math.round(sec / 60));
//   }, [sections]);

//   const durationHeader =
//     totalAssessmentMinutes >= 60
//       ? `${Math.round(totalAssessmentMinutes / 60)}hr`
//       : `${totalAssessmentMinutes} min`;

//   const gridTotalPages = Math.max(1, Math.ceil(totalQuestionsInSection / QUESTIONS_GRID_PAGE_SIZE));
//   const gridPageClamped = Math.min(questionGridPage, gridTotalPages);
//   const gridSliceStart = (gridPageClamped - 1) * QUESTIONS_GRID_PAGE_SIZE;
//   const gridQuestionsSlice = (currentSection?.questions || []).slice(
//     gridSliceStart,
//     gridSliceStart + QUESTIONS_GRID_PAGE_SIZE
//   );

//   const isQuestionAnswered = (q) => {
//     if (!q) return false;
//     const a = allAnswers[q.id];
//     return a !== undefined && a !== null && String(a).trim() !== '';
//   };

//   const goToSectionFromTab = (type) => {
//     const idx = sections.findIndex((s) => s.type === type);
//     if (idx < 0) return;
//     if (idx > currentSectionIndex) {
//       toast.info('Finish this section to unlock the next part.');
//       return;
//     }
//     setCurrentSectionIndex(idx);
//     setCurrentQuestionIndex(0);
//   };

//   const getQuestionKey = (q, sectionIndex, questionIndex) => {
//     if (!q) return '';
//     const raw = q.id ?? q._id ?? q.question_id;
//     if (raw !== undefined && raw !== null && String(raw) !== '') return String(raw);
//     return `s${sectionIndex}-i${questionIndex}`;
//   };

//   const currentQReviewKey =
//     currentQuestion != null
//       ? getQuestionKey(currentQuestion, currentSectionIndex, currentQuestionIndex)
//       : '';
//   const isCurrentMarkedForReview = !!(currentQReviewKey && reviewMarks[currentQReviewKey]);

//   const toggleMarkReview = () => {
//     if (!currentQuestion) return;
//     const key = getQuestionKey(currentQuestion, currentSectionIndex, currentQuestionIndex);
//     if (!key) return;
//     setReviewMarks((prev) => {
//       const next = { ...prev };
//       if (next[key]) {
//         delete next[key];
//         toast.info('Removed from review');
//       } else {
//         next[key] = true;
//         toast.success('Marked for review');
//       }
//       return next;
//     });
//   };

//   const handleSaveAndNext = () => {
//     if (
//       (currentSection?.type === 'mcq' ||
//         currentSection?.type === 'coding' ||
//         currentSection?.type === 'video') &&
//       currentQuestionIndex === totalQuestionsInSection - 1 &&
//       currentSectionIndex === sections.length - 1
//     ) {
//       if (submitting) return;
//       handleSubmitAllSections().catch((e) => console.warn('Submit failed', e));
//       return;
//     }

//     const hasVideoSection = sections.some((s) => s.type === 'video');

//     if (
//       hasVideoSection &&
//       currentSection?.type === 'video' &&
//       !showWebcamInterview &&
//       currentQuestionIndex === totalQuestionsInSection - 1
//     ) {
//       toast.error('Please complete the webcam interview before submitting.');
//       return;
//     }

//     if (currentSection?.type === 'audio') {
//       if (currentSectionIndex < sections.length - 1) {
//         setCompletedSections((prev) => new Set([...prev, currentSectionIndex]));
//         setCurrentSectionIndex((prev) => prev + 1);
//         setCurrentQuestionIndex(0);
//       } else if (audioInterviewDone) {
//         if (submitting) return;
//         handleSubmitAllSections().catch((e) => console.warn('Submit failed', e));
//       } else {
//         setAudioInterviewVisited(true);
//         setShowAudioInterview(true);
//       }
//       return;
//     }

//     handleNext();
//   };

//   const saveNextLabel = submitting
//     ? 'Submitting...'
//     : currentSection?.type === 'audio'
//       ? currentSectionIndex === sections.length - 1
//         ? audioInterviewDone
//           ? 'Submit Test'
//           : 'Visit Audio Interview'
//         : audioInterviewVisited
//           ? 'Go To Next Part'
//           : 'Visit Audio Interview'
//       : (currentSection?.type === 'mcq' ||
//         currentSection?.type === 'coding' ||
//         currentSection?.type === 'video') &&
//         currentQuestionIndex === totalQuestionsInSection - 1 &&
//         currentSectionIndex === sections.length - 1
//         ? 'Submit Test'
//         : currentQuestionIndex === totalQuestionsInSection - 1
//           ? 'Proceed to Next Section'
//           : 'Save & Next';

//   const saveNextDisabled =
//     submitting || (currentSection?.type === 'audio' && !audioInterviewVisited);

//   // Handle single-question answer change
//   const handleAnswerChange = (answer) => {
//     if (!currentQuestion) return;
//     setAllAnswers(prev => ({
//       ...prev,
//       [currentQuestion.id]: answer,
//     }));
//   };

//   // Navigation: Next / Previous
//   const handleNext = () => {
//     if (currentQuestionIndex < totalQuestionsInSection - 1) {
//       setCurrentQuestionIndex(prev => prev + 1);
//     } else if (currentSectionIndex < sections.length - 1) {
//       setCompletedSections(prev => new Set([...prev, currentSectionIndex]));
//       setCurrentSectionIndex(prev => prev + 1);
//       setCurrentQuestionIndex(0);
//     } else {
//       // Removed automatic submit from navigation. Submissions are now triggered by section-specific actions (audio/video Upload & Submit).
//       toast.info('Please complete the section actions (Upload & Submit) to finish the test.');
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex(prev => prev - 1);
//     }
//     // do not allow going back to previous section once moved forward
//   };

//   const handleTimeUp = () => {
//     handleNext();
//   };

//   // Start recording immediately on mount as soon as media is available
//   useEffect(() => {
//     if (recordingStartedRef.current) return;
//     if (!mediaAllowed) return;

//     const candidateStream =
//       streamRef.current ||
//       localStream ||
//       window.__candidateCameraStream;

//     if (!candidateStream) return;

//     console.log('GiveTest: recorder mounted and ready');

//     setRecordingStarted(true);
//     recordingStartedRef.current = true;
//   }, [mediaAllowed, localStream]);


//   // Submit all sections
//   // options: { markComplete: boolean }
//   const handleSubmitAllSections = async (answersOverride, options = {}) => {
//     try {
//       if (fullscreenExitTimeoutRef.current) {
//         clearTimeout(fullscreenExitTimeoutRef.current);
//         fullscreenExitTimeoutRef.current = null;
//       }
//       if (fullscreenExitIntervalRef.current) {
//         clearInterval(fullscreenExitIntervalRef.current);
//         fullscreenExitIntervalRef.current = null;
//       }
//       fullscreenPenaltyActiveRef.current = false;
//       setShowFullscreenExitModal(false);
//       setFullscreenGraceSeconds(null);
//     } catch (e) { }

//     setSubmitting(true);
//     try {
//       // Before submitting, upload the recorded video if recording was started
//       if (recordingStarted && webcamInterviewRef.current) {
//         try {
//           console.log('GiveTest: uploading recorded video before final submit...');
//           const uploadResult = await webcamInterviewRef.current.uploadRecording();
//           console.log('GiveTest: video upload result:', uploadResult);
//           if (uploadResult && uploadResult.qa_data) {
//             // Merge uploaded QA into allAnswers if needed
//             console.log('GiveTest: video QA data received from upload:', uploadResult.qa_data);
//           }
//         } catch (err) {
//           console.warn('GiveTest: video upload failed before submit:', err);
//           // Don't block submission if video upload fails
//         }
//       }

//       const results = [];
//       // read cid once from sessionStorage so it's available after the loop
//       let cidFromSession = null;
//       let jobIdFromSession = null;
//       try {
//         const raw = sessionStorage.getItem("candidateData");
//         if (raw) {
//           const parsed = JSON.parse(raw);
//           cidFromSession = parsed?.id ?? null;
//           // accept multiple possible keys used by different flows
//           jobIdFromSession = parsed?.job_id || parsed?.jobId || parsed?.job || parsed?.jdId || parsed?.jd_id || null;
//           console.log('GiveTest: candidateData keys from sessionStorage', Object.keys(parsed || {}));
//         }
//       } catch (e) {
//         console.warn('Failed to read candidateData from sessionStorage', e);
//       }

//       // helper: read job id from URL query params as another fallback
//       const getQueryParam = (name) => {
//         try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
//       };

//       // try multiple fallbacks: prop, sessionStorage, URL query, location state, localStorage cached jobData
//       let resolvedJobId = jdId || jobIdFromSession || getQueryParam('job_id') || getQueryParam('jobId') || getQueryParam('jdId') || getQueryParam('jd') || null;
//       if (!resolvedJobId) {
//         // check react-router location state
//         try {
//           const s = location && location.state;
//           if (s && (s.job_id || s.jobId || s.jdId || s.job)) resolvedJobId = s.job_id || s.jobId || s.jdId || s.job || null;
//         } catch (e) { }
//       }

//       if (!resolvedJobId) {
//         // prefer sessionStorage (set by Examination/TestDetails) then fall back to localStorage
//         try {
//           const maybeSession = sessionStorage.getItem('jobData');
//           if (maybeSession) {
//             const jd = JSON.parse(maybeSession);
//             if (jd && (jd.job_id || jd.jobId || jd._id || jd.id) && (jd.questionSetId === questionSetId || jd.question_set_id === questionSetId || !questionSetId)) {
//               resolvedJobId = jd.job_id || jd.jobId || jd._id || jd.id;
//             }
//           }
//         } catch (e) { }

//         if (!resolvedJobId) {
//           try {
//             const maybe = localStorage.getItem('jobData');
//             if (maybe) {
//               const jd = JSON.parse(maybe);
//               if (jd && (jd.job_id || jd.jobId || jd._id || jd.id) && (jd.questionSetId === questionSetId || jd.question_set_id === questionSetId || !questionSetId)) {
//                 resolvedJobId = jd.job_id || jd.jobId || jd._id || jd.id;
//               }
//             }
//           } catch (e) { }
//         }
//       }

//       if (!resolvedJobId) {
//         try {
//           const listRawSession = sessionStorage.getItem('jobDataList');
//           if (listRawSession) {
//             const arr = JSON.parse(listRawSession) || [];
//             const found = arr.find(it => (it.questionSetId === questionSetId) || (it.question_set_id === questionSetId));
//             if (found) resolvedJobId = found.job_id || found.jobId || found._id || found.id || null;
//           }
//         } catch (e) { }

//         if (!resolvedJobId) {
//           try {
//             const listRaw = localStorage.getItem('jobDataList');
//             if (listRaw) {
//               const arr = JSON.parse(listRaw) || [];
//               const found = arr.find(it => (it.questionSetId === questionSetId) || (it.question_set_id === questionSetId));
//               if (found) resolvedJobId = found.job_id || found.jobId || found._id || found.id || null;
//             }
//           } catch (e) { }
//         }
//       }

//       console.log('GiveTest: resolvedJobId ->', resolvedJobId);
//       // expose for quick debugging in console
//       try { window.__resolvedJobId = resolvedJobId; } catch (e) { }

//       for (let sIdx = 0; sIdx < sections.length; sIdx++) {
//         const section = sections[sIdx];
//         const answersSource = answersOverride || allAnswers;

//         const responses = section.questions.map((question, qIdx) => {
//           const qKey = getQuestionKey(question, sIdx, qIdx);
//           const qId = question.id ?? question._id ?? question.question_id;
//           return {
//             question_id: qId,
//             question_type: question.type,
//             question_text:
//               question.prompt_text ||
//               question.content?.prompt_text ||
//               question.question ||
//               '',

//             correct_answer:
//               question.correct_answer ||
//               question.content?.correct_answer ||
//               'N/A',

//             candidate_answer: answersSource[qId] ?? answersSource[question.id] ?? '',
//             marked_for_review: !!reviewMarks[qKey],
//           };
//         });



//         const submissionData = {
//           question_set_id: questionSetId,
//           section_name: section.name,
//           candidate_id: finalCandidateId,
//           cid: cidFromSession || finalCandidateId,
//           job_id: resolvedJobId,
//           responses,
//         };

//         if (options && options.markComplete) {
//           submissionData.mark_complete = true;
//         }

//         // Debug logs (helpful during integration)
//         console.log('Submitting section', section.name, 'with questionSetId=', questionSetId);
//         console.log('submissionData:', submissionData);
//         let result = null;
//         try {
//           result = await testApi.submitSection(questionSetId, submissionData, orgIdRef.current);
//           console.log('submitSection result:', result);
//         } catch (err) {
//           console.error('submitSection threw error:', err);
//           throw err;
//         }
//         results.push({ sectionName: section.name, result });
//       }

//       setSubmissionResults(results);
//       setSubmitted(true);
//       try {
//         sessionStorage.removeItem('exam_expects_fullscreen');
//       } catch (e) { }
//       toast.success("Test submitted successfully!");

//       // STOP RECORDING + MONITORING AFTER SUBMIT
//       try {
//         // 1. Stop webcam recorder (stops recording)
//         if (webcamInterviewRef.current && typeof webcamInterviewRef.current.stopAll === "function") {
//           console.log('GiveTest: stopping recording on test submit...');
//           await webcamInterviewRef.current.stopAll();
//           recordingStartedRef.current = false;
//           setRecordingStarted(false);
//           console.log('GiveTest: recording stopped');
//         }

//         // 2. Disable further tab/inactivity/face violations
//         setTestStarted(false);
//         // clear any multi-face UI state
//         try { setShowMultipleFaces(false); } catch (e) { }
//       } catch (err) {
//         console.warn("Failed to cleanup after submit:", err);
//       }

//       // 1) save violations (best-effort)
//       try {
//         if (!saveViolationsSentRef.current) {
//           saveViolationsSentRef.current = true;
//           const v = violationsRef.current;
//           const violationsPayload = {
//             question_set_id: questionSetId,
//             candidate_id: finalCandidateId,
//             tab_switches: v.tab_switches || 0,
//             inactivities: v.inactivities || 0,
//             face_not_visible: v.face_not_visible || 0,
//             multiple_faces: v.multiple_faces || 0, // CRITICAL FIX: missing field
//             cid: cidFromSession || finalCandidateId,
//             job_id: resolvedJobId,
//           };
//           console.log('GiveTest: sending saveViolations payload ->', violationsPayload);
//           await testApi.saveViolations(violationsPayload, orgIdRef.current);
//           console.log('GiveTest: Violations saved successfully');
//         }
//       } catch (err) {
//         console.warn('GiveTest: Failed to save violations', err);
//       }

//       // 2) optionally store candidate id to local env for other components
//       window.REACT_APP_CANDIDATE_ID = finalCandidateId;
//       window.REACT_APP_QUESTION_SET_ID = questionSetId;
//     } catch (err) {
//       console.error('Test submission error:', err);
//       setError('Failed to submit test. Please try again.');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleSubmitAllSectionsRef = useRef(handleSubmitAllSections);
//   handleSubmitAllSectionsRef.current = handleSubmitAllSections;

//   useEffect(() => {
//     const examLive = testStarted && step === 'test' && !submitted;

//     const clearFullscreenGraceTimers = () => {
//       if (fullscreenExitTimeoutRef.current) {
//         clearTimeout(fullscreenExitTimeoutRef.current);
//         fullscreenExitTimeoutRef.current = null;
//       }
//       if (fullscreenExitIntervalRef.current) {
//         clearInterval(fullscreenExitIntervalRef.current);
//         fullscreenExitIntervalRef.current = null;
//       }
//       setFullscreenGraceSeconds(null);
//       fullscreenPenaltyActiveRef.current = false;
//     };

//     if (!examLive) {
//       clearFullscreenGraceTimers();
//       setShowFullscreenExitModal(false);
//       return;
//     }

//     const examExpectsFullscreen = (() => {
//       try {
//         return sessionStorage.getItem('exam_expects_fullscreen') === '1';
//       } catch (e) {
//         return false;
//       }
//     })();

//     const startFullscreenExitPenalty = () => {
//       if (fullscreenPenaltyActiveRef.current || submittingRef.current) return;
//       fullscreenPenaltyActiveRef.current = true;
//       setShowFullscreenExitModal(true);
//       setFullscreenGraceSeconds(FULLSCREEN_EXIT_GRACE_SEC);

//       let remaining = FULLSCREEN_EXIT_GRACE_SEC;
//       fullscreenExitIntervalRef.current = setInterval(() => {
//         remaining -= 1;
//         setFullscreenGraceSeconds(remaining > 0 ? remaining : 0);
//       }, 1000);

//       fullscreenExitTimeoutRef.current = setTimeout(() => {
//         if (fullscreenExitIntervalRef.current) {
//           clearInterval(fullscreenExitIntervalRef.current);
//           fullscreenExitIntervalRef.current = null;
//         }
//         fullscreenExitTimeoutRef.current = null;
//         fullscreenPenaltyActiveRef.current = false;
//         setShowFullscreenExitModal(false);
//         setFullscreenGraceSeconds(null);

//         if (!getFullscreenElement() && !submittingRef.current) {
//           toast.error(
//             'Your exam was submitted automatically because fullscreen was not restored.'
//           );
//           Promise.resolve(handleSubmitAllSectionsRef.current?.()).catch((e) =>
//             console.warn('Fullscreen auto-submit failed', e)
//           );
//         }
//       }, FULLSCREEN_EXIT_GRACE_SEC * 1000);
//     };

//     const onFullscreenChange = () => {
//       const fs = getFullscreenElement();
//       if (fs) {
//         hadFullscreenDuringExamRef.current = true;
//         clearFullscreenGraceTimers();
//         setShowFullscreenExitModal(false);
//         return;
//       }

//       const shouldEnforce =
//         hadFullscreenDuringExamRef.current || examExpectsFullscreen;
//       if (!shouldEnforce) return;
//       hadFullscreenDuringExamRef.current = true;
//       startFullscreenExitPenalty();
//     };

//     document.addEventListener('fullscreenchange', onFullscreenChange);
//     document.addEventListener('webkitfullscreenchange', onFullscreenChange);
//     document.addEventListener('MSFullscreenChange', onFullscreenChange);

//     if (getFullscreenElement()) {
//       hadFullscreenDuringExamRef.current = true;
//     } else if (examExpectsFullscreen) {
//       hadFullscreenDuringExamRef.current = true;
//       queueMicrotask(() => startFullscreenExitPenalty());
//     }

//     return () => {
//       document.removeEventListener('fullscreenchange', onFullscreenChange);
//       document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
//       document.removeEventListener('MSFullscreenChange', onFullscreenChange);
//       if (fullscreenExitTimeoutRef.current) {
//         clearTimeout(fullscreenExitTimeoutRef.current);
//         fullscreenExitTimeoutRef.current = null;
//       }
//       if (fullscreenExitIntervalRef.current) {
//         clearInterval(fullscreenExitIntervalRef.current);
//         fullscreenExitIntervalRef.current = null;
//       }
//     };
//   }, [testStarted, step, submitted]);

//   // ActivityMonitor -> onViolation handler
//   const handleViolation = (key, count = 1, flush = false) => {
//     if (submitted || !testStarted) return;

//     // Helper: show alert for MCQ, coding, and video sections
//     const showSectionAlert = (msg) => {
//       const sectionType = currentSection?.type;
//       if (["mcq", "coding", "video"].includes(sectionType)) {
//         window.alert(msg);
//       }
//     };

//     // 1. UPDATE REF IMMEDIATELY (SYNCHRONOUS) - This is for the final submission payload
//     const currentCounts = { ...violationsRef.current };
//     if (flush) {
//       currentCounts[key] = count;
//     } else {
//       currentCounts[key] = (currentCounts[key] || 0) + count;
//     }
//     violationsRef.current = currentCounts;

//     // 2. UPDATE STATE FOR UI FEEDBACK (ASYNCHRONOUS)
//     setViolations(currentCounts);

//     // 3. EMIT SOCKET EVENT
//     try {
//       emitViolation({
//         exam_id: jdId,
//         question_set_id: questionSetId,
//         candidate_email: userInfo.email,
//         candidate_name: userInfo.name,
//         [key]: flush ? Number(count) : 1,
//       });
//     } catch (e) {
//       console.warn('emitViolation failed', e);
//     }

//     // 4. HANDLE SPECIFIC KEYS
//     if (key === 'multiple_faces') {
//       setShowMultipleFaces(true);
//       if (!shownToastsRef.current.has('multiple_faces')) {
//         const msg = '🚨 Multiple faces detected — page blurred';
//         toast.warning(msg);
//         showSectionAlert(msg);
//         shownToastsRef.current.add('multiple_faces');
//       }
//     } else if (key === 'single_face') {
//       setShowMultipleFaces(false);
//       shownToastsRef.current.delete('multiple_faces');
//       return;
//     } else if (key === 'tab_switches') {
//       const msg = '⚠️ Tab switch detected — page blurred';
//       showSectionAlert(msg);
//       if (!shownToastsRef.current.has('tab_switches')) {
//         toast.warning(msg);
//         shownToastsRef.current.add('tab_switches');
//       }
//       setShowTabSwitch(true);
//       setTimeout(() => { try { setShowTabSwitch(false); } catch (e) { } }, 3000);
//     } else {
//       // General toasts for other violations (inactivities, face_not_visible)
//       if (!shownToastsRef.current.has(key)) {
//         let msg = '';
//         if (key === 'inactivities') msg = '⌛ You have been inactive.';
//         if (key === 'face_not_visible') msg = '🚨 Face not visible!';
//         if (msg) {
//           toast[key === 'face_not_visible' ? 'error' : (key === 'inactivities' ? 'info' : 'warning')](msg);
//           showSectionAlert(msg);
//         }
//         shownToastsRef.current.add(key);
//       }
//     }

//     // 5. AUTO-SUBMIT LOGIC
//     // Thresholds: tab_switches >= 15, multiple_faces >= 15, inactivities >= 15, face_not_visible >= 15
//     let shouldAutoSubmit = false;
//     let submitReason = '';

//     if (currentCounts.tab_switches >= 5) {
//       shouldAutoSubmit = true;
//       submitReason = 'Too many tab switches detected.';
//     } else if (currentCounts.multiple_faces >= 5) {
//       shouldAutoSubmit = true;
//       submitReason = 'Multiple faces detected multiple times.';
//     } else if (currentCounts.inactivities >= 5) {
//       shouldAutoSubmit = true;
//       submitReason = 'Prolonged inactivity detected.';
//     } else if (currentCounts.face_not_visible >= 5) {
//       shouldAutoSubmit = true;
//       submitReason = 'Face not visible for too long.';
//     }

//     if (shouldAutoSubmit && testStarted && !submittingRef.current) {
//       console.log('AUTO-SUBMITTING due to proctoring violation:', submitReason);
//       toast.error(`${submitReason} Submitting test automatically.`);

//       try {
//         setTestStarted(false);
//         const answersToSubmit = { ...(allAnswers || {}) };

//         // Persist partial results
//         try {
//           const key = `partialAnswers_${questionSetId}_${finalCandidateId}`;
//           sessionStorage.setItem(key, JSON.stringify(answersToSubmit));
//         } catch (e) { }

//         handleSubmitAllSections(answersToSubmit, { markComplete: true })
//           .catch(e => console.warn('Auto-submit failed', e));
//       } catch (e) {
//         console.warn('Auto-submit handler crash', e);
//       }
//     }
//   };

//   // uncomment the below line if candidate needs to login before giving test!!!
//   {/* // Entry step: collect email / user details
//   if (step === 'entry') {
//     return (
//       <UserEmail
//         jdId={jdId}
//         onContinue={(info) => {
//           setUserInfo(info);
//           setStep('instructions');
//           requestMedia();
//         }}
//       />
//     );
//   } */}

//   // Recording permission dialog - show before allowing test to start
//   if (recordingStarted && !recordingPermissionAsked) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center border-2 border-blue-200">
//           <div className="text-6xl mb-6">🎥</div>
//           <h2 className="text-3xl font-bold text-gray-800 mb-4">Recording Permission</h2>
//           <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6 text-left">
//             <p className="text-gray-700 mb-3">
//               <strong>Your camera is now recording.</strong>
//             </p>
//             <p className="text-gray-600 text-sm mb-2">
//               This recording will capture your entire test session to ensure:
//             </p>
//             <ul className="text-sm text-gray-600 space-y-1 ml-4">
//               <li>✓ Test integrity and fairness</li>
//               <li>✓ Proper candidate verification</li>
//               <li>✓ A single continuous video of your test</li>
//             </ul>
//           </div>
//           <p className="text-gray-600 mb-6">
//             Do you allow us to record your test session?
//           </p>
//           <div className="flex gap-4">
//             <button
//               onClick={() => {
//                 setRecordingPermissionAsked(true);
//                 setRecordingPermissionGranted(true);
//                 setInstructionsVisible(false);
//                 setTestStarted(true);
//                 setStep('test');
//                 toast.success('✓ Permission granted! Starting test...');
//               }}

//               className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
//             >
//               Deny
//             </button>
//             <button
//               onClick={() => {
//                 setRecordingPermissionAsked(true);
//                 setRecordingPermissionGranted(true);
//                 setInstructionsVisible(false);
//                 setTestStarted(true);
//                 setStep('test');
//                 toast.success('✓ Permission granted! Starting test...');
//               }}
//               className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
//             >
//               Allow
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Show error if recording was denied
//   if (recordingPermissionAsked && !recordingPermissionGranted) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
//           <div className="text-red-500 text-6xl mb-4">❌</div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">Recording Permission Denied</h2>
//           <p className="text-gray-600 mb-6">
//             Recording is mandatory for this test. You cannot proceed without granting recording permission.
//           </p>
//           <button
//             onClick={() => window.location.reload()}
//             className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold"
//           >
//             Reload and Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Instructions step
//   if (step === 'instructions') {
//     if (instructionsVisible || !mediaAllowed) {
//       return (
//         <InstructionsPage
//           onComplete={() => {
//             setInstructionsVisible(false);
//             setTestStarted(true);
//             setStep('test');
//             // Test starts after instructions, recording is already active
//           }}
//           mediaAllowed={mediaAllowed}
//         />
//       );
//     }
//   }

//   // Show permission request overlay if media not allowed after test started
//   if (!mediaAllowed && testStarted && step === 'test') {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
//           <div className="text-4xl mb-4">📹🎤</div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">Permissions Required</h2>
//           <p className="text-gray-600 mb-6">
//             Your camera and microphone access is required to take this test. Please grant permissions when prompted by your browser.
//           </p>
//           <button
//             onClick={requestMedia}
//             className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-2"
//           >
//             Request Camera & Microphone Access
//           </button>
//           <p className="text-xs text-gray-500 mt-4">
//             If you deny permissions, you won't be able to take the test. Make sure your device has both camera and microphone available.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Loading
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
//           <p className="text-gray-600 text-lg">Loading test...</p>
//         </div>
//       </div>
//     );
//   }

//   // Error
//   if (error && !submitting) {
//     return (
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
//           <div className="text-red-500 text-5xl mb-4">⚠️</div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Submitted / results view
//   if (submitted) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-[#eef0f4] px-4 py-10 font-sans">
//         <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
//           <button
//             type="button"
//             aria-label="Close"
//             onClick={() => { window.location.href = '/Candidate-Dashboard'; }}
//             className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
//           >
//             ✕
//           </button>
//           <div className="flex flex-col items-center text-center">
//             <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.45)]">
//               <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
//             <h2 className="mb-2 text-xl font-semibold text-[#7C69EF]">Test submitted successfully</h2>
//             <p className="mb-8 text-sm leading-relaxed text-gray-600">
//               Thank you for taking the test. Your responses have been submitted successfully.
//             </p>
//             <button
//               type="button"
//               onClick={() => { window.location.href = '/Candidate-Dashboard'; }}
//               className="w-full rounded-xl bg-gradient-to-r from-[#7C69EF] to-[#a855f7] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
//             >
//               Done
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // When audio interview is open, show only that UI


//   // NOTE: Do not early-return for AudioInterview; keep recorder mounted across sections.


//   // UI
//   return (
//     <>

//       {/* Audio Interview Overlay (keeps the recorder mounted so recording does NOT restart) */}
//       {showAudioInterview && (
//         <div className="fixed inset-0 z-[9999] h-dvh max-h-dvh overflow-hidden bg-[#eef0f4]">
//           <AudioInterview
//             questions={currentSection?.questions || []}
//             candidateId={finalCandidateId}
//             questionSetId={questionSetId}
//             baseUrl={window.REACT_APP_BASE_URL || { pythonUrl }}
//             onClose={() => setShowAudioInterview(false)}
//             onComplete={(qa) => {
//               setAudioInterviewResults(qa);
//               // merge audio answers into main answers map so submit includes them
//               setAllAnswers((prev) => {
//                 const next = { ...prev };
//                 (qa || []).forEach((item) => {
//                   if (item && item.questionId) next[item.questionId] = item.answer || '';
//                 });
//                 return next;
//               });
//               setShowAudioInterview(false);
//               setAudioInterviewDone(true);
//               toast.success('Audio interview completed.');
//             }}
//             faceEventRef={faceEventRef}
//             showMultipleFaces={showMultipleFaces}
//             showTabSwitch={showTabSwitch}
//             sharedStream={streamRef.current || localStream}
//             remainingTime={questionTimeLeft}
//             updateRemainingTime={(t) => setQuestionTimeLeft(Number(t))}
//             onAudioTimeUp={handleTimeUp}
//           />
//         </div>
//       )}


//       <ToastContainer
//         position="top-center"
//         autoClose={3000}
//         hideProgressBar={false}
//         newestOnTop={true}
//         closeOnClick
//         rtl={false}
//         pauseOnFocusLoss
//         draggable
//         pauseOnHover
//       />

//       {showFullscreenExitModal && testStarted && step === 'test' && !submitted && (
//         <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
//           <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
//             <h2 className="text-xl font-bold text-gray-900">Return to fullscreen</h2>
//             <p className="mt-3 text-sm leading-relaxed text-gray-600">
//               You left fullscreen during the exam. Click the button below to go back to fullscreen and continue.
//               If you do not return within{' '}
//               <span className="font-semibold text-[#7C69EF]">
//                 {fullscreenGraceSeconds ?? FULLSCREEN_EXIT_GRACE_SEC}
//               </span>{' '}
//               seconds, your exam will be submitted automatically.
//             </p>
//             <button
//               type="button"
//               onClick={() => requestDocumentFullscreen()}
//               className="mt-6 w-full rounded-xl bg-[#7C69EF] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
//             >
//               Enter fullscreen again
//             </button>
//           </div>
//         </div>
//       )}

//       {showMultipleFaces && (
//         <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-400 text-black px-4 py-2 rounded shadow">
//           🚨 Multiple faces detected — page blurred
//         </div>
//       )}

//       {/* Hidden monitoring components */}
//       <ActivityMonitor
//         questionSetId={questionSetId}
//         candidateName={userInfo.name}
//         email={userInfo.email}
//         faceEventRef={faceEventRef}
//         testStarted={testStarted}
//         submitted={submitted}
//         onViolation={handleViolation}
//       />

//       {!submitted && <FaceDetection faceEventRef={faceEventRef} />}

//       {/* Persistent hidden recorder - records entire test continuously */}
//       {/* Persistent recorder – mounted early, starts later */}
//       {recordingStarted && recordingPermissionGranted && (
//         <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
//           <WebCamRecorder
//             ref={webcamInterviewRef}
//             candidateId={finalCandidateId}
//             questionSetId={questionSetId}
//             sharedStream={streamRef.current || localStream || window.__candidateCameraStream}

//             /* 🔑 THIS IS THE FIX */
//             autoStart={recordingPermissionGranted}

//             onComplete={(qa) => {
//               console.log('Recorder completed:', qa);
//             }}
//           />
//         </div>
//       )}


//       {/* Quick button to trigger camera permissions if preview missing */}
//       {!submitted && step === 'test' && !mediaAllowed && (
//         <div className="fixed top-24 right-4 z-40">
//           <button
//             onClick={requestMedia}
//             className="px-3 py-2 bg-yellow-500 text-white rounded shadow"
//           >
//             Enable Camera Preview
//           </button>
//         </div>
//       )}

//       <div className={`min-h-screen bg-[#eef0f4] font-sans ${showMultipleFaces ? 'blur-sm' : ''}`}>
//         <div className="mx-auto max-w-[1600px] px-4 py-6">
//           <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//             <div>
//               <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Online Assessment</p>
//               <h1 className="mt-1 text-2xl font-bold text-gray-900">
//                 Welcome, {candidateDisplayName}!
//               </h1>
//               <p className="mt-1 text-sm text-gray-500">
//                 {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
//               </p>
//             </div>
//             <div className="flex-1 rounded-2xl bg-white px-6 py-5 text-center shadow-md lg:mx-6">
//               <h2 className="text-lg font-bold text-gray-900">
//                 Online Assessment for {assessmentJobTitle}
//               </h2>
//               <p className="mt-1 text-sm text-gray-500">
//                 Duration: {durationHeader} • {sections.length} Sections
//               </p>
//             </div>
//             <div className="hidden w-44 shrink-0 lg:block" aria-hidden />
//           </div>

//           <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
//             {/* Left: question palette */}
//             <aside className="lg:col-span-3">
//               <div className="rounded-2xl bg-white p-5 shadow-md">
//                 <h3 className="text-sm font-bold text-gray-800">
//                   Questions ({totalQuestionsInSection})
//                 </h3>
//                 <div className="mt-4 grid grid-cols-4 gap-2">
//                   {gridQuestionsSlice.map((q, i) => {
//                     const globalIdx = gridSliceStart + i;
//                     const answered = isQuestionAnswered(q);
//                     const visited = visitedQuestionIds.has(q.id);
//                     const qKey = getQuestionKey(q, currentSectionIndex, globalIdx);
//                     const isReview = !!reviewMarks[qKey];
//                     const isCurrent = globalIdx === currentQuestionIndex;
//                     let cell =
//                       'flex h-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition ';
//                     if (isCurrent) {
//                       cell += 'ring-2 ring-offset-2 ';
//                       cell += isReview ? 'ring-violet-600 ' : 'ring-[#7C69EF] ';
//                     }
//                     if (isReview && !isCurrent) {
//                       cell += 'border-violet-400 bg-violet-50 text-violet-900 ';
//                     } else if (answered) {
//                       cell += 'border-emerald-200 bg-emerald-100 text-emerald-900 ';
//                     } else if (visited) {
//                       cell += 'border-amber-200 bg-amber-100 text-amber-900 ';
//                     } else {
//                       cell += 'border-gray-200 bg-gray-100 text-gray-500 ';
//                     }
//                     if (isCurrent && isReview) {
//                       cell += 'bg-violet-50 ';
//                     }
//                     return (
//                       <button
//                         key={q.id}
//                         type="button"
//                         onClick={() => setCurrentQuestionIndex(globalIdx)}
//                         className={cell}
//                       >
//                         {globalIdx + 1}
//                       </button>
//                     );
//                   })}
//                 </div>
//                 {gridTotalPages > 1 && (
//                   <div className="mt-4 flex items-center justify-center gap-3 text-gray-600">
//                     <button
//                       type="button"
//                       className="rounded-lg p-1 hover:bg-gray-100"
//                       onClick={() => setQuestionGridPage((p) => Math.max(1, p - 1))}
//                       aria-label="Previous page"
//                     >
//                       &lt;
//                     </button>
//                     <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C69EF] text-sm font-bold text-white">
//                       {gridPageClamped}
//                     </span>
//                     <button
//                       type="button"
//                       className="rounded-lg p-1 hover:bg-gray-100"
//                       onClick={() => setQuestionGridPage((p) => Math.min(gridTotalPages, p + 1))}
//                       aria-label="Next page"
//                     >
//                       &gt;
//                     </button>
//                   </div>
//                 )}
//                 <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-600">
//                   <div className="flex items-center gap-2">
//                     <span className="h-3 w-6 rounded bg-amber-200" />
//                     Visited but not answered
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="h-3 w-6 rounded bg-emerald-200" />
//                     Answered
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="h-3 w-6 rounded bg-gray-200" />
//                     Not visited
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="h-3 w-6 rounded border-2 border-violet-400 bg-violet-50" />
//                     Marked for review
//                   </div>
//                 </div>
//               </div>
//             </aside>

//             {/* Center: tabs + question */}
//             <main className="lg:col-span-6">
//               <div className="rounded-2xl bg-white p-5 shadow-md lg:min-h-[520px]">
//                 <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
//                   {SECTION_TAB_ORDER.map((type) => {
//                     const exists = sections.some((s) => s.type === type);
//                     const active = currentSection?.type === type;
//                     const label =
//                       type === 'mcq'
//                         ? 'MCQ'
//                         : type === 'coding'
//                           ? 'Coding'
//                           : type === 'audio'
//                             ? 'Audio'
//                             : 'Video';
//                     return (
//                       <button
//                         key={type}
//                         type="button"
//                         disabled={!exists}
//                         onClick={() => goToSectionFromTab(type)}
//                         className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${!exists
//                             ? 'cursor-not-allowed text-gray-300'
//                             : active
//                               ? 'bg-[#7C69EF]/15 text-[#5b4dd4]'
//                               : 'text-gray-500 hover:bg-gray-50'
//                           }`}
//                       >
//                         {label}
//                       </button>
//                     );
//                   })}
//                   <div className="ml-auto flex flex-wrap items-center gap-2">
//                     {(currentSection?.type === 'audio') && (
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setAudioInterviewVisited(true);
//                           if (currentSection?.type === 'audio') setShowAudioInterview(true);
//                         }}
//                         className="inline-flex items-center gap-2 rounded-xl bg-[#7C69EF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#6d5ce0]"
//                       >
//                         <span className="inline-block h-2.5 w-2.5 rounded-full bg-white ring-2 ring-white/80" />
//                         Record
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {currentQuestionIndex === totalQuestionsInSection - 1 &&
//                   currentSectionIndex === sections.length - 1 && (
//                     <p className="mb-3 text-center text-sm font-medium text-[#7C69EF]">
//                       Final submission — all sections will be submitted
//                     </p>
//                   )}
//                 {currentQuestionIndex === totalQuestionsInSection - 1 &&
//                   currentSectionIndex < sections.length - 1 && (
//                     <p className="mb-3 text-center text-sm text-amber-700">
//                       Next: proceed to the next section (you cannot return)
//                     </p>
//                   )}

//                 {currentQuestion ? (
//                   <div className="min-h-[280px]">
//                     {(() => {
//                       switch (currentQuestion.type) {
//                         case 'mcq':
//                           return (
//                             <McqQuestion
//                               question={currentQuestion}
//                               answer={allAnswers[currentQuestion.id]}
//                               onAnswer={handleAnswerChange}
//                               embedded
//                               questionOrdinal={currentQuestionIndex + 1}
//                             />
//                           );
//                         case 'coding':
//                           return (
//                             <CodingQuestion
//                               question={currentQuestion}
//                               answer={allAnswers[currentQuestion.id]}
//                               onAnswer={handleAnswerChange}
//                               runCodeUrl={`${pythonUrl}/v1/test/run_code`}
//                               embedded
//                               questionOrdinal={currentQuestionIndex + 1}
//                             />
//                           );
//                         case 'audio':
//                           if (currentQuestion.id === 'audio-placeholder') {
//                             return (
//                               <p className="text-sm text-gray-700">
//                                 {currentQuestion.content.prompt_text || currentQuestion.prompt_text}
//                               </p>
//                             );
//                           }
//                           if (showAudioInterview) {
//                             return (
//                               <p className="rounded-xl border border-dashed border-[#7C69EF]/40 bg-[#7C69EF]/5 p-6 text-center text-sm text-gray-600">
//                                 Audio interview is open in full screen. Complete it there, then return here.
//                               </p>
//                             );
//                           }
//                           return (
//                             <div>
//                               <p className="mb-4 text-base font-semibold text-gray-900">
//                                 <span className="text-[#7C69EF]">Q{currentQuestionIndex + 1}.</span>{' '}
//                                 {(currentQuestion.prompt_text || currentQuestion.question || '').trim() ||
//                                   'Answer in the audio interview.'}
//                               </p>
//                               <textarea
//                                 value={
//                                   typeof allAnswers[currentQuestion.id] === 'string'
//                                     ? allAnswers[currentQuestion.id]
//                                     : ''
//                                 }
//                                 onChange={(e) => handleAnswerChange(e.target.value)}
//                                 className="min-h-[160px] w-full rounded-xl border border-gray-200 bg-[#f3f4f6] p-4 text-sm focus:border-[#7C69EF] focus:outline-none focus:ring-2 focus:ring-[#7C69EF]/20"
//                                 placeholder="Optional notes while recording…"
//                               />
//                             </div>
//                           );
//                         case 'video':
//                           if (currentQuestionIndex >= totalQuestionsInSection) {
//                             return (
//                               <div className="py-8 text-center">
//                                 <div className="mb-3 text-4xl text-emerald-500">✓</div>
//                                 <h3 className="text-lg font-bold text-gray-800">Video interview complete</h3>
//                                 <p className="mt-2 text-sm text-gray-600">
//                                   You can submit when you are ready.
//                                 </p>
//                               </div>
//                             );
//                           }
//                           if (currentQuestion.id === 'video-placeholder') {
//                             return (
//                               <p className="text-sm text-gray-700">
//                                 {currentQuestion.content.prompt_text || currentQuestion.prompt_text}
//                               </p>
//                             );
//                           }
//                           return (
//                             <div>
//                               <p className="mb-4 text-base font-semibold text-gray-900">
//                                 <span className="text-[#7C69EF]">Q{currentQuestionIndex + 1}.</span>{' '}
//                                 {currentQuestion.prompt_text || currentQuestion.question}
//                               </p>
//                               <textarea
//                                 value={
//                                   typeof allAnswers[currentQuestion.id] === 'string'
//                                     ? allAnswers[currentQuestion.id]
//                                     : ''
//                                 }
//                                 onChange={(e) => handleAnswerChange(e.target.value)}
//                                 className="min-h-[180px] w-full rounded-xl border border-gray-200 bg-[#f3f4f6] p-4 text-sm focus:border-[#7C69EF] focus:outline-none focus:ring-2 focus:ring-[#7C69EF]/20"
//                                 placeholder="Type your response here…"
//                               />
//                               {currentQuestionIndex === totalQuestionsInSection - 1 && (
//                                 <p className="mt-3 text-sm font-medium text-emerald-700">
//                                   Last question — you can submit the test after saving.
//                                 </p>
//                               )}
//                             </div>
//                           );
//                         default:
//                           return <p className="text-sm text-gray-600">Unknown question type</p>;
//                       }
//                     })()}
//                   </div>
//                 ) : (
//                   <p className="text-sm text-gray-600">No questions in this section.</p>
//                 )}

//                 <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
//                   <button
//                     type="button"
//                     onClick={handlePrevious}
//                     disabled={currentQuestionIndex === 0}
//                     className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
//                   >
//                     Previous
//                   </button>
//                   <div className="flex flex-wrap gap-3">
//                     <button
//                       type="button"
//                       onClick={toggleMarkReview}
//                       disabled={!currentQuestion}
//                       className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm ${isCurrentMarkedForReview
//                           ? 'border-2 border-violet-500 bg-violet-100 text-violet-900'
//                           : 'border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200'
//                         } disabled:cursor-not-allowed disabled:opacity-50`}
//                     >
//                       {isCurrentMarkedForReview ? 'Marked for review' : 'Mark for Review'}
//                     </button>
//                     <button
//                       type="button"
//                       onClick={handleSaveAndNext}
//                       disabled={saveNextDisabled}
//                       className="rounded-xl bg-[#7C69EF] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#6d5ce0] disabled:cursor-not-allowed disabled:opacity-50"
//                     >
//                       {saveNextLabel}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </main>

//             {/* Right: proctoring panel */}
//             <aside className="lg:col-span-3">
//               <div className="space-y-4">
//                 <div className="rounded-2xl bg-white p-4 shadow-md">
//                   {recordingStarted && recordingPermissionGranted && (
//                     <p className="mb-2 flex items-center gap-2 text-xs font-medium text-red-600">
//                       <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
//                       Recording
//                     </p>
//                   )}
//                   <div className="relative">
//                     {!submitted &&
//                       recordingPermissionGranted &&
//                       (step === 'test' || testStarted || mediaAllowed || !!window.__candidateCameraStream) ? (
//                       <WebcamPreview
//                         variant="embedded"
//                         webcamRef={webcamRef}
//                         canvasRef={canvasRef}
//                         localStream={localStream}
//                         streamRef={streamRef}
//                         hasVideoFrame={hasVideoFrame}
//                         floatingPos={floatingPos}
//                         setFloatingPos={setFloatingPos}
//                         selectedDeviceId={selectedDeviceId}
//                       />
//                     ) : (
//                       <div className="flex aspect-[16/10] max-h-[280px] min-h-[200px] w-full items-center justify-center rounded-xl bg-[#3d3d42] text-sm text-gray-400">
//                         Camera preview unavailable
//                       </div>
//                     )}
//                     <button
//                       type="button"
//                       title="Assessment info"
//                       className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-xs font-bold text-white backdrop-blur-sm"
//                     >
//                       i
//                     </button>
//                     <div className="absolute bottom-2 left-2 max-w-[70%] truncate rounded-lg bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
//                       {candidateDisplayName}
//                     </div>
//                     <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-[#7C69EF] px-2.5 py-1 text-xs font-semibold text-white shadow-md">
//                       <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <circle cx="12" cy="12" r="9" />
//                         <path d="M12 7v5l3 2" strokeLinecap="round" />
//                       </svg>
//                       {typeof questionTimeLeft === 'number' ? `${questionTimeLeft} secs` : '—'}
//                     </div>
//                   </div>
//                   <MicLevelWaveform
//                     key={
//                       (localStream ||
//                         streamRef.current ||
//                         (typeof window !== 'undefined' ? window.__candidateCameraStream : null)
//                       )?.id || 'no-mic-stream'
//                     }
//                     stream={
//                       localStream ||
//                       streamRef.current ||
//                       (typeof window !== 'undefined' ? window.__candidateCameraStream : null)
//                     }
//                   />
//                 </div>

//                 <div className="rounded-2xl bg-white p-4 shadow-md">
//                   <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
//                     <span className="text-lg leading-none">▮▮▮</span>
//                     Internet Speed: Good
//                   </div>
//                   <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
//                     <span className="text-emerald-500">✓</span> Microphone
//                   </div>
//                   <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
//                     <span className="text-emerald-500">✓</span> Camera
//                   </div>
//                 </div>

//                 {currentSection?.type === 'coding' && (
//                   <div className="rounded-2xl bg-white p-4 shadow-md">
//                     <h4 className="text-sm font-bold text-gray-800">Test Cases</h4>
//                     <ul className="mt-3 space-y-2 text-sm text-gray-600">
//                       <li className="flex items-center gap-2">
//                         <span className="h-2 w-2 rounded-full bg-amber-400" />
//                         Test case 1
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <span className="h-2 w-2 rounded-full bg-emerald-500" />
//                         Test case 2
//                       </li>
//                       <li className="flex items-center gap-2">
//                         <span className="h-2 w-2 rounded-full bg-gray-300" />
//                         Test case 3
//                       </li>
//                     </ul>
//                   </div>
//                 )}

//                 <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">
//                   <span className="mr-1 font-bold">⚠</span>
//                   Warning: Leaving full-screen, switching tabs, or minimizing the window will be flagged.
//                 </div>
//               </div>
//             </aside>
//           </div>
//         </div>
//       </div>
//       {/* Global submitting overlay (covers entire test while submitting and stopping recording) */}
//       {submitting && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
//           <div className="relative z-10 flex flex-col items-center gap-3 p-6 bg-white bg-opacity-90 rounded-lg shadow-lg">
//             <div className="w-14 h-14 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin" />
//             <div className="text-gray-700 font-medium">Submitting test and finalizing recording... Please wait</div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default GiveTest;
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useParams } from 'react-router-dom';
import { testApi } from '../../RecruiterAdmin/api/tests.js';
import McqQuestion from '../../RecruiterAdmin/Component/McqQuestion.jsx';
import CodingQuestion from '../../RecruiterAdmin/Component/CodingQuestion';
import InstructionsPage from '../instructions_page/InstructionsPage.jsx';
import ActivityMonitor from '../instructions_page/ActivityMonitor.jsx';
import FaceDetection from '../instructions_page/FaceDetection.jsx';
import AudioInterview from '../instructions_page/AudioInterview.jsx'; // adjust the path as needed
import WebcamPreview from '../Component/WebcamPreview.jsx';
import MicLevelWaveform from '../Component/MicLevelWaveform.jsx';
import { emitViolation } from '../../RecruiterAdmin/api/socket.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { pythonUrl } from '../../utils/ApiConstants';

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );
}

async function requestDocumentFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  } catch (e) {
    console.warn('GiveTest: requestFullscreen failed', e);
  }
}

const FULLSCREEN_EXIT_GRACE_SEC = 45;

// ------------------------------
// Embedded WebCamRecorder (merged into GiveTest to avoid mount/unmount timing issues)
// ------------------------------

const WebCamRecorder = forwardRef(
  (
    {
      questions = [],
      candidateId,
      questionSetId,
      onComplete = () => { },
      showMultipleFaces = false,
      sharedStream = null,
      autoStart = true,
      // If true, component will only show a preview and won't record or upload
      previewOnly = false,
      // If false, internal "Upload & Submit" button and uploadRecording will be disabled
      allowUpload = true,
    },
    ref
  ) => {
    // Set to true during local debugging to see detailed recorder logs
    const VERBOSE_LOG = false;
    const vlog = (...args) => { if (VERBOSE_LOG) console.log(...args); };
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const monitorRef = useRef(null);
    const sharedStreamWarnedRef = useRef(false);
    // Keep a reference to the *source* stream (shared or created) for preview/health checks
    const sourceStreamRef = useRef(null);
    // Use a dedicated recording stream made of cloned tracks so other components stopping the shared stream
    // won't break this recording.
    const recordingStreamRef = useRef(null);
    const clonedTracksRef = useRef([]);
    const createdStreamRef = useRef(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const startedOnceRef = useRef(false);

    const [interviewStarted, setInterviewStarted] = useState(false);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const qaListRef = useRef([]);
    const [status, setStatus] = useState("Idle");
    const [uploading, setUploading] = useState(false);

    // Initialize qa list with question metadata so indices exist and ids are preserved
    useEffect(() => {
      try {
        qaListRef.current = (questions || []).map((q) => ({
          question_id: q.question_id || q.id || q._id || null,
          question: (q.prompt_text || q.question) || '',
          answer: '',
        }));
        vlog('WebCamRecorder: initialized qaListRef with', qaListRef.current);
      } catch (e) { console.warn('qaList init failed', e); }
    }, [questions]);

    const prompt =
      (questions[currentIndex]?.prompt_text || questions[currentIndex]?.question) ||
      "Please answer this question.";

    // ---------------------------------------------------------
    // Initialize Camera + MediaRecorder
    // ---------------------------------------------------------
    useEffect(() => {
      vlog('WebCamRecorder: useEffect init() running now, sharedStream present?', !!sharedStream);
      const initRecorder = async () => {
        // Avoid double-initializing recorder (can happen in StrictMode/dev remounts)
        if (mediaRecorderRef.current) {
          vlog('WebCamRecorder: initRecorder called but recorder already exists; skipping');
          return;
        }
        try {
          let stream = sharedStream;
          vlog('WebCamRecorder: init called, sharedStream present?', !!sharedStream);

          // Check if shared stream is viable
          if (stream) {
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            vlog('WebCamRecorder: checking sharedStream - video tracks:', videoTracks.length, 'audio tracks:', audioTracks.length);

            // Check if tracks are actually alive
            let tracksAlive = false;
            if (videoTracks.length > 0) {
              videoTracks.forEach((t, i) => {
                vlog(`WebCamRecorder: video track ${i} - enabled: ${t.enabled}, readyState: ${t.readyState}`);
                if (t.readyState === 'live' && t.enabled) tracksAlive = true;
              });
            }

            if (!tracksAlive) {
              if (!sharedStreamWarnedRef.current) {
                console.warn('WebCamRecorder: shared stream tracks are dead/ended, requesting fresh stream');
                sharedStreamWarnedRef.current = true;
              } else {
                vlog('WebCamRecorder: shared stream tracks dead -> requesting fresh stream (suppressed repeat warning)');
              }
              stream = null;
            }
          }

          // If no viable shared stream, request fresh media
          if (!stream) {
            vlog('WebCamRecorder: requesting fresh camera stream');
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            createdStreamRef.current = true;
          }

          // Source stream is either sharedStream or a newly created stream
          sourceStreamRef.current = stream;

          // Build a dedicated recording stream with cloned tracks.
          // This prevents recording from stopping if some other component stops/ends tracks on the shared stream.
          try {
            // Stop any previous cloned tracks (defensive)
            try { (clonedTracksRef.current || []).forEach(t => { try { t.stop(); } catch (e) { } }); } catch (e) { }
            clonedTracksRef.current = [];

            const recStream = new MediaStream();
            const v0 = stream.getVideoTracks && stream.getVideoTracks()[0];
            const a0 = stream.getAudioTracks && stream.getAudioTracks()[0];

            if (v0) {
              const vClone = v0.clone();
              recStream.addTrack(vClone);
              clonedTracksRef.current.push(vClone);
            }
            if (a0) {
              const aClone = a0.clone();
              recStream.addTrack(aClone);
              clonedTracksRef.current.push(aClone);
            }

            recordingStreamRef.current = recStream;
          } catch (e) {
            console.warn('WebCamRecorder: failed to create cloned recording stream, falling back to source stream', e);
            recordingStreamRef.current = stream;
          }

          // Use recordingStreamRef for MediaRecorder; keep streamRef.current pointing to recording stream
          streamRef.current = recordingStreamRef.current || stream;

          if (videoRef.current) {
            try { videoRef.current.srcObject = stream; } catch (e) { }
          }

          // If previewOnly is set, skip creating MediaRecorder and only attach preview
          if (previewOnly) {
            vlog('WebCamRecorder: previewOnly=true, skipping MediaRecorder setup');
            setStatus('Preview');
            setInterviewStarted(true);
            return;
          }

          // Check stream tracks are active
          const videoTracks = (streamRef.current || stream).getVideoTracks();
          const audioTracks = (streamRef.current || stream).getAudioTracks();
          vlog('WebCamRecorder: final video tracks:', videoTracks.length, 'audio tracks:', audioTracks.length);

          // Enable all tracks to ensure they're active
          videoTracks.forEach((t, i) => {
            t.enabled = true;
            vlog(`WebCamRecorder: enabled video track ${i}, readyState: ${t.readyState}`);
          });
          audioTracks.forEach((t, i) => {
            t.enabled = true;
            vlog(`WebCamRecorder: enabled audio track ${i}, readyState: ${t.readyState}`);
          });

          if (videoTracks.length === 0) {
            throw new Error('Stream missing video tracks - camera access required');
          }

          // Audio is preferred but not strictly required for recording
          if (audioTracks.length === 0) {
            console.warn('WebCamRecorder: No audio tracks available - recording video only');
          }

          // Find supported MIME type
          let mimeType = 'video/webm;codecs=vp8,opus';
          const supportedTypes = [
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm',
            'video/mp4',
          ];

          for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
              mimeType = type;
              vlog('WebCamRecorder: using MIME type:', mimeType);
              break;
            }
          }

          mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
            mimeType: mimeType,
          });

          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              chunksRef.current.push(e.data);
              vlog('WebCamRecorder: chunk added, total chunks now:', chunksRef.current.length);
            }
          };

          mediaRecorderRef.current.onstop = () => {
            console.log('WebCamRecorder: onstop fired, final chunks collected:', chunksRef.current.length);
            setInterviewEnded(true);
          };

          // Auto-start recording once recorder is ready (only if autoStart prop is true)
          try {
            if (autoStart) {
              if (!startedOnceRef.current) {
                chunksRef.current = [];
              }
              // Start the recorder and log a single start message
              mediaRecorderRef.current.start(1000); // Request data every 1 second
              if (!startedOnceRef.current) {
                startedOnceRef.current = true;
                console.log('WebCamRecorder: Recording started');
              }

              // Monitor stream health while recording
              monitorRef.current = setInterval(() => {
                const rec = mediaRecorderRef.current;
                if (!rec || rec.state !== 'recording') {
                  clearInterval(monitorRef.current);
                  monitorRef.current = null;
                  return;
                }
                const vTracks = streamRef.current?.getVideoTracks() || [];
                const aTracks = streamRef.current?.getAudioTracks() || [];
                vlog('WebCamRecorder: [MONITOR] recorder state:', rec.state, 'video enabled:', vTracks[0]?.enabled, 'audio enabled:', aTracks[0]?.enabled);
              }, 2000);

              setInterviewStarted(true);
              setStatus("Recording...");
            } else {
              console.log('WebCamRecorder: autoStart=false, NOT starting recorder yet');
              setStatus("Ready to record");
            }
          } catch (e) {
            console.error('WebCamRecorder: Auto-start recording failed', e);
          }
        } catch (err) {
          console.error("Camera init failed:", err);
          alert("Camera/microphone access is required!");
        }
      };

      initRecorder();

      // Cleanup: only stop recorder and tracks on unmount
      return () => {
        console.log('WebCamRecorder: cleanup running, recorder state:', mediaRecorderRef.current?.state);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try { mediaRecorderRef.current.stop(); } catch (e) { console.warn('stop failed', e); }
        }
        // Always stop cloned tracks created for recording
        try {
          (clonedTracksRef.current || []).forEach((t) => {
            try { t.stop(); } catch (e) { }
          });
        } catch (e) { }
        clonedTracksRef.current = [];

        // clear monitor interval if running
        try { if (monitorRef.current) { clearInterval(monitorRef.current); monitorRef.current = null; } } catch (e) { }

        // Only stop the source stream tracks if this component created the stream itself
        if (createdStreamRef.current && sourceStreamRef.current) {
          try { sourceStreamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) { }
        }
      };
    }, [sharedStream]);

    // If autoStart flips from false -> true after init, start the recorder immediately.
    useEffect(() => {
      try {
        if (previewOnly) return;
        if (!autoStart) return;
        const rec = mediaRecorderRef.current;
        if (!rec) return;
        if (rec.state === 'recording') return;
        if (!startedOnceRef.current) {
          chunksRef.current = [];
          rec.start(1000);
          startedOnceRef.current = true;
          console.log('WebCamRecorder: Recording started');
        } else {
          rec.start(1000);
        }
        setInterviewStarted(true);
        setStatus("Recording...");
      } catch (e) {
        console.warn('WebCamRecorder: autoStart effect failed', e);
      }
    }, [autoStart, previewOnly]);

    // ---------------------------------------------------------
    // Start Recording
    // ---------------------------------------------------------
    const startInterview = () => {
      try {
        // IMPORTANT: Do not wipe earlier chunks if recording already started once (prevents losing MCQ+Audio parts)
        if (!startedOnceRef.current) {
          chunksRef.current = [];
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
            mediaRecorderRef.current.start(1000);
            startedOnceRef.current = true;
            console.log('WebCamRecorder: Recording started');
          }
        } else {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
            mediaRecorderRef.current.start(1000);
          }
        }
        setInterviewStarted(true);
        setStatus("Recording...");
      } catch (e) {
        console.warn('startInterview failed', e);
      }
    };


    // ---------------------------------------------------------
    // Stop Recording
    // ---------------------------------------------------------
    const pushAnswerForIndex = (idx, ans) => {
      let answerText = '';
      if (typeof ans === 'string') {
        answerText = ans;
      } else if (ans && ans.target && typeof ans.target.value === 'string') {
        answerText = ans.target.value;
        console.warn('[WebCamRecorder] pushAnswerForIndex received event object instead of string!', ans);
      } else {
        console.warn('[WebCamRecorder] pushAnswerForIndex received non-string, non-event:', ans);
      }
      const item = {
        question_id: questions[idx]?.question_id || questions[idx]?.id,
        question: (questions[idx]?.prompt_text || questions[idx]?.question) || '',
        answer: answerText.trim(),
      };
      qaListRef.current = qaListRef.current || [];
      qaListRef.current[idx] = item;
      console.log(`[WebCamRecorder] pushAnswerForIndex idx=${idx} answer='${item.answer}' item=`, item);
    };

    // Always keep qaListRef in sync with the text area
    useEffect(() => {
      pushAnswerForIndex(currentIndex, currentAnswer);
      // Debug: log current answer and qaListRef
      console.log('[WebCamRecorder] Textarea changed:', { currentIndex, currentAnswer, qaList: JSON.parse(JSON.stringify(qaListRef.current)) });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentAnswer, currentIndex]);

    const endInterview = async () => {
      try {
        // push current answer before stopping
        console.log('WebCamRecorder: endInterview pushing answer for index', currentIndex, 'currentAnswer=', currentAnswer);
        pushAnswerForIndex(currentIndex, currentAnswer);
      } catch (e) { }

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
        setStatus("Recording stopped");
      }
    };

    // Wait until recorder 'stop' event fires (returns a Promise)
    const stopRecordingWait = () => {
      return new Promise((resolve) => {
        const rec = mediaRecorderRef.current;
        if (!rec || rec.state === 'inactive') return resolve();
        const onStop = () => {
          try { rec.removeEventListener('stop', onStop); } catch (e) { }
          resolve();
        };
        try {
          rec.addEventListener('stop', onStop);
          try { rec.stop(); } catch (e) { onStop(); }
        } catch (e) {
          onStop();
        }
      });
    };

    // ---------------------------------------------------------
    // Upload Recording to Backend
    // ---------------------------------------------------------
    // Upload Recording to Backend (for all questions answered)
    // ---------------------------------------------------------
    const uploadRecording = async () => {
      console.log('WebCamRecorder: uploadRecording called, allowUpload=', allowUpload);
      if (!allowUpload) {
        console.log('WebCamRecorder: internal upload disabled (allowUpload=false) - deferring to parent');
        // Ensure recorder is stopped/flushed so parent recording (if any) can handle finalization
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try { mediaRecorderRef.current.requestData(); } catch (e) { }
          await stopRecordingWait();
        }
        const qa_data = (qaListRef.current || []).map((item, idx) => ({
          question_id: item?.question_id || questions[idx]?.question_id || questions[idx]?.id,
          question: item?.question || questions[idx]?.prompt_text || questions[idx]?.question || '',
          answer: item?.answer || '',
        }));
        setStatus('Upload deferred');
        // Do NOT call onComplete because parent will handle upload
        setUploading(false);
        return { qa_data, skipped: true };
      }
      console.log('WebCamRecorder: uploadRecording called, current chunks:', chunksRef.current.length);
      console.log('WebCamRecorder: recorder state before stop:', mediaRecorderRef.current?.state);
      setUploading(true);

      // ensure recorder has flushed final chunks
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('WebCamRecorder: MediaRecorder still recording, requesting final data and stopping');
        // Request final data flush before stopping
        try {
          mediaRecorderRef.current.requestData();
          console.log('WebCamRecorder: requestData called');
        } catch (e) { console.warn('requestData failed', e); }

        // Wait a bit for ondataavailable to fire
        await new Promise(resolve => setTimeout(resolve, 100));

        await stopRecordingWait();
      }

      console.log('WebCamRecorder: after stopRecordingWait, final chunks:', chunksRef.current.length);
      if (!chunksRef.current.length) {
        console.error('WebCamRecorder: No video chunks recorded! Check if MediaRecorder was recording.');
        alert("No video recorded! Ensure camera/microphone permissions are enabled and try again.");
        setUploading(false);
        return null;
      }

      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const filename = `video_${candidateId}_${Date.now()}.webm`;

      const file = new File([blob], filename, { type: "video/webm" });

      // use accumulated QA list
      // ensure we have a safe copy of QA data
      const qa_data = (qaListRef.current || []).map((item, idx) => ({
        question_id: item?.question_id || questions[idx]?.question_id || questions[idx]?.id,
        question: item?.question || questions[idx]?.prompt_text || questions[idx]?.question || '',
        answer: item?.answer || '',
      }));

      // Debug: log before upload
      console.log('[WebCamRecorder] Uploading video with:', { qaList: JSON.parse(JSON.stringify(qaListRef.current)), qa_data, currentIndex, currentAnswer });
      console.log('WebCamRecorder: uploading video with qa_data=', qa_data, 'chunksCount=', chunksRef.current.length);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("candidate_id", candidateId);
      fd.append("question_set_id", questionSetId);
      fd.append("qa_data", JSON.stringify(qa_data));

      setStatus("Uploading video...");

      try {
        const res = await fetch(`${pythonUrl}/v1/upload_video`, {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const txt = await res.text();
          console.error("Upload failed:", txt);
          alert("Video upload failed!");
          setStatus("Upload failed");
          return { qa_data, error: txt };
        }

        const data = await res.json();
        console.log("Upload success:", data);
        setStatus("Video uploaded!");
        // notify parent with qa_data
        try { onComplete(qa_data); } catch (e) { console.warn('onComplete callback failed', e); }
        return { qa_data, response: data };

      } catch (err) {
        console.error("Upload error:", err);
        alert("Failed to upload video!");
        setStatus("Upload failed");
        return { qa_data, error: err };
      } finally {
        setUploading(false);
      }
    }
    // ---------------------------------------------------------
    // Exposed methods for parent component (GiveTest.jsx)
    // ---------------------------------------------------------
    useImperativeHandle(ref, () => ({
      startInterview,
      endInterview,
      uploadRecording,
      stopAll: () => {
        try {
          endInterview();
          if (createdStreamRef.current) {
            streamRef.current?.getTracks().forEach((t) => t.stop());
          }
        } catch { }
      },
    }));

    return (
      <div className="p-4 bg-white rounded shadow relative">
        {showMultipleFaces && (
          <>
            <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-50" />
            <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-60 bg-yellow-400 text-black px-4 py-2 rounded shadow">
              🚨 Multiple faces detected — page blurred
            </div>
          </>
        )}
        <h2 className="text-xl font-bold mb-4">Video Interview</h2>

        {/* Live Camera Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-72 bg-black rounded"
        />

        {/* Question */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Question:</h3>
          <p className="p-3 bg-gray-100 rounded">{prompt}</p>
        </div>

        {/* Text Answer */}
        <textarea
          value={typeof currentAnswer === 'string' ? currentAnswer : ''}
          onChange={e => {
            if (typeof e.target.value === 'string') {
              setCurrentAnswer(e.target.value);
            } else {
              console.warn('[WebCamRecorder] textarea onChange non-string value:', e);
            }
          }}
          className="w-full p-3 border rounded mt-4 min-h-[120px]"
          placeholder="Write your explanation / answer here..."
        />

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          {!interviewStarted && (
            <button
              onClick={startInterview}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Start Recording
            </button>
          )}

          {interviewStarted && !interviewEnded && (
            <>
              <button
                onClick={async () => {
                  // Always save the current answer for this index
                  pushAnswerForIndex(currentIndex, currentAnswer);
                  // clear answer and move to next
                  setCurrentAnswer('');
                  const next = currentIndex + 1;
                  if (next < questions.length) {
                    setCurrentIndex(next);
                    setTimeout(() => setStatus('Recording...'), 200);
                  } else {
                    // last question -> stop recording automatically
                    await stopRecordingWait();
                    setInterviewEnded(true);
                    setStatus('Recording stopped');
                  }
                  // --- PATCH: Save all video answers to parent state on every next click ---
                  if (typeof window !== 'undefined' && window.__saveVideoAnswersToParent) {
                    window.__saveVideoAnswersToParent(qaListRef.current);
                  }
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded"
              >
                Next
              </button>
            </>
          )}

          {interviewEnded && allowUpload && (
            <button
              onClick={uploadRecording}
              className="px-4 py-2 bg-blue-600 text-white rounded"
              disabled={(qaListRef.current?.length || 0) < questions.length}
            >
              Upload & Submit
            </button>
          )}

          {interviewEnded && !allowUpload && (
            <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded">Recording complete — final upload will occur when you submit the test.</div>
          )}
        </div>

        {/* Status */}
        <p className="text-sm text-gray-600 mt-3">Status: {status}</p>
        {/* Uploading overlay */}
        {uploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative z-10 flex flex-col items-center gap-3 p-6 bg-white bg-opacity-90 rounded-lg shadow-lg">
              <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin" />
              <div className="text-gray-700 font-medium">Uploading & Submitting...</div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
// --- PATCH: Helper to sync video answers from recorder to allAnswers ---
function syncVideoAnswersToAllAnswers(qaList, setAllAnswers) {
  if (!Array.isArray(qaList)) return;
  setAllAnswers(prev => {
    const next = { ...prev };
    qaList.forEach(item => {
      if (item && item.question_id) next[item.question_id] = item.answer || '';
    });
    return next;
  });
}

const GiveTest = ({ jdId }) => {
  const { questionSetId } = useParams();
  const location = useLocation();
  const { setHideSidebarForTest } = useOutletContext() || {};

  // Loading / data / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sections & navigation
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [allAnswers, setAllAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResults, setSubmissionResults] = useState([]);
  const candidateIdRef = useRef(`candidate_${Date.now()}`);
  const finalCandidateId = candidateIdRef.current;
  const [userInfo] = useState({
    name: `Candidate_${finalCandidateId}`,
    email: `candidate_${finalCandidateId}@mail.com`,
  });
  const [mediaAllowed, setMediaAllowed] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [floatingPos, setFloatingPos] = useState({ x: 20, y: 80 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [hasVideoFrame, setHasVideoFrame] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const faceEventRef = useRef(null);
  const webcamInterviewRef = useRef(null);
  // --- PATCH: Expose a global sync function for video answers ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__saveVideoAnswersToParent = (qaList) => {
        syncVideoAnswersToAllAnswers(qaList, setAllAnswers);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.__saveVideoAnswersToParent = undefined;
      }
    };
  }, []);
  const webcamPreviewRef = useRef(null);
  const saveViolationsSentRef = useRef(false);
  const [showWebcamInterview, setShowWebcamInterview] = useState(false);
  const [showAudioInterview, setShowAudioInterview] = useState(false);
  const [audioInterviewResults, setAudioInterviewResults] = useState([]);
  const [audioInterviewDone, setAudioInterviewDone] = useState(false);
  const [audioInterviewVisited, setAudioInterviewVisited] = useState(false);
  const [step, setStep] = useState('entry');
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  const [visitedQuestionIds, setVisitedQuestionIds] = useState(() => new Set());
  /** { [stableQuestionKey]: true } — plain object so React always re-renders on toggle */
  const [reviewMarks, setReviewMarks] = useState({});
  const [questionGridPage, setQuestionGridPage] = useState(1);
  const [candidateDisplayName] = useState(() => {
    try {
      const raw = sessionStorage.getItem('candidateData');
      if (raw) {
        const p = JSON.parse(raw);
        if (p?.name) return p.name;
      }
    } catch (e) { }
    return userInfo.name;
  });
  const [assessmentJobTitle, setAssessmentJobTitle] = useState('Software Engineer Position');

  const [showFullscreenExitModal, setShowFullscreenExitModal] = useState(false);
  const [fullscreenGraceSeconds, setFullscreenGraceSeconds] = useState(null);
  const hadFullscreenDuringExamRef = useRef(false);
  const fullscreenPenaltyActiveRef = useRef(false);
  const fullscreenExitTimeoutRef = useRef(null);
  const fullscreenExitIntervalRef = useRef(null);
  const submittingRef = useRef(false);

  const QUESTIONS_GRID_PAGE_SIZE = 12;
  const SECTION_TAB_ORDER = ['mcq', 'coding', 'audio', 'video'];

  // Recording state
  const [recordingStarted, setRecordingStarted] = useState(false);
  const recordingStartedRef = useRef(false);
  const [recordingPermissionAsked, setRecordingPermissionAsked] = useState(false);
  const [recordingPermissionGranted, setRecordingPermissionGranted] = useState(false);

  // Is there an actually active candidate stream we can record from?
  const candidateStreamActive = !!(
    (streamRef.current && streamRef.current.active) ||
    (localStream && localStream.active) ||
    (window.__candidateCameraStream && window.__candidateCameraStream.active)
  );

  // Violations tracking
  const [violations, setViolations] = useState({
    tab_switches: 0,
    inactivities: 0,
    face_not_visible: 0,
    multiple_faces: 0,
  });
  const [orgId, setOrgId] = useState(null);
  const orgIdRef = useRef(null);
  const [showMultipleFaces, setShowMultipleFaces] = useState(false);
  const [showTabSwitch, setShowTabSwitch] = useState(false);
  const violationsRef = useRef(violations);
  // Track which toast alerts have already been shown to avoid duplicates
  const shownToastsRef = useRef(new Set());

  // Keep refs in sync
  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // attach localStream to video element and cleanup on unmount
  useEffect(() => {
    const targetVideo = (webcamRef.current && webcamRef.current.video) || videoRef.current;
    if (targetVideo && localStream) {
      try { targetVideo.srcObject = localStream; videoRef.current = targetVideo; } catch (e) { console.warn('attach srcObject failed', e); }
    }
    return () => {
      if (localStream) {
        try { localStream.getTracks().forEach(t => t.stop()); } catch (e) { }
      }
    };
  }, [localStream]);

  // track whether <video> is actually playing so we can hide canvas fallback
  useEffect(() => {
    const v = videoRef.current || (webcamRef.current && webcamRef.current.video);
    if (!v) return;
    const onPlaying = () => setIsVideoPlaying(true);
    const onPause = () => setIsVideoPlaying(false);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('play', onPlaying);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onPause);
    return () => {
      try {
        v.removeEventListener('playing', onPlaying);
        v.removeEventListener('play', onPlaying);
        v.removeEventListener('pause', onPause);
        v.removeEventListener('ended', onPause);
      } catch (e) { }
    };
  }, [videoRef.current]);

  // Poll video element to detect whether frames are available (videoWidth>0)
  useEffect(() => {
    let intId = null;
    const check = () => {
      const v = videoRef.current || (webcamRef.current && webcamRef.current.video);
      if (v) {
        const hasFrame = !!(v.videoWidth && v.videoHeight);
        setHasVideoFrame(hasFrame);
        if (hasFrame) return true;
      }
      return false;
    };
    // run a few times for up to ~2s
    let attempts = 0;
    intId = setInterval(() => {
      attempts += 1;
      const ok = check();
      if (ok || attempts > 10) {
        clearInterval(intId);
      }
    }, 200);
    // immediate check
    check();
    return () => { if (intId) clearInterval(intId); };
  }, [localStream, mediaAllowed, step, streamRef.current]);

  // Request camera+mic permissions (always prompt, don't reuse stored stream)
  const requestMedia = async () => {
    try {
      // Always request fresh permissions - don't reuse existing stream
      const constraints = {
        video: camEnabled ? { facingMode: 'user' } : false,
        audio: micEnabled,
      };
      console.log('GiveTest: requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      setMediaAllowed(true);
      setLocalStream(stream);
      streamRef.current = stream;
      // Save globally for future pages in same tab
      try { window.__candidateCameraStream = stream; window.__cameraAllowed = true; } catch (e) { }
      if (videoRef.current) {
        try { videoRef.current.srcObject = stream; } catch (e) { console.warn('set srcObject failed', e); }
      }
      console.log('GiveTest: media access granted successfully');
    } catch (err) {
      console.error('Media permissions error:', err);
      setMediaAllowed(false);
      const errorMsg = err.name === 'NotAllowedError'
        ? 'You denied camera/microphone access. Please enable permissions in your browser settings and refresh the page.'
        : err.name === 'NotFoundError'
          ? 'No camera or microphone found on your device.'
          : `Unable to access camera/microphone: ${err.message}`;
      alert(errorMsg);
    }
  };

  // On mount, reuse stream from CameraCheck if available
  useEffect(() => {
    try {
      const existing = window.__candidateCameraStream;
      if (existing && !localStream) {
        setMediaAllowed(true);
        setLocalStream(existing);
        streamRef.current = existing;
        if (videoRef.current) {
          try { videoRef.current.srcObject = existing; } catch (e) { console.warn('attach existing on mount failed', e); }
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Enumerate devices and prefer a saved device if present
  useEffect(() => {
    const list = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vids = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(vids);
        if (!selectedDeviceId && vids.length) setSelectedDeviceId(vids[0].deviceId);
      } catch (e) { }
    };
    list();
  }, []);

  // Poll for a global stream (if set by CameraCheck in another part of the app)
  useEffect(() => {
    let pollId = null;
    const tryAttachGlobal = () => {
      try {
        const existing = window.__candidateCameraStream;
        if (existing) {
          streamRef.current = existing;
          setLocalStream(existing);
          setMediaAllowed(true);
          if (videoRef.current && videoRef.current.srcObject !== existing) {
            try { videoRef.current.srcObject = existing; const p = videoRef.current.play && videoRef.current.play(); if (p && p.then) p.catch(() => { }); } catch (e) { console.warn('attach global stream failed', e); }
          }
          if (pollId) { clearInterval(pollId); pollId = null; }
        }
      } catch (e) { }
    };

    tryAttachGlobal();
    if (!streamRef.current) pollId = setInterval(tryAttachGlobal, 300);
    return () => { if (pollId) clearInterval(pollId); };
  }, []);

  // Auto-request media once when the test actually starts (safeguard against missing CameraCheck flow)
  const _requestedMediaRef = useRef(false);
  useEffect(() => {
    if (testStarted && !mediaAllowed && !_requestedMediaRef.current) {
      _requestedMediaRef.current = true;
      console.log('GiveTest: auto-requesting media on test start');
      // attempt to reuse existing or prompt user
      requestMedia();
    }
  }, [testStarted, mediaAllowed]);

  // Attempt to attach any available stream to the preview video whenever relevant state changes
  useEffect(() => {
    try {
      const candidateStream = streamRef.current || localStream || window.__candidateCameraStream;
      if (!candidateStream) {
        console.log('GiveTest: no candidate stream available to attach');
        return;
      }

      const vElem = (videoRef.current) || (webcamRef.current && webcamRef.current.video);
      if (!vElem) {
        console.log('GiveTest: preview video element not mounted yet');
        return;
      }

      // attach if not already attached
      if (vElem.srcObject !== candidateStream) {
        try {
          vElem.srcObject = candidateStream;
          // attempt to play (some browsers require explicit play call)
          const p = vElem.play && vElem.play();
          if (p && p.then) p.then(() => { }).catch(() => { });
          setMediaAllowed(true);
          videoRef.current = vElem; // ensure other code uses this concrete element
          console.log('GiveTest: attached candidate stream to preview; stream active=', !!candidateStream.active);
        } catch (e) {
          console.warn('GiveTest: failed to attach candidate stream to preview', e);
        }
      } else {
        console.log('GiveTest: preview already attached to stream');
      }
    } catch (e) {
      console.warn('GiveTest: attach effect error', e);
    }
  }, [localStream, testStarted, mediaAllowed, step]);

  // Canvas fallback: draw frames from the video element into canvas if video isn't rendering
  useEffect(() => {
    let rafId = null;
    let imgCapInterval = null;
    let offscreenVideo = null;
    const c = canvasRef.current;
    const v = videoRef.current || (webcamRef.current && webcamRef.current.video);

    const drawFromVideo = (videoEl) => {
      try {
        if (c && videoEl && (videoEl.readyState >= 2 || videoEl.videoWidth)) {
          const ctx = c.getContext('2d');
          const w = (c.width = c.clientWidth || 360);
          const h = (c.height = c.clientHeight || 260);
          try {
            ctx.drawImage(videoEl, 0, 0, w, h);
            // mark that we have a frame so UI can hide black video
            setHasVideoFrame(true);
          } catch (e) { }
        }
      } catch (e) { }
      rafId = requestAnimationFrame(() => drawFromVideo(videoEl));
    };

    const startImageCaptureLoop = (stream) => {
      try {
        const track = stream.getVideoTracks && stream.getVideoTracks()[0];
        if (!track) return;
        const ImageCapture = window.ImageCapture || null;
        if (!ImageCapture) return;
        const ic = new ImageCapture(track);
        imgCapInterval = setInterval(async () => {
          try {
            const bitmap = await ic.grabFrame();
            if (bitmap && c) {
              const ctx = c.getContext('2d');
              const w = c.width = c.clientWidth || bitmap.width || 360;
              const h = c.height = c.clientHeight || bitmap.height || 260;
              try { ctx.drawImage(bitmap, 0, 0, w, h); } catch (e) { }
              try { bitmap.close && bitmap.close(); } catch (e) { }
            }
          } catch (err) {
            // grabFrame can fail on some browsers/devices; ignore
          }
        }, 700);
      } catch (e) { }
    };

    // Start drawing only if there is any candidate stream available
    const hasStream = streamRef.current || localStream || window.__candidateCameraStream;
    if (hasStream && c) {
      try {
        c.width = c.clientWidth || 360;
        c.height = c.clientHeight || 260;
      } catch (e) { }

      // If video element is playing/rendering frames, draw from it.
      if (v && isVideoPlaying) {
        drawFromVideo(v);
      } else if (v) {
        // video exists but not playing; still start raf draw to catch frames when available
        rafId = requestAnimationFrame(() => drawFromVideo(v));
      } else {
        // Visible video isn't mounted yet; create an offscreen video attached to the stream
        try {
          const candidateStream = streamRef.current || localStream || window.__candidateCameraStream;
          if (candidateStream) {
            offscreenVideo = document.createElement('video');
            offscreenVideo.muted = true;
            offscreenVideo.playsInline = true;
            try {
              offscreenVideo.srcObject = candidateStream;
            } catch (e) {
              console.warn('offscreen assign srcObject failed', e);
            }
            // try to play; some browsers require user gesture but play() may still resolve
            const p = offscreenVideo.play && offscreenVideo.play();
            if (p && p.then) p.catch(() => { });
            // start RAF draws from the offscreen element
            rafId = requestAnimationFrame(() => drawFromVideo(offscreenVideo));
          }
        } catch (e) {
          console.warn('failed to create offscreen video fallback', e);
        }
      }

      // Also start ImageCapture fallback to grab frames directly from the track
      const candidateStream = streamRef.current || localStream || window.__candidateCameraStream;
      if (candidateStream) startImageCaptureLoop(candidateStream);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (imgCapInterval) clearInterval(imgCapInterval);
      try {
        if (offscreenVideo) {
          offscreenVideo.pause();
          try { offscreenVideo.srcObject = null; } catch (e) { }
          offscreenVideo = null;
        }
      } catch (e) { }
    };
  }, [localStream, mediaAllowed, step]);

  // Always log mount for diagnostics
  useEffect(() => {
    try {
      console.groupCollapsed('GiveTest Mounted');
      console.log('step', step, 'testStarted', testStarted, 'mediaAllowed', mediaAllowed);
      console.log('window.__candidateCameraStream present:', !!window.__candidateCameraStream);
      console.groupEnd();
    } catch (e) { console.warn('mount log failed', e); }
  }, []);

  // DO NOT auto-start test - wait for recording permission first
  // useEffect(() => {
  //   setTestStarted(true);
  // }, []);

  // Log whenever localStream changes
  useEffect(() => {
    try {
      console.groupCollapsed('GiveTest Stream Update');
      console.log('localStream set?', !!localStream);
      console.log('streamRef.current', streamRef.current);
      console.log('videoRef.current', videoRef.current);
      console.groupEnd();
    } catch (e) { console.warn('stream log failed', e); }
  }, [localStream]);

  // Cleanup webcam on unload
  useEffect(() => {
    const stopCamOnExit = async () => {
      if (webcamInterviewRef.current && typeof webcamInterviewRef.current.stopAll === 'function') {
        try {
          await webcamInterviewRef.current.stopAll();
        } catch (err) {
          console.warn('Cleanup webcam error:', err);
        }
      }
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('beforeunload', stopCamOnExit);
    return () => {
      stopCamOnExit();
      window.removeEventListener('beforeunload', stopCamOnExit);
    };
  }, []);

  // Block certain keys and context menu while test active
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') ||
        (e.ctrlKey && e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e) => {
      // Only block if test started and not submitted
      if (testStarted && !submitted) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [testStarted, submitted]);

  // Track visibility/tab switches and auto-submit after threshold
  useEffect(() => {
    // Centralized visibility/inactivity monitoring is handled by ActivityMonitor component.
    // This redundant listener in GiveTest is removed to prevent double-counting.
  }, [testStarted, submitted, allAnswers, sections]);

  // Disable text selection & copy while test active
  useEffect(() => {
    if (!testStarted || submitted) return;

    const handleSelect = (e) => e.preventDefault();
    const handleCopy = (e) => e.preventDefault();

    document.addEventListener('selectstart', handleSelect);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('selectstart', handleSelect);
      document.removeEventListener('copy', handleCopy);
    };
  }, [testStarted, submitted]);

  // Fetch test and organize into sections
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(window.location.search);
        const orgIdFromUrl = queryParams.get('orgId') || queryParams.get('org_id');
        if (orgIdFromUrl) {
          setOrgId(orgIdFromUrl);
          orgIdRef.current = orgIdFromUrl;
        }

        const data = await testApi.startTest(questionSetId, orgIdFromUrl);
        // console.log("Fetched test data:", data);

        const mcqQuestions = data.questions.filter(q => q.type === "mcq");
        const codingQuestions = data.questions.filter(q => q.type === "coding");
        const audioQuestions = data.questions.filter(q => q.type === "audio");
        const videoQuestions = data.questions.filter(q => q.type === "video");

        const organizedSections = [];

        if (mcqQuestions.length) {
          organizedSections.push({
            name: "MCQ",
            displayName: "Multiple Choice Questions",
            questions: mcqQuestions,
            type: "mcq",
          });
        }

        if (codingQuestions.length) {
          organizedSections.push({
            name: "Coding",
            displayName: "Coding Problems",
            questions: codingQuestions,
            type: "coding",
          });
        }

        if (audioQuestions.length) {
          organizedSections.push({
            name: "Audio",
            displayName: "Audio Interview",
            questions: audioQuestions.map(q => ({
              ...q,
              content: { prompt_text: q.prompt_text }  // Normalize
            })),
            type: "audio",
          });
        }

        if (videoQuestions.length) {
          organizedSections.push({
            name: "Video",
            displayName: "Video Interview",
            questions: videoQuestions.map(q => ({
              ...q,
              content: { prompt_text: q.prompt_text }  // Normalize
            })),
            type: "video",
          });
        }

        setSections(organizedSections);

        setLoading(false);
      } catch (err) {
        console.error('Failed to load test:', err);
        setError('Failed to load test. Please check your link and try again.');
        setLoading(false);
      }
    };

    fetchTest();
  }, [questionSetId]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('jobData');
      if (raw) {
        const j = JSON.parse(raw);
        const title = j.title || j.job_title || j.role || j.position;
        if (title) setAssessmentJobTitle(String(title));
      }
    } catch (e) { }
  }, []);

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestionsInSection = currentSection?.questions.length || 0;

  useEffect(() => {
    if (currentQuestion?.id) {
      setVisitedQuestionIds((prev) => new Set([...prev, currentQuestion.id]));
    }
  }, [currentQuestion?.id]);

  useEffect(() => {
    setQuestionGridPage(1);
  }, [currentSectionIndex]);

  useEffect(() => {
    const hide = testStarted && step === 'test' && !submitted;
    if (typeof setHideSidebarForTest === 'function') {
      setHideSidebarForTest(hide);
    }
    return () => {
      if (typeof setHideSidebarForTest === 'function') {
        setHideSidebarForTest(false);
      }
    };
  }, [testStarted, step, submitted, setHideSidebarForTest]);

  // Shared timer for the current question so it continues inside AudioInterview
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
  // initialize when question changes
  useEffect(() => {
    const t = Number(currentQuestion?.time_limit || 60);
    setQuestionTimeLeft(t);
  }, [currentSectionIndex, currentQuestionIndex, currentQuestion?.id]);

  // countdown managed here so it continues while AudioInterview is shown
  useEffect(() => {
    if (questionTimeLeft === null) return;
    if (submitted) return;

    const id = setInterval(() => {
      setQuestionTimeLeft((prev) => (typeof prev === 'number' && prev > 0 ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?.id, submitted]);

  // notify when time reaches zero
  useEffect(() => {
    if (typeof questionTimeLeft === 'number' && questionTimeLeft <= 0) {
      try { handleTimeUp(); } catch (e) { }
    }
  }, [questionTimeLeft]);

  const totalAssessmentMinutes = useMemo(() => {
    let sec = 0;
    for (const s of sections) {
      for (const q of s.questions || []) {
        sec += Number(q.time_limit) || 60;
      }
    }
    return Math.max(1, Math.round(sec / 60));
  }, [sections]);

  const durationHeader =
    totalAssessmentMinutes >= 60
      ? `${Math.round(totalAssessmentMinutes / 60)}hr`
      : `${totalAssessmentMinutes} min`;

  const gridTotalPages = Math.max(1, Math.ceil(totalQuestionsInSection / QUESTIONS_GRID_PAGE_SIZE));
  const gridPageClamped = Math.min(questionGridPage, gridTotalPages);
  const gridSliceStart = (gridPageClamped - 1) * QUESTIONS_GRID_PAGE_SIZE;
  const gridQuestionsSlice = (currentSection?.questions || []).slice(
    gridSliceStart,
    gridSliceStart + QUESTIONS_GRID_PAGE_SIZE
  );

  const isQuestionAnswered = (q) => {
    if (!q) return false;
    const a = allAnswers[q.id];
    return a !== undefined && a !== null && String(a).trim() !== '';
  };

  const goToSectionFromTab = (type) => {
    const idx = sections.findIndex((s) => s.type === type);
    if (idx < 0) return;
    if (idx > currentSectionIndex) {
      toast.info('Finish this section to unlock the next part.');
      return;
    }
    setCurrentSectionIndex(idx);
    setCurrentQuestionIndex(0);
  };

  const getQuestionKey = (q, sectionIndex, questionIndex) => {
    if (!q) return '';
    const raw = q.id ?? q._id ?? q.question_id;
    if (raw !== undefined && raw !== null && String(raw) !== '') return String(raw);
    return `s${sectionIndex}-i${questionIndex}`;
  };

  const currentQReviewKey =
    currentQuestion != null
      ? getQuestionKey(currentQuestion, currentSectionIndex, currentQuestionIndex)
      : '';
  const isCurrentMarkedForReview = !!(currentQReviewKey && reviewMarks[currentQReviewKey]);

  const toggleMarkReview = () => {
    if (!currentQuestion) return;
    const key = getQuestionKey(currentQuestion, currentSectionIndex, currentQuestionIndex);
    if (!key) return;
    setReviewMarks((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
        toast.info('Removed from review');
      } else {
        next[key] = true;
        toast.success('Marked for review');
      }
      return next;
    });
  };

  const handleSaveAndNext = () => {
    if (
      (currentSection?.type === 'mcq' ||
        currentSection?.type === 'coding' ||
        currentSection?.type === 'video') &&
      currentQuestionIndex === totalQuestionsInSection - 1 &&
      currentSectionIndex === sections.length - 1
    ) {
      if (submitting) return;
      handleSubmitAllSections().catch((e) => console.warn('Submit failed', e));
      return;
    }

    const hasVideoSection = sections.some((s) => s.type === 'video');

    if (
      hasVideoSection &&
      currentSection?.type === 'video' &&
      !showWebcamInterview &&
      currentQuestionIndex === totalQuestionsInSection - 1
    ) {
      toast.error('Please complete the webcam interview before submitting.');
      return;
    }

    if (currentSection?.type === 'audio') {
      if (currentSectionIndex < sections.length - 1) {
        setCompletedSections((prev) => new Set([...prev, currentSectionIndex]));
        setCurrentSectionIndex((prev) => prev + 1);
        setCurrentQuestionIndex(0);
      } else if (audioInterviewDone) {
        if (submitting) return;
        handleSubmitAllSections().catch((e) => console.warn('Submit failed', e));
      } else {
        setAudioInterviewVisited(true);
        setShowAudioInterview(true);
      }
      return;
    }

    handleNext();
  };

  const saveNextLabel = submitting
    ? 'Submitting...'
    : currentSection?.type === 'audio'
      ? currentSectionIndex === sections.length - 1
        ? audioInterviewDone
          ? 'Submit Test'
          : 'Visit Audio Interview'
        : audioInterviewVisited
          ? 'Go To Next Part'
          : 'Visit Audio Interview'
      : (currentSection?.type === 'mcq' ||
        currentSection?.type === 'coding' ||
        currentSection?.type === 'video') &&
        currentQuestionIndex === totalQuestionsInSection - 1 &&
        currentSectionIndex === sections.length - 1
        ? 'Submit Test'
        : currentQuestionIndex === totalQuestionsInSection - 1
          ? 'Proceed to Next Section'
          : 'Save & Next';

  const saveNextDisabled =
    submitting || (currentSection?.type === 'audio' && !audioInterviewVisited);

  // Handle single-question answer change
  const handleAnswerChange = (answer) => {
    if (!currentQuestion) return;
    setAllAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer,
    }));
  };

  // Navigation: Next / Previous
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestionsInSection - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCompletedSections(prev => new Set([...prev, currentSectionIndex]));
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Removed automatic submit from navigation. Submissions are now triggered by section-specific actions (audio/video Upload & Submit).
      toast.info('Please complete the section actions (Upload & Submit) to finish the test.');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
    // do not allow going back to previous section once moved forward
  };

  const handleTimeUp = () => {
    handleNext();
  };

  // Start recording immediately on mount as soon as media is available
  useEffect(() => {
    if (recordingStartedRef.current) return;
    if (!mediaAllowed) return;

    const candidateStream =
      streamRef.current ||
      localStream ||
      window.__candidateCameraStream;

    if (!candidateStream) return;

    console.log('GiveTest: recorder mounted and ready');

    setRecordingStarted(true);
    recordingStartedRef.current = true;
  }, [mediaAllowed, localStream]);


  // Submit all sections
  // options: { markComplete: boolean }
  const handleSubmitAllSections = async (answersOverride, options = {}) => {
    try {
      if (fullscreenExitTimeoutRef.current) {
        clearTimeout(fullscreenExitTimeoutRef.current);
        fullscreenExitTimeoutRef.current = null;
      }
      if (fullscreenExitIntervalRef.current) {
        clearInterval(fullscreenExitIntervalRef.current);
        fullscreenExitIntervalRef.current = null;
      }
      fullscreenPenaltyActiveRef.current = false;
      setShowFullscreenExitModal(false);
      setFullscreenGraceSeconds(null);
    } catch (e) { }

    setSubmitting(true);
    try {
      // Before submitting, upload the recorded video if recording was started
      if (recordingStarted && webcamInterviewRef.current) {
        try {
          console.log('GiveTest: uploading recorded video before final submit...');
          const uploadResult = await webcamInterviewRef.current.uploadRecording();
          console.log('GiveTest: video upload result:', uploadResult);
          if (uploadResult && uploadResult.qa_data) {
            // Merge uploaded QA into allAnswers if needed
            console.log('GiveTest: video QA data received from upload:', uploadResult.qa_data);
          }
        } catch (err) {
          console.warn('GiveTest: video upload failed before submit:', err);
          // Don't block submission if video upload fails
        }
      }

      const results = [];
      // read cid once from sessionStorage so it's available after the loop
      let cidFromSession = null;
      let jobIdFromSession = null;
      try {
        const raw = sessionStorage.getItem("candidateData");
        if (raw) {
          const parsed = JSON.parse(raw);
          cidFromSession = parsed?.id ?? null;
          // accept multiple possible keys used by different flows
          jobIdFromSession = parsed?.job_id || parsed?.jobId || parsed?.job || parsed?.jdId || parsed?.jd_id || null;
          console.log('GiveTest: candidateData keys from sessionStorage', Object.keys(parsed || {}));
        }
      } catch (e) {
        console.warn('Failed to read candidateData from sessionStorage', e);
      }

      // helper: read job id from URL query params as another fallback
      const getQueryParam = (name) => {
        try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
      };

      // try multiple fallbacks: prop, sessionStorage, URL query, location state, localStorage cached jobData
      let resolvedJobId = jdId || jobIdFromSession || getQueryParam('job_id') || getQueryParam('jobId') || getQueryParam('jdId') || getQueryParam('jd') || null;
      if (!resolvedJobId) {
        // check react-router location state
        try {
          const s = location && location.state;
          if (s && (s.job_id || s.jobId || s.jdId || s.job)) resolvedJobId = s.job_id || s.jobId || s.jdId || s.job || null;
        } catch (e) { }
      }

      if (!resolvedJobId) {
        // prefer sessionStorage (set by Examination/TestDetails) then fall back to localStorage
        try {
          const maybeSession = sessionStorage.getItem('jobData');
          if (maybeSession) {
            const jd = JSON.parse(maybeSession);
            if (jd && (jd.job_id || jd.jobId || jd._id || jd.id) && (jd.questionSetId === questionSetId || jd.question_set_id === questionSetId || !questionSetId)) {
              resolvedJobId = jd.job_id || jd.jobId || jd._id || jd.id;
            }
          }
        } catch (e) { }

        if (!resolvedJobId) {
          try {
            const maybe = localStorage.getItem('jobData');
            if (maybe) {
              const jd = JSON.parse(maybe);
              if (jd && (jd.job_id || jd.jobId || jd._id || jd.id) && (jd.questionSetId === questionSetId || jd.question_set_id === questionSetId || !questionSetId)) {
                resolvedJobId = jd.job_id || jd.jobId || jd._id || jd.id;
              }
            }
          } catch (e) { }
        }
      }

      if (!resolvedJobId) {
        try {
          const listRawSession = sessionStorage.getItem('jobDataList');
          if (listRawSession) {
            const arr = JSON.parse(listRawSession) || [];
            const found = arr.find(it => (it.questionSetId === questionSetId) || (it.question_set_id === questionSetId));
            if (found) resolvedJobId = found.job_id || found.jobId || found._id || found.id || null;
          }
        } catch (e) { }

        if (!resolvedJobId) {
          try {
            const listRaw = localStorage.getItem('jobDataList');
            if (listRaw) {
              const arr = JSON.parse(listRaw) || [];
              const found = arr.find(it => (it.questionSetId === questionSetId) || (it.question_set_id === questionSetId));
              if (found) resolvedJobId = found.job_id || found.jobId || found._id || found.id || null;
            }
          } catch (e) { }
        }
      }

      console.log('GiveTest: resolvedJobId ->', resolvedJobId);
      // expose for quick debugging in console
      try { window.__resolvedJobId = resolvedJobId; } catch (e) { }

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const section = sections[sIdx];
        const answersSource = answersOverride || allAnswers;

        const responses = section.questions.map((question, qIdx) => {
          const qKey = getQuestionKey(question, sIdx, qIdx);
          const qId = question.id ?? question._id ?? question.question_id;
          return {
            question_id: qId,
            question_type: question.type,
            question_text:
              question.prompt_text ||
              question.content?.prompt_text ||
              question.question ||
              '',

            correct_answer:
              question.correct_answer ||
              question.content?.correct_answer ||
              'N/A',

            candidate_answer: answersSource[qId] ?? answersSource[question.id] ?? '',
            marked_for_review: !!reviewMarks[qKey],
          };
        });



        const submissionData = {
          question_set_id: questionSetId,
          section_name: section.name,
          candidate_id: finalCandidateId,
          cid: cidFromSession || finalCandidateId,
          job_id: resolvedJobId,
          responses,
        };

        if (options && options.markComplete) {
          submissionData.mark_complete = true;
        }

        // Debug logs (helpful during integration)
        console.log('Submitting section', section.name, 'with questionSetId=', questionSetId);
        console.log('submissionData:', submissionData);
        let result = null;
        try {
          result = await testApi.submitSection(questionSetId, submissionData, orgIdRef.current);
          console.log('submitSection result:', result);
        } catch (err) {
          console.error('submitSection threw error:', err);
          throw err;
        }
        results.push({ sectionName: section.name, result });
      }

      setSubmissionResults(results);
      setSubmitted(true);
      try {
        sessionStorage.removeItem('exam_expects_fullscreen');
      } catch (e) { }
      toast.success("Test submitted successfully!");

      // STOP RECORDING + MONITORING AFTER SUBMIT
      try {
        // 1. Stop webcam recorder (stops recording)
        if (webcamInterviewRef.current && typeof webcamInterviewRef.current.stopAll === "function") {
          console.log('GiveTest: stopping recording on test submit...');
          await webcamInterviewRef.current.stopAll();
          recordingStartedRef.current = false;
          setRecordingStarted(false);
          console.log('GiveTest: recording stopped');
        }

        // 2. Disable further tab/inactivity/face violations
        setTestStarted(false);
        // clear any multi-face UI state
        try { setShowMultipleFaces(false); } catch (e) { }
      } catch (err) {
        console.warn("Failed to cleanup after submit:", err);
      }

      // 1) save violations (best-effort)
      try {
        if (!saveViolationsSentRef.current) {
          saveViolationsSentRef.current = true;
          const v = violationsRef.current;
          const violationsPayload = {
            question_set_id: questionSetId,
            candidate_id: finalCandidateId,
            tab_switches: v.tab_switches || 0,
            inactivities: v.inactivities || 0,
            face_not_visible: v.face_not_visible || 0,
            multiple_faces: v.multiple_faces || 0, // CRITICAL FIX: missing field
            cid: cidFromSession || finalCandidateId,
            job_id: resolvedJobId,
          };
          console.log('GiveTest: sending saveViolations payload ->', violationsPayload);
          await testApi.saveViolations(violationsPayload, orgIdRef.current);
          console.log('GiveTest: Violations saved successfully');
        }
      } catch (err) {
        console.warn('GiveTest: Failed to save violations', err);
      }

      // 2) optionally store candidate id to local env for other components
      window.REACT_APP_CANDIDATE_ID = finalCandidateId;
      window.REACT_APP_QUESTION_SET_ID = questionSetId;
    } catch (err) {
      console.error('Test submission error:', err);
      setError('Failed to submit test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAllSectionsRef = useRef(handleSubmitAllSections);
  handleSubmitAllSectionsRef.current = handleSubmitAllSections;

  useEffect(() => {
    const examLive = testStarted && step === 'test' && !submitted;

    const clearFullscreenGraceTimers = () => {
      if (fullscreenExitTimeoutRef.current) {
        clearTimeout(fullscreenExitTimeoutRef.current);
        fullscreenExitTimeoutRef.current = null;
      }
      if (fullscreenExitIntervalRef.current) {
        clearInterval(fullscreenExitIntervalRef.current);
        fullscreenExitIntervalRef.current = null;
      }
      setFullscreenGraceSeconds(null);
      fullscreenPenaltyActiveRef.current = false;
    };

    if (!examLive) {
      clearFullscreenGraceTimers();
      setShowFullscreenExitModal(false);
      return;
    }

    const examExpectsFullscreen = (() => {
      try {
        return sessionStorage.getItem('exam_expects_fullscreen') === '1';
      } catch (e) {
        return false;
      }
    })();

    const startFullscreenExitPenalty = () => {
      if (fullscreenPenaltyActiveRef.current || submittingRef.current) return;
      fullscreenPenaltyActiveRef.current = true;
      setShowFullscreenExitModal(true);
      setFullscreenGraceSeconds(FULLSCREEN_EXIT_GRACE_SEC);

      let remaining = FULLSCREEN_EXIT_GRACE_SEC;
      fullscreenExitIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setFullscreenGraceSeconds(remaining > 0 ? remaining : 0);
      }, 1000);

      fullscreenExitTimeoutRef.current = setTimeout(() => {
        if (fullscreenExitIntervalRef.current) {
          clearInterval(fullscreenExitIntervalRef.current);
          fullscreenExitIntervalRef.current = null;
        }
        fullscreenExitTimeoutRef.current = null;
        fullscreenPenaltyActiveRef.current = false;
        setShowFullscreenExitModal(false);
        setFullscreenGraceSeconds(null);

        if (!getFullscreenElement() && !submittingRef.current) {
          toast.error(
            'Your exam was submitted automatically because fullscreen was not restored.'
          );
          Promise.resolve(handleSubmitAllSectionsRef.current?.()).catch((e) =>
            console.warn('Fullscreen auto-submit failed', e)
          );
        }
      }, FULLSCREEN_EXIT_GRACE_SEC * 1000);
    };

    const onFullscreenChange = () => {
      const fs = getFullscreenElement();
      if (fs) {
        hadFullscreenDuringExamRef.current = true;
        clearFullscreenGraceTimers();
        setShowFullscreenExitModal(false);
        return;
      }

      const shouldEnforce =
        hadFullscreenDuringExamRef.current || examExpectsFullscreen;
      if (!shouldEnforce) return;
      hadFullscreenDuringExamRef.current = true;
      startFullscreenExitPenalty();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    if (getFullscreenElement()) {
      hadFullscreenDuringExamRef.current = true;
    } else if (examExpectsFullscreen) {
      hadFullscreenDuringExamRef.current = true;
      queueMicrotask(() => startFullscreenExitPenalty());
    }

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
      if (fullscreenExitTimeoutRef.current) {
        clearTimeout(fullscreenExitTimeoutRef.current);
        fullscreenExitTimeoutRef.current = null;
      }
      if (fullscreenExitIntervalRef.current) {
        clearInterval(fullscreenExitIntervalRef.current);
        fullscreenExitIntervalRef.current = null;
      }
    };
  }, [testStarted, step, submitted]);

  // ActivityMonitor -> onViolation handler
  const handleViolation = (key, count = 1, flush = false) => {
    if (submitted || !testStarted) return;

    // Helper: show alert for MCQ, coding, and video sections
    const showSectionAlert = (msg) => {
      const sectionType = currentSection?.type;
      if (["mcq", "coding", "video"].includes(sectionType)) {
        window.alert(msg);
      }
    };

    // 1. UPDATE REF IMMEDIATELY (SYNCHRONOUS) - This is for the final submission payload
    const currentCounts = { ...violationsRef.current };
    if (flush) {
      currentCounts[key] = count;
    } else {
      currentCounts[key] = (currentCounts[key] || 0) + count;
    }
    violationsRef.current = currentCounts;

    // 2. UPDATE STATE FOR UI FEEDBACK (ASYNCHRONOUS)
    setViolations(currentCounts);

    // 3. EMIT SOCKET EVENT
    try {
      emitViolation({
        exam_id: jdId,
        question_set_id: questionSetId,
        candidate_email: userInfo.email,
        candidate_name: userInfo.name,
        [key]: flush ? Number(count) : 1,
      });
    } catch (e) {
      console.warn('emitViolation failed', e);
    }

    // 4. HANDLE SPECIFIC KEYS
    if (key === 'multiple_faces') {
      setShowMultipleFaces(true);
      if (!shownToastsRef.current.has('multiple_faces')) {
        const msg = '🚨 Multiple faces detected — page blurred';
        toast.warning(msg);
        showSectionAlert(msg);
        shownToastsRef.current.add('multiple_faces');
      }
    } else if (key === 'single_face') {
      setShowMultipleFaces(false);
      shownToastsRef.current.delete('multiple_faces');
      return;
    } else if (key === 'tab_switches') {
      const msg = '⚠️ Tab switch detected — page blurred';
      showSectionAlert(msg);
      if (!shownToastsRef.current.has('tab_switches')) {
        toast.warning(msg);
        shownToastsRef.current.add('tab_switches');
      }
      setShowTabSwitch(true);
      setTimeout(() => { try { setShowTabSwitch(false); } catch (e) { } }, 3000);
    } else {
      // General toasts for other violations (inactivities, face_not_visible)
      if (!shownToastsRef.current.has(key)) {
        let msg = '';
        if (key === 'inactivities') msg = '⌛ You have been inactive.';
        if (key === 'face_not_visible') msg = '🚨 Face not visible!';
        if (msg) {
          toast[key === 'face_not_visible' ? 'error' : (key === 'inactivities' ? 'info' : 'warning')](msg);
          showSectionAlert(msg);
        }
        shownToastsRef.current.add(key);
      }
    }

    // 5. AUTO-SUBMIT LOGIC
    // Thresholds: tab_switches >= 15, multiple_faces >= 15, inactivities >= 15, face_not_visible >= 15
    let shouldAutoSubmit = false;
    let submitReason = '';

    if (currentCounts.tab_switches >= 5) {
      shouldAutoSubmit = true;
      submitReason = 'Too many tab switches detected.';
    } else if (currentCounts.multiple_faces >= 5) {
      shouldAutoSubmit = true;
      submitReason = 'Multiple faces detected multiple times.';
    } else if (currentCounts.inactivities >= 5) {
      shouldAutoSubmit = true;
      submitReason = 'Prolonged inactivity detected.';
    } else if (currentCounts.face_not_visible >= 5) {
      shouldAutoSubmit = true;
      submitReason = 'Face not visible for too long.';
    }

    if (shouldAutoSubmit && testStarted && !submittingRef.current) {
      console.log('AUTO-SUBMITTING due to proctoring violation:', submitReason);
      toast.error(`${submitReason} Submitting test automatically.`);

      try {
        setTestStarted(false);
        const answersToSubmit = { ...(allAnswers || {}) };

        // Persist partial results
        try {
          const key = `partialAnswers_${questionSetId}_${finalCandidateId}`;
          sessionStorage.setItem(key, JSON.stringify(answersToSubmit));
        } catch (e) { }

        handleSubmitAllSections(answersToSubmit, { markComplete: true })
          .catch(e => console.warn('Auto-submit failed', e));
      } catch (e) {
        console.warn('Auto-submit handler crash', e);
      }
    }
  };

  // uncomment the below line if candidate needs to login before giving test!!!
  {/* // Entry step: collect email / user details
  if (step === 'entry') {
    return (
      <UserEmail
        jdId={jdId}
        onContinue={(info) => {
          setUserInfo(info);
          setStep('instructions');
          requestMedia();
        }}
      />
    );
  } */}

  // Recording permission dialog - show before allowing test to start
  if (recordingStarted && !recordingPermissionAsked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center border-2 border-blue-200">
          <div className="text-6xl mb-6">🎥</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Recording Permission</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6 text-left">
            <p className="text-gray-700 mb-3">
              <strong>Your camera is now recording.</strong>
            </p>
            <p className="text-gray-600 text-sm mb-2">
              This recording will capture your entire test session to ensure:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>✓ Test integrity and fairness</li>
              <li>✓ Proper candidate verification</li>
              <li>✓ A single continuous video of your test</li>
            </ul>
          </div>
          <p className="text-gray-600 mb-6">
            Do you allow us to record your test session?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setRecordingPermissionAsked(true);
                setRecordingPermissionGranted(true);
                setInstructionsVisible(false);
                setTestStarted(true);
                setStep('test');
                toast.success('✓ Permission granted! Starting test...');
              }}

              className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Deny
            </button>
            <button
              onClick={() => {
                setRecordingPermissionAsked(true);
                setRecordingPermissionGranted(true);
                setInstructionsVisible(false);
                setTestStarted(true);
                setStep('test');
                toast.success('✓ Permission granted! Starting test...');
              }}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Allow
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if recording was denied
  if (recordingPermissionAsked && !recordingPermissionGranted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Recording Permission Denied</h2>
          <p className="text-gray-600 mb-6">
            Recording is mandatory for this test. You cannot proceed without granting recording permission.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Reload and Try Again
          </button>
        </div>
      </div>
    );
  }

  // Instructions step
  if (step === 'instructions') {
    if (instructionsVisible || !mediaAllowed) {
      return (
        <InstructionsPage
          onComplete={() => {
            setInstructionsVisible(false);
            setTestStarted(true);
            setStep('test');
            // Test starts after instructions, recording is already active
          }}
          mediaAllowed={mediaAllowed}
        />
      );
    }
  }

  // Show permission request overlay if media not allowed after test started
  if (!mediaAllowed && testStarted && step === 'test') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-4xl mb-4">📹🎤</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Permissions Required</h2>
          <p className="text-gray-600 mb-6">
            Your camera and microphone access is required to take this test. Please grant permissions when prompted by your browser.
          </p>
          <button
            onClick={requestMedia}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-2"
          >
            Request Camera & Microphone Access
          </button>
          <p className="text-xs text-gray-500 mt-4">
            If you deny permissions, you won't be able to take the test. Make sure your device has both camera and microphone available.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading test...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Submitted / results view
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef0f4] px-4 py-10 font-sans">
        <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <button
            type="button"
            aria-label="Close"
            onClick={() => { window.location.href = '/Candidate-Dashboard'; }}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.45)]">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[#7C69EF]">Test submitted successfully</h2>
            <p className="mb-8 text-sm leading-relaxed text-gray-600">
              Thank you for taking the test. Your responses have been submitted successfully.
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = '/Candidate-Dashboard'; }}
              className="w-full rounded-xl bg-gradient-to-r from-[#7C69EF] to-[#a855f7] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // When audio interview is open, show only that UI


  // NOTE: Do not early-return for AudioInterview; keep recorder mounted across sections.


  // UI
  return (
    <>

      {/* Audio Interview Overlay (keeps the recorder mounted so recording does NOT restart) */}
      {showAudioInterview && (
        <div className="fixed inset-0 z-[9999] h-dvh max-h-dvh overflow-hidden bg-[#eef0f4]">
          <AudioInterview
            questions={currentSection?.questions || []}
            candidateId={finalCandidateId}
            questionSetId={questionSetId}
            baseUrl={window.REACT_APP_BASE_URL || { pythonUrl }}
            onClose={() => setShowAudioInterview(false)}
            onComplete={(qa) => {
              setAudioInterviewResults(qa);
              // merge audio answers into main answers map so submit includes them
              setAllAnswers((prev) => {
                const next = { ...prev };
                (qa || []).forEach((item) => {
                  if (item && item.questionId) next[item.questionId] = item.answer || '';
                });
                return next;
              });
              setShowAudioInterview(false);
              setAudioInterviewDone(true);
              toast.success('Audio interview completed.');
            }}
            faceEventRef={faceEventRef}
            showMultipleFaces={showMultipleFaces}
            showTabSwitch={showTabSwitch}
            sharedStream={streamRef.current || localStream}
            remainingTime={questionTimeLeft}
            updateRemainingTime={(t) => setQuestionTimeLeft(Number(t))}
            onAudioTimeUp={handleTimeUp}
          />
        </div>
      )}


      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {showFullscreenExitModal && testStarted && step === 'test' && !submitted && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900">Return to fullscreen</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              You left fullscreen during the exam. Click the button below to go back to fullscreen and continue.
              If you do not return within{' '}
              <span className="font-semibold text-[#7C69EF]">
                {fullscreenGraceSeconds ?? FULLSCREEN_EXIT_GRACE_SEC}
              </span>{' '}
              seconds, your exam will be submitted automatically.
            </p>
            <button
              type="button"
              onClick={() => requestDocumentFullscreen()}
              className="mt-6 w-full rounded-xl bg-[#7C69EF] py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Enter fullscreen again
            </button>
          </div>
        </div>
      )}

      {showMultipleFaces && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-400 text-black px-4 py-2 rounded shadow">
          🚨 Multiple faces detected — page blurred
        </div>
      )}

      {/* Hidden monitoring components */}
      <ActivityMonitor
        questionSetId={questionSetId}
        candidateName={userInfo.name}
        email={userInfo.email}
        faceEventRef={faceEventRef}
        testStarted={testStarted}
        submitted={submitted}
        onViolation={handleViolation}
      />

      {!submitted && <FaceDetection faceEventRef={faceEventRef} />}

      {/* Persistent hidden recorder - records entire test continuously */}
      {/* Persistent recorder – mounted early, starts later */}
      {recordingStarted && recordingPermissionGranted && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <WebCamRecorder
            ref={webcamInterviewRef}
            candidateId={finalCandidateId}
            questionSetId={questionSetId}
            sharedStream={streamRef.current || localStream || window.__candidateCameraStream}

            /* 🔑 THIS IS THE FIX */
            autoStart={recordingPermissionGranted}

            onComplete={(qa) => {
              console.log('Recorder completed:', qa);
            }}
          />
        </div>
      )}


      {/* Quick button to trigger camera permissions if preview missing */}
      {!submitted && step === 'test' && !mediaAllowed && (
        <div className="fixed top-24 right-4 z-40">
          <button
            onClick={requestMedia}
            className="px-3 py-2 bg-yellow-500 text-white rounded shadow"
          >
            Enable Camera Preview
          </button>
        </div>
      )}

      <div className={`min-h-screen bg-[#eef0f4] font-sans ${showMultipleFaces ? 'blur-sm' : ''}`}>
        <div className="mx-auto max-w-[1600px] px-4 py-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Online Assessment</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Welcome, {candidateDisplayName}!
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex-1 rounded-2xl bg-white px-6 py-5 text-center shadow-md lg:mx-6">
              <h2 className="text-lg font-bold text-gray-900">
                Online Assessment for {assessmentJobTitle}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Duration: {durationHeader} • {sections.length} Sections
              </p>
            </div>
            <div className="hidden w-44 shrink-0 lg:block" aria-hidden />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            {/* Left: question palette */}
            <aside className="lg:col-span-3">
              <div className="rounded-2xl bg-white p-5 shadow-md">
                <h3 className="text-sm font-bold text-gray-800">
                  Questions ({totalQuestionsInSection})
                </h3>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {gridQuestionsSlice.map((q, i) => {
                    const globalIdx = gridSliceStart + i;
                    const answered = isQuestionAnswered(q);
                    const visited = visitedQuestionIds.has(q.id);
                    const qKey = getQuestionKey(q, currentSectionIndex, globalIdx);
                    const isReview = !!reviewMarks[qKey];
                    const isCurrent = globalIdx === currentQuestionIndex;
                    let cell =
                      'flex h-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition ';
                    if (isCurrent) {
                      cell += 'ring-2 ring-offset-2 ';
                      cell += isReview ? 'ring-violet-600 ' : 'ring-[#7C69EF] ';
                    }
                    if (isReview && !isCurrent) {
                      cell += 'border-violet-400 bg-violet-50 text-violet-900 ';
                    } else if (answered) {
                      cell += 'border-emerald-200 bg-emerald-100 text-emerald-900 ';
                    } else if (visited) {
                      cell += 'border-amber-200 bg-amber-100 text-amber-900 ';
                    } else {
                      cell += 'border-gray-200 bg-gray-100 text-gray-500 ';
                    }
                    if (isCurrent && isReview) {
                      cell += 'bg-violet-50 ';
                    }
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(globalIdx)}
                        className={cell}
                      >
                        {globalIdx + 1}
                      </button>
                    );
                  })}
                </div>
                {gridTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3 text-gray-600">
                    <button
                      type="button"
                      className="rounded-lg p-1 hover:bg-gray-100"
                      onClick={() => setQuestionGridPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      &lt;
                    </button>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7C69EF] text-sm font-bold text-white">
                      {gridPageClamped}
                    </span>
                    <button
                      type="button"
                      className="rounded-lg p-1 hover:bg-gray-100"
                      onClick={() => setQuestionGridPage((p) => Math.min(gridTotalPages, p + 1))}
                      aria-label="Next page"
                    >
                      &gt;
                    </button>
                  </div>
                )}
                <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-6 rounded bg-amber-200" />
                    Visited but not answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-6 rounded bg-emerald-200" />
                    Answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-6 rounded bg-gray-200" />
                    Not visited
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-6 rounded border-2 border-violet-400 bg-violet-50" />
                    Marked for review
                  </div>
                </div>
              </div>
            </aside>

            {/* Center: tabs + question */}
            <main className="lg:col-span-6">
              <div className="rounded-2xl bg-white p-5 shadow-md lg:min-h-[520px]">
                <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-4">
                  {SECTION_TAB_ORDER.map((type) => {
                    const exists = sections.some((s) => s.type === type);
                    const active = currentSection?.type === type;
                    const label =
                      type === 'mcq'
                        ? 'MCQ'
                        : type === 'coding'
                          ? 'Coding'
                          : type === 'audio'
                            ? 'Audio'
                            : 'Video';
                    return (
                      <button
                        key={type}
                        type="button"
                        disabled={!exists}
                        onClick={() => goToSectionFromTab(type)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${!exists
                          ? 'cursor-not-allowed text-gray-300'
                          : active
                            ? 'bg-[#7C69EF]/15 text-[#5b4dd4]'
                            : 'text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {/* Record button is hidden for video questions as per request */}
                    {currentSection?.type === 'audio' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAudioInterviewVisited(true);
                          if (currentSection?.type === 'audio') setShowAudioInterview(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#7C69EF] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#6d5ce0]"
                      >
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-white ring-2 ring-white/80" />
                        Record
                      </button>
                    )}
                  </div>
                </div>

                {currentQuestionIndex === totalQuestionsInSection - 1 &&
                  currentSectionIndex === sections.length - 1 && (
                    <p className="mb-3 text-center text-sm font-medium text-[#7C69EF]">
                      Final submission — all sections will be submitted
                    </p>
                  )}
                {currentQuestionIndex === totalQuestionsInSection - 1 &&
                  currentSectionIndex < sections.length - 1 && (
                    <p className="mb-3 text-center text-sm text-amber-700">
                      Next: proceed to the next section (you cannot return)
                    </p>
                  )}

                {currentQuestion ? (
                  <div className="min-h-[280px]">
                    {(() => {
                      switch (currentQuestion.type) {
                        case 'mcq':
                          return (
                            <McqQuestion
                              question={currentQuestion}
                              answer={allAnswers[currentQuestion.id]}
                              onAnswer={handleAnswerChange}
                              embedded
                              questionOrdinal={currentQuestionIndex + 1}
                            />
                          );
                        case 'coding':
                          return (
                            <CodingQuestion
                              question={currentQuestion}
                              answer={allAnswers[currentQuestion.id]}
                              onAnswer={handleAnswerChange}
                              runCodeUrl={`${pythonUrl}/v1/test/run_code`}
                              embedded
                              questionOrdinal={currentQuestionIndex + 1}
                            />
                          );
                        case 'audio':
                          if (currentQuestion.id === 'audio-placeholder') {
                            return (
                              <p className="text-sm text-gray-700">
                                {currentQuestion.content.prompt_text || currentQuestion.prompt_text}
                              </p>
                            );
                          }
                          if (showAudioInterview) {
                            return (
                              <p className="rounded-xl border border-dashed border-[#7C69EF]/40 bg-[#7C69EF]/5 p-6 text-center text-sm text-gray-600">
                                Audio interview is open in full screen. Complete it there, then return here.
                              </p>
                            );
                          }
                          return (
                            <div>
                              <p className="mb-4 text-base font-semibold text-gray-900">
                                <span className="text-[#7C69EF]">Q{currentQuestionIndex + 1}.</span>{' '}
                                {(currentQuestion.prompt_text || currentQuestion.question || '').trim() ||
                                  'Answer in the audio interview.'}
                              </p>
                              {typeof allAnswers[currentQuestion.id] === 'string' && allAnswers[currentQuestion.id].trim() !== '' ? (
                                <div className="mt-4">
                                  <p className="text-sm font-semibold text-gray-700 mb-2">Transcribed Answer:</p>
                                  <div className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-[#f3f4f6] p-4 text-sm text-gray-800">
                                    {allAnswers[currentQuestion.id]}
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                                  <p className="text-sm text-gray-500">
                                    Click <strong>Record</strong> above to start the audio interview.
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    Your response will appear here after completion.
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        case 'video':
                          if (currentQuestionIndex >= totalQuestionsInSection) {
                            return (
                              <div className="py-8 text-center">
                                <div className="mb-3 text-4xl text-emerald-500">✓</div>
                                <h3 className="text-lg font-bold text-gray-800">Video interview complete</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                  You can submit when you are ready.
                                </p>
                              </div>
                            );
                          }
                          if (currentQuestion.id === 'video-placeholder') {
                            return (
                              <p className="text-sm text-gray-700">
                                {currentQuestion.content.prompt_text || currentQuestion.prompt_text}
                              </p>
                            );
                          }
                          return (
                            <div>
                              <p className="mb-4 text-base font-semibold text-gray-900">
                                <span className="text-[#7C69EF]">Q{currentQuestionIndex + 1}.</span>{' '}
                                {currentQuestion.prompt_text || currentQuestion.question}
                              </p>
                              <textarea
                                value={
                                  typeof allAnswers[currentQuestion.id] === 'string'
                                    ? allAnswers[currentQuestion.id]
                                    : ''
                                }
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                className="min-h-[180px] w-full rounded-xl border border-gray-200 bg-[#f3f4f6] p-4 text-sm focus:border-[#7C69EF] focus:outline-none focus:ring-2 focus:ring-[#7C69EF]/20"
                                placeholder="Type your response here…"
                              />
                              {currentQuestionIndex === totalQuestionsInSection - 1 && (
                                <p className="mt-3 text-sm font-medium text-emerald-700">
                                  Last question — you can submit the test after saving.
                                </p>
                              )}
                            </div>
                          );
                        default:
                          return <p className="text-sm text-gray-600">Unknown question type</p>;
                      }
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No questions in this section.</p>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={toggleMarkReview}
                      disabled={!currentQuestion}
                      className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm ${isCurrentMarkedForReview
                        ? 'border-2 border-violet-500 bg-violet-100 text-violet-900'
                        : 'border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isCurrentMarkedForReview ? 'Marked for review' : 'Mark for Review'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAndNext}
                      disabled={saveNextDisabled}
                      className="rounded-xl bg-[#7C69EF] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#6d5ce0] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saveNextLabel}
                    </button>
                  </div>
                </div>
              </div>
            </main>

            {/* Right: proctoring panel */}
            <aside className="lg:col-span-3">
              <div className="space-y-4">
                <div className="rounded-2xl bg-white p-4 shadow-md">
                  {recordingStarted && recordingPermissionGranted && (
                    <p className="mb-2 flex items-center gap-2 text-xs font-medium text-red-600">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      Recording
                    </p>
                  )}
                  <div className="relative">
                    {!submitted &&
                      recordingPermissionGranted &&
                      (step === 'test' || testStarted || mediaAllowed || !!window.__candidateCameraStream) ? (
                      <WebcamPreview
                        variant="embedded"
                        webcamRef={webcamRef}
                        canvasRef={canvasRef}
                        localStream={localStream}
                        streamRef={streamRef}
                        hasVideoFrame={hasVideoFrame}
                        floatingPos={floatingPos}
                        setFloatingPos={setFloatingPos}
                        selectedDeviceId={selectedDeviceId}
                      />
                    ) : (
                      <div className="flex aspect-[16/10] max-h-[280px] min-h-[200px] w-full items-center justify-center rounded-xl bg-[#3d3d42] text-sm text-gray-400">
                        Camera preview unavailable
                      </div>
                    )}
                    <button
                      type="button"
                      title="Assessment info"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/35 text-xs font-bold text-white backdrop-blur-sm"
                    >
                      i
                    </button>
                    <div className="absolute bottom-2 left-2 max-w-[70%] truncate rounded-lg bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {candidateDisplayName}
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-[#7C69EF] px-2.5 py-1 text-xs font-semibold text-white shadow-md">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" strokeLinecap="round" />
                      </svg>
                      {typeof questionTimeLeft === 'number' ? `${questionTimeLeft} secs` : '—'}
                    </div>
                  </div>
                  <MicLevelWaveform
                    key={
                      (localStream ||
                        streamRef.current ||
                        (typeof window !== 'undefined' ? window.__candidateCameraStream : null)
                      )?.id || 'no-mic-stream'
                    }
                    stream={
                      localStream ||
                      streamRef.current ||
                      (typeof window !== 'undefined' ? window.__candidateCameraStream : null)
                    }
                  />
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-md">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                    <span className="text-lg leading-none">▮▮▮</span>
                    Internet Speed: Good
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500">✓</span> Microphone
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500">✓</span> Camera
                  </div>
                </div>

                {currentSection?.type === 'coding' && (
                  <div className="rounded-2xl bg-white p-4 shadow-md">
                    <h4 className="text-sm font-bold text-gray-800">Test Cases</h4>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Test case 1
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Test case 2
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-gray-300" />
                        Test case 3
                      </li>
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">
                  <span className="mr-1 font-bold">⚠</span>
                  Warning: Leaving full-screen, switching tabs, or minimizing the window will be flagged.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
      {/* Global submitting overlay (covers entire test while submitting and stopping recording) */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-3 p-6 bg-white bg-opacity-90 rounded-lg shadow-lg">
            <div className="w-14 h-14 border-4 border-t-blue-600 border-gray-200 rounded-full animate-spin" />
            <div className="text-gray-700 font-medium">Submitting test and finalizing recording... Please wait</div>
          </div>
        </div>
      )}
    </>
  );
};

export default GiveTest;