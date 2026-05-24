import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Upload, 
  Globe, 
  Send, 
  Mic, 
  MicOff, 
  Play, 
  Languages, 
  ChevronRight,
  ChevronDown,
  GraduationCap,
  School,
  Book,
  User,
  Info,
  Volume2,
  Camera,
  Scan,
  Users,
  MessageSquare,
  Sparkles,
  X,
  Zap,
  Sun,
  Moon,
  Eye,
  ArrowUp,
  FileQuestion,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Shield,
  Trash2,
  HelpCircle,
  Settings,
  Clock,
  BarChart3,
  FileUp,
  Square,
  Music,
  Wind,
  CloudRain,
  Coffee,
  Trees,
  Hash,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Plus,
  Network,
  Flame,
  Brain,
  FileText,
  XCircle,
  PenTool,
  Video,
  VideoOff,
  ScreenShare,
  Smile,
  Hand,
  Monitor,
  Laugh,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as SocketIOClient from 'socket.io-client';
import Logo from './components/Logo';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, isSameDay, startOfDay, differenceInDays, parseISO } from 'date-fns';
import { EducationLevel, Annotation, ChatMessage, Quiz, CopyrightReport, StudyInsight, StudySessionLog, FocusSound, RoomMessage, ProgressSummary, Flashcard, MistakeQuestion, WeeklyLetter, KnowledgeGraph, ClozeQuiz, GraphNode, GraphEdge, ClozeQuestion, ActiveRecallReport } from './types';
import { processDocument, translateText, chatWithAI, textToSpeech, textToSpeechStream, ocrFromImage, summarizeDocument, describeVisuals, extractTextFromFile, generateQuiz, generateStudyInsights, analyzeCopyright, generateLectureScript, generateFlashcards, generateAIFeedbackForMistake, generateWeeklyLetter, generateKnowledgeGraph, generateClozeQuiz, analyzeActiveRecall, generateVariantQuestion, generateCornellCues, defineHighlightedText, translateQuiz, translateClozeQuiz, translateKnowledgeGraph, translateFlashcards, translateAnnotations, translateChatMessageArray, translateWeeklyLetter, translateInsights, translateActiveRecallReport } from './services/gemini';
import type { VariantQuestion, CornellCue } from './services/gemini';
import { translations, Language } from './translations';
import { SummaryData, LectureScript } from './types';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, deleteDoc, writeBatch, query, where, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from './services/firebase';

export default function App() {
  const [level, setLevel] = useState<EducationLevel | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  // 3-second splash screen effect at startup
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(splashTimer);
  }, []);

  // Firebase Authentication States
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const isFirstLoadDone = useRef(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [summaryMode, setSummaryMode] = useState<'standard' | 'simple'>('simple');
  const [lectureScript, setLectureScript] = useState<LectureScript | null>(null);
  const [isGeneratingLecture, setIsGeneratingLecture] = useState(false);
  const [visualDescription, setVisualDescription] = useState<string>('');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'extracting' | 'analyzing' | 'summarizing' | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('Korean');
  const [isTranslating, setIsTranslating] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Synchronize darkMode to root HTML element for seamless Tailwind variant and transition application
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [activeTab, setActiveTab] = useState<'study' | 'quiz' | 'flashcards' | 'spatial' | 'audiobook' | 'collab' | 'recall' | 'ebbinghaus' | 'mistake-diary' | 'cornell'>('study');
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null);
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, {x: number, y: number}>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // States for manual concept mapping & drawing bridges (User-driven Graph Annotating)
  const [isConnectingBridge, setIsConnectingBridge] = useState(false);
  const [bridgeSourceId, setBridgeSourceId] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeGroup, setNewNodeGroup] = useState('Concept');
  const [newNodeDesc, setNewNodeDesc] = useState('');

  const [quizType, setQuizType] = useState<'mcq' | 'cloze'>('mcq');
  const [clozeQuiz, setClozeQuiz] = useState<ClozeQuiz | null>(null);
  const [isGeneratingCloze, setIsGeneratingCloze] = useState(false);
  const [clozeUserAnswers, setClozeUserAnswers] = useState<Record<string, Record<string, string>>>({});
  const [clozeChecked, setClozeChecked] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  
  // stopwatch & learning tracking removed
  const [studyLogs, setStudyLogs] = useState<StudySessionLog[]>([]);
  const totalStudyTime = studyLogs.reduce((acc, log) => acc + log.durationSeconds, 0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [timerMode, setTimerMode] = useState<'stopwatch' | 'pomodoro'>('stopwatch');
  const [pomodoroSession, setPomodoroSession] = useState<'focus' | 'break'>('focus');
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(1500); // 25 min
  const [activeRecallInput, setActiveRecallInput] = useState('');
  const [activeRecallReport, setActiveRecallReport] = useState<ActiveRecallReport | null>(null);
  const [isAnalyzingActiveRecall, setIsAnalyzingActiveRecall] = useState(false);

  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        if (timerMode === 'stopwatch') {
          setSecondsElapsed(prev => prev + 1);
        } else {
          setPomodoroTimeLeft(prev => {
            if (prev <= 1) {
              // Sound alert
              try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioCtx = new AudioContextClass();
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.55);
                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.6);
              } catch (e) {}

              if (pomodoroSession === 'focus') {
                const newLog: StudySessionLog = {
                  date: new Date().toISOString(),
                  durationSeconds: 1500, // 25 mins
                  level: level || 'elementary',
                  fileName: (audioFileName || 'Study Session') + ' (Pomodoro 25m Focus)'
                };
                setStudyLogs(current => {
                  const updated = [...current, newLog];
                  localStorage.setItem('studyo_logs', JSON.stringify(updated));
                  return updated;
                });
                setPomodoroSession('break');
                return 300; // 5 min
              } else {
                setPomodoroSession('focus');
                return 1500; // 25 min
              }
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, timerMode, pomodoroSession, level, audioFileName]);
  
  // TTS Settings
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'core' | 'other'>('core');
  const [showEncodingWarning, setShowEncodingWarning] = useState(false);
  
  // 🍿 Additional States for Habit Heatmap, Leitner boxes, and Socratic Audio
  const [hoveredHeatmapDay, setHoveredHeatmapDay] = useState<string | null>(null);
  const [flashcardBoxFilter, setFlashcardBoxFilter] = useState<'all' | '1' | '2' | '3'>('all');
  const [isSocraticAudio, setIsSocraticAudio] = useState(false);
  const cornellNotesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [notesSelectionDetails, setNotesSelectionDetails] = useState<{ text: string; } | null>(null);
  
  // 📝 Selection & Direct Highlight States
  const [highlights, setHighlights] = useState<any[]>(() => {
    const saved = localStorage.getItem('study_highlights');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectionDetails, setSelectionDetails] = useState<{
    text: string;
    x: number;
    y: number;
    open: boolean;
  } | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<any | null>(null);
  const [isDefiningHighlight, setIsDefiningHighlight] = useState(false);
  const [showSplitNote, setShowSplitNote] = useState<boolean>(() => {
    const saved = localStorage.getItem('study_show_split_note');
    return saved === 'true';
  });

  useEffect(() => {
    if (selectedHighlight && !selectedHighlight.aiDefinition) {
      const fetchHighlightDefinition = async () => {
        setIsDefiningHighlight(true);
        try {
          const res = await defineHighlightedText(
            selectedHighlight.text,
            fileContent || "",
            level || "high",
            selectedLanguage
          );
          if (res) {
            setHighlights(prev => {
              const updated = prev.map(h => h.id === selectedHighlight.id ? { 
                ...h, 
                aiDefinition: res.definition,
                aiContextUsage: res.contextUsage 
              } : h);
              localStorage.setItem('study_highlights', JSON.stringify(updated));
              return updated;
            });
            setSelectedHighlight(prev => prev ? {
              ...prev,
              aiDefinition: res.definition,
              aiContextUsage: res.contextUsage
            } : null);
          }
        } catch (err) {
          console.error("Failed to dynamically define highlighted text", err);
        } finally {
          setIsDefiningHighlight(false);
        }
      };
      fetchHighlightDefinition();
    }
  }, [selectedHighlight, fileContent, level, selectedLanguage]);

  useEffect(() => {
    localStorage.setItem('study_highlights', JSON.stringify(highlights));
  }, [highlights]);
  
  // 📅 Ebbinghaus Spaced Repetitive Tracker States
  const [ebbinghausItems, setEbbinghausItems] = useState<any[]>(() => {
    const saved = localStorage.getItem('study_ebbinghaus_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEbbinghausTitle, setNewEbbinghausTitle] = useState('');
  const [newEbbinghausType, setNewEbbinghausType] = useState<'material' | 'quiz' | 'flashcard' | 'recall'>('material');

  // Firebase Auth Handlers
  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const u = result.user;
        const userRef = doc(db, 'users', u.uid);
        await setDoc(userRef, {
          uid: u.uid,
          email: u.email || '',
          displayName: u.displayName || '',
          photoURL: u.photoURL || '',
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      const savedEbb = localStorage.getItem('study_ebbinghaus_items');
      const savedMis = localStorage.getItem('study_mistake_questions');
      setEbbinghausItems(savedEbb ? JSON.parse(savedEbb) : []);
      setMistakeQuestions(savedMis ? JSON.parse(savedMis) : []);
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Google sign out failed:", error);
    }
  };

  // 1. Listen to Auth State changes & load/merge sync items on login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      
      if (user) {
        // Fetch user's sync data from Firestore
        try {
          const ebbRef = collection(db, 'users', user.uid, 'ebbinghaus');
          const ebbSnap = await getDocs(ebbRef);
          const ebbList: any[] = [];
          ebbSnap.forEach(docSnap => {
            ebbList.push(docSnap.data());
          });

          const misRef = collection(db, 'users', user.uid, 'mistakes');
          const misSnap = await getDocs(misRef);
          const misList: any[] = [];
          misSnap.forEach(docSnap => {
            misList.push(docSnap.data());
          });

          // If either exists in Firestore, load them!
          if (ebbList.length > 0 || misList.length > 0) {
            setEbbinghausItems(ebbList);
            setMistakeQuestions(misList);
          } else {
            // Firestore data is empty, let's back up existing local state to Firestore!
            const savedEbb = localStorage.getItem('study_ebbinghaus_items');
            const savedMis = localStorage.getItem('study_mistake_questions');
            const localEbb = savedEbb ? JSON.parse(savedEbb) : [];
            const localMis = savedMis ? JSON.parse(savedMis) : [];

            if (localEbb.length > 0) {
              for (const item of localEbb) {
                await setDoc(doc(db, 'users', user.uid, 'ebbinghaus', item.id), item);
              }
            }
            if (localMis.length > 0) {
              for (const item of localMis) {
                await setDoc(doc(db, 'users', user.uid, 'mistakes', item.id), item);
              }
            }
          }
        } catch (err) {
          console.error("Firestore fetching failed: ", err);
        }
        isFirstLoadDone.current = true;
      } else {
        isFirstLoadDone.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. React to changed Ebbinghaus Items and write to Firestore (if logged in and initial load completed)
  useEffect(() => {
    localStorage.setItem('study_ebbinghaus_items', JSON.stringify(ebbinghausItems));
    
    if (currentUser && isFirstLoadDone.current) {
      const syncEbbinghaus = async () => {
        for (const item of ebbinghausItems) {
          try {
            await setDoc(doc(db, 'users', currentUser.uid, 'ebbinghaus', item.id), item);
          } catch (e) {
            console.error("Failed to sync ebbinghaus item:", e);
          }
        }
      };
      syncEbbinghaus();
    }
  }, [ebbinghausItems, currentUser]);

  // 📝 Metacognitive Mistake Diary Extra States (AI Misconception + Variant Quiz)
  const [activeVariantQuestion, setActiveVariantQuestion] = useState<VariantQuestion | null>(null);
  const [variantUserAnswer, setVariantUserAnswer] = useState<string>('');
  const [isGeneratingVariant, setIsGeneratingVariant] = useState(false);
  const [isSolvingVariant, setIsSolvingVariant] = useState(false);
  const [variantFeedback, setVariantFeedback] = useState<string | null>(null);
  const [activeMistakeForVariant, setActiveMistakeForVariant] = useState<any | null>(null);

  // ✍️ Cornell Notes & AI Cues States
  const [cornellNotes, setCornellNotes] = useState<string>(() => {
    return localStorage.getItem('study_cornell_notes') || '';
  });
  const [cornellSummary, setCornellSummary] = useState<string>(() => {
    return localStorage.getItem('study_cornell_summary') || '';
  });
  const [cornellCues, setCornellCues] = useState<CornellCue[]>(() => {
    const saved = localStorage.getItem('study_cornell_cues');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGeneratingCornellCues, setIsGeneratingCornellCues] = useState(false);
  const [expandedCornellCueIdx, setExpandedCornellCueIdx] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('study_cornell_notes', cornellNotes);
  }, [cornellNotes]);

  useEffect(() => {
    localStorage.setItem('study_cornell_summary', cornellSummary);
  }, [cornellSummary]);

  useEffect(() => {
    localStorage.setItem('study_cornell_cues', JSON.stringify(cornellCues));
  }, [cornellCues]);
  
  // Focus Sounds
  const [activeFocusSound, setActiveFocusSound] = useState<FocusSound | null>(null);
  const [isFocusSoundPlaying, setIsFocusSoundPlaying] = useState(false);
  const [focusVolume, setFocusVolume] = useState(0.5);
  const [audioError, setAudioError] = useState<string | null>(null);

  const [lastYoutubeUrl, setLastYoutubeUrl] = useState<string>('');
  const [lastAudioUrl, setLastAudioUrl] = useState<string>('');

  useEffect(() => {
    if (activeFocusSound) {
      if (activeFocusSound.type === 'youtube') setLastYoutubeUrl(activeFocusSound.url);
      else setLastAudioUrl(activeFocusSound.url);
    }
  }, [activeFocusSound]);

  const toggleFocusSound = (sound: FocusSound) => {
    setAudioError(null);
    
    // Create or resume the AudioContext inside the user gesture to avoid browser blocks
    if (sound.type === 'synth') {
      try {
        if (!focusSynthCtxRef.current) {
          focusSynthCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (focusSynthCtxRef.current.state === 'suspended') {
          focusSynthCtxRef.current.resume();
        }
      } catch (e) {
        console.warn("Failed to initialize sound context on user interaction:", e);
      }
    }

    const isSameSound = activeFocusSound?.id === sound.id;

    if (isSameSound && isFocusSoundPlaying) {
      setIsFocusSoundPlaying(false);
    } else {
      setActiveFocusSound(sound);
      setIsFocusSoundPlaying(true);
    }
  };
  const [socket, setSocket] = useState<any>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [isJoinedRoom, setIsJoinedRoom] = useState(false);
  const [roomUsers, setRoomUsers] = useState<string[]>([]);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [roomInput, setRoomInput] = useState('');
  const [username, setUsername] = useState(`Learner_${Math.floor(Math.random() * 900) + 100}`);
  
  // Video chat - Zoom-like state variables
  const [isZoomActiveModalOpen, setIsZoomActiveModalOpen] = useState(false);
  const [isVideoChatEnabled, setIsVideoChatEnabled] = useState(false);
  const [collabVideoStream, setCollabVideoStream] = useState<MediaStream | null>(null);
  const collabVideoRef = useRef<HTMLVideoElement>(null);
  const collabModalVideoRef = useRef<HTMLVideoElement>(null);
  const [videoFilter, setVideoFilter] = useState<'none' | 'grayscale' | 'sepia' | 'warm' | 'cyber' | 'glow'>('none');
  const [isCollabScreenSharing, setIsCollabScreenSharing] = useState(false);
  const [collabScreenStream, setCollabScreenStream] = useState<MediaStream | null>(null);
  const collabScreenVideoRef = useRef<HTMLVideoElement>(null);
  
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set());
  const [userEmojiReactions, setUserEmojiReactions] = useState<{ [user: string]: { emoji: string, id: number } }>({});
  const [usersWithVideo, setUsersWithVideo] = useState<Set<string>>(new Set());
  const [usersSharingScreen, setUsersSharingScreen] = useState<Set<string>>(new Set());
  
  // Virtual study buddies to make the room feel alive when studying solo
  const [includeVirtualBuddies, setIncludeVirtualBuddies] = useState(true);
  const [audioHistory, setAudioHistory] = useState<{id: string, name: string, date: string, duration: string}[]>(() => {
    const saved = localStorage.getItem('audio_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isHistoryPaused, setIsHistoryPaused] = useState(false);
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false);
  const [usersWithMic, setUsersWithMic] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('audio_history', JSON.stringify(audioHistory));
  }, [audioHistory]);

  const [savedRooms, setSavedRooms] = useState<{id: string, name: string}[]>(() => {
    const saved = localStorage.getItem('study_rooms_list');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Migrate old string-only storage if needed
      return parsed.map((item: any) => typeof item === 'string' ? { id: item, name: item } : item);
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('study_rooms_list', JSON.stringify(savedRooms));
  }, [savedRooms]);

  // Automatically translate content, chat messages, vocabulary annotations, and handle speech / voice changes when selectedLanguage changes
  useEffect(() => {
    let active = true;

    const translateContentOnLangChange = async () => {
      if (!fileContent) return;
      setIsTranslating(true);
      try {
        const result = await translateText(fileContent, selectedLanguage);
        if (active) {
          setTranslatedContent(result);
        }
      } catch (err) {
        console.error("Autotranslate fileContent error:", err);
      } finally {
        if (active) {
          setIsTranslating(false);
        }
      }
    };

    const translateSummaryOnLangChange = async () => {
      if (!summary) return;
      try {
        const result = await translateText(summary, selectedLanguage);
        if (active) {
          setSummary(result);
        }
      } catch (err) {
        console.error("Autotranslate summary error:", err);
      }
    };

    const translateVisualOnLangChange = async () => {
      if (!visualDescription) return;
      try {
        const result = await translateText(visualDescription, selectedLanguage);
        if (active) {
          setVisualDescription(result);
        }
      } catch (err) {
        console.error("Autotranslate visualDescription error:", err);
      }
    };

    const translateSpeechOnLangChange = async () => {
      if (!currentReadingText) return;
      // Stop current speech first
      if (ttsAbortControllerRef.current) {
        ttsAbortControllerRef.current.abort();
        ttsAbortControllerRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      pcmSourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      pcmSourcesRef.current = [];
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      setIsAudioPaused(false);
      setIsGeneratingTTS(false);

      try {
        const translatedSpeechText = await translateText(currentReadingText, selectedLanguage);
        if (active) {
          setCurrentReadingText(translatedSpeechText);
          setAudioTotalTime(translatedSpeechText.length / charsPerSecond / playbackSpeed);
          setAudioCurrentTime(0);
          setBaseTimeOffset(0);
          const targetVoice = selectedLanguage === 'Korean' ? 'Kore' :
                              selectedLanguage === 'English' ? 'Aoide' :
                              selectedLanguage === 'Japanese' ? 'Puck' : 'Fenrir';
          // Let it resume playing the translated audio immediately in the new language
          handleTTS(translatedSpeechText, undefined, true, targetVoice, selectedLanguage);
        }
      } catch (err) {
        console.error("Autotranslate currentReadingText error:", err);
      }
    };

    const translateChatOnLangChange = async () => {
      if (messages.length === 0) return;
      try {
        const updatedMessages = await translateChatMessageArray(messages, selectedLanguage);
        if (active) {
          setMessages(updatedMessages);
        }
      } catch (err) {
        console.error("Autotranslate chat messages error:", err);
      }
    };

    const translateAnnotationsOnLangChange = async () => {
      if (annotations.length === 0) return;
      try {
        const updatedAnnotations = await translateAnnotations(annotations, selectedLanguage);
        if (active) {
          setAnnotations(updatedAnnotations);
        }
      } catch (err) {
        console.error("Autotranslate annotations error:", err);
      }
    };

    const translateFlashcardsOnLangChange = async () => {
      if (flashcards.length === 0) return;
      try {
        const updatedCards = await translateFlashcards(flashcards, selectedLanguage);
        if (active) {
          setFlashcards(updatedCards);
        }
      } catch (err) {
        console.error("Autotranslate flashcards error:", err);
      }
    };

    const translateQuizOnLangChange = async () => {
      if (!currentQuiz) return;
      try {
        const updated = await translateQuiz(currentQuiz, selectedLanguage);
        if (active && updated) {
          setCurrentQuiz(updated);
        }
      } catch (err) {
        console.error("Autotranslate currentQuiz error:", err);
      }
    };

    const translateClozeQuizOnLangChange = async () => {
      if (!clozeQuiz) return;
      try {
        const updated = await translateClozeQuiz(clozeQuiz, selectedLanguage);
        if (active && updated) {
          setClozeQuiz(updated);
        }
      } catch (err) {
        console.error("Autotranslate clozeQuiz error:", err);
      }
    };

    const translateWeeklyLetterOnLangChange = async () => {
      if (!weeklyLetter) return;
      try {
        const updated = await translateWeeklyLetter(weeklyLetter, selectedLanguage);
        if (active && updated) {
          setWeeklyLetter(updated);
        }
      } catch (err) {
        console.error("Autotranslate weeklyLetter error:", err);
      }
    };

    const translateInsightsOnLangChange = async () => {
      if (!insights) return;
      try {
        const updated = await translateInsights(insights, selectedLanguage);
        if (active && updated) {
          setInsights(updated);
        }
      } catch (err) {
        console.error("Autotranslate insights error:", err);
      }
    };

    const translateKnowledgeGraphOnLangChange = async () => {
      if (!knowledgeGraph) return;
      try {
        const updated = await translateKnowledgeGraph(knowledgeGraph, selectedLanguage);
        if (active && updated) {
          setKnowledgeGraph(updated);
        }
      } catch (err) {
        console.error("Autotranslate knowledgeGraph error:", err);
      }
    };

    const translateActiveRecallReportOnLangChange = async () => {
      if (!activeRecallReport) return;
      try {
        const updated = await translateActiveRecallReport(activeRecallReport, selectedLanguage);
        if (active && updated) {
          setActiveRecallReport(updated);
        }
      } catch (err) {
        console.error("Autotranslate activeRecallReport error:", err);
      }
    };

    const runAllTranslationsSequentially = async () => {
      setIsTranslating(true);
      const pause = () => new Promise(resolve => setTimeout(resolve, 1000));
      try {
        await translateContentOnLangChange();
        await pause();
        await translateSummaryOnLangChange();
        await pause();
        await translateVisualOnLangChange();
        await pause();
        await translateSpeechOnLangChange();
        await pause();
        await translateChatOnLangChange();
        await pause();
        await translateAnnotationsOnLangChange();
        await pause();
        await translateFlashcardsOnLangChange();
        await pause();
        await translateQuizOnLangChange();
        await pause();
        await translateClozeQuizOnLangChange();
        await pause();
        await translateWeeklyLetterOnLangChange();
        await pause();
        await translateInsightsOnLangChange();
        await pause();
        await translateKnowledgeGraphOnLangChange();
        await pause();
        await translateActiveRecallReportOnLangChange();
      } catch (err) {
        console.error("Error during sequential translation:", err);
      } finally {
        if (active) {
          setIsTranslating(false);
        }
      }
    };

    runAllTranslationsSequentially();

    return () => {
      active = false;
    };
  }, [selectedLanguage]);

  // Progress tracking
  const [viewedAnnotations, setViewedAnnotations] = useState<Set<string>>(new Set());
  const [completedSections, setCompletedSections] = useState<Set<number>>(new Set());
  
  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const isAudioPausedRef = useRef(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pcmSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);

  // Synchronize playback speed with active audio sources
  useEffect(() => {
    pcmSourcesRef.current.forEach(source => {
      try {
        source.playbackRate.value = playbackSpeed;
      } catch (err) {
        // Source might have finished or hasn't started
      }
    });
    
    // For browser TTS (Web Speech API), we can't change speed mid-utterance easily
    // but the next utterance will pick up the new speed.
  }, [playbackSpeed]);

  // Web Audio Focus Synth Engine (Resolves dead links for focus sounds!)
  const focusSynthCtxRef = useRef<AudioContext | null>(null);
  const focusSynthNodesRef = useRef<{
    source: AudioBufferSourceNode | null;
    rainTimer?: any;
    windLfo?: OscillatorNode;
    gainNode: GainNode | null;
    activeNodes?: any[];
  } | null>(null);

  const cleanupFocusSynth = () => {
    if (focusSynthNodesRef.current) {
      const { source, rainTimer, windLfo, activeNodes, gainNode } = focusSynthNodesRef.current;
      if (gainNode) {
        try {
          const ctx = focusSynthCtxRef.current;
          if (ctx) {
            gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
          }
        } catch (e) {}
      }
      
      const s = source;
      const wl = windLfo;
      const an = activeNodes;
      setTimeout(() => {
        if (s) {
          try { s.stop(); } catch(e) {}
        }
        if (wl) {
          try { wl.stop(); } catch (e) {}
        }
        if (an) {
          an.forEach(node => {
            try { node.stop(); } catch (e) {}
          });
        }
      }, 160);

      if (rainTimer) {
        clearTimeout(rainTimer);
      }
      focusSynthNodesRef.current = null;
    }
  };

  // Dynamically control volume without re-triggering & rebuilding audio loops
  useEffect(() => {
    if (focusSynthNodesRef.current && focusSynthNodesRef.current.gainNode) {
      const ctx = focusSynthCtxRef.current;
      if (ctx) {
        focusSynthNodesRef.current.gainNode.gain.setValueAtTime(focusVolume, ctx.currentTime);
      } else {
        focusSynthNodesRef.current.gainNode.gain.value = focusVolume;
      }
    }
  }, [focusVolume]);

  useEffect(() => {
    if (!isFocusSoundPlaying || !activeFocusSound) {
      cleanupFocusSynth();
      return;
    }

    if (activeFocusSound.type === 'youtube') {
      cleanupFocusSynth();
      return;
    }

    let ctx = focusSynthCtxRef.current;
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      focusSynthCtxRef.current = ctx;
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    cleanupFocusSynth();

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(focusVolume || 0.001, ctx.currentTime + 0.15);
    gainNode.connect(ctx.destination);

    const soundId = activeFocusSound.id;
    let mainSource: AudioBufferSourceNode | null = null;
    let rainTimer: any = null;
    let windLfo: OscillatorNode | null = null;
    const activeNodesList: any[] = [];

    if (soundId === 'white' || soundId === 'rain' || soundId === 'forest' || soundId === 'cafe' || soundId === 'campfire') {
      if (soundId === 'white') {
        const pinkBuffer = createPinkNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = pinkBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, ctx.currentTime);

        const breezeOsc = ctx.createOscillator();
        breezeOsc.frequency.setValueAtTime(0.08, ctx.currentTime);

        const breezeGain = ctx.createGain();
        breezeGain.gain.setValueAtTime(600, ctx.currentTime);

        breezeOsc.connect(breezeGain);
        breezeGain.connect(filter.frequency);

        source.connect(filter);
        filter.connect(gainNode);

        try {
          breezeOsc.start(0);
          source.start(0);
        } catch (e) {}

        mainSource = source;
        windLfo = breezeOsc;
      }
      else if (soundId === 'rain') {
        const brownBuffer = createBrownNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = brownBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        source.connect(filter);
        filter.connect(gainNode);

        try {
          source.start(0);
        } catch (e) {}

        mainSource = source;

        const playRaindrop = () => {
          if (!ctx || ctx.state === 'closed' || !focusSynthNodesRef.current) return;

          const dropOsc = ctx.createOscillator();
          const dropGain = ctx.createGain();
          const dropFilter = ctx.createBiquadFilter();

          dropFilter.type = 'bandpass';
          dropFilter.frequency.value = 800 + Math.random() * 1200;
          dropFilter.Q.value = 5.0;

          dropOsc.type = 'sine';
          dropOsc.frequency.setValueAtTime(1200, ctx.currentTime);
          dropOsc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);

          dropGain.gain.setValueAtTime(0.008 + Math.random() * 0.015, ctx.currentTime);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

          dropOsc.connect(dropFilter);
          dropFilter.connect(dropGain);

          let lastNode: AudioNode = dropGain;
          try {
            if (ctx.createStereoPanner) {
              const panner = ctx.createStereoPanner();
              panner.pan.value = Math.random() * 2 - 1;
              dropGain.connect(panner);
              lastNode = panner;
            }
          } catch(e) {}

          lastNode.connect(gainNode);

          try {
            dropOsc.start();
            dropOsc.stop(ctx.currentTime + 0.06);
            activeNodesList.push(dropOsc);
          } catch (e) {}

          const nextInterval = 200 + Math.random() * 300;
          rainTimer = setTimeout(playRaindrop, nextInterval);
          if (focusSynthNodesRef.current) {
            focusSynthNodesRef.current.rainTimer = rainTimer;
          }
        };
        playRaindrop();
      }
      else if (soundId === 'forest') {
        const pinkBuffer = createPinkNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = pinkBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
        filter.Q.value = 1.5;

        const forestLfo = ctx.createOscillator();
        forestLfo.frequency.setValueAtTime(0.05, ctx.currentTime);
        const forestLfoGain = ctx.createGain();
        forestLfoGain.gain.setValueAtTime(400, ctx.currentTime);

        forestLfo.connect(forestLfoGain);
        forestLfoGain.connect(filter.frequency);

        source.connect(filter);
        filter.connect(gainNode);

        try {
          forestLfo.start(0);
          source.start(0);
        } catch (e) {}

        mainSource = source;
        windLfo = forestLfo;

        const playBirdChirp = () => {
          if (!ctx || ctx.state === 'closed' || !focusSynthNodesRef.current) return;

          const chirpsCount = 2 + Math.floor(Math.random() * 3);
          const t = ctx.currentTime;
          let birdPan = 0;
          try {
            birdPan = Math.random() * 2 - 1;
          } catch(e) {}

          for (let i = 0; i < chirpsCount; i++) {
            const osc = ctx.createOscillator();
            const chirpGain = ctx.createGain();
            const offset = i * 0.15;

            osc.type = 'sine';
            const startFreq = 2500 + Math.random() * 1000;
            osc.frequency.setValueAtTime(startFreq, t + offset);
            osc.frequency.exponentialRampToValueAtTime(startFreq + 1200, t + offset + 0.08);

            chirpGain.gain.setValueAtTime(0.0, t + offset);
            chirpGain.gain.linearRampToValueAtTime(0.04, t + offset + 0.02);
            chirpGain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.12);

            osc.connect(chirpGain);

            let lastNode: AudioNode = chirpGain;
            try {
              if (ctx.createStereoPanner) {
                const panner = ctx.createStereoPanner();
                panner.pan.value = birdPan;
                chirpGain.connect(panner);
                lastNode = panner;
              }
            } catch(e) {}

            lastNode.connect(gainNode);

            try {
              osc.start(t + offset);
              osc.stop(t + offset + 0.13);
              activeNodesList.push(osc);
            } catch (e) {}
          }

          const nextChirp = 6000 + Math.random() * 8000;
          rainTimer = setTimeout(playBirdChirp, nextChirp);
          if (focusSynthNodesRef.current) {
            focusSynthNodesRef.current.rainTimer = rainTimer;
          }
        };
        rainTimer = setTimeout(playBirdChirp, 2000);
      }
      else if (soundId === 'cafe') {
        const pinkBuffer = createPinkNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = pinkBuffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(180, ctx.currentTime);
        filter.Q.setValueAtTime(1.0, ctx.currentTime);

        source.connect(filter);
        filter.connect(gainNode);

        try {
          source.start(0);
        } catch (e) {}

        mainSource = source;

        const playCafesounds = () => {
          if (!ctx || ctx.state === 'closed' || !focusSynthNodesRef.current) return;

          const clinkOsc = ctx.createOscillator();
          const clinkGain = ctx.createGain();
          const clinkFilter = ctx.createBiquadFilter();

          clinkFilter.type = 'peaking';
          clinkFilter.frequency.value = 2500 + Math.random() * 1500;
          clinkFilter.Q.value = 10.0;

          clinkOsc.type = 'sine';
          clinkOsc.frequency.setValueAtTime(clinkFilter.frequency.value, ctx.currentTime);

          clinkGain.gain.setValueAtTime(0.002 + Math.random() * 0.004, ctx.currentTime);
          clinkGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

          clinkOsc.connect(clinkFilter);
          clinkFilter.connect(clinkGain);

          let lastNode: AudioNode = clinkGain;
          try {
            if (ctx.createStereoPanner) {
              const panner = ctx.createStereoPanner();
              panner.pan.value = Math.random() * 1.6 - 0.8;
              clinkGain.connect(panner);
              lastNode = panner;
            }
          } catch(e) {}

          lastNode.connect(gainNode);

          try {
            clinkOsc.start();
            clinkOsc.stop(ctx.currentTime + 0.18);
            activeNodesList.push(clinkOsc);
          } catch (e) {}

          const nextSound = 1500 + Math.random() * 3000;
          rainTimer = setTimeout(playCafesounds, nextSound);
          if (focusSynthNodesRef.current) {
            focusSynthNodesRef.current.rainTimer = rainTimer;
          }
        };
        playCafesounds();
      }
      else if (soundId === 'campfire') {
        const brownBuffer = createBrownNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = brownBuffer;
        source.loop = true;

        const rumbleFilter = ctx.createBiquadFilter();
        rumbleFilter.type = 'lowpass';
        rumbleFilter.frequency.setValueAtTime(150, ctx.currentTime);

        source.connect(rumbleFilter);
        rumbleFilter.connect(gainNode);

        try {
          source.start(0);
        } catch (e) {}

        mainSource = source;

        const playCrackles = () => {
          if (!ctx || ctx.state === 'closed' || !focusSynthNodesRef.current) return;

          const popOsc = ctx.createOscillator();
          const popGain = ctx.createGain();
          const popFilter = ctx.createBiquadFilter();

          popFilter.type = 'bandpass';
          popFilter.frequency.setValueAtTime(1500 + Math.random() * 3000, ctx.currentTime);
          popFilter.Q.setValueAtTime(10.0, ctx.currentTime);

          popOsc.type = 'triangle';
          popOsc.frequency.setValueAtTime(2500 + Math.random() * 2000, ctx.currentTime);
          popOsc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.015);

          const crackleGainVal = 0.03 + Math.random() * 0.06;
          popGain.gain.setValueAtTime(crackleGainVal, ctx.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.018);

          popOsc.connect(popFilter);
          popFilter.connect(popGain);
          popGain.connect(gainNode);

          try {
            popOsc.start();
            popOsc.stop(ctx.currentTime + 0.02);
            activeNodesList.push(popOsc);
          } catch (e) {}

          const nextSound = 150 + Math.random() * 450;
          rainTimer = setTimeout(playCrackles, nextSound);
          if (focusSynthNodesRef.current) {
            focusSynthNodesRef.current.rainTimer = rainTimer;
          }
        };
        playCrackles();
      }
    }

    focusSynthNodesRef.current = {
      source: mainSource,
      rainTimer,
      windLfo,
      gainNode,
      activeNodes: activeNodesList
    };

    return () => {
      cleanupFocusSynth();
    };
  }, [isFocusSoundPlaying, activeFocusSound]);

  // Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Flashcards & Advanced AI Features State
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    const saved = localStorage.getItem('study_flashcards');
    return saved ? JSON.parse(saved) : [];
  });
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  useEffect(() => {
    localStorage.setItem('study_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const [mistakeQuestions, setMistakeQuestions] = useState<MistakeQuestion[]>(() => {
    const saved = localStorage.getItem('study_mistake_questions');
    return saved ? JSON.parse(saved) : [];
  });
  const [loadingMistakeFeedbackId, setLoadingMistakeFeedbackId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('study_mistake_questions', JSON.stringify(mistakeQuestions));
    
    if (currentUser && isFirstLoadDone.current) {
      const syncMistakes = async () => {
        for (const item of mistakeQuestions) {
          try {
            await setDoc(doc(db, 'users', currentUser.uid, 'mistakes', item.id), item);
          } catch (e) {
            console.error("Failed to sync mistake question:", e);
          }
        }
      };
      syncMistakes();
    }
  }, [mistakeQuestions, currentUser]);

  // AI Tutor Persona State
  const [tutorPersona, setTutorPersona] = useState<'cherry' | 'tiger' | 'socrates' | 'teo'>(() => {
    return (localStorage.getItem('study_tutor_persona') as any) || 'cherry';
  });

  useEffect(() => {
    localStorage.setItem('study_tutor_persona', tutorPersona);
  }, [tutorPersona]);

  // Study Goal Tracker & Streak States
  const [studyGoals, setStudyGoals] = useState<any[]>(() => {
    const saved = localStorage.getItem('study_daily_goals');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'g_time', title: '⏱️ 총 20분 이상 집중 학습하기', target: 20, current: 0, type: 'time', completed: false },
      { id: 'g_quiz', title: '✍️ 성취도 평가 퀴즈 3회 이상 풀기', target: 3, current: 0, type: 'quiz', completed: false },
      { id: 'g_flashcard', title: '🎴 스마트 플래시카드 5회 이상 숙달', target: 5, current: 0, type: 'flashcard', completed: false },
      { id: 'g_graph', title: '🕸️ 지식 공간에서 단어 노드/브릿지 만들기', target: 1, current: 0, type: 'graph', completed: false }
    ];
  });

  const [customGoalInput, setCustomGoalInput] = useState('');
  const [goalStreak, setGoalStreak] = useState<number>(() => {
    return Number(localStorage.getItem('study_goal_streak_count') || '0');
  });
  const [lastGoalCompletionDate, setLastGoalCompletionDate] = useState<string>(() => {
    return localStorage.getItem('study_last_goal_completion_date') || '';
  });

  // Mistake Archive Filters & Challenge States
  const [mistakeSearchQuery, setMistakeSearchQuery] = useState('');
  const [mistakeFilter, setMistakeFilter] = useState<'all' | 'review' | 'mastered'>('all');
  const [activeResolveChallengeId, setActiveResolveChallengeId] = useState<string | null>(null);
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<string | null>(null);
  const [challengeFeedback, setChallengeFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Sync Daily Goals with Local Storage
  useEffect(() => {
    localStorage.setItem('study_daily_goals', JSON.stringify(studyGoals));
  }, [studyGoals]);

  // Auto increment Streak when all goals are completed
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const allDone = studyGoals.length > 0 && studyGoals.every(g => g.completed);
    if (allDone && lastGoalCompletionDate !== todayStr) {
      setGoalStreak(prev => {
        const next = prev + 1;
        localStorage.setItem('study_goal_streak_count', String(next));
        return next;
      });
      setLastGoalCompletionDate(todayStr);
      localStorage.setItem('study_last_goal_completion_date', todayStr);
    }
  }, [studyGoals, lastGoalCompletionDate]);

  // Auto-Update timer goal on elapsed stopwatch time
  useEffect(() => {
    const roundedMins = Math.floor(secondsElapsed / 60);
    if (roundedMins > 0) {
      setStudyGoals(prev => prev.map(goal => {
        if (goal.type === 'time') {
          const newCurrent = Math.min(goal.target, roundedMins);
          return { ...goal, current: newCurrent, completed: newCurrent >= goal.target };
        }
        return goal;
      }));
    }
  }, [secondsElapsed]);

  const [quizAnsweredCount, setQuizAnsweredCount] = useState<number>(() => {
    return Number(localStorage.getItem('study_quiz_answered_count') || '0');
  });
  const [quizCorrectCount, setQuizCorrectCount] = useState<number>(() => {
    return Number(localStorage.getItem('study_quiz_correct_count') || '0');
  });

  useEffect(() => {
    localStorage.setItem('study_quiz_answered_count', String(quizAnsweredCount));
  }, [quizAnsweredCount]);

  useEffect(() => {
    localStorage.setItem('study_quiz_correct_count', String(quizCorrectCount));
  }, [quizCorrectCount]);

  const [weeklyLetter, setWeeklyLetter] = useState<WeeklyLetter | null>(() => {
    const saved = localStorage.getItem('study_weekly_letter');
    return saved ? JSON.parse(saved) : null;
  });
  const [isGeneratingWeeklyLetter, setIsGeneratingWeeklyLetter] = useState(false);
  const [showWeeklyLetterModal, setShowWeeklyLetterModal] = useState(false);

  useEffect(() => {
    if (weeklyLetter) {
      localStorage.setItem('study_weekly_letter', JSON.stringify(weeklyLetter));
    } else {
      localStorage.removeItem('study_weekly_letter');
    }
  }, [weeklyLetter]);

  const [quizSubTab, setQuizSubTab] = useState<'solve' | 'mistake'>('solve');

  const handleGenerateFlashcards = async () => {
    const contentToUse = translatedContent || fileContent;
    if (!contentToUse) return;
    setIsGeneratingFlashcards(true);
    try {
      const generated = await generateFlashcards(contentToUse, level, selectedLanguage);
      if (generated && generated.length > 0) {
        const formatted: Flashcard[] = generated.map((c: any, i: number) => ({
          id: `fc_${Date.now()}_${i}`,
          front: c.front,
          back: c.back,
          mastered: false
        }));
        setFlashcards(formatted);
        setCurrentCardIndex(0);
        setIsCardFlipped(false);
      }
    } catch (error) {
      console.error("Error generating flashcards", error);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleToggleMasteredCard = (cardId: string) => {
    setFlashcards(prev => {
      const nextCards = prev.map(c => c.id === cardId ? { ...c, mastered: !c.mastered, box: (!c.mastered ? 3 : 1) as 1 | 3 } : c);
      const isNowMastered = nextCards.find(c => c.id === cardId)?.mastered;
      if (isNowMastered) {
        setStudyGoals(goals => goals.map(goal => {
          if (goal.type === 'flashcard') {
            const newCurrent = Math.min(goal.target, goal.current + 1);
            return { ...goal, current: newCurrent, completed: newCurrent >= goal.target };
          }
          return goal;
        }));
      }
      return nextCards;
    });
  };

  const handleChangeLeitnerBox = (cardId: string, targetBox: 1 | 2 | 3) => {
    setFlashcards(prev => {
      const nextCards = prev.map(c => c.id === cardId ? { 
        ...c, 
        box: targetBox, 
        mastered: targetBox === 3 
      } : c);
      
      if (targetBox === 3) {
        setStudyGoals(goals => goals.map(goal => {
          if (goal.type === 'flashcard') {
            const newCurrent = Math.min(goal.target, goal.current + 1);
            return { ...goal, current: newCurrent, completed: newCurrent >= goal.target };
          }
          return goal;
        }));
      }
      return nextCards;
    });
  };

  const handleGetMistakeFeedback = async (mistakeId: string) => {
    const mistake = mistakeQuestions.find(m => m.id === mistakeId);
    if (!mistake) return;
    
    setLoadingMistakeFeedbackId(mistakeId);
    try {
      const feedback = await generateAIFeedbackForMistake(
        mistake.question,
        mistake.options,
        mistake.userAnswer,
        mistake.correctAnswer,
        translatedContent || fileContent,
        tutorPersona
      );
      setMistakeQuestions(prev => prev.map(m => m.id === mistakeId ? { ...m, aiFeedback: feedback } : m));
    } catch (error) {
      console.error("Error generating mistake feedback", error);
    } finally {
      setLoadingMistakeFeedbackId(null);
    }
  };

  const handleGenerateWeeklyLetter = async () => {
    setIsGeneratingWeeklyLetter(true);
    try {
      const stats = {
        totalStudyTimeSeconds: totalStudyTime + secondsElapsed,
        streakDays: getStudyStreak() || 1,
        sessionsCount: studyLogs.length || 1,
        quizAnswered: quizAnsweredCount,
        quizCorrect: quizCorrectCount,
        masteredWordsCount: viewedAnnotations.size,
        masteredCardsCount: flashcards.filter(c => c.mastered).length
      };
      
      const recentSummary = summary || fileContent?.substring(0, 1000) || "";
      
      const letter = await generateWeeklyLetter(
        stats,
        level,
        selectedLanguage,
        recentSummary
      );
      if (letter) {
        setWeeklyLetter(letter);
        setShowWeeklyLetterModal(true);
      }
    } catch (error) {
      console.error("Error generating weekly letter", error);
    } finally {
      setIsGeneratingWeeklyLetter(false);
    }
  };

  const deleteMistakeQuestion = async (id: string) => {
    setMistakeQuestions(prev => prev.filter(m => m.id !== id));
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'mistakes', id));
      } catch (e) {
        console.error("Failed to delete mistake question from Firestore:", e);
      }
    }
  };
  
  
  // Learning Support States
  const [insights, setInsights] = useState<StudyInsight | null>(null);
  const [copyrightReport, setCopyrightReport] = useState<CopyrightReport | null>(null);
  const [showCopyrightGuard, setShowCopyrightGuard] = useState(false);
  
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[selectedLanguage];

  // Helper to extract YouTube ID
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const focusSounds: FocusSound[] = [
    { id: 'white', name: t.whiteNoise, icon: 'Wind', url: '', type: 'synth' },
    { id: 'rain', name: t.rainSound, icon: 'CloudRain', url: '', type: 'synth' },
    { id: 'cafe', name: t.cafeSound, icon: 'Coffee', url: '', type: 'synth' },
    { id: 'forest', name: t.forestSound, icon: 'Trees', url: '', type: 'synth' },
    { id: 'campfire', name: t.campfireSound, icon: 'Flame', url: '', type: 'synth' },
  ];

  useEffect(() => {
    const ioFunc = (SocketIOClient as any).io || (SocketIOClient as any).default || SocketIOClient;
    const newSocket = typeof ioFunc === 'function' ? ioFunc() : null;
    if (newSocket) {
      setSocket(newSocket);
      
      newSocket.on("user-joined", (data: any) => {
        setRoomUsers(data.users);
      });

      newSocket.on("user-left", (data: any) => {
        setRoomUsers(data.users);
      });

      newSocket.on("room-history", (data: any) => {
        setRoomMessages(data);
      });

      newSocket.on("new-message", (data: any) => {
        setRoomMessages((prev: any) => [...prev, data]);
      });

      newSocket.on("user-audio-changed", (data: { username: string, isEnabled: boolean }) => {
        setUsersWithMic(prev => {
          const next = new Set(prev);
          if (data.isEnabled) next.add(data.username);
          else next.delete(data.username);
          return next;
        });
      });

      newSocket.on("user-video-changed", (data: { username: string, isEnabled: boolean }) => {
        setUsersWithVideo(prev => {
          const next = new Set(prev);
          if (data.isEnabled) next.add(data.username);
          else next.delete(data.username);
          return next;
        });
      });

      newSocket.on("user-hand-raised", (data: { username: string, isRaised: boolean }) => {
        setRaisedHands(prev => {
          const next = new Set(prev);
          if (data.isRaised) next.add(data.username);
          else next.delete(data.username);
          return next;
        });
      });

      newSocket.on("user-reacted", (data: { username: string, emoji: string, id: number }) => {
        setUserEmojiReactions(prev => ({
          ...prev,
          [data.username]: { emoji: data.emoji, id: data.id }
        }));
        
        setTimeout(() => {
          setUserEmojiReactions(prev => {
            const current = prev[data.username];
            if (current && current.id === data.id) {
              const next = { ...prev };
              delete next[data.username];
              return next;
            }
            return prev;
          });
        }, 3000);
      });

      newSocket.on("user-screen-shared", (data: { username: string, isSharing: boolean }) => {
        setUsersSharingScreen(prev => {
          const next = new Set(prev);
          if (data.isSharing) next.add(data.username);
          else next.delete(data.username);
          return next;
        });
      });
    }

    return () => {
      if (newSocket) newSocket.close();
    };
  }, []);

  const handleJoinRoom = () => {
    if (!roomId.trim() || !socket) return;
    const cleanRoomId = roomId.trim();
    const name = roomName.trim() || cleanRoomId;
    socket.emit("join-room", cleanRoomId, username);
    setIsJoinedRoom(true);
    if (!savedRooms.find(r => r.id === cleanRoomId)) {
      setSavedRooms(prev => [...prev, { id: cleanRoomId, name }]);
    }
  };

  const handleCreateRoom = () => {
    if (!socket) return;
    const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    const name = roomName.trim() || `${t.studyRoom} ${newRoomId}`;
    setRoomId(newRoomId);
    socket.emit("join-room", newRoomId, username);
    setIsJoinedRoom(true);
    setSavedRooms(prev => [...prev, { id: newRoomId, name }]);
  };

  const handleLeaveRoom = () => {
    if (socket && roomId) {
      socket.emit("leave-room", roomId, username);
    }
    
    // Stop any video/screen tracks
    if (collabVideoStream) {
      collabVideoStream.getTracks().forEach(track => track.stop());
    }
    setCollabVideoStream(null);
    setIsVideoChatEnabled(false);

    if (collabScreenStream) {
      collabScreenStream.getTracks().forEach(track => track.stop());
    }
    setCollabScreenStream(null);
    setIsCollabScreenSharing(false);

    setIsJoinedRoom(false);
    setRoomMessages([]);
    setRoomUsers([]);
  };

  const openZoomActiveModal = async () => {
    setIsZoomActiveModalOpen(true);
    // Auto Join default study room to make the experience instant
    const activeRoomId = roomId || "live-study-arena";
    if (!roomId) {
      setRoomId(activeRoomId);
    }
    if (socket && !isJoinedRoom) {
      socket.emit("join-room", activeRoomId, username);
      setIsJoinedRoom(true);
    }
    // Auto enable camera feed
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCollabVideoStream(stream);
      setIsVideoChatEnabled(true);
      setUsersWithVideo(prev => {
        const next = new Set(prev);
        next.add(username);
        return next;
      });
      if (socket) {
        socket.emit("toggle-video", activeRoomId, username, true);
      }
      setTimeout(() => {
        if (collabVideoRef.current) {
          collabVideoRef.current.srcObject = stream;
        }
        if (collabModalVideoRef.current) {
          collabModalVideoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      console.warn("Unable to access camera on modal open:", err);
    }
  };

  const closeZoomActiveModal = () => {
    setIsZoomActiveModalOpen(false);
    if (collabVideoStream) {
      collabVideoStream.getTracks().forEach(track => track.stop());
    }
    setCollabVideoStream(null);
    setIsVideoChatEnabled(false);
    if (socket && roomId) {
      socket.emit("toggle-video", roomId, username, false);
    }
  };

  const toggleVideoChat = async () => {
    if (isVideoChatEnabled) {
      if (collabVideoStream) {
        collabVideoStream.getTracks().forEach(track => track.stop());
      }
      setCollabVideoStream(null);
      setIsVideoChatEnabled(false);
      setUsersWithVideo(prev => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
      if (socket && roomId) {
        socket.emit("toggle-video", roomId, username, false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCollabVideoStream(stream);
        setIsVideoChatEnabled(true);
        setUsersWithVideo(prev => {
          const next = new Set(prev);
          next.add(username);
          return next;
        });
        if (socket && roomId) {
          socket.emit("toggle-video", roomId, username, true);
        }
        setTimeout(() => {
          if (collabVideoRef.current) {
            collabVideoRef.current.srcObject = stream;
          }
          if (collabModalVideoRef.current) {
            collabModalVideoRef.current.srcObject = stream;
          }
        }, 120);
      } catch (err) {
        console.error("Error accessing camera direct:", err);
      }
    }
  };

  const toggleCollabScreenShare = async () => {
    if (isCollabScreenSharing) {
      if (collabScreenStream) {
        collabScreenStream.getTracks().forEach(track => track.stop());
      }
      setCollabScreenStream(null);
      setIsCollabScreenSharing(false);
      setUsersSharingScreen(prev => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
      if (socket && roomId) {
        socket.emit("toggle-screen", roomId, username, false);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        setCollabScreenStream(stream);
        setIsCollabScreenSharing(true);
        setUsersSharingScreen(prev => {
          const next = new Set(prev);
          next.add(username);
          return next;
        });
        if (socket && roomId) {
          socket.emit("toggle-screen", roomId, username, true);
        }
        stream.getVideoTracks()[0].onended = () => {
          setIsCollabScreenSharing(false);
          setCollabScreenStream(null);
          setUsersSharingScreen(prev => {
            const next = new Set(prev);
            next.delete(username);
            return next;
          });
          if (socket && roomId) {
            socket.emit("toggle-screen", roomId, username, false);
          }
        };
        setTimeout(() => {
          if (collabScreenVideoRef.current) {
            collabScreenVideoRef.current.srcObject = stream;
          }
        }, 120);
      } catch (err) {
        console.error("Error starting screen capture:", err);
      }
    }
  };

  const raiseCollabHand = () => {
    const isCurrentlyRaised = raisedHands.has(username);
    const nextState = !isCurrentlyRaised;
    
    setRaisedHands(prev => {
      const next = new Set(prev);
      if (nextState) next.add(username);
      else next.delete(username);
      return next;
    });

    if (socket && roomId) {
      socket.emit("raise-hand", roomId, username, nextState);
    }
  };

  const sendCollabReaction = (emoji: string) => {
    const rId = Date.now();
    setUserEmojiReactions(prev => ({
      ...prev,
      [username]: { emoji, id: rId }
    }));

    if (socket && roomId) {
      socket.emit("send-reaction", roomId, username, emoji, rId);
    }

    setTimeout(() => {
      setUserEmojiReactions(prev => {
        const current = prev[username];
        if (current && current.id === rId) {
          const next = { ...prev };
          delete next[username];
          return next;
        }
        return prev;
      });
    }, 3000);
  };

  const removeSavedRoom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedRooms(prev => prev.filter(r => r.id !== id));
  };

  const handleSendRoomMessage = () => {
    if (!roomInput.trim()) return;
    const activeRoomId = roomId || "live-study-arena";
    const msg = {
      username,
      text: roomInput,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Always append locally so the user has immediate, smooth feedback even in offline or socket-less sandboxes
    setRoomMessages(prev => [...prev, msg]);
    setRoomInput('');

    if (socket && roomId) {
      socket.emit("send-message", activeRoomId, msg);
    } else {
      // If virtual study buddies are active, simulate high-quality interactive study responses!
      if (includeVirtualBuddies) {
        setTimeout(() => {
          const buddies = ["Emma", "Alex"];
          const selectedBuddy = buddies[Math.floor(Math.random() * buddies.length)];
          let replyText = "";
          
          if (selectedLanguage === 'Korean') {
            const replies = [
              "동의합니다! 그 부분의 인출 훈련(Active Recall)을 집중적으로 하면 점수가 훨씬 더 잘 나올 거예요! 🔥",
              "오, 저도 마침 그 핵심 개념(Key Concept)을 학습 노트에 정리하는 중이었는데, 통했네요! 💡",
              "어려운 부분이 있으면 부담 없이 여기서 서로 물어봐요! 줌 스터디하니까 확실히 더 몰입이 잘 되네요.",
              "이따가 뽀모도로 세션 끝나면 같이 에빙하우스 복사 주기에 맞춰 유사 변형 퀴즈 한 판 더 어때요? 📅",
              "좋은 의견이에요! 에마와 알렉스는 이미 이 세그먼트 분석을 끝마치고 영구 기억 연결망에 저장 완료했습니다! 🚀"
            ];
            replyText = replies[Math.floor(Math.random() * replies.length)];
          } else {
            const replies = [
              "Totally agree! Running dedicated active recall sessions on that exact concept will work wonders. 🔥",
              "Wow, I was just structuring that core concept on my Cornell side column as well. Perfect minds! 💡",
              "If you run into any conceptual blockages, let's debug them in this Zoom workspace. Dynamic study rocks!",
              "Once our current Pomodoro phase completes, let's take a Cloze Test break to calibrate our memory! 📅",
              "Excellent takeaway! I am mapping this detail to our central knowledge graph node as we speak. Let's pass this quiz!"
            ];
            replyText = replies[Math.floor(Math.random() * replies.length)];
          }
          
          setRoomMessages(prev => [...prev, {
            username: selectedBuddy,
            text: replyText,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }, 1200);
      }
    }
  };

  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioTotalTime, setAudioTotalTime] = useState(0);
  const audioStartTimeRef = useRef<number>(0);
  const [baseTimeOffset, setBaseTimeOffset] = useState(0);
  const [currentReadingText, setCurrentReadingText] = useState<string>('');
  const [charsPerSecond, setCharsPerSecond] = useState(15); // Average reading speed

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAudioPlaying && !isAudioPaused) {
      interval = setInterval(() => {
        setAudioCurrentTime(prev => {
          const nextVal = prev + 0.1 * playbackSpeed;
          return nextVal > audioTotalTime ? audioTotalTime : nextVal;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isAudioPlaying, isAudioPaused, playbackSpeed, audioTotalTime]);

  const handleSkipForward = () => {
    if (!currentReadingText) return;
    const newTime = Math.min(audioTotalTime, audioCurrentTime + 10);
    const charOffset = Math.floor(newTime * charsPerSecond * playbackSpeed);
    if (charOffset < currentReadingText.length) {
      setBaseTimeOffset(newTime);
      setAudioCurrentTime(newTime);
      handleTTS(currentReadingText.substring(charOffset), undefined, true);
    }
  };

  const handleSkipBackward = () => {
    if (!currentReadingText) return;
    const newTime = Math.max(0, audioCurrentTime - 10);
    const charOffset = Math.floor(newTime * charsPerSecond * playbackSpeed);
    setBaseTimeOffset(newTime);
    setAudioCurrentTime(newTime);
    handleTTS(currentReadingText.substring(charOffset), undefined, true);
  };

  const handlePauseResumeTTS = async () => {
    const isGeminiVoice = ['Aoide', 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(selectedVoice);

    if (isGeminiVoice && audioContextRef.current) {
      if (isAudioPaused) {
        await audioContextRef.current.resume();
        setIsAudioPaused(false);
        isAudioPausedRef.current = false;
      } else {
        await audioContextRef.current.suspend();
        setIsAudioPaused(true);
        isAudioPausedRef.current = true;
      }
    }

    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      if (isAudioPaused) {
        window.speechSynthesis.resume();
        setIsAudioPaused(false);
        isAudioPausedRef.current = false;
      } else {
        window.speechSynthesis.pause();
        setIsAudioPaused(true);
        isAudioPausedRef.current = true;
      }
    }
  };

  const getWeeklyData = () => {
    const days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
    return days.map(day => {
      const dayLogs = (studyLogs as StudySessionLog[]).filter(log => isSameDay(parseISO(log.date), day));
      const totalSeconds = dayLogs.reduce((acc, log) => acc + log.durationSeconds, 0);
      return {
        name: format(day, 'E'),
        fullDate: format(day, 'MM/dd'),
        minutes: Math.round(totalSeconds / 60),
        seconds: totalSeconds
      };
    });
  };

  const getStudyStreak = () => {
    if (studyLogs.length === 0) return 0;
    
    // Sort unique dates descending
    const sortedDates = Array.from(new Set((studyLogs as StudySessionLog[]).map(log => 
      format(startOfDay(parseISO(log.date)), 'yyyy-MM-dd')
    ))).sort().reverse();

    let streak = 0;
    let currentDate = startOfDay(new Date());

    // Check if studied today or yesterday to continue streak
    const lastStudyDate = parseISO(sortedDates[0]);
    if (differenceInDays(currentDate, lastStudyDate) > 1) return 0;

    for (let i = 0; i < sortedDates.length; i++) {
      const studyDate = parseISO(sortedDates[i]);
      if (i === 0) {
        streak = 1;
      } else {
        const prevDate = parseISO(sortedDates[i - 1]);
        if (differenceInDays(prevDate, studyDate) === 1) {
          streak++;
        } else {
          break;
        }
      }
    }
    return streak;
  };

  const averageSessionDuration = () => {
    if (studyLogs.length === 0) return 0;
    const total = studyLogs.reduce((acc, log) => acc + log.durationSeconds, 0);
    return Math.round(total / studyLogs.length / 60);
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (ttsAbortControllerRef.current) ttsAbortControllerRef.current.abort();
      pcmSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    };
  }, []);

  useEffect(() => {
    const handleWindowScroll = () => {
      setShowScrollBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Brand Favicon
  useEffect(() => {
    const link = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23FFD60A"/><text y=".9em" font-size="90">S</text></svg>';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  // Loading persisted study data
  useEffect(() => {
    const savedLogs = localStorage.getItem('studyo_logs');
    if (savedLogs) {
      setStudyLogs(JSON.parse(savedLogs));
    }
  }, []);

  const deleteStudyLog = (index: number) => {
    const updatedLogs = studyLogs.filter((_, i) => i !== index);
    setStudyLogs(updatedLogs);
    localStorage.setItem('studyo_logs', JSON.stringify(updatedLogs));
  };

  const recordStudyEntry = (fileName: string) => {
    const newLog: StudySessionLog = {
      date: new Date().toISOString(),
      durationSeconds: 0,
      level: level || 'elementary',
      fileName
    };
    const updatedLogs = [...studyLogs, newLog];
    setStudyLogs(updatedLogs);
    localStorage.setItem('studyo_logs', JSON.stringify(updatedLogs));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveStudyLog = () => {
    if (secondsElapsed === 0) return;
    
    const newLog: StudySessionLog = {
      date: new Date().toISOString(),
      durationSeconds: secondsElapsed,
      level: level || 'elementary',
      fileName: audioFileName || 'Study Session'
    };
    
    const updatedLogs = [...studyLogs, newLog];
    setStudyLogs(updatedLogs);
    localStorage.setItem('studyo_logs', JSON.stringify(updatedLogs));
    
    setSecondsElapsed(0);
    setIsTimerActive(false);
  };

  const handleResetTimer = () => {
    setSecondsElapsed(0);
    setIsTimerActive(false);
  };

  const handleLevelSelect = (lvl: EducationLevel) => {
    setLevel(lvl);
  };

  const handleActiveRecallAnalysis = async () => {
    if (!activeRecallInput.trim() || !fileContent) return;
    setIsAnalyzingActiveRecall(true);
    try {
      const report = await analyzeActiveRecall(fileContent, activeRecallInput, level || 'elementary', selectedLanguage);
      setActiveRecallReport(report);
    } catch (err) {
      console.error("Error analyzing active recall:", err);
    } finally {
      setIsAnalyzingActiveRecall(false);
    }
  };

  const handleInjectRecallFlashcards = () => {
    if (!activeRecallReport || activeRecallReport.missedPoints.length === 0) return;
    
    const newCards: Flashcard[] = activeRecallReport.missedPoints.map((point, index) => ({
      id: `recall_auto_${Date.now()}_${index}`,
      front: selectedLanguage === 'Korean' ? `완벽 자가 인출: 복습 각인 (${index + 1})` : `Recall Mastery: Study Frame (${index + 1})`,
      back: point,
      mastered: false
    }));

    setFlashcards(prev => {
      const updated = [...newCards, ...prev];
      localStorage.setItem('study_flashcards', JSON.stringify(updated));
      return updated;
    });

    alert(selectedLanguage === 'Korean' 
      ? `🎉 인출에 누락된 핵심 개념 ${newCards.length}개가 암기 플래시카드(Memorizer)에 즉시 연계 각인되었습니다!` 
      : `🎉 ${newCards.length} missing high-yield points have been instantly mapped to your flashcards!`);
  };

  // 📅 Ebbinghaus Spaced Repetitive Tracker Handlers
  const handleAddEbbinghausItem = (title: string, type: 'material' | 'quiz' | 'flashcard' | 'recall') => {
    if (!title.trim()) return;
    const now = new Date();
    const newItem = {
      id: `eb_${Date.now()}`,
      title: title.trim(),
      type,
      originalDate: now.toISOString(),
      nextReviewDate: now.toISOString(), // Due immediately when added
      stage: 0,
      history: [],
      completed: false
    };
    setEbbinghausItems(prev => [newItem, ...prev]);
  };

  const handleReviewEbbinghausItem = (itemId: string) => {
    const intervals = [1, 3, 7, 14, 30]; // Days for spaced repetition
    setEbbinghausItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const currentStage = item.stage;
      const now = new Date();
      const updatedHistory = [...(item.history || []), { reviewDate: now.toISOString(), stage: currentStage }];
      
      if (currentStage >= intervals.length) {
        // Fully mastered!
        return {
          ...item,
          stage: currentStage + 1,
          history: updatedHistory,
          completed: true,
          nextReviewDate: ''
        };
      } else {
        const nextIntervalDays = intervals[currentStage];
        const nextDate = new Date();
        nextDate.setDate(now.getDate() + nextIntervalDays);
        return {
          ...item,
          stage: currentStage + 1,
          history: updatedHistory,
          nextReviewDate: nextDate.toISOString()
        };
      }
    }));
  };

  const handleDeleteEbbinghausItem = async (itemId: string) => {
    setEbbinghausItems(prev => prev.filter(item => item.id !== itemId));
    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'ebbinghaus', itemId));
      } catch (e) {
        console.error("Failed to delete ebbinghaus item from Firestore:", e);
      }
    }
  };

  const getHeatmapDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      const log = studyLogs.find(l => l.date === dateString);
      const studyMinutes = log ? Math.round(log.durationSeconds / 60) : 0;
      
      days.push({
        date: dateString,
        studyMinutes,
        displayDate: d.toLocaleDateString(selectedLanguage === 'Korean' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }),
        dayOfWeek: d.toLocaleDateString(selectedLanguage === 'Korean' ? 'ko-KR' : 'en-US', { weekday: 'short' }),
      });
    }
    return days;
  };

  const getHeatmapStreak = () => {
    let streak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const studiedToday = studyLogs.some(l => l.date === todayStr && l.durationSeconds > 0);
    const studiedYesterday = studyLogs.some(l => l.date === yesterdayStr && l.durationSeconds > 0);
    
    if (!studiedToday && !studiedYesterday) return 0;
    
    let checkDate = new Date();
    if (!studiedToday && studiedYesterday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (true) {
      const testStr = checkDate.toISOString().split('T')[0];
      const found = studyLogs.some(l => l.date === testStr && l.durationSeconds > 0);
      if (found) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  // 📝 Metacognitive Mistake Variant Quiz Handlers
  const handleGenerateVariant = async (mistake: MistakeQuestion) => {
    setIsGeneratingVariant(true);
    setVariantFeedback(null);
    setVariantUserAnswer('');
    setActiveMistakeForVariant(mistake);
    try {
      const result = await generateVariantQuestion(
        mistake.question,
        mistake.correctAnswer,
        mistake.aiFeedback || mistake.userNotes || "Explain why the answer is correct.",
        level || 'elementary',
        selectedLanguage
      );
      if (result) {
        setActiveVariantQuestion(result);
      } else {
        alert(selectedLanguage === 'Korean' ? "AI 유사 변형 문제 생성에 실패했습니다." : "Failed to generate AI variant quiz.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingVariant(false);
    }
  };

  const handleSolveVariant = (selectedAnswer: string) => {
    if (!activeVariantQuestion) return;
    setVariantUserAnswer(selectedAnswer);
    setIsSolvingVariant(true);

    const isCorrect = selectedAnswer === activeVariantQuestion.correctAnswer;
    
    // Create an elegant feedback string
    if (isCorrect) {
      setVariantFeedback(selectedLanguage === 'Korean' 
        ? `🔥 정답입니다! 🎉\n정답 부합: "${activeVariantQuestion.correctAnswer}"\n\n${activeVariantQuestion.explanation}\n\n사용자께서 원래 가졌던 오개념을 이 변형 시나리오에서 성공적으로 극복(Breakthrough)하셨습니다!`
        : `🔥 Correct Answer! 🎉\nMatching choice: "${activeVariantQuestion.correctAnswer}"\n\n${activeVariantQuestion.explanation}\n\nSuccess! You've broken through your initial misconception in this newly simulated scenario.`
      );
    } else {
      setVariantFeedback(selectedLanguage === 'Korean'
        ? `❌ 아쉽게도 오답입니다.\n선택한 답: "${selectedAnswer}"\n\n${activeVariantQuestion.explanation}\n\n원래 문제에서의 오개념이 아직 조금 남아있을 수 있습니다. 설명을 정독하시고 다시 한 번 개념의 흐름을 곱씹어 보세요.`
        : `❌ Incorrect Answer.\nYour Choice: "${selectedAnswer}"\n\n${activeVariantQuestion.explanation}\n\nLooks like there are still residual gaps. Review the explanation details carefully on the left concept pane and absorb the feedback.`
      );
    }
    setIsSolvingVariant(false);
  };

  // ✍️ Cornell Notes & AI Cues Handlers
  const handleTriggerCornellCues = async () => {
    if (!cornellNotes.trim()) {
      alert(selectedLanguage === 'Korean' ? "작성된 필기 내용이 없습니다! 먼저 노트를 입력해 주세요." : "Notes are empty! Please enter notes before generating AI cues.");
      return;
    }
    setIsGeneratingCornellCues(true);
    try {
      const cues = await generateCornellCues(cornellNotes, fileContent || summary || "", level || 'high', selectedLanguage);
      setCornellCues(cues);
      setExpandedCornellCueIdx(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCornellCues(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsProcessing(true);
    setProcessingStage('extracting');
    setSummary('');
    setTranslatedContent('');
    setVisualDescription('');
    setAnnotations([]);
    setShowEncodingWarning(false);

    const isTextFile = file.type === 'text/plain' || 
                      file.name.endsWith('.txt') || 
                      file.name.endsWith('.md');

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target?.result as ArrayBuffer;
        
        // Try to decode with UTF-8 first, then fallback
        const decoder = new TextDecoder('utf-8', { fatal: true });
        let content = '';
        try {
          content = decoder.decode(new Uint8Array(buffer));
        } catch (e) {
          // Fallback to EUC-KR or another if encoding fails
          const fallbackDecoder = new TextDecoder('euc-kr');
          content = fallbackDecoder.decode(new Uint8Array(buffer));
          setShowEncodingWarning(true);
        }

        setFileContent(content || '');
        setIsProcessing(false);
        
        if (level && content) {
          setProcessingStage('analyzing');
          
          // These can potentially finish at different times
          const annotationsPromise = processDocument(content, level, selectedLanguage).then(res => {
            setAnnotations(res);
            return res;
          });

          const insightsPromise = generateStudyInsights(content, level, selectedLanguage).then(res => {
            setInsights(res);
            return res;
          });

          const copyrightPromise = analyzeCopyright(content, selectedLanguage).then(res => {
            setCopyrightReport(res);
            return res;
          });

          // Summary is often what users want first
          setProcessingStage('summarizing');
          const sumData = await summarizeDocument(content, level, selectedLanguage);
          setSummaryData(sumData);
          if (sumData) {
            recordStudyEntry(file.name);
          }
          await Promise.all([annotationsPromise, insightsPromise, copyrightPromise]);
        }
        
        setProcessingStage(null);
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          setIsProcessing(false);
          setProcessingStage(null);
          return;
        }
        const base64 = dataUrl.split(',')[1];
        const extractedText = await extractTextFromFile(base64, file.type || 'application/pdf');
        
        if (extractedText && extractedText.trim().length > 0) {
          setFileContent(extractedText);
          setIsProcessing(false);
          
          if (level) {
            setProcessingStage('analyzing');
            
            const annotationsPromise = processDocument(extractedText, level, selectedLanguage).then(res => {
              setAnnotations(res);
              return res;
            });

            const insightsPromise = generateStudyInsights(extractedText, level, selectedLanguage).then(res => {
              setInsights(res);
              return res;
            });

            const copyrightPromise = analyzeCopyright(extractedText, selectedLanguage).then(res => {
              setCopyrightReport(res);
              return res;
            });

            setProcessingStage('summarizing');
            const sumData = await summarizeDocument(extractedText, level, selectedLanguage);
            setSummaryData(sumData);
            if (sumData) {
              recordStudyEntry(file.name);
            }
            await Promise.all([annotationsPromise, insightsPromise, copyrightPromise]);
          }
        } else {
          alert(translations[selectedLanguage].noContent);
        }
        setProcessingStage(null);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsProcessing(true);
    
    try {
      let extractedText = '';
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        extractedText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const buffer = event.target?.result as ArrayBuffer;
            const decoder = new TextDecoder('utf-8');
            resolve(decoder.decode(new Uint8Array(buffer)));
          };
          reader.readAsArrayBuffer(file);
        });
      } else {
        extractedText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            const text = await extractTextFromFile(base64, file.type || 'application/pdf');
            resolve(text);
          };
          reader.readAsDataURL(file);
        });
      }

      if (extractedText && extractedText.trim().length > 0) {
        setFileContent(extractedText);
        setAudioFileName(file.name);
        handleTTS(extractedText);
      }
    } catch (err) {
      console.error('Audio file upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowCamera(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsScanning(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    // Stop camera
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    setShowCamera(false);

    setIsProcessing(true);
    setSummary('');
    setTranslatedContent('');
    setVisualDescription('');
    setAnnotations([]);

    const extractedText = await ocrFromImage(base64Image);
    if (extractedText) {
      setFileContent(extractedText);
      setSummary('');
      if (level) {
        setProcessingStage('analyzing');
        
        const annotationsPromise = processDocument(extractedText, level, selectedLanguage).then(res => {
          setAnnotations(res);
          return res;
        });

        const insightsPromise = generateStudyInsights(extractedText, level, selectedLanguage).then(res => {
          setInsights(res);
          return res;
        });

        const copyrightPromise = analyzeCopyright(extractedText, selectedLanguage).then(res => {
          setCopyrightReport(res);
          return res;
        });

        setProcessingStage('summarizing');
        const sData = await summarizeDocument(extractedText, level, selectedLanguage);
        setSummaryData(sData);
        setSummary(sData.simple);

        await Promise.all([annotationsPromise, insightsPromise, copyrightPromise]);
      }
    }
    setProcessingStage(null);
    setIsScanning(false);
    setIsProcessing(false);
  };

  const handleSummarize = async () => {
    if (!fileContent || !level) return;
    setIsProcessing(true);
    setProcessingStage('summarizing');
    const result = await summarizeDocument(fileContent, level, selectedLanguage);
    setSummaryData(result);
    setSummary(summaryMode === 'simple' ? result.simple : result.standard);
    setIsProcessing(false);
    setProcessingStage(null);
  };

  const handleGenerateLecture = async () => {
    if (!fileContent || !level) return;
    setIsGeneratingLecture(true);
    const script = await generateLectureScript(fileContent, level, selectedLanguage);
    setLectureScript(script);
    setIsGeneratingLecture(false);
    
    if (script) {
      // Automatically play the lecture if generated
      let fullText = `${script.title}. ${script.introduction}. `;
      script.points.forEach(p => {
        fullText += `${p.topic}. ${p.explanation}. `;
      });
      fullText += script.conclusion;
      handleTTS(fullText);
    }
  };

  const handleDescribeVisuals = async () => {
    if (!fileContent) return;
    setIsProcessing(true);
    const result = await describeVisuals(fileContent, selectedLanguage);
    setVisualDescription(result);
    setIsProcessing(false);
  };

  const handleTranslate = async () => {
    if (!fileContent) return;
    setIsTranslating(true);
    const result = await translateText(fileContent, selectedLanguage);
    setTranslatedContent(result);
    setIsTranslating(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    let modelResponse = '';
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    try {
      const stream = chatWithAI(inputText, messages, fileContent);
      for await (const chunk of stream) {
        modelResponse += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = modelResponse;
          return newMsgs;
        });
      }
    } catch (err) {
      console.error("Chat error:", err);
    }
  };

  const toggleVoiceChat = () => {
    const newState = !isVoiceChatEnabled;
    setIsVoiceChatEnabled(newState);
    if (socket && roomId) {
      socket.emit("toggle-audio", roomId, username, newState);
    }
  };

  const deleteAudioHistory = (id: string) => {
    setAudioHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleGeminiTTS = async (text: string, voice?: string, lang?: string) => {
    setIsGeneratingTTS(true);
    
    // Create new abort controller
    const controller = new AbortController();
    ttsAbortControllerRef.current = controller;

    try {
      let audioCtx = audioContextRef.current;
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;
      }
      
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      audioStartTimeRef.current = audioCtx.currentTime;
      nextStartTimeRef.current = audioCtx.currentTime + 0.05;
      setIsAudioPlaying(true);
      setIsAudioPaused(false);

      let isStreamActive = true;
      const voiceToUse = voice || selectedVoice;
      const langToUse = lang || selectedLanguage;
      const stream = textToSpeechStream(text, voiceToUse, langToUse);
      let chunkCount = 0;

      for await (const audioData of stream) {
        if (controller.signal.aborted) break;
        if (!audioData) continue;
        
        // Wait if paused (using Ref for reliable check in async loop)
        while (isAudioPausedRef.current && !controller.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        chunkCount++;

        try {
          const binaryString = atob(audioData);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const alignedLen = len - (len % 2);
          const alignedBytes = bytes.slice(0, alignedLen);
          const pcm16 = new Int16Array(alignedBytes.buffer);
          const float32Data = new Float32Array(pcm16.length);
          for (let i = 0; i < pcm16.length; i++) {
            float32Data[i] = pcm16[i] / 32768.0;
          }

          const buffer = audioCtx.createBuffer(1, float32Data.length, 24000);
          buffer.getChannelData(0).set(float32Data);

          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.playbackRate.value = playbackSpeed;
          
          const playTime = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
          source.start(playTime);
          nextStartTimeRef.current = playTime + (buffer.duration / playbackSpeed);

          pcmSourcesRef.current.push(source);

          source.onended = () => {
            pcmSourcesRef.current = pcmSourcesRef.current.filter(s => s !== source);
            if (pcmSourcesRef.current.length === 0 && !isStreamActive) {
              setIsAudioPlaying(false);
            }
          };
        } catch (err) {
          console.error("Chunk playback error:", err);
          if (controller.signal.aborted) break;
        }
      }

      isStreamActive = false;
      if (pcmSourcesRef.current.length === 0) {
        setIsAudioPlaying(false);
      }

      if (chunkCount === 0 && !controller.signal.aborted) {
        setIsAudioPlaying(false);
        handleBrowserTTS(text);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log("TTS Stream aborted");
      } else {
        console.error("TTS streaming error:", err);
        handleBrowserTTS(text);
      }
    } finally {
      setIsGeneratingTTS(false);
      if (ttsAbortControllerRef.current === controller) {
        ttsAbortControllerRef.current = null;
      }
    }
  };

  const handleBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.substring(0, 1000));
      utterance.lang = selectedLanguage === 'Korean' ? 'ko-KR' : 
                     selectedLanguage === 'English' ? 'en-US' :
                     selectedLanguage === 'Japanese' ? 'ja-JP' : 'zh-CN';
      
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.name === selectedVoice);
      if (!voice) {
        const langCode = selectedLanguage === 'Korean' ? 'ko' : 
                         selectedLanguage === 'English' ? 'en' :
                         selectedLanguage === 'Japanese' ? 'ja' : 'zh';
        voice = voices.find(v => v.lang.startsWith(langCode) && v.localService) ||
                voices.find(v => v.lang.startsWith(langCode));
      }
      if (voice) utterance.voice = voice;
      
      utterance.rate = playbackSpeed;
      utterance.onstart = () => {
        audioStartTimeRef.current = performance.now() / 1000;
        setIsAudioPlaying(true);
        setIsAudioPaused(false);
      };
      utterance.onend = () => {
        setIsAudioPlaying(false);
        setIsAudioPaused(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsAudioPlaying(false);
    }
  };

  const getSocraticEnhancedText = (text: string) => {
    if (annotations.length === 0) return text;
    // Split sentences using a simple regex but preserve separators
    const sentences = text.split(/([.!?]\s+)/);
    let enhanced = '';
    let matchedCount = 0;
    const usedWords = new Set<string>();

    for (let i = 0; i < sentences.length; i++) {
      const s = sentences[i];
      enhanced += s;
      
      // If the sentence is not empty and we haven't matched too many items
      if (s && s.trim() && matchedCount < 4) {
        const foundAnn = annotations.find(ann => 
          !usedWords.has(ann.word.toLowerCase()) && 
          s.toLowerCase().includes(ann.word.toLowerCase())
        );
        
        if (foundAnn) {
          usedWords.add(foundAnn.word.toLowerCase());
          matchedCount++;
          
          if (selectedLanguage === 'Korean') {
            enhanced += `\n\n[💡 가학적 두뇌 자극: 소크라테스 발문] 잠시 가던 길을 멈추고 생각해보세요! 방금 배운 중요 용어인 "${foundAnn.word}"의 정확한 속뜻은 학술적으로 무엇이었나요? 머릿속으로 3초간 직접 답을 인출하여 회상해 보세요... (3초 소크라테스 명상 딜레이) ...\n네, "${foundAnn.word}"의 핵심 학술 정의는 다음과 같습니다: "${foundAnn.definition}". 당신이 떠올린 기억과 정확히 도킹했는지 확인해 보세요! 자, 다음 구절로 이어서 진행합니다.\n\n`;
          } else if (selectedLanguage === 'Japanese') {
            enhanced += `\n\n[💡 リアルタイム・ソクラテス問いかけ] ここで一時思考停止！先ほど出てきた最重要キーワード「${foundAnn.word}」の本来の学術的定義は何だったでしょうか？3秒間で脳内からアクティブ・リコールして取り出してみましょう。... (3秒の瞑想ディレイ) ...\nはい、「${foundAnn.word}」の定義は、「${foundAnn.definition}」です。あなたの脳内定義とマージできたか点検してください。では、朗読を再開します。\n\n`;
          } else if (selectedLanguage === 'Chinese') {
            enhanced += `\n\n[💡 苏格拉底互动思考] 稍作停顿！刚刚句中出现的重点学术词汇 “${foundAnn.word}” 究竟代表什么核心定义？请主动在大脑中调取回想3秒钟... (3秒思考间歇) ...\n是的，“${foundAnn.word}” 的标准定义是：“${foundAnn.definition}”。请核对该定义是否与您刚刚检索出的记忆完美契合！接下来继续为您朗读。\n\n`;
          } else {
            enhanced += `\n\n[💡 Socratic Metacognitive Pause] Critical thinking break! Reflect on the core definition of the high-yielding term "${foundAnn.word}". Try to actively retrieve it right now ... (3 seconds pause) ...\nGreat! The scientific definition of "${foundAnn.word}" is: "${foundAnn.definition}". Verify if your retrieved engram matches this exactly! Resuming the reading now.\n\n`;
          }
        }
      }
    }
    return enhanced;
  };

  const handleTTS = async (text: string, annotationId?: string, isSkip: boolean = false, overrideVoice?: string, overrideLanguage?: Language) => {
    if (!text) return;
    
    // Progress tracking: Mark word as viewed if it's an annotation
    if (annotationId) {
      setViewedAnnotations(prev => new Set(prev).add(annotationId));
    }

    // Intercept with Socratic Mode if active and it's full material
    const textToRead = (isSocraticAudio && !annotationId) ? getSocraticEnhancedText(text) : text;

    // Toggle behavior: If already playing, handle pause or stop
    // UNLESS it's a skip command, which needs to stop and restart immediately
    if (!isSkip && (isAudioPlaying || isGeneratingTTS || isAudioPaused)) {
      if (annotationId) {
        handlePauseResumeTTS();
        return;
      }

      // Immediate cancellation
      if (ttsAbortControllerRef.current) {
        ttsAbortControllerRef.current.abort();
        ttsAbortControllerRef.current = null;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      pcmSourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      pcmSourcesRef.current = [];
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      setIsAudioPaused(false);
      setIsGeneratingTTS(false);
      return;
    }

    if (isSkip) {
      // For skips, cancel previous without returning
      if (ttsAbortControllerRef.current) ttsAbortControllerRef.current.abort();
      pcmSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
      pcmSourcesRef.current = [];
      window.speechSynthesis.cancel();
      // Reset pause state on skip/restart
      setIsAudioPaused(false);
      isAudioPausedRef.current = false;
    } else {
      // First time starting this text
      setCurrentReadingText(textToRead);
      setBaseTimeOffset(0);
      setAudioCurrentTime(0);
      setAudioTotalTime(textToRead.length / charsPerSecond / playbackSpeed);
    }

    if (isGeneratingTTS) return;

    const voiceToUse = overrideVoice || selectedVoice;
    const langToUse = overrideLanguage || selectedLanguage;
    const isGeminiVoice = ['Aoide', 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(voiceToUse);

    if (isGeminiVoice) {
      handleGeminiTTS(textToRead, voiceToUse, langToUse);
      if (!isHistoryPaused && !annotationId) {
        setAudioHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          name: textToRead.substring(0, 30) + '...',
          date: new Date().toISOString(),
          duration: '00:00' // Real duration calculation would need more logic
        }, ...prev].slice(0, 10));
      }
    } else {
      handleBrowserTTS(textToRead);
    }
  };

  const handlePreviewVoice = () => {
    const previewText = selectedLanguage === 'Korean' 
      ? `안녕하세요! 현재 선택된 ${ (t.voiceNames as any)[selectedVoice] || '기본' } 목소리입니다. 공부할 준비가 되셨나요?` 
      : selectedLanguage === 'Japanese'
      ? `こんにちは！現在選択されている ${(t.voiceNames as any)[selectedVoice] || 'デフォルト'} の声です。勉強の準備はできましたか？`
      : selectedLanguage === 'Chinese'
      ? `你好！这是当前选择的 ${(t.voiceNames as any)[selectedVoice] || '默认'} 声音。准备好学习了吗？`
      : `Hello! This is the currently selected ${(t.voiceNames as any)[selectedVoice] || 'default'} voice. Are you ready to study?`;
    handleTTS(previewText);
  };

  const handleClear = () => {
    setFileContent('');
    setTranslatedContent('');
    setSummary('');
    setSummaryData(null);
    setLectureScript(null);
    setVisualDescription('');
    setAnnotations([]);
    setMessages([]);
    setCurrentQuiz(null);
    setQuizFinished(false);
    setQuizScore(0);
    setInsights(null);
    setCopyrightReport(null);
    setViewedAnnotations(new Set());
    setCompletedSections(new Set());
    setKnowledgeGraph(null);
    setSelectedNode(null);
    setNodePositions({});
    setClozeQuiz(null);
    setClozeUserAnswers({});
    setClozeChecked(false);
  };

  const handleGenerateQuiz = async () => {
    if (!fileContent || !level) return;
    setIsProcessing(true);
    const quiz = await generateQuiz(fileContent, level, selectedLanguage);
    if (quiz) {
      setCurrentQuiz(quiz);
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setQuizFinished(false);
      setSelectedOption(null);
      setShowFeedback(false);
      setActiveTab('quiz');
    }
    setIsProcessing(false);
  };

  const handleGenerateKnowledgeGraph = async () => {
    if (!fileContent || !level) return;
    setIsGeneratingGraph(true);
    try {
      const graph = await generateKnowledgeGraph(fileContent, level, selectedLanguage);
      if (graph && graph.nodes.length > 0) {
        setKnowledgeGraph(graph);
        // Initialize node positions in a nice circular layout
        const N = graph.nodes.length;
        const positions: Record<string, { x: number; y: number }> = {};
        const centerX = 330;
        const centerY = 220;
        const radius = Math.min(centerX, centerY) * 0.75 + 10;
        
        graph.nodes.forEach((node, idx) => {
          const angle = (2 * Math.PI * idx) / N;
          positions[node.id] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });
        setNodePositions(positions);
        setSelectedNode(graph.nodes[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingGraph(false);
    }
  };

  const handleGenerateClozeQuiz = async () => {
    if (!fileContent || !level) return;
    setIsGeneratingCloze(true);
    try {
      const cloze = await generateClozeQuiz(fileContent, level, selectedLanguage);
      if (cloze && cloze.questions.length > 0) {
        setClozeQuiz(cloze);
        setClozeUserAnswers({});
        setClozeChecked(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCloze(false);
    }
  };

  const handleNodeDragStart = (id: string, e: React.MouseEvent<SVGGElement> | React.TouchEvent<SVGGElement>) => {
    e.stopPropagation();
    setDraggedNodeId(id);
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!draggedNodeId) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setNodePositions(prev => ({
      ...prev,
      [draggedNodeId]: { x, y }
    }));
  };

  const handleSVGMouseUp = () => {
    setDraggedNodeId(null);
  };

  const createPinkNoiseBuffer = (ctx: AudioContext, seconds = 4) => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // estimate volume compensation
      b6 = white * 0.115926;
    }
    return buffer;
  };

  const createBrownNoiseBuffer = (ctx: AudioContext, seconds = 4) => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
       const white = Math.random() * 2 - 1;
       data[i] = (lastOut + (0.02 * white)) / 1.02;
       lastOut = data[i];
       data[i] *= 3.5; // compensation to make it audible
    }
    return buffer;
  };

  const createWhiteNoiseBuffer = (ctx: AudioContext, seconds = 4) => {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
       data[i] = Math.random() * 2 - 1;
       data[i] *= 0.15; // low intensity
    }
    return buffer;
  };

  const handleAddCustomNode = () => {
    if (!newNodeLabel.trim()) return;
    const newId = `custom-node-${Date.now()}`;
    const newNode: GraphNode & { userNotes?: string } = {
      id: newId,
      label: newNodeLabel,
      group: newNodeGroup || 'Concept',
      description: newNodeDesc || (selectedLanguage === 'Korean' ? '학습자가 수동으로 노팅한 지식 개념입니다.' : 'Manually annotated concept node.')
    };

    const updatedNodes = knowledgeGraph 
      ? [...knowledgeGraph.nodes, newNode]
      : [newNode];

    const updatedEdges = knowledgeGraph ? knowledgeGraph.edges : [];

    // Place in center or slightly offset
    const centerX = 330;
    const centerY = 220;

    setNodePositions(prev => ({
      ...prev,
      [newId]: { x: centerX + (Math.random() * 80 - 40), y: centerY + (Math.random() * 80 - 40) }
    }));

    setKnowledgeGraph({
      nodes: updatedNodes,
      edges: updatedEdges
    });

    setStudyGoals(goals => goals.map(goal => {
      if (goal.type === 'graph') {
        const newCurrent = Math.min(goal.target, goal.current + 1);
        return { ...goal, current: newCurrent, completed: newCurrent >= goal.target };
      }
      return goal;
    }));

    setSelectedNode(newNode);
    setNewNodeLabel('');
    setNewNodeDesc('');
    setIsAddingNode(false);
  };

  const highlightNotesTerm = (term: string) => {
    if (!term) return;
    const textArea = cornellNotesTextareaRef.current;
    if (!textArea) return;

    const notesText = cornellNotes;
    const index = notesText.toLowerCase().indexOf(term.toLowerCase());
    if (index !== -1) {
      textArea.focus();
      textArea.setSelectionRange(index, index + term.length);
      
      // Auto-scroll the textarea to that line!
      const lines = notesText.substring(0, index).split('\n');
      const lineHeight = 18; // approx line height in pixels
      textArea.scrollTop = lines.length * lineHeight - 60;
    } else {
      // Append tag if not found, to mirror it!
      const tag = `\n\n[🗺️ 마인드맵 연계 단서] ${term}: `;
      setCornellNotes(prev => {
        const next = prev + tag;
        localStorage.setItem('study_cornell_notes', next);
        return next;
      });
      setTimeout(() => {
        if (cornellNotesTextareaRef.current) {
          const nextIndex = (cornellNotes + tag).length;
          cornellNotesTextareaRef.current.focus();
          cornellNotesTextareaRef.current.setSelectionRange(nextIndex, nextIndex);
          cornellNotesTextareaRef.current.scrollTop = cornellNotesTextareaRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const handleNotesTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const selection = target.value.substring(target.selectionStart, target.selectionEnd).trim();
    if (selection.length > 1 && selection.length < 35) {
      setNotesSelectionDetails({ text: selection });
    } else {
      setNotesSelectionDetails(null);
    }
  };

  const handleSyncSelectedTextToMindmap = () => {
    if (!notesSelectionDetails) return;
    const term = notesSelectionDetails.text;
    
    // Create new node in knowledgeGraph
    const newNodeId = `node-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: GraphNode = {
      id: newNodeId,
      label: term,
      description: selectedLanguage === 'Korean' ? '필기장에서 가져온 연결 단어입니다.' : 'Linked from active Cornell notes.',
      group: 'concept'
    };

    setKnowledgeGraph(prev => {
      if (!prev) return { nodes: [newNode], edges: [] };
      const exists = prev.nodes.some(n => n.label.toLowerCase() === term.toLowerCase());
      if (exists) return prev;
      return {
        ...prev,
        nodes: [...prev.nodes, newNode]
      };
    });

    setNodePositions(prev => ({
      ...prev,
      [newNodeId]: { x: 150 + Math.random() * 100, y: 150 + Math.random() * 100 }
    }));

    setNotesSelectionDetails(null);
  };

  const handleNodeClick = (node: GraphNode) => {
    if (isConnectingBridge && bridgeSourceId) {
      if (node.id === bridgeSourceId) {
        setIsConnectingBridge(false);
        setBridgeSourceId(null);
        return;
      }
      
      const defaultRelation = selectedLanguage === 'Korean' ? '연관됨' : 'relates to';
      const rel = prompt(
        selectedLanguage === 'Korean' 
          ? `[${knowledgeGraph?.nodes.find(n => n.id === bridgeSourceId)?.label}] 에서 [${node.label}] 사이의 연결선(브릿지)의 연관 관계명을 정의해주세요.`
          : `Define connection bridge relationship from [${knowledgeGraph?.nodes.find(n => n.id === bridgeSourceId)?.label}] to [${node.label}]:`,
        defaultRelation
      );
      
      if (rel !== null) {
        const newEdge: GraphEdge = {
          from: bridgeSourceId,
          to: node.id,
          relation: rel.trim() || defaultRelation
        };
        setKnowledgeGraph(prev => {
          if (!prev) return prev;
          const exists = prev.edges.some(e => e.from === newEdge.from && e.to === newEdge.to && e.relation === newEdge.relation);
          if (exists) return prev;
          
          // Increment Daily Goals graph node bridge counter
          setStudyGoals(goals => goals.map(goal => {
            if (goal.type === 'graph') {
              const newCurrent = Math.min(goal.target, goal.current + 1);
              return { ...goal, current: newCurrent, completed: newCurrent >= goal.target };
            }
            return goal;
          }));

          return {
            ...prev,
            edges: [...prev.edges, newEdge]
          };
        });
      }
      
      setIsConnectingBridge(false);
      setBridgeSourceId(null);
    } else {
      setSelectedNode(node);
      highlightNotesTerm(node.label);
    }
  };

  const handleSelectOption = (option: string) => {
    if (showFeedback) return;
    setSelectedOption(option);
  };

  const handleCheckAnswer = () => {
    if (!currentQuiz || !selectedOption) return;
    const currentQ = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQ.correctAnswer;
    
    setQuizAnsweredCount(prev => prev + 1);
    
    setStudyGoals(goals => goals.map(goal => {
      if (goal.type === 'quiz') {
        const newCurrent = Math.min(goal.target, goal.current + 1);
        return { ...goal, current: newCurrent, completed: newCurrent >= goal.target };
      }
      return goal;
    }));

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      setQuizCorrectCount(prev => prev + 1);
    } else {
      const newMistake: MistakeQuestion = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        question: currentQ.question,
        options: currentQ.options,
        userAnswer: selectedOption,
        correctAnswer: currentQ.correctAnswer,
        explanation: currentQ.explanation,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMistakeQuestions(prev => {
        const exists = prev.some(m => m.question === currentQ.question);
        if (exists) return prev;
        return [...prev, newMistake];
      });
    }
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (!currentQuiz) return;
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleTextSelection = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionDetails(null);
      return;
    }
    const text = selection.toString().trim();
    if (text.length > 0) {
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionDetails({
          text,
          x: rect.left + window.scrollX + rect.width / 2,
          y: rect.top + window.scrollY - 10,
          open: true
        });
      } catch (err) {
        setSelectionDetails({
          text,
          x: e.pageX,
          y: e.pageY - 20,
          open: true
        });
      }
    }
  };

  const handleTextContextMenu = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (text.length > 0) {
      e.preventDefault();
      setSelectionDetails({
        text,
        x: e.pageX,
        y: e.pageY,
        open: true
      });
    }
  };

  const renderAnnotatedText = () => {
    const textToShow = translatedContent || fileContent;
    if (!textToShow) return <div className="text-zinc-400 italic font-medium">{t.noContent}</div>;

    interface TextRange {
      start: number;
      end: number;
      type: 'highlight' | 'annotation';
      text: string;
      color?: string;
      note?: string;
      annotation?: any;
    }

    const ranges: TextRange[] = [];

    // 1. Find all highlights
    highlights.forEach(h => {
      if (!h.text.trim()) return;
      let idx = textToShow.indexOf(h.text);
      while (idx !== -1) {
        ranges.push({
          start: idx,
          end: idx + h.text.length,
          type: 'highlight',
          text: h.text,
          color: h.color,
          note: h.note,
        });
        idx = textToShow.indexOf(h.text, idx + 1);
      }
    });

    // 2. Find all annotations (word matches)
    annotations.forEach(ann => {
      if (!ann.word.trim()) return;
      // Word boundary scan
      const escapedWord = ann.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
      let match;
      while ((match = regex.exec(textToShow)) !== null) {
        ranges.push({
          start: match.index,
          end: match.index + ann.word.length,
          type: 'annotation',
          text: ann.word,
          annotation: ann
        });
      }
    });

    // 3. Filter overlapping ranges
    ranges.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    const activeRanges: TextRange[] = [];
    let lastEnd = 0;
    for (const r of ranges) {
      if (r.start >= lastEnd) {
        activeRanges.push(r);
        lastEnd = r.end;
      }
    }

    // 4. Render chunks
    const chunks: React.ReactNode[] = [];
    let currentIdx = 0;

    activeRanges.forEach((r, idx) => {
      if (r.start > currentIdx) {
        chunks.push(textToShow.slice(currentIdx, r.start));
      }

      if (r.type === 'highlight') {
        const selfHl = highlights.find(h => h.text === r.text);
        const displayColor = r.color || 'yellow';
        const hlBgStyle = displayColor === 'yellow' ? '#fef08a' : displayColor === 'green' ? '#bbf7d0' : displayColor === 'pink' ? '#fbcfe8' : '#bfdbfe';
        const displayColorIndicator = displayColor === 'yellow' ? 'border-amber-400' : displayColor === 'green' ? 'border-emerald-400' : displayColor === 'pink' ? 'border-rose-400' : 'border-blue-400';

        chunks.push(
          <span 
            key={`hl-${idx}`} 
            className="p-1 rounded cursor-pointer select-text font-semibold relative group inline-block transition-all hover:brightness-95 active:scale-98"
            style={{ backgroundColor: hlBgStyle, color: '#09090b' }}
            onClick={() => {
              setSelectedHighlight(selfHl || r);
            }}
          >
            {textToShow.slice(r.start, r.end)}
            
            {/* 🔮 Interactive Popover Balloon on Hover */}
            <AnimatePresence>
              <div 
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 hidden group-hover:block z-[100] w-80 p-5 border-2 shadow-[12px_12px_0px_rgba(0,0,0,0.15)] text-[13px] leading-relaxed rounded-[22px] transition-all ${
                  darkMode ? 'bg-zinc-950 border-white text-white' : 'bg-white border-ink text-ink'
                }`}
              >
                <div className={`flex items-center justify-between mb-3.5 border-b pb-2 ${darkMode ? 'border-white/10' : 'border-zinc-150'}`}>
                  <p className={`font-mono text-[9px] font-black uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-ink/40'}`}>
                    {selectedLanguage === 'Korean' ? '🔮 AI 형광펜 상세조회' : '🔮 AI Highlight Lookup'}
                  </p>
                  <span className={`w-3 h-3 rounded-full border-2 ${displayColorIndicator}`} style={{ backgroundColor: hlBgStyle }}></span>
                </div>
                
                <p className={`text-[15px] font-black leading-snug mb-3 italic opacity-95 ${darkMode ? 'text-white' : 'text-ink'}`}>
                  "{r.text}"
                </p>

                {(selfHl?.aiDefinition) ? (
                  <div className="space-y-3 pt-0.5">
                    <p className={`text-[12px] font-black leading-relaxed ${darkMode ? 'text-emerald-400' : 'text-[#059669]'}`}>
                      ⚡️ {selfHl.aiDefinition}
                    </p>
                    {selfHl.aiContextUsage && (
                      <div className={`p-3 border rounded-xl text-[10.5px] italic leading-relaxed font-bold ${
                        darkMode ? 'bg-white/5 border-white/10 text-white/70' : 'bg-zinc-50 border-ink/10 text-ink/75'
                      }`}>
                        "{selfHl.aiContextUsage}"
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] font-bold text-zinc-400 italic">
                    {selectedLanguage === 'Korean' 
                      ? '💡 클릭 시 AI의 정밀 문맥 실시간 단어/용어 뜻풀이가 로드됩니다!' 
                      : '💡 Click this highlight to fetch AI contextual definitions in real-time!'}
                  </p>
                )}

                {(selfHl?.note || r.note) && (
                  <div className={`mt-3.5 pt-3 border-t text-[11px] font-black ${
                    darkMode ? 'border-white/10 text-yellow-400' : 'border-zinc-150 text-[#b45309]'
                  }`}>
                    📝 {selfHl?.note || r.note}
                  </div>
                )}
                
                <div className={`absolute top-full left-1/2 -translate-x-1/2 border-[9px] border-transparent ${
                  darkMode ? 'border-t-zinc-950' : 'border-t-white'
                }`}></div>
              </div>
            </AnimatePresence>
          </span>
        );
      } else {
        const annotation = r.annotation;
        chunks.push(
          <span key={`ann-${idx}`} className="relative group inline-block">
            <span className={`bg-accent/40 font-bold border-b-2 px-1 rounded-sm cursor-help transition-all hover:bg-accent hover:shadow-lg shadow-accent/50 ${darkMode ? 'text-white border-white' : 'text-ink border-ink'}`}>
              {textToShow.slice(r.start, r.end)}
            </span>
            <AnimatePresence>
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block z-50 w-80 p-6 border-2 shadow-[12px_12px_0px_rgba(0,0,0,0.1)] text-[14px] ${darkMode ? 'bg-zinc-900 border-white text-white' : 'bg-white border-ink text-ink'}`}>
                <div className={`flex items-center justify-between mb-4 border-b pb-2 ${darkMode ? 'border-white/10' : 'border-zinc-100'}`}>
                  <p className={`font-mono text-xs font-black uppercase tracking-widest ${darkMode ? 'text-white/40' : 'text-ink/40'}`}>{t.wordAnnotation}</p>
                  <button 
                    onClick={() => handleTTS(`${annotation.word}: ${annotation.definition}`, annotation.word)} 
                    className={`p-2 transition-all border rounded-lg active:scale-95 ${isAudioPlaying ? 'bg-accent/20 border-accent text-accent shadow-[0_0_15px_rgba(255,214,10,0.3)]' : (darkMode ? 'bg-zinc-800 border-white/10 hover:bg-accent text-white hover:text-ink' : 'bg-zinc-50 hover:bg-accent border-ink/5 text-ink')}`}
                  >
                    {isAudioPlaying ? (isAudioPaused ? <Play size={12} fill="currentColor" /> : <Square size={12} fill="currentColor" />) : <Volume2 size={12} />}
                  </button>
                </div>
                <p className={`text-lg font-black mb-3 leading-tight ${darkMode ? 'text-white' : 'text-ink'}`}>{annotation.word}</p>
                <p className={`mb-4 leading-relaxed font-bold ${darkMode ? 'text-white/80' : 'text-ink/80'}`}>{annotation.definition}</p>
                <div className={`p-4 border rounded-xl ${darkMode ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-ink/10'}`}>
                  <p className={`text-[11px] italic leading-relaxed font-medium ${darkMode ? 'text-white/60' : 'text-ink/60'}`}>"{annotation.context}"</p>
                </div>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent ${darkMode ? 'border-t-white' : 'border-t-ink'}`}></div>
              </div>
            </AnimatePresence>
          </span>
        );
      }

      currentIdx = r.end;
    });

    if (currentIdx < textToShow.length) {
      chunks.push(textToShow.slice(currentIdx));
    }

    return (
      <div 
        className={`whitespace-pre-wrap break-words leading-[1.8] text-[20px] font-medium tracking-tight select-text ${darkMode ? 'text-white' : 'text-ink'}`}
        onMouseUp={handleTextSelection}
        onContextMenu={handleTextContextMenu}
      >
        {chunks}
      </div>
    );
  };

  if (showSplash) {
    return (
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-zinc-950' : 'bg-white'}`}>
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <Logo size={240} showText={true} animate={true} />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 140 }}
            transition={{ duration: 2.3, ease: "easeInOut", delay: 0.3 }}
            className="h-[3px] bg-accent rounded-full mt-6 opacity-80"
          />
        </div>
      </div>
    );
  }

  if (!level) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-zinc-950 text-white' : 'bg-bg text-ink'} flex items-center justify-center p-8 transition-colors duration-500`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full"
        >
          <div className="absolute top-10 left-10">
            <button 
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-2 px-6 py-3 bg-accent text-ink rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-accent/20 transition-all hover:scale-110 active:scale-95"
            >
              <BookOpen size={18} />
              {t.featureGuide}
            </button>
          </div>
          <div className="absolute top-10 right-10 flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-ink'}`}>
              <Globe size={14} className="opacity-40" />
              <select 
                value={selectedLanguage}
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setSelectedLanguage(newLang);
                  const targetVoice = newLang === 'Korean' ? 'Kore' :
                                      newLang === 'English' ? 'Aoide' :
                                      newLang === 'Japanese' ? 'Puck' : 'Fenrir';
                  setSelectedVoice(targetVoice);
                }}
                className={`text-[12px] font-bold bg-transparent outline-none cursor-pointer border-none focus:ring-0 p-0 ${darkMode ? 'text-white bg-zinc-800' : 'text-ink bg-white'}`}
              >
                <option value="English" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>English</option>
                <option value="Korean" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>한국어</option>
                <option value="Japanese" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>日本語</option>
                <option value="Chinese" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>中文</option>
              </select>
            </div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:scale-110 transition-all text-ink dark:text-white"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {currentUser ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-750 text-ink dark:text-white">
                {currentUser.photoURL && (
                  <img src={currentUser.photoURL} alt="Profile" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                )}
                <span className="text-xs font-bold truncate max-w-[120px]">
                  {currentUser.displayName || 'Learner'}
                </span>
              </div>
            ) : (
              <button 
                onClick={handleSignIn}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold text-xs transition-all active:scale-95 cursor-pointer text-ink dark:text-white"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.62l3.7 2.87c2.16-2 3.75-4.94 3.75-8.34z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.28 0-6.06-2.21-7.05-5.19H1.14v3c2.05 4.07 6.27 6.87 11.23 6.87z"/>
                  <path fill="#FBBC05" d="M4.95 14.13c-.25-.76-.4-1.58-.4-2.42s.15-1.66.4-2.42V6.29H1.14C.41 7.74 0 9.38 0 11.12s.41 3.38 1.14 4.83l3.81-2.02z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.41C17.96 1.19 15.24 0 12 0 7.04 0 2.82 2.8 1.14 6.29l3.81 2c.99-2.98 3.77-5.19 7.05-5.19z"/>
                </svg>
                <span>{selectedLanguage === 'Korean' ? '구글 로그인' : 'Google Login'}</span>
              </button>
            )}
          </div>

          <div className="mb-10 flex flex-col items-center justify-center">
            <Logo size={140} showText={false} animate={true} />
          </div>

          <div className="mb-16 text-center space-y-4">
            <h1 className="text-7xl font-black tracking-tighter uppercase">
              {t.title}{t.subtitle}
            </h1>
            <p className="opacity-40 font-medium text-lg tracking-tight">{t.tagline}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'elementary', label: t.elementary, desc: t.elementaryDesc, icon: Book },
              { id: 'middle', label: t.middle, desc: t.middleDesc, icon: School },
              { id: 'high', label: t.high, desc: t.highDesc, icon: GraduationCap },
              { id: 'university', label: t.university, desc: t.universityDesc, icon: User },
            ].map((item, idx) => (
              <motion.button
                key={item.id}
                whileHover={{ y: -4 }}
                onClick={() => handleLevelSelect(item.id as EducationLevel)}
                className={`p-8 text-left rounded-[32px] group transition-all border ${darkMode ? 'bg-zinc-900 border-zinc-800 hover:border-accent/40' : 'glass-panel hover:border-accent/40'}`}
              >
                <div className={`mb-6 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-zinc-800 text-white/40 group-hover:bg-accent group-hover:text-zinc-900' : 'bg-zinc-50 text-ink/40 group-hover:bg-accent group-hover:text-ink'}`}>
                  {React.createElement(item.icon, { size: 28 })}
                </div>
                <h3 className="text-2xl font-bold mb-2 tracking-tight">{item.label}</h3>
                <p className="opacity-40 text-sm leading-relaxed group-hover:opacity-60">{item.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 font-sans ${darkMode ? 'bg-zinc-950 text-white dark' : 'bg-bg text-ink'}`}>
      <header className={`sticky top-0 h-20 flex items-center justify-between px-10 border-b shrink-0 z-50 backdrop-blur-md transition-all ${darkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-zinc-200'}`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Logo size={42} showText={false} animate={false} />
            <span className="font-black text-xl tracking-tighter uppercase">{t.title}{t.subtitle}</span>
          </div>
          
          {copyrightReport && (
            <button 
              onClick={() => setShowCopyrightGuard(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                copyrightReport.isSafe 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse'
              }`}
            >
              <Shield size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{t.copyrightShield}</span>
            </button>
          )}

          <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 shrink-0 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
            <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,214,10,0.6)] ${processingStage ? 'bg-accent animate-pulse' : 'bg-accent/40'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50 whitespace-nowrap">
              {processingStage ? (
                <span>{processingStage === 'analyzing' ? t.analyzingContent : t.generatingSummary}</span>
              ) : (
                <span>{level === 'elementary' ? t.elementary : 
                 level === 'middle' ? t.middle : 
                 level === 'high' ? t.high : t.university} {t.mode}</span>
              )}
            </span>
          </div>

          <div className={`flex items-center gap-2 p-1.5 rounded-xl ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`}>
            <div className="flex items-center gap-1">
              {focusSounds.map(sound => (
                <button
                  key={sound.id}
                  onClick={() => toggleFocusSound(sound)}
                  title={sound.name}
                  className={`p-2 rounded-lg transition-all relative ${activeFocusSound?.id === sound.id && isFocusSoundPlaying ? 'bg-accent text-ink shadow-lg scale-110' : 'text-zinc-400 hover:text-ink dark:hover:text-white'}`}
                >
                  {sound.id === 'white' && <Wind size={14} />}
                  {sound.id === 'rain' && <CloudRain size={14} />}
                  {sound.id === 'cafe' && <Coffee size={14} />}
                  {sound.id === 'forest' && <Trees size={14} />}
                  {sound.id === 'campfire' && <Flame size={14} />}
                  {activeFocusSound?.id === sound.id && audioError && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" title={audioError} />
                  )}
                </button>
              ))}
            </div>
            
            {(isFocusSoundPlaying || activeFocusSound) && (
              <div className="flex items-center gap-2.5 px-2 border-l border-zinc-200 dark:border-zinc-700">
                {isFocusSoundPlaying ? (
                  <div className="flex items-end gap-[2px] h-3.5 w-4 overflow-hidden" title="Playing ambient noise">
                    <span className="w-[3px] bg-accent rounded-full animate-eq-1"></span>
                    <span className="w-[3px] bg-accent rounded-full animate-eq-2"></span>
                    <span className="w-[3px] bg-accent rounded-full animate-eq-3"></span>
                    <span className="w-[3px] bg-accent rounded-full animate-eq-4"></span>
                  </div>
                ) : (
                  <Volume2 size={12} className="opacity-40" />
                )}
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={focusVolume}
                  onChange={(e) => setFocusVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-accent"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">


          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-100 text-ink'}`}>
            <Globe size={14} className="opacity-40" />
            <select 
              value={selectedLanguage}
              onChange={(e) => {
                const newLang = e.target.value as Language;
                setSelectedLanguage(newLang);
                const targetVoice = newLang === 'Korean' ? 'Kore' :
                                    newLang === 'English' ? 'Aoide' :
                                    newLang === 'Japanese' ? 'Puck' : 'Fenrir';
                setSelectedVoice(targetVoice);
              }}
              className={`text-[12px] font-bold bg-transparent outline-none cursor-pointer border-none focus:ring-0 p-0 ${darkMode ? 'text-white bg-zinc-800' : 'text-ink bg-white'}`}
            >
              <option value="English" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>English</option>
              <option value="Korean" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>한국어</option>
              <option value="Japanese" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>日本語</option>
              <option value="Chinese" className={darkMode ? 'bg-zinc-800 text-white' : 'bg-white text-ink'}>中文</option>
            </select>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-ink'}`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-ink'}`}
            title={t.settings}
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent text-ink rounded-xl font-black text-[11px] uppercase tracking-normal shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
          >
            <Book size={14} />
            {t.featureGuide}
          </button>
          {fileContent && (
            <button 
              onClick={handleClear}
              className="px-5 py-2 text-[11px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            >
              {t.resetSession}
            </button>
          )}
          {currentUser ? (
            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-10 h-10 rounded-full bg-accent border border-accent/20 flex items-center justify-center font-bold text-xs text-ink shadow-sm overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.displayName?.substring(0, 2).toUpperCase() || 'US'
                )}
              </button>
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute right-0 mt-3 w-64 rounded-2xl p-5 border shadow-2xl z-50 transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-150 text-ink'}`}
                  >
                    <div className="flex flex-col gap-1 border-b border-ink/5 dark:border-white/5 pb-3">
                      <p className="font-extrabold text-sm truncate">{currentUser.displayName || 'Learner'}</p>
                      <p className="text-[10px] opacity-40 truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                          {selectedLanguage === 'Korean' ? '실시간 클라우드 동기화' : 'Cloud Sync Active'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-center py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest mt-4 transition-all active:scale-95"
                    >
                      {selectedLanguage === 'Korean' ? '로그아웃' : 'Sign Out'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={handleSignIn}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 border border-zinc-200 dark:border-zinc-700 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer text-ink dark:text-white"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.62l3.7 2.87c2.16-2 3.75-4.94 3.75-8.34z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.7-2.87c-1.03.69-2.35 1.1-4.26 1.1-3.28 0-6.06-2.21-7.05-5.19H1.14v3c2.05 4.07 6.27 6.87 11.23 6.87z"/>
                <path fill="#FBBC05" d="M4.95 14.13c-.25-.76-.4-1.58-.4-2.42s.15-1.66.4-2.42V6.29H1.14C.41 7.74 0 9.38 0 11.12s.41 3.38 1.14 4.83l3.81-2.02z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.41C17.96 1.19 15.24 0 12 0 7.04 0 2.82 2.8 1.14 6.29l3.81 2c.99-2.98 3.77-5.19 7.05-5.19z"/>
              </svg>
              <span>{selectedLanguage === 'Korean' ? '구글 로그인' : 'Google Login'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Zoom Live Video Conference Modal - DEACTIVATED AND REMOVED */}
      <AnimatePresence>
        {false && isZoomActiveModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeZoomActiveModal}
              className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className={`relative w-full max-w-5xl rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col md:flex-row h-[85vh] md:h-[80vh] overflow-hidden border border-white/10 ${
                darkMode ? 'bg-zinc-900 text-white border-zinc-800/40' : 'bg-zinc-900 text-white border-zinc-950/30'
              }`}
            >
              {/* Main Live Stage Area */}
              <div className="flex-1 flex flex-col p-6 h-full relative overflow-hidden bg-black/40">
                
                {/* Header info */}
                <div className="flex items-center justify-between mb-4 z-10">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                        {selectedLanguage === 'Korean' ? '원격 화상 클래스 아레나' : 'Socratic Live Study Arena'} 
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[9px] lowercase font-normal border border-white/5 font-mono text-zinc-400">
                          {roomId || "live-study-arena"}
                        </span>
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-medium font-sans">
                        {selectedLanguage === 'Korean' ? '실시간 인터랙티브 원격 줌 워크스페이스' : 'Interactive remote video workspace'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Toggle Virtual Studymates */}
                    <button
                      onClick={() => setIncludeVirtualBuddies(!includeVirtualBuddies)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold transition-all border ${
                        includeVirtualBuddies 
                          ? 'bg-accent/25 border-accent/40 text-accent' 
                          : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sparkles size={10} />
                      {selectedLanguage === 'Korean' ? 'AI 스터디메이트 활성' : 'AI Study Partners'}
                    </button>
                    
                    {/* Copy ID Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(roomId || "live-study-arena");
                        alert(selectedLanguage === 'Korean' ? "회의실 ID가 클립보드에 복사되었습니다!" : "Meeting ID copied to clipboard!");
                      }}
                      className="px-3 py-1 rounded-full text-[9px] font-bold bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                    >
                      {selectedLanguage === 'Korean' ? '방 코드 복사' : 'Copy Room ID'}
                    </button>
                    
                    {/* Close button */}
                    <button 
                      onClick={closeZoomActiveModal}
                      className="p-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Split Responsive 2x2 Interactive Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full relative overflow-y-auto custom-scrollbar pr-1 pb-4">
                  
                  {/* Grid 1: Local webcam element ("나") */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 aspect-video md:aspect-auto flex flex-col justify-center items-center shadow-inner group">
                    {isVideoChatEnabled ? (
                      <video
                        ref={collabModalVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transform scale-x-[-1] transition-all duration-300 ${
                          videoFilter === 'grayscale' ? 'grayscale' :
                          videoFilter === 'sepia' ? 'sepia' :
                          videoFilter === 'warm' ? 'sepia-[0.30] hue-rotate-[10deg] brightness-[1.05]' :
                          videoFilter === 'cyber' ? 'hue-rotate-[120deg] saturate-[1.8] contrast-[1.1]' :
                          videoFilter === 'glow' ? 'brightness-[1.15] contrast-[1.05] saturate-[1.1]' :
                          ''
                        }`}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 gap-3">
                        <div className="w-16 h-16 rounded-full bg-accent text-ink font-black text-xl flex items-center justify-center shadow-lg shadow-accent/25 animate-pulse">
                          {username.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-sans">
                          {selectedLanguage === 'Korean' ? '카메라 전송 비활성화' : 'Camera Off'}
                        </span>
                      </div>
                    )}

                    {/* Left overlay badge with name and mic state */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 z-10">
                      <span className="text-[9px] font-bold text-white tracking-wide font-sans">
                        {username} {selectedLanguage === 'Korean' ? '(나 / 호스트)' : '(You / Host)'}
                      </span>
                      {isVoiceChatEnabled ? (
                        <Mic size={9} className="text-emerald-400 animate-pulse" />
                      ) : (
                        <MicOff size={9} className="text-rose-500" />
                      )}
                    </div>

                    {/* Floating Reaction Overlay bubble */}
                    <AnimatePresence>
                      {userEmojiReactions[username] && (
                        <motion.div
                          initial={{ scale: 0.3, y: 15, opacity: 0 }}
                          animate={{ scale: 1.2, y: -10, opacity: 1 }}
                          exit={{ scale: 0.5, y: -30, opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                        >
                          <div className="bg-black/85 backdrop-blur-md text-4xl px-5 py-4 rounded-3xl border border-white/20 shadow-2xl animate-bounce">
                            {userEmojiReactions[username].emoji}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hand Raised state display */}
                    {raisedHands.has(username) && (
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="absolute top-3 right-3 bg-yellow-500 text-ink font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 z-15 border border-yellow-300 font-sans"
                      >
                        <Hand size={10} className="fill-ink" />
                        <span>{selectedLanguage === 'Korean' ? '질문 손들기 활성' : 'Hand Raised'}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Grid 2: Study Buddy Emma */}
                  {includeVirtualBuddies && (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 aspect-video md:aspect-auto flex flex-col justify-center items-center shadow-inner group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-zinc-950 to-indigo-950/10 flex flex-col items-center justify-center gap-4">
                        <div className="flex items-end gap-1.5 h-12 w-24">
                          <div className="w-1.5 bg-accent/40 rounded-full animate-[pulse_1.0s_infinite_alternate]" style={{height: '25%'}} />
                          <div className="w-1.5 bg-accent/60 rounded-full animate-[pulse_1.4s_infinite_alternate]" style={{height: '55%'}} />
                          <div className="w-1.5 bg-accent rounded-full animate-[pulse_0.8s_infinite_alternate]" style={{height: '85%'}} />
                          <div className="w-1.5 bg-accent/70 rounded-full animate-[pulse_1.2s_infinite_alternate]" style={{height: '45%'}} />
                          <div className="w-1.5 bg-accent/30 rounded-full animate-[pulse_1.6s_infinite_alternate]" style={{height: '15%'}} />
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/35 text-purple-300 text-xs font-bold flex items-center justify-center shadow-inner">
                            EM
                          </div>
                          <span className="text-[10px] font-bold text-zinc-300 mt-2 font-sans">Emma (Pacemaker)</span>
                          <span className="text-[8px] font-semibold text-zinc-500 font-sans">
                            {selectedLanguage === 'Korean' ? '원격 학습 멘토링 분석 중' : 'Analyzing Spatial Memory'}
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 z-10">
                        <span className="text-[9px] font-bold text-white tracking-wide font-sans">Emma</span>
                        <Mic size={9} className="text-emerald-400 animate-pulse" />
                      </div>
                      <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-400 font-bold text-[8px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest font-sans">
                        Studying
                      </div>
                    </div>
                  )}

                  {/* Grid 3: Study Buddy Alex */}
                  {includeVirtualBuddies && (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 aspect-video md:aspect-auto flex flex-col justify-center items-center shadow-inner group">
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-zinc-950 to-emerald-950/10 flex flex-col items-center justify-center gap-4">
                        <div className="w-44 bg-black/50 border border-white/5 rounded-lg p-2 font-mono text-[7px] text-emerald-400/80 h-16 overflow-hidden">
                          <p className="animate-pulse">const ActiveRecall = () =&gt; {'{'}</p>
                          <p className="text-sky-400 pl-2">learningEngines.refreshEngrams();</p>
                          <p className="text-white/30 pl-2">// Mapped to permanent memory</p>
                          <p className="text-yellow-400 pl-2">return true;</p>
                          <p className="text-emerald-400">{'}'}</p>
                        </div>

                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/35 text-teal-300 text-xs font-bold flex items-center justify-center">
                            AL
                          </div>
                          <span className="text-[10px] font-bold text-zinc-300 mt-2 font-sans">Alex (Virtual Mentor)</span>
                          <span className="text-[8px] font-semibold text-zinc-500 font-sans">
                            {selectedLanguage === 'Korean' ? '에빙하우스 가독화 분석 코딩 중' : 'Structuring Flashcards'}
                          </span>
                        </div>
                      </div>

                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 z-10">
                        <span className="text-[9px] font-bold text-white tracking-wide font-sans">Alex</span>
                        <MicOff size={9} className="text-zinc-500" />
                      </div>
                      <div className="absolute top-3 right-3 bg-indigo-500/10 text-indigo-400 font-bold text-[8px] px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest font-sans">
                        Coding
                      </div>
                    </div>
                  )}

                  {/* Grid 4: Peer Connection Holder / Meeting details */}
                  <div className="relative rounded-2xl overflow-hidden border border-dashed border-white/10 bg-zinc-950/45 p-6 flex flex-col justify-center items-center text-center">
                    <Users size={24} className="text-accent/30 mb-3 animate-bounce" />
                    <h5 className="text-[11px] font-black uppercase text-zinc-300 tracking-widest font-sans">
                      {selectedLanguage === 'Korean' ? '외부 클래스 멤버 연결 대기 완료' : 'Waiting for real-time peers'}
                    </h5>
                    <p className="text-[9px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed font-sans">
                      {selectedLanguage === 'Korean' ? '상단의 회의실 ID를 스터디 그룹원들과 매칭하여 동시 원격 접속이 활성화됩니다!' : 'Share the meeting room code to study live in perfect synchrony with classmates!'}
                    </p>
                  </div>

                </div>

                {/* Live Stage Control Bar */}
                <div className="mt-auto border-t border-white/10 pt-4 flex flex-wrap items-center justify-center gap-3">
                  {/* Mute/Unmute mic */}
                  <button
                    onClick={toggleVoiceChat}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      isVoiceChatEnabled 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25 hover:bg-green-600' 
                        : 'bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                    title={isVoiceChatEnabled ? "Mute Microphone" : "Unmute Microphone"}
                  >
                    {isVoiceChatEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                  </button>

                  {/* Camera on/off */}
                  <button
                    onClick={toggleVideoChat}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      isVideoChatEnabled 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                        : 'bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                    title={isVideoChatEnabled ? "Turn Cam Off" : "Turn Cam On"}
                  >
                    {isVideoChatEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                  </button>

                  {/* Screen Share */}
                  <button
                    onClick={toggleCollabScreenShare}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      isCollabScreenSharing 
                        ? 'bg-cyan-500 text-white shadow-lg' 
                        : 'bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                    title="Share Screen"
                  >
                    <ScreenShare size={16} />
                  </button>

                  {/* Hand raise */}
                  <button
                    onClick={raiseCollabHand}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      raisedHands.has(username) 
                        ? 'bg-yellow-500 text-ink shadow-lg shadow-yellow-500/25 animate-bounce' 
                        : 'bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                    title="Raise Hand"
                  >
                    <Hand size={16} />
                  </button>

                  {/* Reaction Palette */}
                  <div className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 border border-white/5 rounded-2xl">
                    {['👏', '🎉', '💡', '🔥', '🙌', '😮'].map(em => (
                      <button
                        key={em}
                        onClick={() => sendCollabReaction(em)}
                        className="w-8 h-8 text-base flex items-center justify-center hover:bg-zinc-700 rounded-xl transition-all active:scale-95 text-white"
                      >
                        {em}
                      </button>
                    ))}
                  </div>

                  {/* Video filter */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-white/5 rounded-2xl text-[9px] font-bold">
                    <span className="text-zinc-500 font-sans">{selectedLanguage === 'Korean' ? '필터:' : 'Filter:'}</span>
                    <select 
                      value={videoFilter} 
                      onChange={(e: any) => setVideoFilter(e.target.value)}
                      className="bg-transparent border-none outline-none p-0 text-[9px] cursor-pointer text-zinc-350 font-bold focus:ring-0 bg-zinc-800 text-white"
                    >
                      <option value="none" className="bg-zinc-900 text-white">Normal</option>
                      <option value="grayscale" className="bg-zinc-900 text-white">Mono 1920</option>
                      <option value="sepia" className="bg-zinc-900 text-white">Vintage Sepia</option>
                      <option value="warm" className="bg-zinc-900 text-white">Warm Cinema</option>
                      <option value="cyber" className="bg-zinc-900 text-white">Cyberpunk</option>
                      <option value="glow" className="bg-zinc-900 text-white">Soft Glow</option>
                    </select>
                  </div>

                  {/* Red Leave Room Button */}
                  <button
                    onClick={closeZoomActiveModal}
                    className="flex items-center gap-1.5 px-4 h-11 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all text-xs font-black shadow-lg shadow-rose-600/20 ml-2"
                    title={selectedLanguage === 'Korean' ? "회의실 실시간 나가기" : "Leave Live Room"}
                  >
                    <LogOut size={13} />
                    <span>{selectedLanguage === 'Korean' ? '나가기' : 'Leave'}</span>
                  </button>
                </div>

              </div>

              {/* Chat Column Sidebar matching Zoom sidebar style */}
              <div className="w-full md:w-[320px] flex flex-col justify-between shrink-0 border-t md:border-t-0 md:border-l border-white/10 p-5 bg-zinc-950/40 relative">
                
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <h5 className="text-[10px] uppercase font-black tracking-widest text-white/70 flex items-center gap-1.5 font-sans">
                    <MessageSquare size={12} className="text-accent" />
                    {selectedLanguage === 'Korean' ? '라이브 회의 메신저' : 'Live Meeting Chat'}
                  </h5>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">
                    {roomMessages.length} {selectedLanguage === 'Korean' ? '개 메시지' : 'messages'}
                  </span>
                </div>

                {/* Message display stack */}
                <div className="flex-grow overflow-y-auto space-y-4 pr-1 pb-4 max-h-[45vh] md:max-h-none custom-scrollbar text-xs">
                  {roomMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-8">
                      <MessageSquare size={20} className="mb-2 text-zinc-500" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">
                        {selectedLanguage === 'Korean' ? '스터디원 간의 대화가 시작됩니다.' : 'No messages yet.'}
                      </p>
                    </div>
                  ) : (
                    roomMessages.map((m, i) => (
                      <div key={i} className={`flex flex-col gap-1 ${m.username === username ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-1.5">
                          {m.username !== username && <span className="text-[9px] font-bold text-accent font-sans">{m.username}</span>}
                          <span className="text-[7px] font-mono text-zinc-550 opacity-60">{m.timestamp}</span>
                        </div>
                        <div className={`p-3 rounded-2xl leading-normal max-w-[95%] border text-[11px] font-medium ${
                          m.username === username 
                            ? 'bg-accent border-accent text-ink' 
                            : 'bg-zinc-800 border-white/10 text-white'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Form Input bar */}
                <div className="border-t border-white/10 pt-4 mt-auto">
                  <div className="bg-zinc-800 border border-white/5 rounded-2xl p-1.5 flex gap-2">
                    <input 
                      type="text"
                      value={roomInput}
                      onChange={(e) => setRoomInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendRoomMessage();
                        }
                      }}
                      placeholder={selectedLanguage === 'Korean' ? '회의 참가자에게 의견 쓰기...' : 'Chat with class...'}
                      className="bg-transparent border-none outline-none flex-1 py-2 px-3 text-[11px] placeholder:text-zinc-600 text-white font-medium focus:ring-0"
                    />
                    <button 
                      onClick={handleSendRoomMessage}
                      className="w-9 h-9 rounded-xl bg-accent text-ink flex items-center justify-center hover:bg-accent/80 transition-all active:scale-95"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Copyright Guard Modal */}
      <AnimatePresence>
        {showCopyrightGuard && copyrightReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCopyrightGuard(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-lg rounded-[32px] shadow-2xl p-8 flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar ${darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${copyrightReport.isSafe ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tighter uppercase">{t.copyrightShield}</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40">{t.safeMode}</p>
                  </div>
                </div>
                <button onClick={() => setShowCopyrightGuard(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{t.privacyAdvice}</p>
                  <p className="text-xs leading-relaxed font-semibold opacity-85">{copyrightReport.copyrightAdvice}</p>
                </div>

                {copyrightReport.sensitiveInfoDetected.length > 0 ? (
                  <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-3xl">
                    <div className="flex items-center gap-2 mb-3 text-red-500">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.sensitiveInfo}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {copyrightReport.sensitiveInfoDetected.map((info, idx) => (
                         <li key={idx} className="text-xs font-bold text-red-500 dark:text-red-400">• {info}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <CheckCircle2 size={13} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.allClear}</span>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowCopyrightGuard(false)}
                className={`w-full mt-6 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl transition-all ${darkMode ? 'bg-white text-ink font-bold' : 'bg-ink text-white font-bold'}`}
              >
                {t.finish}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Focus Sound Players (Persistent to avoid "removed from document" errors) */}
      <div className="fixed top-[-100px] left-[-100px] w-10 h-10 overflow-hidden opacity-0 pointer-events-none select-none z-[-1]">
        {/* YouTube Player */}
        <Player
          url={lastYoutubeUrl}
          playing={isFocusSoundPlaying && activeFocusSound?.type === 'youtube'}
          volume={focusVolume}
          loop={true}
          playsinline={true}
          width="100%"
          height="100%"
          config={{
            youtube: {
              playerVars: { 
                autoplay: 1,
                loop: 1,
                playlist: lastYoutubeUrl ? getYoutubeId(lastYoutubeUrl) : undefined
              }
            }
          }}
          onStart={() => setAudioError(null)}
          onError={(e: any) => {
            if (activeFocusSound?.type === 'youtube') {
              console.error("YouTube Player Error:", e);
              setAudioError("YouTube load failed.");
              setIsFocusSoundPlaying(false);
            }
          }}
        />
        {/* File Audio Player */}
        <Player
          url={lastAudioUrl}
          playing={isFocusSoundPlaying && activeFocusSound?.type === 'audio'}
          volume={focusVolume}
          loop={true}
          playsinline={true}
          width="100%"
          height="100%"
          config={{
            file: {
              attributes: {
                preload: 'auto',
                controlsList: 'nodownload'
              }
            }
          }}
          onStart={() => setAudioError(null)}
          onError={(e: any) => {
            if (activeFocusSound?.type === 'audio') {
              console.error("Audio Player Error:", e);
              setAudioError("Audio load failed.");
              setIsFocusSoundPlaying(false);
            }
          }}
        />
      </div>

      <main className="max-w-[1600px] mx-auto w-full flex flex-col lg:flex-row p-6 gap-6">
        <section className={`flex-1 rounded-[40px] flex flex-col relative border transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'glass-panel'}`}>
          <div className={`h-16 flex items-center justify-between px-8 border-b sticky top-20 z-20 ${darkMode ? 'border-zinc-800 bg-zinc-900/80 backdrop-blur-md' : 'border-zinc-100 bg-white/80 backdrop-blur-md'}`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${fileContent ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-zinc-300 dark:bg-zinc-600 animate-pulse'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
                  {fileContent ? 'Active' : 'Standby'}
                </span>
              </div>
              
              {fileContent && (
                <div className="flex items-center gap-1 pr-6 border-r border-zinc-100 dark:border-zinc-800">
                  <button 
                    onClick={handleSummarize}
                    className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-40 hover:opacity-100 flex items-center gap-2"
                  >
                    <BookOpen size={12} />
                    {t.summarize}
                  </button>
                  <button 
                    onClick={handleDescribeVisuals}
                    className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all opacity-40 hover:opacity-100 flex items-center gap-2"
                  >
                    <Eye size={12} />
                    {t.describeVisual}
                  </button>
                  <button 
                    onClick={() => {
                      const next = !showSplitNote;
                      setShowSplitNote(next);
                      localStorage.setItem('study_show_split_note', String(next));
                    }}
                    className={`h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
                      showSplitNote 
                        ? 'bg-accent/20 text-accent border border-accent/30 shadow-[0_0_12px_rgba(255,214,10,0.15)] font-black' 
                        : 'opacity-40 hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title={selectedLanguage === 'Korean' ? '분할 필기 노트 전환' : 'Toggle Split-Screen Cornell Notes'}
                  >
                    <PenTool size={12} />
                    {selectedLanguage === 'Korean' 
                      ? (showSplitNote ? '분할 필기 노트 ON' : '분할 필기 노트 OFF') 
                      : (showSplitNote ? 'Split Note ON' : 'Split Note')}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 bg-zinc-100/50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5">
                <button 
                  onClick={handleTranslate}
                  className={`h-8 px-4 flex items-center gap-2 rounded-lg transition-all ${darkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-white hover:shadow-sm text-zinc-400 hover:text-ink'}`}
                >
                  <Languages size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.translate}</span>
                </button>
                <div className="w-[1px] h-3 bg-zinc-200 dark:bg-zinc-800 mx-1" />
                <button 
                  onClick={handleStartCamera}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-white hover:shadow-sm text-zinc-400 hover:text-ink'}`}
                  title={t.scanPaper}
                >
                  <Camera size={14} />
                </button>
              </div>

              <label className={`h-10 px-5 flex items-center gap-3 cursor-pointer rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-white text-ink hover:bg-zinc-100' : 'bg-ink text-white hover:bg-zinc-800 active:scale-95'}`}>
                <Upload size={14} />
                {t.uploadFile}
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.pdf,image/*" />
              </label>
            </div>
          </div>

          <div 
            className="px-8 md:px-16 py-12 md:py-20 scroll-smooth"
          >
            <div className={`${showSplitNote && fileContent ? 'max-w-[1600px]' : 'max-w-4xl'} mx-auto w-full transition-all duration-300`}>
              <AnimatePresence>
                {showEncodingWarning && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl flex items-center gap-3 text-xs font-bold"
                  >
                    <AlertCircle size={14} />
                    {t.encodingWarning}
                    <button onClick={() => setShowEncodingWarning(false)} className="ml-auto opacity-50 hover:opacity-100"><X size={12}/></button>
                  </motion.div>
                )}
              </AnimatePresence>
              {!fileContent && !isProcessing && (
                <div className="h-[70vh] flex flex-col items-center justify-center p-12">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`max-w-xl w-full p-12 rounded-[48px] border-2 border-dashed flex flex-col items-center text-center ${darkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-accent/30 bg-accent/5'}`}
                  >
                    <div className="w-24 h-24 bg-accent/10 rounded-[32px] flex items-center justify-center mb-8 border border-accent/20 animate-float">
                      <BookOpen size={40} className="text-accent" />
                    </div>
                    <h2 className="text-2xl font-black mb-4 tracking-tighter uppercase">{t.readyToBegin}</h2>
                    <p className="text-sm opacity-50 font-medium max-w-sm mb-12 leading-relaxed">{t.readyDesc}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <label className={`flex flex-col items-center gap-4 p-6 rounded-3xl cursor-pointer border-2 border-transparent transition-all hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-zinc-800 hover:border-accent/40' : 'bg-white shadow-sm hover:border-accent/40'}`}>
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                          <Upload size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.uploadFile}</span>
                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.pdf,image/*" />
                      </label>
                      <button 
                        onClick={handleStartCamera}
                        className={`flex flex-col items-center gap-4 p-6 rounded-3xl border-2 border-transparent transition-all hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-zinc-800 hover:border-accent/40' : 'bg-white shadow-sm hover:border-accent/40'}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                          <Camera size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{t.scanPaper}</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {isProcessing && (
                <div className="h-[60vh] flex flex-col items-center justify-center">
                  <div className={`w-32 h-1 relative mb-6 overflow-hidden rounded-full ${darkMode ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                    <motion.div 
                      animate={{ x: [-128, 128] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-accent"
                    />
                  </div>
                  <span className="mono-label animate-pulse">
                    {processingStage === 'extracting' ? t.extractingText :
                     processingStage === 'analyzing' ? t.analyzingContent :
                     processingStage === 'summarizing' ? t.generatingSummary :
                     t.processing}
                  </span>
                </div>
              )}
              
              {/* Wrapping grid when split note is true */}
              <div className={showSplitNote && fileContent ? "grid grid-cols-1 xl:grid-cols-2 gap-10 items-start mt-8" : "space-y-12 mt-8"}>
                
                {/* COLUMN 1: Real study materials */}
                <div className="space-y-12">
                  {!isProcessing && summary && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-12 p-10 border rounded-[40px] shadow-2xl transition-all ${darkMode ? 'bg-accent/5 border-accent/20' : 'bg-white border-zinc-100'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h4 className="font-black text-xl tracking-tighter uppercase">{t.summaryTitle}</h4>
                        <span className="mono-label opacity-40">{summaryMode === 'simple' ? t.easySummary : t.standardSummary}</span>
                      </div>
                    </div>
                    
                    <div className="flex p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl scale-90 md:scale-100 origin-right">
                      <button 
                        onClick={() => {
                          setSummaryMode('simple');
                          if (summaryData) setSummary(summaryData.simple);
                        }}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${summaryMode === 'simple' ? 'bg-accent text-ink shadow-lg shadow-accent/20' : 'opacity-40 hover:opacity-100'}`}
                      >
                        {t.easySummary}
                      </button>
                      <button 
                        onClick={() => {
                          setSummaryMode('standard');
                          if (summaryData) setSummary(summaryData.standard);
                        }}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${summaryMode === 'standard' ? 'bg-accent text-ink shadow-lg shadow-accent/20' : 'opacity-40 hover:opacity-100'}`}
                      >
                        {t.standardSummary}
                      </button>
                    </div>
                  </div>

                  <div className={`prose max-w-none prose-p:text-[17px] prose-p:leading-[1.7] ${darkMode ? 'prose-invert text-white' : 'text-zinc-800'}`}>
                    <div className="whitespace-pre-wrap font-medium">{summary}</div>
                  </div>
                </motion.div>
              )}

              {!isProcessing && visualDescription && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mb-12 p-10 border-2 border-dashed rounded-3xl ${darkMode ? 'bg-zinc-800/50 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-200 text-ink'}`}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Eye className="text-accent" size={20} />
                    <span className="font-mono text-xs font-black uppercase tracking-widest">{t.describeVisual}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed opacity-80">{visualDescription}</p>
                </motion.div>
              )}

              {!isProcessing && fileContent && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-20 border relative transition-colors group/doc ${darkMode ? 'bg-zinc-800/30 border-zinc-700' : 'bg-zinc-50/30 border-zinc-100 border-ink/5'}`}
                >
                  <div className="absolute top-8 right-8 z-10 flex flex-col items-end gap-2 text-ink">
                    <div className="flex gap-2">
                       {isAudioPlaying && (
                         <div className="flex gap-1 items-center px-4 py-2 bg-rose-500/10 rounded-xl">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{playbackSpeed}x</span>
                         </div>
                       )}
                       <button 
                        onClick={() => handleTTS(fileContent)}
                        title={t.readAll}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                          isAudioPlaying 
                            ? 'bg-rose-500 text-white' 
                            : (darkMode ? 'bg-zinc-800 text-white hover:bg-accent hover:text-ink' : 'bg-white text-ink hover:bg-accent')
                        }`}
                       >
                         {isAudioPlaying ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
                         {isAudioPlaying ? t.stopReading : t.readAll}
                       </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 justify-end max-w-[160px]">
                      {[0.4, 0.7, 1, 1.2, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlaybackSpeed(speed);
                          }}
                          className={`px-2 py-1 rounded-md text-[9px] font-black tracking-tighter transition-all ${
                            isAudioPlaying ? 'opacity-100 scale-100' : 'opacity-0 group-hover/doc:opacity-100 scale-95'
                          } ${
                            playbackSpeed === speed 
                              ? 'bg-accent text-ink shadow-sm' 
                              : (darkMode ? 'bg-zinc-800 text-white/40 hover:text-white border border-zinc-700' : 'bg-white text-ink/40 hover:text-ink hover:bg-zinc-100 border border-ink/5 shadow-sm')
                          }`}
                        >
                          {speed.toFixed(1)}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`markdown-body ${darkMode ? 'text-white' : ''}`}>
                    {renderAnnotatedText()}
                  </div>
                  <div className="absolute top-0 right-0 p-4 mono-label opacity-20">Ref: 0x{Math.floor(Math.random()*1000).toString(16)}</div>
                </motion.div>
              )}
              
              {annotations.length > 0 && !isProcessing && (
                <div className="mt-32 space-y-12">
                  <div className="flex items-center gap-6">
                    <span className="mono-label">{t.semanticMatrix}</span>
                    <div className="h-[1px] flex-1 bg-ink/5 dark:bg-white/5"></div>
                  </div>
                  
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-px border ${darkMode ? 'bg-zinc-800 border-zinc-800' : 'bg-ink/10 border-ink/10'}`}>
                    {annotations.map((ann, i) => (
                      <motion.div 
                        key={i}
                        className={`p-10 transition-colors group ${darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-accent'}`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <span className={`font-mono text-[10px] font-black px-3 py-1 uppercase tracking-wider transition-colors ${darkMode ? 'bg-zinc-800 text-white group-hover:bg-accent group-hover:text-ink' : 'bg-accent text-ink group-hover:bg-ink group-hover:text-white'}`}>{ann.word}</span>
                          <button onClick={() => handleTTS(`${ann.word}: ${ann.definition}`)} className={`p-2 border transition-colors ${isAudioPlaying ? 'border-rose-500 text-rose-500 bg-rose-500/5' : 'border-ink/5 hover:border-ink dark:border-white/5 dark:hover:border-white'}`}>
                            {isAudioPlaying ? <Square size={13} fill="currentColor" /> : <Volume2 size={13}/>}
                          </button>
                        </div>
                        <p className="text-base font-bold leading-[1.4] mb-8">{ann.definition}</p>
                        <div className="pt-6 border-t border-ink/5 dark:border-white/5">
                          <p className="text-[10px] font-mono font-bold opacity-30 mb-2 uppercase">{t.usageContext}</p>
                          <p className="text-[13px] font-medium opacity-60 leading-relaxed italic group-hover:opacity-100">"{ann.context}"</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* COLUMN 1 wrapper ends here */}
              </div>

              {/* COLUMN 2: Inline split note */}
              {showSplitNote && fileContent && (
                    <div className={`p-8 border rounded-[36px] sticky top-24 shadow-2xl space-y-6 flex flex-col ${darkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-white/80 border-zinc-150 backdrop-blur-md'}`}>
                      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                          <span className="text-[10px] uppercase font-black text-accent tracking-widest block">Double-Pane Desk</span>
                          <h5 className="text-sm font-black tracking-tight">{selectedLanguage === 'Korean' ? '✍️ 필기 밀착 통합 메모장' : '✍️ Double-Pane Study Notes'}</h5>
                        </div>
                        
                        <button
                          onClick={handleTriggerCornellCues}
                          disabled={!cornellNotes.trim() || isGeneratingCornellCues}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            isGeneratingCornellCues 
                              ? 'bg-zinc-800 text-zinc-600'
                              : 'bg-accent text-ink hover:scale-105 active:scale-95 shadow-lg shadow-accent/15'
                          }`}
                        >
                          <Sparkles size={11} className={isGeneratingCornellCues ? "animate-spin" : ""} />
                          <span>{isGeneratingCornellCues ? (selectedLanguage === 'Korean' ? '생성 전송 중...' : 'Generating...') : (selectedLanguage === 'Korean' ? 'AI 단서 추출' : 'Get AI Cues')}</span>
                        </button>
                      </div>

                      {/* Recall cues board */}
                      {cornellCues.length > 0 && (
                        <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-black/20 dark:border-zinc-800 max-h-48 overflow-y-auto">
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest block mb-1">💡 Real-time Cue Board</span>
                          {cornellCues.map((cue, idx) => {
                            const isExpanded = expandedCornellCueIdx === idx;
                            return (
                              <div 
                                key={idx} 
                                className={`p-3 rounded-xl border text-[11px] font-bold leading-relaxed transition-all cursor-pointer ${
                                  isExpanded 
                                    ? (darkMode ? 'bg-zinc-900 border-zinc-750 text-white' : 'bg-white border-zinc-200 text-ink')
                                    : (darkMode ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400' : 'bg-white/50 border-zinc-100 hover:bg-white text-zinc-500 shadow-sm')
                                }`}
                                onClick={() => setExpandedCornellCueIdx(isExpanded ? null : idx)}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex-1 text-left">
                                    <span className="text-[8px] font-mono opacity-50 block uppercase tracking-wide">Cue #{idx + 1} - {cue.targetRecallConcept}</span>
                                    <span className="text-zinc-905 dark:text-zinc-100">{cue.cueQuestion}</span>
                                  </div>
                                  <ChevronDown 
                                    size={12} 
                                    className={`transition-transform duration-300 mt-1 shrink-0 ${isExpanded ? 'rotate-180 text-accent' : 'opacity-40'}`} 
                                  />
                                </div>
                                {isExpanded && (
                                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold">
                                    <span className="text-[8px] font-black uppercase text-accent tracking-wider block mb-1">💡 Socratic Clue Directive</span>
                                    <p className="text-emerald-500 font-extrabold">{cue.hintText}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Real-time Cornell Notes field */}
                      <div className="flex flex-col flex-1 min-h-[300px] relative">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-2">
                          <span>Record Core Notes (실시간 코넬 필기란)</span>
                          <span>{cornellNotes.length} chars</span>
                        </div>

                        {/* Notes text selection toolbar for dual-way mindmap mirroring */}
                        {notesSelectionDetails && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-4 top-10 z-50 flex items-center gap-1.5 p-1 px-2.5 bg-accent text-ink rounded-xl shadow-[0_4px_16px_rgba(255,214,10,0.35)] border border-accent/20 font-black text-[9px] uppercase tracking-wider select-none animate-bounce"
                          >
                            <span>🗺️ "{notesSelectionDetails.text.length > 10 ? notesSelectionDetails.text.substring(0, 10) + '...' : notesSelectionDetails.text}"</span>
                            <button
                              onClick={handleSyncSelectedTextToMindmap}
                              className="px-2 py-1 bg-ink text-white rounded-lg font-extrabold cursor-pointer hover:bg-ink/80 transition-all text-[8px]"
                            >
                              {selectedLanguage === 'Korean' ? '지식 공간(마인드맵)에 노드로 동조화' : 'Sync to Concept Space'}
                            </button>
                            <button
                              onClick={() => setNotesSelectionDetails(null)}
                              className="p-1 px-1.5 hover:bg-ink/10 rounded-lg text-xs"
                            >
                              ✕
                            </button>
                          </motion.div>
                        )}

                        <textarea
                          ref={cornellNotesTextareaRef}
                          value={cornellNotes}
                          onSelect={handleNotesTextSelect}
                          onChange={(e) => {
                            setCornellNotes(e.target.value);
                            localStorage.setItem('study_cornell_notes', e.target.value);
                          }}
                          placeholder={
                            selectedLanguage === 'Korean' 
                              ? '화면 왼쪽의 학습 교안을 소리내어 읽으며, 핵심 공식이나 논리를 이곳에 자유롭게 필기하세요.\n\n💡 꿀팁: 학습자료에서 원하는 단락을 마우스로 드래그(또는 우클릭 드래그) 시 나타나는 형광펜 선택창에서 [필기장에 단서 추가]를 누르면 일일이 타자를 치지 않고도 인용구를 바로 발췌할 수 있습니다!'
                              : 'Process theories or write definitions as you read side-by-side with your materials.\n\n💡 Tip: Select text in the document viewer and click "Add to Notes" to clip the exact citation instantly!'
                          }
                          className={`w-full flex-1 p-5 rounded-[24px] border text-[13px] font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none ${
                            darkMode ? 'bg-black border-zinc-800 text-white placeholder-zinc-700' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400'
                          }`}
                        />
                      </div>

                      {/* Holistic summary */}
                      <div className="flex flex-col">
                        <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mb-2 flex justify-between items-center">
                          <span>Dynamic Review summary (최종 요약란)</span>
                          <span className="text-emerald-500 font-semibold">{selectedLanguage === 'Korean' ? '반복 인출 최적화' : 'Systemic Recap'}</span>
                        </div>
                        <textarea
                          value={cornellSummary}
                          onChange={(e) => {
                            setCornellSummary(e.target.value);
                            localStorage.setItem('study_cornell_summary', e.target.value);
                          }}
                          placeholder={
                            selectedLanguage === 'Korean' 
                              ? '학습을 마치고, 이 장에서 증명한 최종 원리나 요강을 1~2줄로 축약해 결론을 지으세요.'
                              : 'Summarize the core premise of this lesson in 1-2 powerful sentences to finish.'
                          }
                          rows={3}
                          className={`w-full p-4 rounded-xl border text-xs font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none ${
                            darkMode ? 'bg-black border-zinc-800 text-white placeholder-zinc-700' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  
                {/* Close the main split-grid wrapper */}
                </div>
            </div>

            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  onClick={scrollToTop}
                  className={`fixed bottom-8 right-8 z-50 p-4 rounded-2xl shadow-2xl transition-all hover:scale-110 active:scale-95 group ${
                    darkMode ? 'bg-white text-ink' : 'bg-ink text-white'
                  }`}
                  title={t.scrollToTop}
                >
                  <ArrowUp size={20} className="group-hover:-translate-y-1 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Sidebar */}
        <section className="w-full lg:w-[500px] flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto custom-scrollbar pr-2 pb-12">
          <div className={`p-6 rounded-[40px] border flex flex-col gap-4 shrink-0 transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-100 shadow-sm'} ${!showStats ? 'p-4' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-accent" />
                <span className="font-black text-xs uppercase tracking-widest">{t.insights}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-mono opacity-40 uppercase hidden sm:inline">{new Date().toLocaleDateString(selectedLanguage === 'Korean' ? 'ko-KR' : 'en-US')}</span>
                <button 
                  onClick={() => setShowStats(!showStats)}
                  className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'}`}
                >
                  <ChevronDown size={16} className={`transition-transform duration-500 ${showStats ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {showStats && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-ink/5'}`}>
                      <p className="text-[9px] font-mono font-black uppercase opacity-30 mb-1">{t.level}</p>
                      <p className="text-lg font-black tracking-tighter uppercase truncate">{level || '---'}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-ink/5'}`}>
                      <p className="text-[9px] font-mono font-black uppercase opacity-30 mb-1">{t.totalStudyTime}</p>
                      <p className="text-lg font-black tracking-tighter uppercase">{formatTime(totalStudyTime)}</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-ink/5'}`}>
                    <div className="flex items-center justify-between mb-3 border-b border-ink/5 dark:border-white/5 pb-2.5">
                      <p className="text-[9px] font-mono font-black uppercase opacity-35">
                        {selectedLanguage === 'Korean' ? '⏱️ 스터디 부스터 타이머' : '⏱️ Study Booster Timer'}
                      </p>
                      <div className="flex bg-zinc-200/50 dark:bg-zinc-900 gradient-border p-[2px] rounded-lg">
                        <button
                          type="button"
                          onClick={() => { setTimerMode('stopwatch'); setIsTimerActive(false); }}
                          className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-all ${timerMode === 'stopwatch' ? 'bg-white dark:bg-zinc-800 text-ink dark:text-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                        >
                          {selectedLanguage === 'Korean' ? '일반 스톱워치' : 'Stopwatch'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTimerMode('pomodoro'); setIsTimerActive(false); setPomodoroTimeLeft(1500); setPomodoroSession('focus'); }}
                          className={`px-2 py-1 text-[9px] font-black uppercase rounded-md transition-all ${timerMode === 'pomodoro' ? 'bg-white dark:bg-zinc-800 text-ink dark:text-white shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                        >
                          {selectedLanguage === 'Korean' ? '25분 뽀모도로' : 'Pomodoro'}
                        </button>
                      </div>
                    </div>

                    {timerMode === 'stopwatch' ? (
                      <div>
                        <div className="flex items-center justify-between">
                           <p className="text-lg font-black tracking-tighter font-mono">{formatTime(secondsElapsed)}</p>
                           <div className="flex gap-1">
                              <button 
                                onClick={() => setIsTimerActive(!isTimerActive)}
                                className={`p-2 rounded-xl transition-all ${isTimerActive ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-accent text-ink'}`}
                              >
                                {isTimerActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                              </button>
                              <button 
                                onClick={handleSaveStudyLog}
                                disabled={secondsElapsed === 0}
                                className="p-2 rounded-xl bg-emerald-500 text-white disabled:opacity-30 transition-all hover:scale-105"
                                title={t.stopAndSave}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              <button 
                                onClick={handleResetTimer}
                                className="p-2 rounded-xl border border-ink/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5"
                              >
                                <RotateCcw size={14} />
                              </button>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${pomodoroSession === 'focus' ? 'bg-rose-500 animate-pulse' : 'bg-teal-400 animate-pulse'}`}></span>
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {pomodoroSession === 'focus' 
                                ? (selectedLanguage === 'Korean' ? '🔥 몰입 집중 주기' : '🔥 Focus Interval') 
                                : (selectedLanguage === 'Korean' ? '🌿 리프레시 휴식' : '🌿 Relax Intermission')}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold opacity-40">
                            {pomodoroSession === 'focus' ? '25:00' : '05:00'}
                          </span>
                        </div>

                        {/* Custom Visual Bar Gauge */}
                        <div className="h-1.5 w-full bg-zinc-200/50 dark:bg-zinc-950 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${pomodoroSession === 'focus' ? 'bg-rose-500' : 'bg-teal-400'}`}
                            style={{ width: `${(pomodoroTimeLeft / (pomodoroSession === 'focus' ? 1500 : 300)) * 100}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black tracking-tighter font-mono">
                            {Math.floor(pomodoroTimeLeft / 60).toString().padStart(2, '0')}:{(pomodoroTimeLeft % 60).toString().padStart(2, '0')}
                          </p>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                setIsTimerActive(!isTimerActive);
                                if (!isTimerActive && pomodoroSession === 'focus' && !isFocusSoundPlaying) {
                                  setIsFocusSoundPlaying(true);
                                }
                              }}
                              className={`p-2 rounded-xl transition-all ${isTimerActive ? 'bg-rose-500 text-white shadow-lg' : 'bg-accent text-ink'}`}
                            >
                              {isTimerActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                            </button>
                            <button 
                              onClick={() => {
                                setIsTimerActive(false);
                                setPomodoroTimeLeft(pomodoroSession === 'focus' ? 1500 : 300);
                              }}
                              className="p-2 rounded-xl border border-ink/10 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5"
                            >
                              <RotateCcw size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`p-6 rounded-3xl border flex flex-col gap-6 ${darkMode ? 'bg-zinc-800/30 border-white/5' : 'bg-zinc-50/50 border-ink/5'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <Trophy size={16} className="text-accent" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{t.statisticsTitle}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 rounded-full">
                          <Sparkles size={10} className="text-accent" />
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest">{getStudyStreak()} {t.days} {t.studyStreak}</span>
                      </div>
                    </div>
                    
                    <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getWeeklyData()}>
                            <Tooltip 
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className={`p-3 rounded-xl border shadow-xl text-[10px] font-bold ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                                      <p className="opacity-40 mb-1">{payload[0].payload.fullDate}</p>
                                      <p>{payload[0].value} {t.minutes}</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="minutes" radius={[4, 4, 4, 4]}>
                              {getWeeklyData().map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={index === 6 ? '#FFD60A' : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')} 
                                />
                              ))}
                            </Bar>
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 9, fontWeight: 800, fill: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} 
                              dy={10}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-ink/5 dark:border-white/5">
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                          <span className="opacity-40">{t.conceptMastery}</span>
                          <span className="text-accent">{Math.round((viewedAnnotations.size / (annotations.length || 1)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(viewedAnnotations.size / (annotations.length || 1)) * 100}%` }}
                              className="h-full bg-accent shadow-[0_0_10px_rgba(255,214,10,0.5)]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-bold">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-accent" />
                             <span className="opacity-40">{t.learnedWords}: {viewedAnnotations.size}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                             <span className="opacity-40">{t.remainingWords}: {Math.max(0, annotations.length - viewedAnnotations.size)}</span>
                          </div>
                      </div>

                      <div>
                          <div className="flex gap-1 flex-wrap">
                             {annotations.map((ann, idx) => (
                               <motion.div 
                                 key={idx}
                                 initial={{ scale: 0 }}
                                 animate={{ scale: 1 }}
                                 transition={{ delay: idx * 0.02 }}
                                 className={`w-4 h-4 rounded-[4px] shadow-sm transition-all hover:scale-125 cursor-help ${viewedAnnotations.has(ann.word) ? 'bg-accent' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                                 title={ann.word}
                               />
                             ))}
                          </div>
                      </div>
                    </div>

                    {studyLogs.length > 0 && (
                      <div className="pt-4 border-t border-ink/5 dark:border-white/5">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-4">{t.recentSessions}</p>
                          <div className="space-y-2">
                             {studyLogs.slice().reverse().slice(0, 10).map((log, i) => {
                               const actualIdx = studyLogs.length - 1 - i;
                               return (
                                 <div key={i} className="group flex justify-between items-center text-[10px] font-bold py-1 border-b border-ink/5 dark:border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="opacity-60">{format(new Date(log.date), 'MMM dd, HH:mm')}</span>
                                      <span className="opacity-40">{log.fileName || 'Untitled'}</span>
                                      <button 
                                        onClick={() => deleteStudyLog(actualIdx)}
                                        className="p-1 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                                        title="Delete"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                    <span className="opacity-40 uppercase tracking-tighter">{log.level}</span>
                                 </div>
                               );
                             })}
                          </div>
                      </div>
                    )}

                    {/* Weekly Diagnostic Letter Button */}
                    <div className="pt-4 border-t border-ink/5 dark:border-white/5 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-35">{t.weeklyLetterTitle}</p>
                      
                      {weeklyLetter && (
                        <button
                          onClick={() => setShowWeeklyLetterModal(true)}
                          className="w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all bg-accent/15 text-accent border border-accent/25 flex items-center justify-center gap-2 hover:bg-accent/25 active:scale-95"
                        >
                          <Trophy size={14} className="text-accent" />
                          {t.viewLetter} ({weeklyLetter.date})
                        </button>
                      )}

                      <button
                        onClick={handleGenerateWeeklyLetter}
                        disabled={isGeneratingWeeklyLetter}
                        className={`w-full py-4 rounded-[20px] text-xs font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 ${
                          darkMode ? 'bg-white text-ink hover:bg-accent' : 'bg-ink text-white hover:bg-accent hover:text-ink'
                        }`}
                      >
                        {isGeneratingWeeklyLetter ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {selectedLanguage === 'Korean' ? 'AI 학습 진단서 진맥 중...' : 'Analyzing study diagnostics...'}
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="text-accent" />
                            {t.weeklyLetterBtn}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 학습 플래너 및 데일리 골 스트리크 (Study Goal & Streak Tracker) */}
          <div className={`p-6 rounded-[40px] border flex flex-col gap-5 transition-all ${darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-100 shadow-sm'}`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                  <Zap size={16} fill="currentColor" />
                </div>
                <div>
                  <h5 className="font-extrabold text-[12px] uppercase tracking-widest text-ink dark:text-white">
                    {selectedLanguage === 'Korean' ? '데일리 골 스트리크 플래너' : 'Daily Goal & Streak Planner'}
                  </h5>
                  <p className="text-[9px] opacity-45">
                    {selectedLanguage === 'Korean' ? '당일 미션을 통과하고 연속 불꽃 스트리크를 지켜내세요!' : 'Keep your daily educational focus alive.'}
                  </p>
                </div>
              </div>

              {/* Goal Streak fire indicator */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider ${
                goalStreak > 0 
                  ? 'bg-amber-500/10 text-amber-500 animate-pulse' 
                  : (darkMode ? 'bg-zinc-805 text-zinc-500' : 'bg-zinc-100 text-zinc-400')
              }`}>
                <span>🔥 {goalStreak} {selectedLanguage === 'Korean' ? '일 연속 불꽃' : 'Day Streak'}</span>
              </div>
            </div>

            {/* General progress bar */}
            {studyGoals.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[9px] font-extrabold uppercase tracking-widest">
                  <span className="opacity-40">{selectedLanguage === 'Korean' ? '오늘의 완수 퍼센트' : 'Task Completion Percent'}</span>
                  <span className="text-accent">{Math.round((studyGoals.filter(g => g.completed).length / studyGoals.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-850">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(studyGoals.filter(g => g.completed).length / studyGoals.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  />
                </div>
              </div>
            )}

            {/* Checklist of goal items */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
              {studyGoals.map((goal) => (
                <div 
                  key={goal.id} 
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    goal.completed 
                      ? (darkMode ? 'bg-zinc-950/20 border-emerald-900/60 opacity-60' : 'bg-emerald-50/10 border-emerald-100/60 opacity-80')
                      : (darkMode ? 'bg-zinc-850/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150')
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Checkbox Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setStudyGoals(prev => prev.map(g => {
                          if (g.id === goal.id) {
                            const nextCompleted = !g.completed;
                            return { 
                              ...g, 
                              completed: nextCompleted, 
                              current: nextCompleted ? g.target : 0 
                            };
                          }
                          return g;
                        }));
                      }}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        goal.completed 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : (darkMode ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-900' : 'border-zinc-300 hover:border-zinc-400 bg-white')
                      }`}
                    >
                      {goal.completed && <CheckCircle2 size={12} className="text-white" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate leading-tight ${goal.completed ? 'line-through text-zinc-400 dark:text-zinc-650' : ''}`}>
                        {goal.title}
                      </p>
                      <p className="text-[8px] opacity-40 uppercase tracking-wider font-mono mt-0.5">
                        {goal.type === 'time' ? `${selectedLanguage === 'Korean' ? '집중도' : 'Focus'}: ` : 
                         goal.type === 'quiz' ? `${selectedLanguage === 'Korean' ? '퀴즈' : 'Quizzes'}: ` : 
                         goal.type === 'flashcard' ? `${selectedLanguage === 'Korean' ? '카드 암기' : 'Cards Reviewed'}: ` : 
                         goal.type === 'graph' ? `${selectedLanguage === 'Korean' ? '지식 브릿지' : 'Graph Nodes'}: ` : 
                         `${selectedLanguage === 'Korean' ? '커스텀 목표' : 'Custom Goal'}: `}
                        {goal.current} / {goal.target}
                      </p>
                    </div>
                  </div>

                  {/* Remove button */}
                  {goal.type === 'custom' && (
                    <button
                      type="button"
                      onClick={() => setStudyGoals(prev => prev.filter(g => g.id !== goal.id))}
                      className="p-1 opacity-40 hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Goal input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!customGoalInput.trim()) return;
                const newGoal = {
                  id: `g_cust_${Date.now()}`,
                  title: `📝 ${customGoalInput.trim()}`,
                  target: 1,
                  current: 0,
                  type: 'custom',
                  completed: false
                };
                setStudyGoals(prev => [...prev, newGoal]);
                setCustomGoalInput('');
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                value={customGoalInput}
                onChange={(e) => setCustomGoalInput(e.target.value)}
                placeholder={selectedLanguage === 'Korean' ? '나만의 학습 할 일 데스크 추가...' : 'Add custom study checklist task...'}
                className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-accent ${
                  darkMode ? 'bg-zinc-850 border-zinc-800 text-zinc-200 placeholder-zinc-700' : 'bg-zinc-150 border-zinc-200 placeholder-zinc-400'
                }`}
              />
              <button
                type="submit"
                className="px-3 rounded-xl bg-accent text-ink font-black text-xs uppercase flex items-center justify-center cursor-pointer transition-all active:scale-95"
              >
                +
              </button>
            </form>

            {/* Reset study goals panel buttons */}
            <div className="flex justify-between items-center text-[9px] font-bold opacity-50 pt-1">
              <span>
                {lastGoalCompletionDate === new Date().toDateString() 
                  ? (selectedLanguage === 'Korean' ? '🎉 오늘 스트리크 불꽃 달성 완료!' : '🎉 Streak secured for today!') 
                  : (selectedLanguage === 'Korean' ? '오늘의 불꽃이 미완료 상태입니다 ⚡' : 'Streak awaits completion ⚡')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(selectedLanguage === 'Korean' ? '데일리 대시보드로 플래너를 전격 리셋하시겠습니까?' : 'Reset planner checklist values?')) {
                    setStudyGoals([
                      { id: 'g_time', title: '⏱️ 총 20분 이상 집중 학습하기', target: 20, current: 0, type: 'time', completed: false },
                      { id: 'g_quiz', title: '✍️ 성취도 평가 퀴즈 3회 이상 풀기', target: 3, current: 0, type: 'quiz', completed: false },
                      { id: 'g_flashcard', title: '🎴 스마트 플래시카드 5회 이상 숙달', target: 5, current: 0, type: 'flashcard', completed: false },
                      { id: 'g_graph', title: '🕸️ 지식 공간에서 단어 노드/브릿지 만들기', target: 1, current: 0, type: 'graph', completed: false }
                    ]);
                  }
                }}
                className="hover:text-rose-500 font-extrabold uppercase tracking-widest cursor-pointer"
              >
                [ {selectedLanguage === 'Korean' ? '리셋' : 'RESET'} ]
              </button>
            </div>
          </div>

          <div className={`p-1.5 flex flex-wrap gap-1 rounded-[24px] border shrink-0 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'glass-panel'}`}>
            <button 
              onClick={() => setActiveTab('study')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'study' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'study' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'study' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {t.contextHub}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'quiz' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'quiz' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'quiz' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {t.quiz}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('flashcards')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'flashcards' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'flashcards' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'flashcards' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {t.flashcards}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('spatial')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'spatial' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'spatial' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'spatial' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {t.spatialMemory}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('audiobook')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'audiobook' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'audiobook' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'audiobook' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {t.auditory}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('collab')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'collab' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'collab' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'collab' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {t.collab}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('recall')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'recall' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'recall' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'recall' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {selectedLanguage === 'Korean' ? '🧠 백지 인출' : '🧠 Recall'}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('ebbinghaus')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'ebbinghaus' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'ebbinghaus' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'ebbinghaus' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {selectedLanguage === 'Korean' ? '📅 복습 주기' : '📅 Ebbinghaus'}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('mistake-diary')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'mistake-diary' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'mistake-diary' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'mistake-diary' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {selectedLanguage === 'Korean' ? '📝 오개념 오답' : '📝 Mistake Diary'}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('cornell')}
              className={`flex-1 min-w-[100px] py-2.5 text-[11px] font-bold rounded-[18px] transition-all relative ${activeTab === 'cornell' ? (darkMode ? 'text-white' : 'text-ink') : (darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink')}`}
            >
              {activeTab === 'cornell' && <motion.div layoutId="activeTab" className={`absolute inset-0 z-0 rounded-[18px] ${darkMode ? 'bg-zinc-800' : 'bg-zinc-50'}`} />}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {activeTab === 'cornell' && <span className="w-1 h-1 bg-accent rounded-full" />}
                {selectedLanguage === 'Korean' ? '✍️ 코넬 필기' : '✍️ Cornell Notes'}
              </span>
            </button>
          </div>

          <div className={`flex flex-col p-5 relative rounded-[40px] border transition-colors ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'glass-panel'}`}>
            <AnimatePresence mode="wait">
              {activeTab === 'study' ? (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 custom-scrollbar text-sm">
                    {messages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                        <MessageSquare size={40} className="mb-4" />
                        <p className="font-bold">{t.academicDialogue}</p>
                        <p className="text-xs px-10 mt-2 leading-relaxed">{t.dialogueDesc(level)}</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-2xl leading-relaxed relative group ${
                          msg.role === 'user' 
                            ? 'bg-ink text-white' 
                            : (darkMode ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-50 border border-zinc-100')
                        }`}>
                          {msg.text || <div className="flex gap-1.5 py-1"><span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce delay-75"></span><span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce delay-150"></span></div>}
                          {msg.role === 'model' && msg.text && (
                            <button 
                              onClick={() => handleTTS(msg.text)}
                              className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ${isAudioPlaying ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-ink/20 hover:text-ink dark:text-white/20 dark:hover:text-white'}`}
                            >
                              {isAudioPlaying ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {insights && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 space-y-4"
                    >
                      <div className="flex items-center gap-3 px-4">
                        <span className="mono-label text-accent">{t.insights}</span>
                        <div className="h-[px] flex-1 bg-ink/5 dark:bg-white/5"></div>
                      </div>
                      
                      <div className="space-y-2 px-4 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.suggestedQs}</p>
                        {insights.suggestedQuestions.map((q, idx) => (
                          <button 
                            key={idx}
                            onClick={() => {
                              setInputText(q);
                              // We can't easily call handleSendMessage from here without refactoring
                              // or just setting text and letting user press enter.
                              // Actually, I'll just set the text.
                            }}
                            className={`w-full p-4 rounded-2xl text-left text-[11px] font-bold border transition-all ${
                              darkMode ? 'bg-zinc-800/40 border-zinc-700 hover:border-accent' : 'bg-zinc-50 border-zinc-100 hover:border-accent'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="shrink-0 relative border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t.explainConcepts}
                        className={`flex-1 border-none rounded-2xl px-6 py-3.5 text-sm font-medium outline-none placeholder:text-ink/20 focus:ring-2 ring-accent/50 transition-all ${darkMode ? 'bg-zinc-800 text-white' : 'bg-zinc-50 text-ink'}`}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-20 transition-all shadow-lg ${darkMode ? 'bg-white text-ink hover:bg-accent' : 'bg-ink text-white hover:bg-accent hover:text-ink'}`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'quiz' ? (
                <motion.div 
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  {/* Mistake Note vs Quiz Toggle */}
                  <div className="flex gap-1.5 mb-6 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800 bg-zinc-100/55 dark:bg-zinc-800/50 shrink-0">
                    <button 
                      onClick={() => setQuizSubTab('solve')}
                      className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all relative ${
                        quizSubTab === 'solve' 
                          ? 'bg-white dark:bg-zinc-850 text-ink dark:text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250'
                      }`}
                    >
                      {selectedLanguage === 'Korean' ? 'AI 퀴즈 평가' : 'Assessment'}
                    </button>
                    <button 
                      onClick={() => setQuizSubTab('mistake')}
                      className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative ${
                        quizSubTab === 'mistake' 
                          ? 'bg-white dark:bg-zinc-855 text-ink dark:text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-250'
                      }`}
                    >
                      {t.mistakeNotes}
                      <span className="px-1.5 py-0.5 rounded-full bg-red-400 text-[9px] font-mono font-bold text-white leading-none">
                        {mistakeQuestions.length}
                      </span>
                    </button>
                  </div>

                  {quizSubTab === 'mistake' ? (
                    <motion.div 
                      key="mistake-sub-tab"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col"
                    >
                      {/* 1. Custom AI Tutor Persona Selection Panel */}
                      <div className={`p-4 rounded-3xl border mb-5 transition-all ${darkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-zinc-50 border-zinc-150 shadow-sm'}`}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className="p-1.5 bg-accent/15 rounded-xl text-accent">
                            <Sparkles size={14} className="animate-spin" />
                          </div>
                          <div>
                            <h6 className="font-extrabold text-[11px] uppercase tracking-wider text-ink dark:text-white">
                              {selectedLanguage === 'Korean' ? 'AI 밀착 해설 과외 버디 페르소나 선택' : 'Custom AI Tutor Buddy Persona'}
                            </h6>
                            <p className="text-[9px] opacity-50">
                              {selectedLanguage === 'Korean' ? '원하는 설명 스타일의 튜터를 클릭하고 AI 피드백을 받아보세요.' : 'Click to select a tutoring companion in real time.'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { id: 'cherry', name: selectedLanguage === 'Korean' ? '🍒 선배 체리' : '🍒 Cherry', badge: 'Warm Buddy', hover: 'text-rose-400 border-rose-100 dark:border-rose-950/40 bg-rose-50/10 dark:bg-rose-950/5' },
                            { id: 'tiger', name: selectedLanguage === 'Korean' ? '🐅 호랑이 교관' : '🐅 Coach Tiger', badge: 'Spartan Drive', hover: 'text-red-500 border-red-100 dark:border-red-950/40 bg-red-50/10 dark:bg-red-950/5' },
                            { id: 'socrates', name: selectedLanguage === 'Korean' ? '🦉 현자 솔' : '🦉 Sages Sol', badge: 'Socratic Logic', hover: 'text-indigo-400 border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/10 dark:bg-indigo-950/5' },
                            { id: 'teo', name: selectedLanguage === 'Korean' ? '🌟 일타 강사' : '🌟 Coach Teo', badge: 'Exam Hacker', hover: 'text-amber-400 border-amber-100 dark:border-amber-950/40 bg-amber-50/10 dark:bg-amber-950/5' }
                          ].map(buddy => (
                            <button
                              key={buddy.id}
                              type="button"
                              onClick={() => setTutorPersona(buddy.id as any)}
                              className={`p-2.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                                tutorPersona === buddy.id 
                                  ? `${buddy.hover} border-current ring-1 ring-current font-black` 
                                  : `${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'}`
                              }`}
                            >
                              <span className="text-xs font-bold leading-none">{buddy.name}</span>
                              <span className="text-[8px] opacity-65 leading-none mt-1">{buddy.badge}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Interactive Search & Filters Panel */}
                      <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <input
                          type="text"
                          placeholder={selectedLanguage === 'Korean' ? '오답 질의 내용 검색...' : 'Search mistake queries...'}
                          value={mistakeSearchQuery}
                          onChange={(e) => setMistakeSearchQuery(e.target.value)}
                          className={`flex-1 px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-accent ${
                            darkMode ? 'bg-zinc-850 border-zinc-805 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 placeholder-zinc-400'
                          }`}
                        />
                        <div className="flex gap-1 shrink-0">
                          {[
                            { id: 'all', label: selectedLanguage === 'Korean' ? '전체' : 'All' },
                            { id: 'review', label: selectedLanguage === 'Korean' ? '💔 복습 대상' : '💔 Review' },
                            { id: 'mastered', label: selectedLanguage === 'Korean' ? '❤️ 마스터' : '❤️ Mastered' }
                          ].map((btn) => (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => setMistakeFilter(btn.id as any)}
                              className={`px-3 py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
                                mistakeFilter === btn.id 
                                  ? 'bg-accent border-accent text-ink' 
                                  : (darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-150 text-zinc-650')
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Empty State or Items list */}
                      {mistakeQuestions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-12">
                          <div className="w-20 h-20 bg-emerald-500/10 rounded-[28px] flex items-center justify-center mb-6 text-emerald-500 animate-bounce">
                            <CheckCircle2 size={40} />
                          </div>
                          <p className="text-sm font-bold opacity-80 mb-2 leading-relaxed max-w-[240px]">
                            {t.mistakesEmpty}
                          </p>
                        </div>
                      ) : (
                        <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar pb-10">
                          {mistakeQuestions.filter(mistake => {
                            const matchesSearch = mistake.question.toLowerCase().includes(mistakeSearchQuery.toLowerCase());
                            const isMastered = mistake.reviewStatus === 'mastered' || mistake.confidence === 5;
                            if (mistakeFilter === 'review') return matchesSearch && !isMastered;
                            if (mistakeFilter === 'mastered') return matchesSearch && isMastered;
                            return matchesSearch;
                          }).map((mistake) => {
                            const isMistakeMastered = mistake.reviewStatus === 'mastered' || mistake.confidence === 5;
                            return (
                              <div 
                                key={mistake.id} 
                                className={`p-5 rounded-3xl border transition-all ${
                                  isMistakeMastered 
                                    ? (darkMode ? 'bg-zinc-900/50 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50/15 border-emerald-100 shadow-sm')
                                    : (darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-100 shadow-sm')
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3 gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono opacity-40 uppercase tracking-widest">{mistake.timestamp}</span>
                                    {isMistakeMastered ? (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-extrabold uppercase text-emerald-500 border border-emerald-500/20">
                                        {selectedLanguage === 'Korean' ? '완가이드 마스터' : 'Mastered'}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-[8px] font-extrabold uppercase text-rose-500 border border-rose-500/20">
                                        {selectedLanguage === 'Korean' ? '집중 복습' : 'Needs Review'}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => deleteMistakeQuestion(mistake.id)}
                                    className="p-1.5 opacity-40 hover:opacity-100 text-rose-500 rounded-lg hover:bg-rose-500/10 transition-all active:scale-95"
                                    title="Clear Mistake"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <h5 className="font-bold text-sm tracking-tight leading-relaxed mb-4">{mistake.question}</h5>
                                
                                <div className="space-y-2 mb-4">
                                  {mistake.options.map((opt, i) => {
                                    let optStyle = "opacity-55 border-transparent";
                                    let optIcon = null;
                                    if (opt === mistake.userAnswer) {
                                      optStyle = "bg-rose-500/10 border-rose-500/35 text-rose-500 opacity-100";
                                      optIcon = <AlertCircle size={14} />;
                                    } else if (opt === mistake.correctAnswer) {
                                      optStyle = "bg-accent/15 border-accent/40 text-ink dark:text-accent opacity-100 font-bold";
                                      optIcon = <CheckCircle2 size={14} className="text-accent" />;
                                    }
                                    return (
                                      <div key={i} className={`p-3 rounded-xl border text-xs font-semibold flex justify-between items-center ${optStyle}`}>
                                        <span>{opt}</span>
                                        {optIcon}
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-4">
                                  <p className="font-extrabold text-[9px] uppercase tracking-widest opacity-40 mb-1">Standard Explanation</p>
                                  {mistake.explanation}
                                </div>

                                {/* 4. Interactive Confidence Slider Metric */}
                                <div className="flex flex-col gap-1.5 border-t border-zinc-100 dark:border-zinc-850 pt-3 mt-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-accent">{selectedLanguage === 'Korean' ? '지식 완전 마스터 각인 수준' : 'Knowledge Comprehension Score'}</span>
                                    <span className="text-[9px] font-mono font-bold">
                                      {mistake.confidence ? `${mistake.confidence} / 5` : (selectedLanguage === 'Korean' ? '미설정 (오답)' : 'Not Set')}
                                    </span>
                                  </div>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((lvl) => {
                                      let textLvl = '';
                                      if (selectedLanguage === 'Korean') {
                                        textLvl = lvl === 1 ? '난동 💔' : lvl === 3 ? '애매 💛' : lvl === 5 ? '마스터 ❤️' : `${lvl}`;
                                      } else {
                                        textLvl = lvl === 1 ? 'Confused' : lvl === 3 ? 'Vague' : lvl === 5 ? 'Mastered' : `${lvl}`;
                                      }
                                      return (
                                        <button
                                          key={lvl}
                                          type="button"
                                          onClick={() => {
                                            setMistakeQuestions(prev => prev.map(m => m.id === mistake.id ? { 
                                              ...m, 
                                              confidence: lvl, 
                                              reviewStatus: lvl === 5 ? 'mastered' : 'review' 
                                            } : m));
                                          }}
                                          className={`flex-1 py-1.5 text-[8px] font-black rounded-lg border transition-all cursor-pointer ${
                                            mistake.confidence === lvl 
                                              ? 'bg-accent border-accent text-ink font-extrabold shadow-sm' 
                                              : (darkMode ? 'bg-zinc-850 border-zinc-805 text-zinc-500 hover:text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-zinc-900')
                                          }`}
                                        >
                                          {textLvl}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 5. Error Mechanism Cause Tags */}
                                <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-accent">{selectedLanguage === 'Korean' ? '내재적 실수 메커니즘 차트 태그' : 'My Mistake Factor Tags'}</span>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { id: 'typo', label: selectedLanguage === 'Korean' ? '📝 단순 자비 실수' : '📝 Sliph/Typo' },
                                      { id: 'misconception', label: selectedLanguage === 'Korean' ? '📚 기초 개념 혼선' : '📚 Core Concept Gap' },
                                      { id: 'trick', label: selectedLanguage === 'Korean' ? '💀 출제자 함정 걸림' : '💀 Classic Trap' },
                                      { id: 'time', label: selectedLanguage === 'Korean' ? '⌛ 서두르다 시간 압박' : '⌛ Urgent Time-rush' }
                                    ].map((tag) => {
                                      const hasTag = mistake.tags?.includes(tag.id);
                                      return (
                                        <button
                                          key={tag.id}
                                          type="button"
                                          onClick={() => {
                                            const currentTags = mistake.tags || [];
                                            const nextTags = currentTags.includes(tag.id) 
                                              ? currentTags.filter(t => t !== tag.id) 
                                              : [...currentTags, tag.id];
                                            setMistakeQuestions(prev => prev.map(m => m.id === mistake.id ? { ...m, tags: nextTags } : m));
                                          }}
                                          className={`px-2.5 py-1 rounded-xl text-[8px] font-bold border transition-all cursor-pointer ${
                                            hasTag 
                                              ? 'bg-accent border-accent text-ink shadow-sm font-black' 
                                              : (darkMode ? 'bg-zinc-950/50 border-zinc-850 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500')
                                          }`}
                                        >
                                          {tag.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 6. Pencil Custom Study Annotation */}
                                <div className="flex flex-col gap-1.5 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-850">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-accent">{selectedLanguage === 'Korean' ? '✍️ 오답 연상 펜 노트 (Personal Takeaway)' : '✍️ Personal Memory Notes'}</span>
                                  <textarea
                                    value={mistake.userNotes || ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setMistakeQuestions(prev => prev.map(m => m.id === mistake.id ? { ...m, userNotes: val } : m));
                                    }}
                                    placeholder={selectedLanguage === 'Korean' ? '다시는 틀리지 않게 이 문제를 마주했을 때 떠올릴 공식을 적어보세요...' : 'Memory association formula or warning tips for future revisions...'}
                                    rows={1}
                                    className={`w-full p-2.5 rounded-xl text-[10px] font-medium transition-all ${
                                      darkMode ? 'bg-zinc-950/60 border-zinc-850 text-white placeholder-zinc-700' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400'
                                    }`}
                                  />
                                </div>

                                {/* 7. Blind Re-solve Simulation Frame */}
                                {activeResolveChallengeId === mistake.id ? (
                                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-accent/30 flex flex-col gap-3 mt-4 animate-fadeIn">
                                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                      <span className="text-[9px] font-black uppercase text-accent tracking-widest">{selectedLanguage === 'Korean' ? '🎯 지문 블라인드 오답 재도전 시뮬레이터' : '🎯 Blind Resolve Challenge'}</span>
                                      <button 
                                        onClick={() => {
                                          setActiveResolveChallengeId(null);
                                          setSelectedChallengeOption(null);
                                          setChallengeFeedback(null);
                                        }}
                                        className="text-xs font-mono font-extrabold hover:text-red-500 p-1"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                      {mistake.options.map((opt, oIdx) => (
                                        <button
                                          key={oIdx}
                                          type="button"
                                          disabled={challengeFeedback !== null}
                                          onClick={() => setSelectedChallengeOption(opt)}
                                          className={`w-full p-2.5 rounded-xl border text-left text-xs transition-style flex justify-between items-center cursor-pointer ${
                                            selectedChallengeOption === opt 
                                              ? 'border-accent bg-accent/10 font-black text-ink dark:text-accent' 
                                              : (darkMode ? 'bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white' : 'bg-white border-zinc-150 text-ink hover:bg-zinc-50')
                                          }`}
                                        >
                                          <span>{opt}</span>
                                        </button>
                                      ))}
                                    </div>
                                    
                                    {challengeFeedback === null ? (
                                      <button
                                        type="button"
                                        disabled={!selectedChallengeOption}
                                        onClick={() => {
                                          const correct = selectedChallengeOption === mistake.correctAnswer;
                                          setChallengeFeedback(correct ? 'correct' : 'incorrect');
                                          if (correct) {
                                            setMistakeQuestions(prev => prev.map(m => m.id === mistake.id ? { 
                                              ...m, 
                                              reviewStatus: 'mastered',
                                              confidence: 5,
                                              resolvedAttemptsCount: (m.resolvedAttemptsCount || 0) + 1 
                                            } : m));
                                          } else {
                                            setMistakeQuestions(prev => prev.map(m => m.id === mistake.id ? { 
                                              ...m, 
                                              resolvedAttemptsCount: (m.resolvedAttemptsCount || 0) + 1 
                                            } : m));
                                          }
                                        }}
                                        className={`py-2 p-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer ${
                                          darkMode ? 'bg-white text-ink' : 'bg-ink text-white'
                                        }`}
                                      >
                                        {selectedLanguage === 'Korean' ? '정답 제출 및 즉석 채점' : 'Submit for Scoring'}
                                      </button>
                                    ) : (
                                      <div className="flex flex-col gap-2 items-center text-center mt-1">
                                        {challengeFeedback === 'correct' ? (
                                          <div className="text-emerald-500 font-extrabold text-xs flex items-center gap-1.5">
                                            <CheckCircle2 size={14} />
                                            <span>{selectedLanguage === 'Korean' ? '정답입니다! 마스터 표식 ❤️으로 연계 갱신.' : 'Excellent! Automatically promoted to Mastered.'}</span>
                                          </div>
                                        ) : (
                                          <div className="text-rose-500 font-extrabold text-xs flex items-center gap-1.5">
                                            <AlertCircle size={14} />
                                            <span>{selectedLanguage === 'Korean' ? '틀렸습니다! 우측 상단의 AI 피드백 해설을 복습하세요.' : 'Incorrect. Study the tutoring tips again.'}</span>
                                          </div>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveResolveChallengeId(null);
                                            setSelectedChallengeOption(null);
                                            setChallengeFeedback(null);
                                          }}
                                          className="px-4 py-1.5 bg-accent text-ink rounded-xl font-bold text-[9px] uppercase tracking-wider mt-1 cursor-pointer"
                                        >
                                          {selectedLanguage === 'Korean' ? '닫기' : 'Done'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActiveResolveChallengeId(mistake.id);
                                      setSelectedChallengeOption(null);
                                      setChallengeFeedback(null);
                                    }}
                                    className={`py-2.5 rounded-2xl text-[10px] uppercase tracking-wider transition-all border block text-center w-full mt-4 flex items-center justify-center gap-2 cursor-pointer ${
                                      darkMode ? 'bg-zinc-850 hover:bg-white hover:text-ink' : 'bg-zinc-50 hover:bg-ink hover:text-white'
                                    }`}
                                  >
                                    <Trophy size={11} className="text-accent animate-bounce" />
                                    <span>{selectedLanguage === 'Korean' ? '🧠 백지 상태 복습: 블라인드 즉석 재풀이 도전' : '🧠 Blind Challenge: Re-solve From Scratch'}</span>
                                  </button>
                                )}

                                {/* Tutors Persona Styled Feedback Display box */}
                                <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-850">
                                  {mistake.aiFeedback ? (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                      className="p-5 rounded-2xl bg-accent/10 border border-accent/20 text-xs font-medium leading-relaxed text-ink dark:text-white"
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={12} className="text-accent animate-pulse" />
                                        <span className="font-black uppercase tracking-widest text-[9px] text-accent">
                                          {tutorPersona === 'cherry' ? '🍒 Cherry Senior Guide' : 
                                           tutorPersona === 'tiger' ? '🐅 Steel Coach Tiger Tips' : 
                                           tutorPersona === 'socrates' ? '🦉 Socratic Sage Analysis' : 
                                           '🌟 Expert Teo Exam Hacks'}
                                        </span>
                                      </div>
                                      <p className="whitespace-pre-line leading-relaxed">{mistake.aiFeedback}</p>
                                    </motion.div>
                                  ) : (
                                    <button
                                      onClick={() => handleGetMistakeFeedback(mistake.id)}
                                      disabled={loadingMistakeFeedbackId === mistake.id}
                                      className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                                        darkMode ? 'bg-zinc-850 border-zinc-800 text-white hover:bg-white hover:text-ink' : 'bg-zinc-50 border-zinc-200 text-ink hover:bg-ink hover:text-white'
                                      }`}
                                    >
                                      {loadingMistakeFeedbackId === mistake.id ? (
                                        <>
                                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                          {selectedLanguage === 'Korean' ? '밀착 버디 피드백 도출 중...' : 'Tutor Persona Analyzing ...'}
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles size={12} className="text-accent animate-pulse" />
                                          {selectedLanguage === 'Korean' ? `정예 튜터 [${tutorPersona === 'cherry' ? '체리' : tutorPersona === 'tiger' ? '타이거 교관' : tutorPersona === 'socrates' ? '솔 박사' : '테오 교수'}] 뇌동조 오답 해설 가이드받기` : `Ask selected tutor for premium personalized feedback`}
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col animate-fadeIn">
                      {/* Select Quiz Type (MCQ vs Cloze) */}
                      <div className="flex gap-2 mb-5 shrink-0 bg-zinc-150/10 dark:bg-zinc-900/40 p-1 rounded-2xl border border-zinc-200/45 dark:border-zinc-800">
                        <button
                          onClick={() => setQuizType('mcq')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            quizType === 'mcq'
                              ? 'bg-white dark:bg-zinc-800 text-accent shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-650'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                          <span>{selectedLanguage === 'Korean' ? '객관식 평가' : 'MCQ Assessment'}</span>
                        </button>
                        <button
                          onClick={() => setQuizType('cloze')}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            quizType === 'cloze'
                              ? 'bg-white dark:bg-zinc-800 text-accent shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-650'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 bg-accent rounded-full" />
                          <span>{t.clozeQuiz}</span>
                        </button>
                      </div>

                      {quizType === 'cloze' ? (
                        <div className="flex-1 flex flex-col">
                          {!clozeQuiz ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-10">
                              <div className="w-20 h-20 bg-accent/10 rounded-[28px] flex items-center justify-center mb-6 text-accent animate-pulse">
                                <Sparkles size={36} />
                              </div>
                              <h4 className="text-lg font-black mb-1 uppercase tracking-tighter">{t.clozeQuiz}</h4>
                              <p className="text-xs opacity-55 mb-8 leading-relaxed max-w-[280px]">
                                {selectedLanguage === 'Korean' 
                                  ? '맥락에서 중요한 키 단어를 블라인드 처리하여 단기 기억 및 인출 장작을 촉진합니다.' 
                                  : 'Test active retrieval. Select the correct terms to fill in the blank markers.'}
                              </p>
                              <button 
                                onClick={handleGenerateClozeQuiz}
                                disabled={!fileContent || isGeneratingCloze}
                                className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-35 ${darkMode ? 'bg-white text-ink' : 'bg-ink text-white'}`}
                              >
                                {isGeneratingCloze ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    {t.generatingCloze}
                                  </div>
                                ) : (
                                  selectedLanguage === 'Korean' ? 'AI 빈칸 퀴즈 생성' : 'Generate Cloze Quiz'
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col justify-between">
                              <div className="space-y-6 max-h-[460px] overflow-y-auto pr-1 pb-6 custom-scrollbar">
                                <h4 className="font-extrabold text-sm uppercase tracking-widest text-accent mb-2">
                                  {clozeQuiz.title || (selectedLanguage === 'Korean' ? 'AI 빈칸 인출 트레이닝' : 'AI Cloze Recall Training')}
                                </h4>
                                
                                {clozeQuiz.questions.map((q, qIndex) => {
                                  const parts = q.sentence.split(/(\[blank_\d+\])/g);
                                  
                                  return (
                                    <div key={q.id} className={`p-5 rounded-3xl border transition-all ${darkMode ? 'bg-zinc-950 border-zinc-805' : 'bg-zinc-50 border-zinc-150'}`}>
                                      <span className="text-[9px] font-black font-mono tracking-widest text-accent block mb-2">
                                        CHALLENGE {qIndex + 1}
                                      </span>
                                      
                                      <div className="text-sm font-semibold leading-relaxed text-zinc-800 dark:text-zinc-200 inline">
                                        {parts.map((part, pIdx) => {
                                          const isBlankMatch = part.match(/\[blank_(\d+)\]/);
                                          if (isBlankMatch) {
                                            const blankKey = part;
                                            const blankInfo = q.blanks.find(b => b.key === blankKey || b.key === blankKey.replace('[', '').replace(']', ''));
                                            if (!blankInfo) return <span key={pIdx} className="text-accent font-black">{part}</span>;
                                            
                                            const isCorrect = (clozeUserAnswers[q.id]?.[blankInfo.key] || '').trim().toLowerCase() === blankInfo.answer.trim().toLowerCase();
                                            
                                            return (
                                              <span key={pIdx} className="inline-block align-middle my-1">
                                                <input
                                                  type="text"
                                                  value={clozeUserAnswers[q.id]?.[blankInfo.key] || ''}
                                                  onChange={(e) => {
                                                    setClozeUserAnswers(prev => ({
                                                      ...prev,
                                                      [q.id]: {
                                                        ...(prev[q.id] || {}),
                                                        [blankInfo.key]: e.target.value
                                                      }
                                                    }));
                                                  }}
                                                  disabled={clozeChecked}
                                                  placeholder={selectedLanguage === 'Korean' ? "입력..." : "type..."}
                                                  style={{ width: `${Math.max(blankInfo.answer.length * 12 + 30, 80)}px` }}
                                                  className={`mx-1 px-3 py-1 text-xs font-black rounded-xl border text-center transition-all focus:outline-none focus:ring-2 focus:ring-accent ${
                                                    clozeChecked
                                                      ? (isCorrect
                                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black shadow-sm'
                                                        : 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-black shadow-sm')
                                                      : 'bg-white dark:bg-zinc-900 border-zinc-350 dark:border-zinc-750 hover:border-accent text-zinc-900 dark:text-zinc-100 font-bold shadow-sm'
                                                  }`}
                                                />
                                                {clozeChecked && (
                                                  <span className={`text-[10px] font-black mr-1 ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {isCorrect ? '✓' : `✗ (${blankInfo.answer})`}
                                                  </span>
                                                )}
                                              </span>
                                            );
                                          }
                                          return <span key={pIdx}>{part}</span>;
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 mt-4">
                                {!clozeChecked ? (
                                  <button
                                    onClick={() => setClozeChecked(true)}
                                    className={`w-full py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:scale-[1.01] active:scale-95 ${
                                      darkMode ? 'bg-white text-ink' : 'bg-ink text-white'
                                    }`}
                                  >
                                    {t.checkAnswer}
                                  </button>
                                ) : (
                                  <div className="flex gap-3">
                                    <button
                                      onClick={() => {
                                        setClozeUserAnswers({});
                                        setClozeChecked(false);
                                      }}
                                      className={`flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all border active:scale-95 ${
                                        darkMode ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-ink hover:bg-zinc-100'
                                      }`}
                                    >
                                      {selectedLanguage === 'Korean' ? '다시 풀기' : 'Retry'}
                                    </button>
                                    <button
                                      onClick={handleGenerateClozeQuiz}
                                      disabled={isGeneratingCloze}
                                      className="flex-1 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest bg-accent text-ink transition-all active:scale-95 flex items-center justify-center gap-1"
                                    >
                                      {isGeneratingCloze ? '...' : (selectedLanguage === 'Korean' ? '새 퀴즈 풀기' : 'New Cloze')}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : !currentQuiz ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-24 h-24 bg-accent/10 rounded-[32px] flex items-center justify-center mb-6 text-accent">
                        <FileQuestion size={48} />
                      </div>
                      <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">{t.quizMode}</h4>
                      <p className="text-sm opacity-40 mb-10 leading-relaxed max-w-[280px]">
                        {selectedLanguage === 'Korean' ? '업로드된 문서를 바탕으로 AI가 맞춤형 퀴즈를 생성합니다.' : 'AI generates custom quizzes based on your uploaded documents.'}
                      </p>
                      <button 
                        onClick={handleGenerateQuiz}
                        disabled={!fileContent || isProcessing}
                        className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 ${darkMode ? 'bg-white text-ink' : 'bg-ink text-white'}`}
                      >
                        {isProcessing ? t.processing : t.generateQuizBtn}
                      </button>
                    </div>
                  ) : quizFinished ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center mb-8 relative">
                        <Trophy size={64} className="text-accent" />
                        <motion.div 
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2 bg-ink text-accent w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 border-accent shadow-2xl"
                        >
                          {quizScore}
                        </motion.div>
                      </div>
                      <h4 className="text-2xl font-black mb-2 uppercase tracking-tighter">{t.quizComplete}</h4>
                      <p className="text-sm opacity-60 mb-10 uppercase tracking-widest font-black">
                        {t.score}: {quizScore} / {currentQuiz.questions.length}
                      </p>
                      <button 
                        onClick={() => {
                          setCurrentQuiz(null);
                          setQuizFinished(false);
                          setQuizScore(0);
                        }}
                        className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all ${darkMode ? 'bg-white text-ink' : 'bg-ink text-white'}`}
                      >
                        {t.finish}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-8">
                        <div>
                          <span className="mono-label text-accent mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                            Question {currentQuestionIndex + 1}/{currentQuiz.questions.length}
                          </span>
                          <h4 className="font-bold text-lg tracking-tight leading-relaxed">
                            {currentQuiz.questions[currentQuestionIndex].question}
                          </h4>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        {currentQuiz.questions[currentQuestionIndex].options.map((option, idx) => {
                          const isCorrect = option === currentQuiz.questions[currentQuestionIndex].correctAnswer;
                          const isSelected = selectedOption === option;
                          
                          let cardStyles = darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-100';
                          if (isSelected) cardStyles = darkMode ? 'bg-white text-ink border-white scale-[1.02]' : 'bg-ink text-white border-ink scale-[1.02]';
                          if (showFeedback && isCorrect) cardStyles = 'bg-accent border-accent text-ink scale-[1.02] shadow-[0_0_20px_rgba(255,214,10,0.3)]';
                          if (showFeedback && isSelected && !isCorrect) cardStyles = 'bg-red-500 border-red-500 text-white opacity-100';

                          return (
                            <motion.button
                              key={idx}
                              whileHover={!showFeedback ? { x: 4 } : {}}
                              onClick={() => handleSelectOption(option)}
                              disabled={showFeedback}
                              className={`w-full p-5 rounded-3xl border text-left font-medium text-sm transition-all flex items-center justify-between group ${cardStyles}`}
                            >
                              <span>{option}</span>
                              {showFeedback && isCorrect && <CheckCircle2 size={18} />}
                              {showFeedback && isSelected && !isCorrect && <AlertCircle size={18} />}
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        {showFeedback && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className={`mb-6 p-6 rounded-3xl text-sm leading-relaxed ${
                              selectedOption === currentQuiz.questions[currentQuestionIndex].correctAnswer
                                ? (darkMode ? 'bg-accent/10 text-accent/80' : 'bg-accent/10 text-ink/80')
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            <p className="font-black uppercase text-[10px] tracking-widest mb-2">
                              {selectedOption === currentQuiz.questions[currentQuestionIndex].correctAnswer ? t.correct : t.incorrect}
                            </p>
                            {currentQuiz.questions[currentQuestionIndex].explanation}
                          </motion.div>
                        )}

                        <button 
                          onClick={showFeedback ? handleNextQuestion : handleCheckAnswer}
                          disabled={!selectedOption}
                          className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-20 ${
                            showFeedback 
                              ? (darkMode ? 'bg-white text-ink' : 'bg-ink text-white')
                              : 'bg-accent text-ink'
                          }`}
                        >
                          {showFeedback ? t.nextQuestion : t.checkAnswer}
                        </button>
                      </div>
                    </div>
                  )}
                      </div>
                    )}
                </motion.div>
              ) : activeTab === 'flashcards' ? (
                <motion.div 
                  key="flashcards"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  {flashcards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-12">
                      <div className="w-24 h-24 bg-accent/15 rounded-[32px] flex items-center justify-center mb-6 text-accent">
                        <HelpCircle size={48} />
                      </div>
                      <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">{t.flashcards}</h4>
                      <p className="text-sm opacity-40 mb-10 leading-relaxed max-w-[280px]">
                        {t.noFlashcards}
                      </p>
                      <button 
                        onClick={handleGenerateFlashcards}
                        disabled={!fileContent || isGeneratingFlashcards}
                        className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2 ${
                          darkMode ? 'bg-white text-ink' : 'bg-ink text-white'
                        }`}
                      >
                        {isGeneratingFlashcards ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {t.processing}
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="text-accent animate-pulse" />
                            {t.generateFlashcards}
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-between">
                      {/* Leitner Box Sorting Tabs */}
                      <div className="mb-6 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                          <span>{selectedLanguage === 'Korean' ? '🗂️ 라이트너 암기 상자 정렬 시스템' : '🗂️ Leitner SRS Box Sorting'}</span>
                          <span className="text-accent">Leitner Sort Enabled</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-850 rounded-2xl">
                          {(['all', '1', '2', '3'] as const).map(box => {
                            const count = box === 'all' 
                              ? flashcards.length 
                              : flashcards.filter(c => (c.box || 1) === parseInt(box)).length;
                            
                            const isSelected = flashcardBoxFilter === box;
                            
                            const boxLabels: Record<string, string> = selectedLanguage === 'Korean' ? {
                              all: '전체',
                              1: '미숙🔴',
                              2: '익숙🟡',
                              3: '장기🟢'
                            } : {
                              all: 'All',
                              1: 'Box 1🔴',
                              2: 'Box 2🟡',
                              3: 'Box 3🟢'
                            };

                            return (
                              <button
                                key={box}
                                type="button"
                                onClick={() => {
                                  setFlashcardBoxFilter(box);
                                  setCurrentCardIndex(0);
                                  setIsCardFlipped(false);
                                }}
                                className={`px-2.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl flex-1 flex items-center justify-center gap-1.5 transition-all ${
                                  isSelected 
                                    ? 'bg-accent text-ink shadow-[0_4px_12px_rgba(255,214,10,0.15)] font-black' 
                                    : 'opacity-50 hover:opacity-100 font-medium'
                                }`}
                              >
                                <span>{boxLabels[box]}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isSelected ? 'bg-ink text-accent' : 'bg-zinc-250 dark:bg-zinc-800'}`}>{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {(() => {
                        const filteredFlashcards = flashcards.filter(c => {
                          if (flashcardBoxFilter === 'all') return true;
                          const cardBox = c.box || 1;
                          return cardBox === parseInt(flashcardBoxFilter);
                        });

                        const activeCardIndex = Math.min(currentCardIndex, Math.max(0, filteredFlashcards.length - 1));
                        const activeCard = filteredFlashcards[activeCardIndex] || null;

                        if (filteredFlashcards.length === 0) {
                          return (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-12">
                              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-[24px] flex items-center justify-center mb-4 text-zinc-450">
                                <Info size={28} />
                              </div>
                              <h5 className="text-sm font-black mb-1 uppercase tracking-tighter">
                                {selectedLanguage === 'Korean' ? '해당 상자가 비어있습니다' : 'Box is Empty'}
                              </h5>
                              <p className="text-xs opacity-40 mb-6 leading-relaxed max-w-[220px]">
                                {selectedLanguage === 'Korean' 
                                  ? '다른 라이트너 암기 카드를 이 상자로 승급시키거나 전체 보기로 이동해 보세요!' 
                                  : 'Promote other cards into this box or select another box.'}
                              </p>
                              <button 
                                onClick={() => setFlashcardBoxFilter('all')}
                                className="px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                              >
                                {selectedLanguage === 'Korean' ? '전체 보기 상자로 돌아가기' : 'Go to All Cards'}
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="flex-1 flex flex-col justify-between">
                            {/* Progress meter */}
                            <div className="mb-6">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest mb-2">
                                <span className="opacity-40">{selectedLanguage === 'Korean' ? '암기 진행률' : 'Memorization Progress'}</span>
                                <span className="text-accent font-mono font-bold">
                                  {flashcards.filter(c => c.mastered).length} / {flashcards.length} ({Math.round((flashcards.filter(c => c.mastered).length / flashcards.length) * 100)}%)
                                </span>
                              </div>
                              <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-accent"
                                  animate={{ width: `${(flashcards.filter(c => c.mastered).length / flashcards.length) * 100}%` }}
                                  transition={{ type: "spring", bounce: 0 }}
                                />
                              </div>
                            </div>

                            {/* Tactical Flashcard with Flip */}
                            <div className="flex-1 flex items-center justify-center py-4">
                              <motion.div 
                                onClick={() => setIsCardFlipped(!isCardFlipped)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className={`w-full max-w-sm aspect-[4/3] p-8 rounded-[36px] border-2 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-shadow relative shadow-sm ${
                                  activeCard.mastered 
                                    ? 'border-accent shadow-[0_0_30px_rgba(255,214,10,0.15)] bg-accent/5' 
                                    : (darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-205 shadow-xl')
                                }`}
                                style={{ perspective: 1000, transformStyle: "preserve-3d" }}
                              >
                                <div 
                                  className="absolute inset-0 p-8 flex flex-col items-center justify-center"
                                  style={{ backfaceVisibility: "hidden", transform: "rotateY(0deg)" }}
                                >
                                  <span className="text-[10px] text-accent font-black uppercase tracking-widest mb-4 flex items-center gap-1">
                                    <HelpCircle size={10} />
                                    {selectedLanguage === 'Korean' ? `앞면: 라이트너 상자 ${activeCard.box || 1}` : `FRONT: BOX ${activeCard.box || 1}`}
                                  </span>
                                  <h4 className="text-xl font-black tracking-tight leading-snug">
                                    {activeCard.front}
                                  </h4>
                                  <p className="mt-8 text-[9px] opacity-35 uppercase font-black tracking-widest">
                                    {selectedLanguage === 'Korean' ? '카드를 눌러 뒤집으세요' : 'TAP TO FLIP'}
                                  </p>
                                </div>

                                <div 
                                  className="absolute inset-0 p-8 flex flex-col items-center justify-center"
                                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                >
                                  <span className="text-[10px] text-accent font-black uppercase tracking-widest mb-4 flex items-center gap-1">
                                    <Sparkles size={10} />
                                    {selectedLanguage === 'Korean' ? '뒷면: 해설 및 정의' : 'BACK: EXPLANATION'}
                                  </span>
                                  <p className="text-xs font-bold leading-relaxed opacity-95">
                                    {activeCard.back}
                                  </p>
                                </div>
                              </motion.div>
                            </div>

                            {/* Controls and Mastery Buttons */}
                            <div className="space-y-4">
                              {/* 3-Way Leitner sorting controls */}
                              <div className="space-y-2 mt-4">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-40">
                                  <span>{selectedLanguage === 'Korean' ? '라이트너 박스 승급/강등 정렬' : 'Leitner srs sorting box'}</span>
                                  <span className="font-mono text-[9px]">Box {activeCard.box || 1}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChangeLeitnerBox(activeCard.id, 1);
                                    }}
                                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                      (!activeCard.box || activeCard.box === 1)
                                        ? 'bg-red-500/10 border-red-500/80 text-red-500 font-bold'
                                        : 'opacity-40 hover:opacity-100 border-transparent bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300'
                                    }`}
                                  >
                                    <span>🔴 미숙 (Box 1)</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChangeLeitnerBox(activeCard.id, 2);
                                    }}
                                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                      activeCard.box === 2
                                        ? 'bg-amber-500/10 border-amber-500/80 text-amber-500 font-bold'
                                        : 'opacity-40 hover:opacity-100 border-transparent bg-zinc-100 dark:bg-zinc-800/50 text-zinc-650 dark:text-zinc-300'
                                    }`}
                                  >
                                    <span>🟡 익숙 (Box 2)</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleChangeLeitnerBox(activeCard.id, 3);
                                    }}
                                    className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                                      activeCard.box === 3
                                        ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-500 font-bold'
                                        : 'opacity-40 hover:opacity-100 border-transparent bg-zinc-100 dark:bg-zinc-800/50 text-zinc-655 dark:text-zinc-300'
                                    }`}
                                  >
                                    <span>🟢 기억 완료 (Box 3)</span>
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-between items-center px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                                <button
                                  disabled={activeCardIndex === 0}
                                  onClick={() => {
                                    setIsCardFlipped(false);
                                    setCurrentCardIndex(prev => Math.max(0, prev - 1));
                                  }}
                                  className="p-3 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all disabled:opacity-20 active:scale-95 text-[10px] font-black cursor-pointer"
                                >
                                  {selectedLanguage === 'Korean' ? '이전' : 'PREV'}
                                </button>
                                
                                <span className="text-[10px] font-black font-mono tracking-widest opacity-40">
                                  {activeCardIndex + 1} / {filteredFlashcards.length}
                                </span>

                                <button
                                  disabled={activeCardIndex === filteredFlashcards.length - 1}
                                  onClick={() => {
                                    setIsCardFlipped(false);
                                    setCurrentCardIndex(prev => Math.min(filteredFlashcards.length - 1, prev + 1));
                                  }}
                                  className="p-3 bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all disabled:opacity-20 active:scale-95 text-[10px] font-black cursor-pointer"
                                >
                                  {selectedLanguage === 'Korean' ? '다음' : 'NEXT'}
                                </button>
                              </div>
                              
                              {/* Clear/Reset Flashcards */}
                              <div className="text-center pt-2">
                                <button 
                                  onClick={() => {
                                    setFlashcards([]);
                                    setCurrentCardIndex(0);
                                    setIsCardFlipped(false);
                                  }}
                                  className="text-[10px] font-black uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  {selectedLanguage === 'Korean' ? '암기 카드 폐기' : 'Reset Memorizer'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'spatial' ? (
                <motion.div 
                  key="spatial"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col relative"
                >
                  {!knowledgeGraph ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-12">
                      <div className="w-24 h-24 bg-accent/10 rounded-[32px] flex items-center justify-center mb-6 text-accent">
                        <Network size={44} />
                      </div>
                      <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">
                        {selectedLanguage === 'Korean' ? '지식 공간 시각화 (Spatial Memory)' : 'Spatial Concept Mindmap'}
                      </h4>
                      <p className="text-sm opacity-55 mb-6 leading-relaxed max-w-[340px]">
                        {selectedLanguage === 'Korean' 
                          ? '학습 자료의 핵심 개념과 주요 인과 관계를 구조적으로 배치하며 스스로 브릿지를 그리거나, AI 분석을 통해 입체적인 자발적 장기 기억을 구현하세요.' 
                          : 'Extract key terms & mechanics from your study material as an interactive, drag-and-drop structural concept board.'}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md items-center justify-center">
                        <button 
                          onClick={handleGenerateKnowledgeGraph}
                          disabled={!fileContent || isGeneratingGraph}
                          className={`flex-1 w-full py-4 px-6 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-30 ${darkMode ? 'bg-white text-ink' : 'bg-ink text-white'}`}
                        >
                          {isGeneratingGraph ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              {selectedLanguage === 'Korean' ? 'AI 분석 구조 분석 중...' : 'Analyzing Spatial Pathways...'}
                            </div>
                          ) : (
                            selectedLanguage === 'Korean' ? 'AI 지식 지도 그리기' : 'Draw AI Spatial Map'
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            setKnowledgeGraph({ nodes: [], edges: [] });
                            setNodePositions({});
                            setIsAddingNode(true);
                          }}
                          className={`flex-1 w-full py-4 px-6 rounded-[20px] font-black text-xs uppercase tracking-widest border transition-all hover:scale-[1.02] active:scale-95 ${
                            darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white' : 'bg-white border-zinc-200 text-ink hover:bg-zinc-50'
                          }`}
                        >
                          {selectedLanguage === 'Korean' ? '직접 지도 그리기' : 'Draw Manual Map'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col lg:flex-row gap-6 relative">
                      {/* Left Viewport: SVG Canvas */}
                      <div className="flex-1 flex flex-col relative">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex flex-col">
                            <h5 className="font-bold text-sm tracking-tight animate-fadeIn">
                              {selectedLanguage === 'Korean' ? '인터랙티브 컨셉 공간' : 'Concept Space Coordinator'}
                            </h5>
                            <span className="text-[10px] opacity-45">
                              {selectedLanguage === 'Korean' ? '★ 노드를 드래그하여 배치하며 개념 간 연결선 브릿지(Bridge)를 구축하세요.' : '★ Click & drag nodes or connect relational bridges manually.'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setNewNodeLabel('');
                                setNewNodeDesc('');
                                setIsAddingNode(true);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-1.5 hover:text-accent hover:border-accent ${
                                darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-ink hover:bg-zinc-50'
                              }`}
                            >
                              <Plus size={11} />
                              {selectedLanguage === 'Korean' ? '개념 추가' : 'Add Node'}
                            </button>
                            
                            <button
                              onClick={handleGenerateKnowledgeGraph}
                              disabled={isGeneratingGraph}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white' : 'bg-white border-zinc-200 text-ink hover:bg-zinc-50'
                              }`}
                            >
                              {isGeneratingGraph ? '...' : (selectedLanguage === 'Korean' ? 'AI 리드로우' : 'AI Re-draw')}
                            </button>
                          </div>
                        </div>

                        <div className={`aspect-[4/3] lg:h-[450px] w-full border rounded-[32px] overflow-hidden relative ${darkMode ? 'bg-zinc-950 border-zinc-850' : 'bg-zinc-50 border-zinc-200'}`}>
                          
                          {/* Floating Instructions Banner for Connecting Bridges */}
                          {isConnectingBridge && (
                            <div className="absolute top-4 inset-x-4 bg-accent text-ink px-4 py-3 rounded-2xl shadow-xl flex justify-between items-center z-30 font-bold text-xs animate-bounce border border-ink/10">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-ink"></span>
                                </span>
                                <span>
                                  {selectedLanguage === 'Korean' 
                                    ? `연결 모드: [${knowledgeGraph.nodes.find(n => n.id === bridgeSourceId)?.label}] 에서 다른 대상 개념 노드를 클릭하여 브릿지 줄을 연결하세요.`
                                    : `Connect Mode: Click target concept node to draw bridge from [${knowledgeGraph.nodes.find(n => n.id === bridgeSourceId)?.label}]`}
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  setIsConnectingBridge(false);
                                  setBridgeSourceId(null);
                                }}
                                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-ink text-white rounded-lg hover:opacity-90 transition-all"
                              >
                                {selectedLanguage === 'Korean' ? '취소' : 'Cancel'}
                              </button>
                            </div>
                          )}

                          {/* SVG Canvas Mindmap */}
                          <svg
                            width="100%"
                            height="100%"
                            className="select-none touch-none"
                            onMouseMove={handleSVGMouseMove}
                            onMouseUp={handleSVGMouseUp}
                            onMouseLeave={handleSVGMouseUp}
                          >
                            <defs>
                              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                                <circle cx="15" cy="15" r="1.5" fill={darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            {/* Connectivity layer */}
                            {knowledgeGraph.edges.map((edge, idx) => {
                              const fromPos = nodePositions[edge.from];
                              const toPos = nodePositions[edge.to];
                              if (!fromPos || !toPos) return null;
                              
                              const midX = (fromPos.x + toPos.x) / 2;
                              const midY = (fromPos.y + toPos.y) / 2;
                              const isLinked = selectedNode?.id === edge.from || selectedNode?.id === edge.to;
                              
                              return (
                                <g key={`edge-${idx}`} className={`transition-all duration-300 ${isLinked ? 'opacity-100' : 'opacity-25'}`}>
                                  <line
                                    x1={fromPos.x}
                                    y1={fromPos.y}
                                    x2={toPos.x}
                                    y2={toPos.y}
                                    stroke={isLinked ? 'var(--color-accent)' : (darkMode ? '#52525b' : '#a1a1aa')}
                                    strokeWidth={isLinked ? "2.5" : "1"}
                                  />
                                  <rect
                                    x={midX - 35}
                                    y={midY - 7}
                                    width="70"
                                    height="14"
                                    rx="5"
                                    fill={darkMode ? '#09090b' : '#ffffff'}
                                    stroke={isLinked ? 'var(--color-accent)' : (darkMode ? '#27272a' : '#e4e4e7')}
                                    strokeWidth="1"
                                    className="transition-colors duration-300"
                                  />
                                  <text
                                    x={midX}
                                    y={midY + 3}
                                    textAnchor="middle"
                                    className={`font-mono text-[8px] font-bold uppercase transition-all ${isLinked ? 'fill-accent' : 'fill-zinc-400 dark:fill-zinc-500'}`}
                                  >
                                    {edge.relation}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Node Layer */}
                            {knowledgeGraph.nodes.map((node) => {
                              const pos = nodePositions[node.id];
                              if (!pos) return null;
                              const isSelected = selectedNode?.id === node.id;
                              
                              let nodeStroke = darkMode ? '#3f3f46' : '#d4d4d8';
                              let nodeFill = isSelected ? 'rgba(var(--color-accent-rgb), 0.15)' : (darkMode ? '#18181b' : '#ffffff');
                              if (isSelected) {
                                nodeStroke = 'var(--color-accent)';
                              } else {
                                if (node.group.toLowerCase().includes('term') || node.group.toLowerCase().includes('word')) {
                                  nodeStroke = '#38bdf8';
                                } else if (node.group.toLowerCase().includes('process') || node.group.toLowerCase().includes('flow')) {
                                  nodeStroke = '#f59e0b';
                                } else if (node.group.toLowerCase().includes('figure') || node.group.toLowerCase().includes('person')) {
                                  nodeStroke = '#10b981';
                                } else if (node.group.toLowerCase().includes('concept') || node.group.toLowerCase().includes('theory')) {
                                  nodeStroke = '#a855f7';
                                }
                              }

                              return (
                                <g
                                  key={node.id}
                                  transform={`translate(${pos.x}, ${pos.y})`}
                                  className="cursor-pointer group animate-fadeIn"
                                  onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                                  onClick={() => handleNodeClick(node)}
                                >
                                  {isSelected && (
                                    <circle
                                      r="34"
                                      fill="none"
                                      stroke="var(--color-accent)"
                                      strokeWidth="1"
                                      className="opacity-25 animate-ping"
                                    />
                                  )}
                                  <circle
                                    r={isSelected ? "28" : "24"}
                                    fill={nodeFill}
                                    stroke={nodeStroke}
                                    strokeWidth={isSelected ? '3' : '2'}
                                    className="transition-all duration-300 shadow-md group-hover:scale-105"
                                  />
                                  <text
                                    dy="3"
                                    textAnchor="middle"
                                    className={`font-black text-[9px] select-none pointer-events-none transition-colors ${
                                      isSelected 
                                        ? 'fill-accent' 
                                        : (darkMode ? 'fill-zinc-100' : 'fill-zinc-800')
                                    }`}
                                  >
                                    {node.label.length > 9 ? `${node.label.substring(0, 8)}.` : node.label}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>

                          {/* Floating Custom Node Addition Form overlay */}
                          {isAddingNode && (
                            <div className="absolute inset-x-4 top-4 bottom-4 backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 z-40 rounded-[28px] p-6 border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between shadow-2xl animate-fadeIn">
                              <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-800">
                                  <h6 className="font-black text-xs uppercase tracking-wider text-accent flex items-center gap-1.5">
                                    <Plus size={14} />
                                    {selectedLanguage === 'Korean' ? '수동 개념 노드 작성' : 'Add Custom Concept Node'}
                                  </h6>
                                  <button 
                                    onClick={() => setIsAddingNode(false)}
                                    className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-black opacity-50 uppercase tracking-widest">
                                    {selectedLanguage === 'Korean' ? '개념/단어 명칭' : 'Concept Name / Label'}
                                  </label>
                                  <input 
                                    type="text" 
                                    value={newNodeLabel}
                                    onChange={(e) => setNewNodeLabel(e.target.value)}
                                    placeholder={selectedLanguage === 'Korean' ? '예: 수소 결합' : 'e.g., Hydrogen Bond'}
                                    className={`w-full p-2.5 rounded-xl border text-xs font-bold transition-all focus:outline-none focus:ring-1 focus:ring-accent ${
                                      darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-700' : 'bg-zinc-50 border-zinc-200 text-ink placeholder-zinc-400'
                                    }`}
                                  />
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-black opacity-50 uppercase tracking-widest">
                                    {selectedLanguage === 'Korean' ? '분류 코드' : 'Category / Type'}
                                  </label>
                                  <div className="grid grid-cols-4 gap-1">
                                    {['Concept', 'Term', 'Process', 'Figure'].map((grp) => (
                                      <button
                                        key={grp}
                                        type="button"
                                        onClick={() => setNewNodeGroup(grp)}
                                        className={`py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${
                                          newNodeGroup === grp 
                                            ? 'bg-accent border-accent text-ink scale-[1.02] font-black' 
                                            : (darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-150 text-ink/50 hover:text-ink')
                                        }`}
                                      >
                                        {selectedLanguage === 'Korean' ? (
                                             grp === 'Concept' ? '개념/이론' :
                                             grp === 'Term' ? '용어' :
                                             grp === 'Process' ? '지식 흐름' : '인물'
                                          ) : grp}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[9px] font-black opacity-50 uppercase tracking-widest">
                                    {selectedLanguage === 'Korean' ? '인과관계 상세 설명' : 'Description'}
                                  </label>
                                  <textarea 
                                    value={newNodeDesc}
                                    onChange={(e) => setNewNodeDesc(e.target.value)}
                                    rows={3}
                                    placeholder={selectedLanguage === 'Korean' ? '해당 핵심 개념의 학술적 의미나 메커니즘을 상세히 기재하세요.' : 'Summarize details of this conceptual connection.'}
                                    className={`w-full p-2.5 rounded-xl border text-[11px] font-semibold leading-relaxed transition-all focus:outline-none focus:ring-1 focus:ring-accent resize-none ${
                                      darkMode ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-700' : 'bg-zinc-50 border-zinc-200 text-ink placeholder-zinc-400'
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4">
                                <button
                                  onClick={() => setIsAddingNode(false)}
                                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                    darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-850' : 'bg-white border-zinc-200 text-ink hover:bg-zinc-50'
                                  }`}
                                >
                                  {selectedLanguage === 'Korean' ? '닫기' : 'Close'}
                                </button>
                                <button
                                  onClick={handleAddCustomNode}
                                  disabled={!newNodeLabel.trim()}
                                  className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30 ${
                                    darkMode ? 'bg-white text-ink' : 'bg-ink text-white'
                                  }`}
                                >
                                  {selectedLanguage === 'Korean' ? '배치 추가 대기' : 'Deploy Concept'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Detail Pane */}
                      <div className="w-full lg:w-80 shrink-0 flex flex-col justify-between">
                        {selectedNode ? (
                          <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150 shadow-sm'} flex-1 flex flex-col justify-start`}>
                            <div className="flex justify-between items-start mb-3">
                              <span className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg bg-accent/20 text-accent">
                                {selectedNode.group}
                              </span>
                            </div>
                            
                            <h4 className="text-lg font-black mb-1.5 tracking-snug">
                              {selectedNode.label}
                            </h4>
                            
                            <p className="text-[11px] font-semibold leading-relaxed opacity-65 mb-4">
                              {selectedNode.description}
                            </p>

                            {/* USER-DRIVEN GRAPH ANNOTATING: Custom Pencil Study Notes Textarea */}
                            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 mb-4">
                              <label className="text-[10px] font-black text-accent uppercase tracking-wider block mb-1.5">
                                {selectedLanguage === 'Korean' ? '✏️ 마인드맵 펜 노트 & 수기 메모' : '✏️ Custom Sketch Notes & Annotation'}
                              </label>
                              <textarea
                                value={(selectedNode as any).userNotes || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSelectedNode(prev => prev ? { ...prev, userNotes: val } : null);
                                  setKnowledgeGraph(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, userNotes: val } : n)
                                    };
                                  });
                                }}
                                placeholder={selectedLanguage === 'Korean' 
                                  ? '여기에 나만의 분석 소회, 암기 꿀팁, 상세 강의 요악을 수동으로 노팅해 지도를 풍성하게 완성하세요...' 
                                  : 'Type custom conceptual annotations, mnemonic hacks, or sketch reminders directly onto this node...'}
                                rows={3}
                                className={`w-full p-2.5 rounded-xl border text-[11px] font-medium leading-relaxed transition-all focus:outline-none focus:ring-1 focus:ring-accent resize-none ${
                                  darkMode ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-700 font-mono' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400'
                                }`}
                              />
                            </div>

                            {/* Connect and Delete Actions Row */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <button
                                onClick={() => {
                                  setIsConnectingBridge(true);
                                  setBridgeSourceId(selectedNode.id);
                                }}
                                className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1 hover:text-accent hover:border-accent ${
                                  darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-150 text-ink'
                                }`}
                              >
                                <Network size={11} className="text-accent" />
                                {selectedLanguage === 'Korean' ? '브릿지 연결' : 'Link Bridge'}
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(selectedLanguage === 'Korean' ? `[${selectedNode.label}] 개념 노드와 이와 연결된 모든 브릿지 선들을 삭제하시겠습니까?` : `Remove [${selectedNode.label}] and its edges?`)) {
                                    const tid = selectedNode.id;
                                    setKnowledgeGraph(prev => {
                                      if (!prev) return prev;
                                      return {
                                        nodes: prev.nodes.filter(n => n.id !== tid),
                                        edges: prev.edges.filter(e => e.from !== tid && e.to !== tid)
                                      };
                                    });
                                    setSelectedNode(null);
                                  }
                                }}
                                className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-red-500 hover:bg-red-500/10 ${
                                  darkMode ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
                                }`}
                              >
                                {selectedLanguage === 'Korean' ? '개념 삭제' : 'Delete concept'}
                              </button>
                            </div>

                            {/* Relationship Links List */}
                            <div className="mt-auto border-t border-zinc-150 dark:border-zinc-800/80 pt-3 animate-fadeIn">
                              <span className="text-[10px] font-black text-accent uppercase tracking-wider block mb-2">
                                {selectedLanguage === 'Korean' ? '연관개념 브릿지망' : 'Interrelated Concept Connections'}
                              </span>
                              <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                                {knowledgeGraph.edges.filter(e => e.from === selectedNode.id || e.to === selectedNode.id).length === 0 ? (
                                  <span className="text-[9px] opacity-40">
                                    {selectedLanguage === 'Korean' ? '연결된 브릿지가 없습니다.' : 'No connections established.'}
                                  </span>
                                ) : (
                                  knowledgeGraph.edges
                                    .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                                    .map((edge, eIdx) => {
                                      const otherId = edge.from === selectedNode.id ? edge.to : edge.from;
                                      const otherNode = knowledgeGraph.nodes.find(n => n.id === otherId);
                                      if (!otherNode) return null;
                                      return (
                                        <div key={eIdx} className="flex gap-1 items-center">
                                          <button
                                            onClick={() => setSelectedNode(otherNode)}
                                            className={`flex-1 px-3 py-1.5 rounded-xl text-[9px] font-black border transition-all hover:scale-[1.01] flex items-center gap-1 ${
                                              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-50 border-zinc-100 text-ink'
                                            }`}
                                          >
                                            <span className="opacity-40">{edge.relation} :</span>
                                            <span className="text-accent font-black">{otherNode.label}</span>
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm(selectedLanguage === 'Korean' ? '이 브릿지 관계선 연결을 끊으시겠습니까?' : 'Delete this concept bridge connection?')) {
                                                setKnowledgeGraph(prev => {
                                                  if (!prev) return prev;
                                                  return {
                                                    ...prev,
                                                    edges: prev.edges.filter(curEdge => curEdge !== edge)
                                                  };
                                                });
                                              }
                                            }}
                                            className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                                            title="Delete relation"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      );
                                    })
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={`p-6 rounded-[32px] border text-center ${darkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-zinc-150 shadow-sm'} flex-1 flex flex-col items-center justify-center`}>
                            <p className="text-xs opacity-40 leading-relaxed">
                              {selectedLanguage === 'Korean' 
                                ? '지도 상의 개념 노드 원형을 클릭하여 펜 노트 작성, 이름 수정 및 연결선 브릿지를 생성하세요.' 
                                : 'Click a concept node on the coordinator map to deep dive & annotate.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'audiobook' ? (
                <motion.div 
                  key="audio"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  <div className={`p-6 mb-6 rounded-[32px] flex flex-col items-center border group transition-colors ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-100'}`}>
                    <div className="w-full flex justify-between items-center mb-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-1.5 items-end h-12">
                          {[0.4, 0.8, 0.6, 1, 0.7, 0.5, 0.9, 0.4].map((h, i) => (
                            <motion.div 
                              key={i}
                              animate={{ height: isAudioPlaying ? [6, 40 * h, 6] : 6 }}
                              transition={{ repeat: Infinity, duration: 1 + h, delay: i * 0.05 }}
                              className="w-2 bg-ink/10 dark:bg-white/10 rounded-full overflow-hidden"
                            >
                               <motion.div 
                                animate={{ y: isAudioPlaying ? [0, -40, 0] : 0 }}
                                className="w-full h-full bg-accent"
                               />
                            </motion.div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[0.4, 0.7, 1, 1.2, 1.5, 2].map(speed => (
                            <button
                              key={speed}
                              onClick={() => setPlaybackSpeed(speed)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tighter transition-all ${
                                playbackSpeed === speed 
                                  ? 'bg-accent text-ink shadow-md scale-105' 
                                  : (darkMode ? 'bg-zinc-800 text-white/40 hover:text-white' : 'bg-white border border-zinc-200 text-ink/40 hover:text-ink hover:bg-zinc-50')
                              }`}
                            >
                              {speed.toFixed(1)}x
                            </button>
                          ))}
                        </div>
                      </div>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={handleSkipBackward}
                        disabled={!isAudioPlaying && !isAudioPaused}
                        title={t.skipBack}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink'} disabled:opacity-10`}
                      >
                        <SkipBack size={24} />
                      </button>

                      <button 
                        onClick={() => {
                          if (isAudioPlaying || isAudioPaused) {
                            handlePauseResumeTTS();
                          } else {
                            handleTTS(fileContent || "Please upload material.");
                          }
                        }}
                        disabled={isGeneratingTTS}
                        title={isAudioPlaying ? t.pauseAudio : t.resumeAudio}
                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border transition-all hover:scale-110 active:scale-95 ${
                          isAudioPlaying || isAudioPaused
                            ? 'bg-accent border-accent text-ink' 
                            : (darkMode ? 'bg-zinc-900 border-zinc-800 text-white hover:text-accent' : 'bg-white border-zinc-100 text-ink hover:text-accent')
                        } ${isGeneratingTTS ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {isGeneratingTTS ? (
                          <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (isAudioPlaying && !isAudioPaused) ? (
                          <Pause size={32} fill="currentColor" />
                        ) : (
                          <Play size={32} fill="currentColor" className="ml-1" />
                        )}
                      </button>

                      <button 
                        onClick={handleSkipForward}
                        disabled={!isAudioPlaying && !isAudioPaused}
                        title={t.skipForward}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${darkMode ? 'text-white/40 hover:text-white' : 'text-ink/40 hover:text-ink'} disabled:opacity-10`}
                      >
                        <SkipForward size={24} />
                      </button>
                    </div>
                    </div>

                    {/* Real-time Audio Generation Status Banner */}
                    <AnimatePresence>
                      {isGeneratingTTS && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -5 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -5 }}
                          className={`w-full max-w-md mb-6 py-3 px-4 rounded-[22px] text-xs font-semibold text-center flex items-center justify-center gap-2 border overflow-hidden ${
                            darkMode 
                              ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' 
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          <Info size={14} className="shrink-0 animate-pulse text-amber-500" />
                          <span>
                            {selectedLanguage === 'Korean' ? (
                              "오디오가 실시간으로 소스 생성 중입니다. 제작 중에는 일시정지 할 수 없습니다."
                            ) : selectedLanguage === 'Japanese' ? (
                              "音声をリアルタイムで作成しています。生成中は一時停止ができません。"
                            ) : selectedLanguage === 'Chinese' ? (
                              "音频正在实时生成中。制作期间无法暂停。"
                            ) : (
                              "Audio is being generated in real-time. Pausing is unavailable during generation."
                            )}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Socratic Mode Toggle */}
                    <div className="w-full max-w-md mt-4 mb-6 p-4 rounded-[22px] border transition-all flex items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-950/20 border-zinc-200/50 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-accent bg-accent/15`}>
                          <Sparkles size={16} className={isSocraticAudio ? 'animate-bounce' : ''} />
                        </div>
                        <div className="text-left">
                          <span className="text-[11px] font-black uppercase tracking-wider block">
                            {selectedLanguage === 'Korean' ? '🎧 소크라테스 능동 유도 슬로러닝' : '🎧 Socratic Interactive Slow-learning'}
                          </span>
                          <span className="text-[9px] opacity-50 block leading-tight">
                            {selectedLanguage === 'Korean' 
                              ? '교안 낭독 중 핵심 단어에서 정지하여, 뇌에 3초 정의 회상 자극을 투여함.' 
                              : 'Auto-pauses at key concepts to quiz the brain and stimulate active retrieval.'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsSocraticAudio(!isSocraticAudio)}
                        className={`w-12 h-6 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                          isSocraticAudio ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                            isSocraticAudio ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="text-center">
                      <h4 className="text-xl font-black mb-1 uppercase tracking-tighter">{t.audioSynthesis}</h4>
                      {audioFileName ? (
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          <p className="mono-label truncate max-w-[200px]">{audioFileName}</p>
                        </div>
                      ) : (
                        <p className="mono-label">{t.activeSignal}</p>
                      )}
                    </div>
                    
                    {/* Synchronized Reading Caption Carousel */}
                    {(isAudioPlaying || isAudioPaused) && currentReadingText && (
                      <div className="w-full p-5 mt-6 rounded-[24px] bg-zinc-900/50 dark:bg-zinc-950/40 border border-zinc-800 text-left relative overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <Sparkles size={11} className="text-accent animate-pulse" />
                          <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">{t.readingHighlighter}</span>
                        </div>
                        <div className="max-h-[105px] overflow-y-auto custom-scrollbar flex flex-wrap gap-x-2 gap-y-1.5 text-xs font-semibold leading-relaxed transition-all">
                          {(() => {
                            const words = currentReadingText.split(/\s+/);
                            // Character-accurate current highlight index calculation
                            let charAccumulator = 0;
                            let estimatedIdx = 0;
                            const charOffset = audioCurrentTime * charsPerSecond * playbackSpeed;
                            for (let i = 0; i < words.length; i++) {
                              charAccumulator += words[i].length + 1; // +1 for the space
                              if (charAccumulator >= charOffset) {
                                estimatedIdx = i;
                                break;
                              }
                              estimatedIdx = words.length - 1;
                            }
                            return words.map((word, wIdx) => {
                              const isActive = wIdx === estimatedIdx;
                              return (
                                <span 
                                  key={wIdx} 
                                  className={`transition-all duration-350 rounded ${
                                    isActive 
                                      ? 'text-accent font-black bg-accent/10 px-1.5 py-0.5 border-b-2 border-accent scale-[1.03]' 
                                      : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-200'
                                  }`}
                                >
                                  {word}
                                </span>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                    
                    <div className="w-full mt-6 space-y-2">
                       <div className="flex justify-between text-[10px] font-mono opacity-40">
                         <span>{formatTime(Math.floor(audioCurrentTime))}</span>
                         <span>{formatTime(Math.floor(audioTotalTime))}</span>
                       </div>
                       <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                         <motion.div 
                           className="h-full bg-accent"
                           animate={{ width: `${Math.min(100, (audioCurrentTime / (audioTotalTime || 1)) * 100)}%` }}
                           transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                         />
                       </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                      <input 
                        type="file"
                        ref={audioFileInputRef}
                        className="hidden"
                        accept=".pdf,.txt"
                        onChange={handleAudioFileUpload}
                      />
                      <button 
                        onClick={() => audioFileInputRef.current?.click()}
                        className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${
                          darkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-zinc-100 text-ink shadow-sm'
                        }`}
                      >
                        <FileUp size={16} className="text-accent" />
                        {t.uploadForAudio}
                      </button>
                      
                      <button 
                         onClick={handleGenerateLecture}
                         disabled={!fileContent || isGeneratingLecture}
                         className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${
                           isGeneratingLecture ? 'animate-pulse opacity-70' : ''
                         } ${
                           darkMode ? 'bg-white text-ink' : 'bg-ink text-white'
                         } disabled:opacity-30`}
                       >
                         {isGeneratingLecture ? (
                           <>
                             <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                             {t.generatingLecture}
                           </>
                         ) : (
                           <>
                             <Sparkles size={16} className="text-accent" />
                             {t.lectureAudiobook}
                           </>
                         )}
                       </button>
                    </div>

                    <AnimatePresence>
                      {lectureScript && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="w-full mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800 overflow-hidden"
                        >
                           <div className="flex items-center gap-2 mb-4">
                             <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                               {t.academicDialogue}: {lectureScript.title}
                             </span>
                           </div>
                           <div className="space-y-4">
                             {lectureScript.points.map((p, i) => (
                               <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-white border-zinc-100'}`}>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">{p.topic}</p>
                                 <p className="text-sm font-medium leading-relaxed opacity-80">{p.explanation}</p>
                               </div>
                             ))}
                           </div>
                           <button 
                             onClick={() => {
                               let fullText = `${lectureScript.title}. ${lectureScript.introduction}. `;
                               lectureScript.points.forEach(p => {
                                 fullText += `${p.topic}. ${p.explanation}. `;
                               });
                               fullText += lectureScript.conclusion;
                               handleTTS(fullText);
                             }}
                             className="w-full mt-4 py-3 bg-accent text-ink rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-accent/80"
                           >
                             {t.playLecture}
                           </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="mono-label">{t.recentSessions}</span>
                      <button 
                        onClick={() => setIsHistoryPaused(!isHistoryPaused)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-lg transition-all ${isHistoryPaused ? 'bg-rose-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 opacity-40 hover:opacity-100'}`}
                      >
                        {isHistoryPaused ? t.resumeHistory : t.pauseHistory}
                      </button>
                    </div>
                    {audioHistory.length > 0 ? audioHistory.map(item => (
                      <div key={item.id} className={`p-5 border rounded-3xl flex items-center justify-between group transition-all ${darkMode ? 'border-zinc-800 hover:bg-zinc-800' : 'border-zinc-100 hover:bg-zinc-50'}`}>
                        <div className="flex items-center gap-5 cursor-pointer" onClick={() => handleTTS(item.name)}>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-zinc-900' : 'bg-zinc-50 group-hover:bg-accent'}`}>
                            <Volume2 size={20} className="opacity-30 group-hover:opacity-100" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-tight truncate max-w-[150px]">{item.name}</p>
                            <p className="text-[10px] mono-label">{format(parseISO(item.date), 'MMM dd, HH:mm')}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteAudioHistory(item.id)}
                          className="p-2 opacity-0 group-hover:opacity-40 hover:!opacity-100 text-rose-500 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )) : (
                      <p className="text-[10px] font-medium opacity-20 py-4 text-center italic">{t.noContent}</p>
                    )}
                  </div>
                </motion.div>
              ) : activeTab === 'collab' ? (
                <motion.div 
                  key="collab"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        {roomUsers.length > 0 ? roomUsers.slice(0, 3).map((u, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[10px] font-bold hover:z-10 transition-all relative ${usersWithMic.has(u) ? 'bg-green-500 text-white animate-pulse' : 'bg-accent text-ink'}`}>
                             {u.substring(0, 2).toUpperCase()}
                             {usersWithMic.has(u) && (
                               <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full border border-white dark:border-zinc-900">
                                 <Mic size={6} className="text-white" />
                               </div>
                             )}
                          </div>
                        )) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                            <User size={14} className="opacity-20" />
                          </div>
                        )}
                        {roomUsers.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-ink text-white border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[9px] font-bold">
                            +{roomUsers.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        {isJoinedRoom ? `${roomUsers.length} ${t.onlineUsers}` : t.studyRoom}
                      </span>
                    </div>
                    {isJoinedRoom ? (
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={toggleVoiceChat}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isVoiceChatEnabled ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-ink dark:hover:text-white'}`}
                          title={isVoiceChatEnabled ? t.voiceChatOff : t.voiceChatOn}
                        >
                          {isVoiceChatEnabled ? <Mic size={12} /> : <MicOff size={12} />}
                          {isVoiceChatEnabled ? t.micUnmuted : t.micMuted}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                          <Hash size={10} className="text-accent" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                            {savedRooms.find(r => r.id === roomId)?.name || roomId}
                          </span>
                        </div>
                        <button 
                          onClick={handleLeaveRoom}
                          className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <X size={12} />
                          {t.finish}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Hash size={12} className="opacity-20" />
                        <input 
                          type="text" 
                          placeholder="Room ID" 
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value)}
                          className="bg-transparent border-none text-[10px] font-bold uppercase tracking-widest focus:ring-0 w-20 p-0"
                        />
                      </div>
                    )}
                  </div>

                  {!isJoinedRoom ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                       <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center mb-6 text-accent animate-float">
                         <Users size={32} />
                       </div>
                       <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">{t.studyRoom}</h4>
                       <p className="text-[11px] opacity-40 mb-10 leading-relaxed max-w-[200px]">
                         {selectedLanguage === 'Korean' ? '방 ID를 입력하여 같은 공부를 하는 친구들과 실시간으로 연결하세요.' : 'Enter a Room ID to connect with friends studying the same material in real-time.'}
                       </p>
                         <div className="w-full space-y-4">
                           <div className="grid grid-cols-2 gap-3">
                             <input 
                               type="text"
                               placeholder={t.roomName}
                               value={roomName}
                               onChange={(e) => setRoomName(e.target.value)}
                               className={`px-6 py-4 rounded-2xl text-sm font-bold border outline-none transition-all focus:ring-2 focus:ring-accent/50 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-zinc-100'}`}
                             />
                             <input 
                               type="text"
                               placeholder="Room ID"
                               value={roomId}
                               onChange={(e) => setRoomId(e.target.value)}
                               className={`px-6 py-4 rounded-2xl text-sm font-bold border outline-none transition-all focus:ring-2 focus:ring-accent/50 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-zinc-100'}`}
                             />
                           </div>
                           <input 
                             type="text"
                             placeholder="Your Username"
                             value={username}
                             onChange={(e) => setUsername(e.target.value)}
                             className={`w-full px-6 py-4 rounded-2xl text-sm font-bold border outline-none transition-all focus:ring-2 focus:ring-accent/50 ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-zinc-100'}`}
                           />
                           <div className="grid grid-cols-2 gap-3">
                             <button 
                               onClick={handleCreateRoom}
                               className={`py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 border ${darkMode ? 'bg-zinc-800 border-zinc-700 text-white hover:border-accent' : 'bg-white border-zinc-100 text-ink hover:border-accent'}`}
                             >
                               {t.createRoom}
                             </button>
                             <button 
                               onClick={handleJoinRoom}
                               disabled={!roomId.trim()}
                               className={`py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-20 ${darkMode ? 'bg-white text-ink' : 'bg-ink text-white'}`}
                             >
                               {t.joinRoom}
                             </button>
                           </div>

                           {/* Saved Rooms List */}
                           <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                             <div className="flex items-center justify-between mb-4">
                               <h6 className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.savedRoomsTitle}</h6>
                               <span className="text-[10px] font-mono opacity-20">{savedRooms.length}</span>
                             </div>
                             
                             <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                               {savedRooms.length > 0 ? savedRooms.slice().reverse().map((room) => (
                                 <div 
                                   key={room.id}
                                   onClick={() => {
                                     setRoomId(room.id);
                                     setRoomName(room.name);
                                   }}
                                   className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${roomId === room.id ? 'border-accent bg-accent/5' : (darkMode ? 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-300')}`}
                                 >
                                   <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${roomId === room.id ? 'bg-accent text-ink' : 'bg-zinc-200 dark:bg-zinc-700 opacity-40'}`}>
                                       <Hash size={14} />
                                     </div>
                                     <div className="flex flex-col">
                                       <span className="text-xs font-bold leading-tight">{room.name}</span>
                                       <span className="text-[10px] font-mono opacity-40 tracking-wider">#{room.id}</span>
                                     </div>
                                   </div>
                                   <button 
                                     onClick={(e) => removeSavedRoom(room.id, e)}
                                     className="p-2 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                                   >
                                     <X size={14} />
                                   </button>
                                 </div>
                               )) : (
                                 <p className="text-[10px] font-medium opacity-20 py-4 italic">{t.noSavedRooms}</p>
                               )}
                             </div>
                           </div>
                         </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-[520px]">
                      {/* LEFT: LIVE STUDY ROOM STAGE */}
                      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950/20 rounded-[32px] p-6 border border-zinc-120 dark:border-zinc-800/80">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            <h5 className="text-[11px] font-black uppercase tracking-widest opacity-80">
                              {selectedLanguage === 'Korean' ? '실시간 스터디 룸 멤버 (Live Room Members)' : 'Live Interactive Study Members'}
                            </h5>
                          </div>
                          
                          {/* Virtual Studymates Toggle */}
                          <button
                            onClick={() => setIncludeVirtualBuddies(!includeVirtualBuddies)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold transition-all border ${
                              includeVirtualBuddies 
                                ? 'bg-accent/10 border-accent/20 text-accent' 
                                : 'bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-400'
                            }`}
                          >
                            <Sparkles size={10} />
                            {selectedLanguage === 'Korean' ? 'AI 스터디메이트 활성' : 'AI Study Buddies'}
                          </button>
                        </div>

                        {/* SPLIT LIVE VIDEO GRID */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 min-h-[300px]">
                          {/* 1. LOCAL PROFILE CARD & REACTION SLOT (ME) */}
                          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-center items-center p-6 text-center group min-h-[220px]">
                            <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent text-ink dark:text-accent font-black text-2xl flex items-center justify-center shadow-lg shadow-accent/10 animate-float mb-4">
                              {username.substring(0, 2).toUpperCase()}
                            </div>
                            <h6 className="text-sm font-black text-zinc-800 dark:text-zinc-100 mb-1">{username}</h6>
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500 font-sans">
                                {selectedLanguage === 'Korean' ? '학습 참여 중 (온라인)' : 'Studying (Online)'}
                              </span>
                            </div>

                            {/* Overlays / Floating Reaction Bubble */}
                            <AnimatePresence>
                              {userEmojiReactions[username] && (
                                <motion.div
                                  initial={{ scale: 0.3, y: 15, opacity: 0 }}
                                  animate={{ scale: 1.2, y: -10, opacity: 1 }}
                                  exit={{ scale: 0.5, y: -30, opacity: 0 }}
                                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                                >
                                  <div className="bg-black/70 backdrop-blur-md text-3xl px-4 py-3 rounded-2xl border border-white/20 animate-bounce">
                                    {userEmojiReactions[username].emoji}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Hand Raised overlay state */}
                            {raisedHands.has(username) && (
                              <motion.div 
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="absolute top-3 right-3 bg-yellow-500 text-ink font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 z-15 border border-yellow-300"
                              >
                                <Hand size={10} className="fill-ink" />
                                <span>{selectedLanguage === 'Korean' ? '질문 있음 (손듬)' : 'Hand Raised'}</span>
                              </motion.div>
                            )}
                          </div>

                          {/* 2. EMMA SLOT (VIRTUAL / DYNAMIC BUDDY 1) */}
                          {includeVirtualBuddies && (
                            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 aspect-video md:aspect-auto flex flex-col justify-center items-center">
                              {/* Simulated webcam stream */}
                              <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/20 via-zinc-900 to-indigo-950/10 flex flex-col items-center justify-center gap-4">
                                <div className="flex items-end gap-1.5 h-12 w-24">
                                  <div className="w-1.5 bg-accent/40 rounded-full animate-[pulse_1.0s_infinite_alternate]" style={{height: '25%'}} />
                                  <div className="w-1.5 bg-accent/60 rounded-full animate-[pulse_1.4s_infinite_alternate]" style={{height: '55%'}} />
                                  <div className="w-1.5 bg-accent rounded-full animate-[pulse_0.8s_infinite_alternate]" style={{height: '85%'}} />
                                  <div className="w-1.5 bg-accent/70 rounded-full animate-[pulse_1.2s_infinite_alternate]" style={{height: '45%'}} />
                                  <div className="w-1.5 bg-accent/30 rounded-full animate-[pulse_1.6s_infinite_alternate]" style={{height: '15%'}} />
                                </div>
                                
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/35 text-purple-300 text-xs font-bold flex items-center justify-center shadow-inner">
                                    EM
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-300 mt-2">Emma</span>
                                  <span className="text-[8px] font-semibold text-zinc-500">
                                    {selectedLanguage === 'Korean' ? 'AI 학습 페이스메이커' : 'AI Study Pacemaker'}
                                  </span>
                                </div>
                              </div>

                              {/* Overlays */}
                              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-10 border border-white/10">
                                <span className="text-[9px] font-bold text-white tracking-wide">Emma</span>
                                <Mic size={9} className="text-emerald-400 animate-pulse" />
                              </div>
                              <div className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-400 font-bold text-[8px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                                Studying
                              </div>
                            </div>
                          )}

                          {/* 3. ALEX SLOT (VIRTUAL / DYNAMIC BUDDY 2) */}
                          {includeVirtualBuddies && (
                            <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900 aspect-video md:aspect-auto flex flex-col justify-center items-center">
                              {/* Simulated whiteboard / coding stream mockup */}
                              <div className="absolute inset-0 bg-gradient-to-br from-teal-950/20 via-zinc-900 to-emerald-950/10 flex flex-col items-center justify-center gap-4">
                                <div className="w-32 bg-black/50 border border-white/5 rounded-lg p-2 font-mono text-[6px] text-emerald-400/80 h-16 overflow-hidden">
                                  <p className="animate-pulse">const Brain = ({'{'} synapse {'}'}) =&gt;</p>
                                  <p className="text-sky-400 pl-2">synapse.fire('active-recall');</p>
                                  <p className="text-yellow-400 pl-2">studyTimer.syncLogs();</p>
                                  <p className="text-white/35 pl-4">// Learning matrix synced...</p>
                                </div>

                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/35 text-teal-300 text-xs font-bold flex items-center justify-center">
                                    AL
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-300 mt-2">Alex</span>
                                  <span className="text-[8px] font-semibold text-zinc-500">
                                    {selectedLanguage === 'Korean' ? '원격 학습 멘토' : 'Virtual Tech Partner'}
                                  </span>
                                </div>
                              </div>

                              {/* Overlays */}
                              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1.5 z-10 border border-white/10">
                                <span className="text-[9px] font-bold text-white tracking-wide">Alex</span>
                                <MicOff size={9} className="text-zinc-500" />
                              </div>
                              <div className="absolute top-3 right-3 bg-indigo-500/10 text-indigo-400 font-bold text-[8px] px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">
                                Coding
                              </div>
                            </div>
                          )}

                          {/* 4. WAITING FOR REAL FRIENDS CARD */}
                          {!includeVirtualBuddies && roomUsers.filter(u => u !== username).length === 0 && (
                            <div className="relative rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/15 flex flex-col items-center justify-center p-6 text-center">
                              <Users size={20} className="opacity-25 mb-2 animate-bounce text-accent" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-35">
                                {selectedLanguage === 'Korean' ? '원격 학습자 대기 중...' : 'Waiting for peers...'}
                              </span>
                              <span className="text-[8px] opacity-25 mt-1 max-w-[160px] leading-normal">
                                {selectedLanguage === 'Korean' ? '방 ID를 친구들에게 알려주면 실시간 줌 화상 회의처럼 여기에 비디오가 나타납니다!' : 'Share your Room ID with other learners to study together over camera!'}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* SIMPLIFIED STUDY ROOM CONTROLS */}
                        <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800/80 pt-4 flex flex-wrap items-center justify-center gap-4">
                          {/* 손 들기 */}
                          <button
                            onClick={raiseCollabHand}
                            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
                              raisedHands.has(username) 
                                ? 'bg-yellow-500 text-ink shadow-lg shadow-yellow-500/25 animate-bounce' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                            title="질문 질문! (Raise Hand)"
                          >
                            <Hand size={14} className={raisedHands.has(username) ? 'fill-ink' : ''} />
                            <span>{selectedLanguage === 'Korean' ? '질문 신청 (손들기)' : 'Raise Hand'}</span>
                          </button>

                          {/* 이모지 리액션 파레트 */}
                          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                            {['👏', '🎉', '💡', '🔥', '🙌', '😮'].map(em => (
                              <button
                                key={em}
                                onClick={() => sendCollabReaction(em)}
                                className="w-8 h-8 text-sm flex items-center justify-center hover:bg-zinc-250 dark:hover:bg-zinc-750 rounded-lg active:scale-95 transition-all"
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: TEXT CHAT CONTROL COLUMN */}
                      <div className="w-full lg:w-[350px] flex flex-col justify-between shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-150 dark:border-zinc-800/80 pt-6 lg:pt-0 lg:pl-6 min-h-[350px]">
                        <div className="flex-grow overflow-y-auto space-y-6 mb-6 pr-2 custom-scrollbar text-sm max-h-[380px]">
                          {roomMessages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                              <MessageSquare size={32} className="mb-4" />
                              <p className="text-xs font-bold uppercase tracking-widest">{t.roomMessages}</p>
                            </div>
                          )}
                          {roomMessages.map((m, i) => (
                            <div key={i} className={`flex flex-col gap-1.5 ${m.username === username ? 'items-end' : ''}`}>
                              <div className="flex items-center gap-2">
                                {m.username !== username && <span className="text-[10px] font-black opacity-30 uppercase">{m.username}</span>}
                                <span className="text-[8px] font-mono opacity-20">{m.timestamp}</span>
                              </div>
                              <div className={`p-4 border rounded-2xl leading-relaxed shadow-sm max-w-[95%] text-xs font-medium ${
                                m.username === username 
                                  ? 'bg-accent border-accent text-ink' 
                                  : (darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-150')
                              }`}>
                                {m.text}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                          <div className={`rounded-3xl p-2 flex gap-2 transition-all border ${darkMode ? 'bg-zinc-800 border-zinc-700 focus-within:border-accent' : 'bg-zinc-50 border-zinc-100 focus-within:border-accent'}`}>
                             <textarea 
                               value={roomInput}
                               onChange={(e) => setRoomInput(e.target.value)}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                   e.preventDefault();
                                   handleSendRoomMessage();
                                 }
                               }}
                               placeholder={t.shareThought}
                               className="bg-transparent border-none flex-1 resize-none outline-none text-xs font-medium h-12 p-2.5 placeholder:opacity-20"
                             />
                             <button 
                               onClick={handleSendRoomMessage}
                               className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-white text-ink hover:bg-accent' : 'bg-ink text-white hover:bg-accent hover:text-ink'}`}
                             >
                               <Send size={16} />
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'recall' ? (
                <motion.div 
                  key="recall"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">
                        {selectedLanguage === 'Korean' ? '🧠 AI 백지 인출 시뮬레이터 (Active Recall)' : '🧠 AI Active Recall Simulator'}
                      </h4>
                      <p className="text-[10px] mono-label mt-1">
                        {selectedLanguage === 'Korean' ? 'Passive 공부를 파괴하고 뇌에서 직접 개념을 끄집어내는 최고 효율의 지능형 진단소.' : 'Smash passive rereading. Retrieve concepts from your neural cortex in real time.'}
                      </p>
                    </div>
                  </div>

                  {!fileContent ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-ink/5 dark:border-white/5 rounded-3xl opacity-60">
                      <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 text-accent">
                        <FileText size={28} />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2">
                        {selectedLanguage === 'Korean' ? '가이드 개념 교재 미등록 상태' : 'No Active Material Loaded'}
                      </p>
                      <p className="text-[10px] leading-relaxed max-w-[280px]">
                        {selectedLanguage === 'Korean' 
                          ? '지식 허브(Context Hub) 탭으로 돌아가 먼저 암기할 도서 텍스트 파일이나 문서를 업로드해 주세요!' 
                          : 'Navigate back to Context Hub and load or scan a study book first so AI can grade your recall!'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                      
                      {/* STEP 1 INPUT */}
                      <div className={`p-6 border rounded-[32px] flex flex-col gap-4 shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                        <div>
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">
                            {selectedLanguage === 'Korean' ? 'STUDY STEP 1: 완전 기억 리콜' : 'STUDY STEP 1: Universal Recall Core'}
                          </span>
                          <span className="text-[10px] font-semibold opacity-55 block leading-normal">
                            {selectedLanguage === 'Korean' 
                              ? '교재를 보지 않고, 머릿속에서 흘러나오는 개념/키워드/인과관계를 두서없이 자유롭게 모두 적으세요.' 
                              : 'Dump every term, keyword, and definition you remember from the study files without looking.'}
                          </span>
                        </div>

                        <textarea
                          value={activeRecallInput}
                          onChange={(e) => setActiveRecallInput(e.target.value)}
                          placeholder={selectedLanguage === 'Korean' 
                            ? '예: 엽록체는 틸라코이드와 스트로마를 포함하며, 광합성을 수행해 식물에 포도당을 가공하는 핵심 동력 기기...' 
                            : 'Write freely... e.g., Mitochondria are dual-membrane organelles carrying DNA. They utilize chemical energy to synthesize ATP.'}
                          rows={11}
                          className={`w-full p-4 rounded-2xl border text-xs font-medium leading-relaxed transition-all focus:outline-none focus:ring-1 focus:ring-accent resize-none ${
                            darkMode ? 'bg-zinc-950 border-zinc-850 text-white placeholder-zinc-700 font-mono' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400'
                          }`}
                        />

                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[9px] font-mono opacity-40">
                            {selectedLanguage === 'Korean' 
                              ? `리콜 인출 수: ${activeRecallInput.length}자` 
                              : `Dump Size: ${activeRecallInput.length} chars`}
                          </span>
                          <button
                            type="button"
                            onClick={handleActiveRecallAnalysis}
                            disabled={!activeRecallInput.trim() || isAnalyzingActiveRecall}
                            className={`px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-102 flex items-center gap-2 shadow-xl ${
                              isAnalyzingActiveRecall ? 'animate-pulse opacity-75' : ''
                            } ${
                              darkMode ? 'bg-white text-ink hover:bg-zinc-100' : 'bg-ink text-white hover:bg-zinc-800'
                            } disabled:opacity-25`}
                          >
                            {isAnalyzingActiveRecall ? (
                              <>
                                <div className="w-3 h-3 border-2 border-current border-t-white rounded-full animate-spin" />
                                {selectedLanguage === 'Korean' ? '인출 채점 중...' : 'Scanning Recall...'}
                              </>
                            ) : (
                              <>
                                <Sparkles size={11} className="text-accent" />
                                {selectedLanguage === 'Korean' ? '인출 진단 채점' : 'Diagnose Dump'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* STEP 2 DIAGNOSTICS */}
                      <div className={`p-6 border rounded-[32px] flex flex-col gap-4 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}>
                        {!activeRecallReport ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-45 border-2 border-dashed border-ink/5 dark:border-white/5 rounded-2xl">
                            <Brain size={32} className="text-accent animate-float mb-3" />
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                              {selectedLanguage === 'Korean' ? 'STUDY STEP 2: 스캔 가동 대기' : 'STUDY STEP 2: Scans Processing'}
                            </p>
                            <p className="text-[9px] max-w-[210px] mt-2 leading-relaxed opacity-60">
                              {selectedLanguage === 'Korean' 
                                ? '왼쪽에 백지 복습 내용을 입력하고 채점 버튼을 클릭하면, AI가 원본 교재와 비교 분석합니다.' 
                                : 'Draft your brain-dump on the left and trigger diagnosis to inspect matching accuracy.'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[480px] pr-1 custom-scrollbar">
                            {/* Recall meter */}
                            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
                              <div>
                                <span className="text-[9px] font-black uppercase text-accent tracking-widest block">
                                  {selectedLanguage === 'Korean' ? '지식 각인 매칭 결과' : 'Active Recall Accuracy'}
                                </span>
                                <h5 className="text-base font-black tracking-tight mt-0.5">
                                  {activeRecallReport.matchScore >= 75 
                                    ? (selectedLanguage === 'Korean' ? '🟢 우수 기억 보유' : '🟢 Mastery Engram') 
                                    : activeRecallReport.matchScore >= 45 
                                      ? (selectedLanguage === 'Korean' ? '🟡 일반 기억 수준' : '🟡 Core Framework OK') 
                                      : (selectedLanguage === 'Korean' ? '🔴 적극 복습 요망' : '🔴 Focus Revision Needed')}
                                </h5>
                              </div>
                              <div className="h-14 w-14 rounded-full border-4 border-accent flex flex-col items-center justify-center bg-accent/5">
                                <span className="text-[14px] font-black tracking-tighter text-ink dark:text-white leading-none">{activeRecallReport.matchScore}</span>
                                <span className="text-[7px] font-mono opacity-40 uppercase tracking-widest mt-0.5">%</span>
                              </div>
                            </div>

                            {/* Remembered */}
                            <div>
                              <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                <CheckCircle2 size={10} className="text-emerald-500" />
                                {selectedLanguage === 'Korean' ? '정확하게 인출 성공한 포인트' : 'Concepts Confirmed'}
                              </span>
                              <div className="space-y-1">
                                {activeRecallReport.rememberedPoints.slice(0, 4).map((p, i) => (
                                  <div key={i} className="flex gap-1.5 items-start p-2 rounded-xl bg-emerald-500/5 text-[10px] font-medium leading-relaxed">
                                    <span className="text-emerald-500 font-mono">✓</span>
                                    <span className="opacity-75">{p}</span>
                                  </div>
                                ))}
                                {activeRecallReport.rememberedPoints.length === 0 && (
                                  <p className="text-[9px] italic opacity-40 text-center py-2">{selectedLanguage === 'Korean' ? '확인된 인출 개념이 없습니다.' : 'No accurate concepts detected.'}</p>
                                )}
                              </div>
                            </div>

                            {/* Missed */}
                            <div>
                              <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-widest flex items-center gap-1 mb-1.5">
                                <XCircle size={10} className="text-rose-500" />
                                {selectedLanguage === 'Korean' ? '완전 누락된 마블 지식 (블랙아웃 부위)' : 'Critical Knowledge Gaps (Blackouts)'}
                              </span>
                              <div className="space-y-1">
                                {activeRecallReport.missedPoints.slice(0, 4).map((p, i) => (
                                  <div key={i} className="flex gap-1.5 items-start p-2 rounded-xl bg-rose-500/5 text-[10px] font-medium leading-relaxed border border-rose-500/10">
                                    <span className="text-rose-500 font-mono">𐄂</span>
                                    <span className="opacity-75">{p}</span>
                                  </div>
                                ))}
                                {activeRecallReport.missedPoints.length === 0 && (
                                  <p className="text-[9px] italic opacity-40 text-center py-2">{selectedLanguage === 'Korean' ? '망각 포인트가 없습니다! 완벽합니다.' : 'No leaks encountered! Phenomenal work.'}</p>
                                )}
                              </div>
                            </div>

                            {/* Advisor feedbacks */}
                            <div className={`p-4 rounded-2xl border text-[10.5px] leading-relaxed flex flex-col gap-1 ${
                              darkMode ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-zinc-50 border-zinc-200/50 text-ink'
                            }`}>
                              <span className="text-[9px] font-extrabold text-accent uppercase tracking-widest block mb-0.5">
                                {selectedLanguage === 'Korean' ? '💬 인공지능 스터디 코치 격려 조언' : '💬 Interactive Coach Evaluation'}
                              </span>
                              <p className="whitespace-pre-wrap">{activeRecallReport.feedbackSummary}</p>
                            </div>

                            {/* Link Card conversion option */}
                            {activeRecallReport.missedPoints.length > 0 && (
                              <button
                                type="button"
                                onClick={handleInjectRecallFlashcards}
                                className="w-full py-3.5 bg-accent text-ink rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all hover:bg-accent/80 flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                              >
                                <Plus size={11} />
                                {selectedLanguage === 'Korean' ? '망각 개념들을 암기 플래시카드로 긴급 수송' : 'Deploy Forgotten Points to Flashcards'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'ebbinghaus' ? (
                <motion.div 
                  key="ebbinghaus"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col space-y-6 text-zinc-900 dark:text-zinc-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">
                        {selectedLanguage === 'Korean' ? '📅 에빙하우스 망각곡선 스마트 스케줄러' : '📅 Ebbinghaus Spaced Repetitive Tracker'}
                      </h4>
                      <p className="text-[10px] mono-label mt-1">
                        {selectedLanguage === 'Korean' ? '뇌와 장기 기억 각인을 위해 가장 완벽한 1, 3, 7, 14, 30일 반복 복습 타임트랙.' : 'Auto-engineered spaced repetitiveness cycles to lock short-term memory into permanent engrams.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">

                    {/* 에빙하우스 리텐션 히트맵 (Habit Heatmap Grid) */}
                    <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} shadow-sm space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                          <h5 className="text-[10px] font-black uppercase text-accent tracking-widest">
                            {selectedLanguage === 'Korean' ? '📊 에빙하우스 리텐션 히트맵 (Habit Heatmap Grid)' : '📊 Habit Retention Heatmap'}
                          </h5>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent text-ink font-mono font-bold">
                            🔥 {getHeatmapStreak()}{selectedLanguage === 'Korean' ? '일 연속 스트리크' : ' Days Streak!'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-[9px] opacity-40 leading-relaxed">
                        {selectedLanguage === 'Korean' 
                          ? '일일 실시간 집중 학습 완수도와 소크라테스 인출 상태를 모니터링합니다. 연속적인 스트리크(잔디)를 채우며 뇌의 초과 기억 흔적(Memory Engrams)을 생성해 보세요.' 
                          : 'Visualizes daily study completions. Build a continuous streak to lock your cognitive engrams into deep neurological networks.'}
                      </p>

                      <div className="pt-2">
                        <div className="flex flex-wrap gap-1.5 items-center justify-between">
                          {getHeatmapDays().map((day) => {
                            const value = day.studyMinutes;
                            // Heatmap color scaling
                            let colorClass = darkMode ? 'bg-zinc-950/40 border-zinc-850' : 'bg-zinc-100/50 border-zinc-150';
                            if (value > 0 && value < 5) {
                              colorClass = 'bg-emerald-500/20 border-emerald-500/10 dark:bg-emerald-500/10';
                            } else if (value >= 5 && value < 15) {
                              colorClass = 'bg-emerald-450 border-emerald-450/20 text-ink';
                            } else if (value >= 15 && value < 30) {
                              colorClass = 'bg-emerald-555 border-emerald-555/30 text-ink';
                            } else if (value >= 30) {
                              colorClass = 'bg-accent border-accent/40 text-ink font-black shadow-[0_0_12px_rgba(255,214,10,0.3)] animate-pulse';
                            }

                            const isHovered = hoveredHeatmapDay === day.date;

                            return (
                              <div
                                key={day.date}
                                onMouseEnter={() => setHoveredHeatmapDay(day.date)}
                                onMouseLeave={() => setHoveredHeatmapDay(null)}
                                className={`w-7 h-7 rounded-[10px] border flex flex-col items-center justify-center text-[9px] font-mono transition-all duration-200 relative cursor-pointer hover:scale-110 active:scale-95 select-none ${colorClass}`}
                              >
                                <span>{day.date.split('-')[2]}</span>
                                
                                {/* Hover Tooltip tooltip */}
                                {isHovered && (
                                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 dark:bg-zinc-950/95 text-white text-[9px] font-black uppercase p-2.5 rounded-xl shadow-2xl border border-zinc-800 whitespace-nowrap leading-tight text-center">
                                    <span className="block opacity-50 font-mono tracking-widest">{day.displayDate} ({day.dayOfWeek})</span>
                                    <span className="block mt-0.5 text-accent font-bold">⏱️ {day.studyMinutes} min focused</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Heatmap Legend */}
                        <div className="flex items-center justify-end gap-2.5 mt-4 text-[9px] font-semibold opacity-40">
                          <span>Less</span>
                          <div className="w-3 h-3 rounded bg-zinc-150 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800" />
                          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/10 dark:bg-emerald-500/10" />
                          <div className="w-3 h-3 rounded bg-emerald-450 border border-emerald-450/20" />
                          <div className="w-3 h-3 rounded bg-emerald-555 border border-emerald-555/30" />
                          <div className="w-3 h-3 rounded bg-accent border border-accent/40" />
                          <span>More</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* LEFT PANEL: Manual addition + Stats */}
                    <div className="space-y-5">
                      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} shadow-sm space-y-5`}>
                        <div>
                          <span className="text-[10px] font-black text-accent uppercase tracking-widest block mb-1">
                            {selectedLanguage === 'Korean' ? '복습 항목 수동 등록' : 'Manual Study Insertion'}
                          </span>
                          <span className="text-[10px] opacity-50 block leading-normal">
                            {selectedLanguage === 'Korean' ? '원하는 책이나 공부 내용을 수동 배치할 수도 있습니다.' : 'Add any custom offline textbooks/exams to the repetitive tracker.'}
                          </span>
                        </div>

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!newEbbinghausTitle.trim()) return;
                            handleAddEbbinghausItem(newEbbinghausTitle, newEbbinghausType);
                            setNewEbbinghausTitle('');
                          }}
                          className="space-y-3"
                        >
                          <input 
                            type="text"
                            placeholder={selectedLanguage === 'Korean' ? '교재명, 문서 제목 또는 시험 범위 입력...' : 'Textbook title, quiz scope, document...'}
                            value={newEbbinghausTitle}
                            onChange={(e) => setNewEbbinghausTitle(e.target.value)}
                            className={`w-full px-4 py-3 text-xs font-bold rounded-xl border focus:outline-none focus:ring-1 focus:ring-accent ${
                              darkMode ? 'bg-zinc-950 border-zinc-850 text-white placeholder-zinc-700' : 'bg-zinc-50 border-zinc-150 text-ink'
                            }`}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {(['material', 'quiz', 'flashcard', 'recall'] as const).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setNewEbbinghausType(t)}
                                className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                                  newEbbinghausType === t 
                                    ? 'bg-accent/10 border-accent text-accent' 
                                    : (darkMode ? 'bg-zinc-950 border-zinc-850 opacity-40 hover:opacity-100' : 'bg-zinc-50 border-zinc-150 opacity-50 hover:opacity-100')
                                }`}
                              >
                                {t === 'material' ? '📖 Material' : t === 'quiz' ? '✍️ Quiz' : t === 'flashcard' ? '🎴 Flashcard' : '🧠 Recall'}
                              </button>
                            ))}
                          </div>
                          <button
                            type="submit"
                            disabled={!newEbbinghausTitle.trim()}
                            className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer ${
                              darkMode ? 'bg-white text-ink hover:bg-zinc-100' : 'bg-ink text-white hover:bg-zinc-800'
                            } disabled:opacity-25`}
                          >
                            + {selectedLanguage === 'Korean' ? '주기 스케줄러 등록' : 'Register Period Tracker'}
                          </button>
                        </form>
                      </div>

                      {/* STATS */}
                      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} shadow-sm space-y-4`}>
                        <h5 className="text-[10px] font-black uppercase text-accent tracking-widest">
                          {selectedLanguage === 'Korean' ? '학습 장기 기억 전이 통계' : 'Memory Retention Diagnostics'}
                        </h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200/40 dark:border-zinc-800 text-center">
                            <span className="text-[9px] font-bold block opacity-40 uppercase">Total Items</span>
                            <span className="text-xl font-black font-mono">{ebbinghausItems.length}</span>
                          </div>
                          <div className="p-3 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-center">
                            <span className="text-[9px] font-bold block opacity-40 uppercase text-rose-500">Reviews Due</span>
                            <span className="text-xl font-black font-mono text-rose-500">
                              {ebbinghausItems.filter(item => !item.completed && (!item.nextReviewDate || new Date(item.nextReviewDate) <= new Date())).length}
                            </span>
                          </div>
                          <div className="p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center col-span-2">
                            <span className="text-[9px] font-bold block opacity-40 uppercase text-emerald-500">Long-term Memory Transferred (30d mastered)</span>
                            <span className="text-lg font-black font-mono text-emerald-500 leading-none">
                              {selectedLanguage === 'Korean' 
                                ? `${ebbinghausItems.filter(item => item.completed).length}개 항목의 학습 기억 각인 완료 👏` 
                                : `👏 ${ebbinghausItems.filter(item => item.completed).length} Items Mastered`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL: List of items */}
                    <div className="space-y-6">
                      {/* DUE TODAY LIST */}
                      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} shadow-sm`}>
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={12} className="text-rose-500 animate-pulse" />
                            {selectedLanguage === 'Korean' ? '🚨 오늘 꼭 복습해야 하는 긴급 지식' : '🚨 Memory Reviews Due Today'}
                          </span>
                          <span className="text-[9px] font-mono opacity-40">
                            {selectedLanguage === 'Korean' ? '미복습시 소멸 구간' : 'Active memory fading'}
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                          {ebbinghausItems.filter(item => !item.completed && (!item.nextReviewDate || new Date(item.nextReviewDate) <= new Date())).length === 0 ? (
                            <div className="text-center py-10 opacity-40 italic text-[11px] font-medium leading-relaxed">
                              {selectedLanguage === 'Korean' 
                                ? '오늘 예정된 복습 주기가 없습니다. 뇌의 연계 학습 상태가 아주 건강합니다! ☀️' 
                                : 'No memory intervals due to expire today! Your neural retention is robust. ☀️'}
                            </div>
                          ) : (
                            ebbinghausItems.filter(item => !item.completed && (!item.nextReviewDate || new Date(item.nextReviewDate) <= new Date())).map((item) => {
                              const stagesLabel = ["Day 1", "Day 3", "Day 7", "Day 14", "Day 30"];
                              return (
                                <div key={item.id} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                                  darkMode ? 'bg-zinc-950/40 border-zinc-850 hover:bg-zinc-950/60' : 'bg-zinc-50 border-zinc-150 hover:bg-zinc-100/50'
                                } transition-all`}>
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm shrink-0">
                                      {item.type === 'material' ? '📖' : item.type === 'quiz' ? '✍️' : item.type === 'flashcard' ? '🎴' : '🧠'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-black truncate max-w-[280px] leading-tight text-zinc-800 dark:text-zinc-200">{item.title}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-mono opacity-50 uppercase tracking-wider">
                                          {item.type}
                                        </span>
                                        <span className="text-[9px] font-bold text-accent">
                                          {selectedLanguage === 'Korean' ? `현재 반복 단계: ${item.stage}단계 (${stagesLabel[Math.min(item.stage, 4)]}차 복습)` : `Current Stage: ${item.stage}`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => handleReviewEbbinghausItem(item.id)}
                                      className="px-3.5 py-2 bg-accent text-ink rounded-lg font-black text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                                    >
                                      ✓ {selectedLanguage === 'Korean' ? '복습 완료' : 'Complete Review'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteEbbinghausItem(item.id)}
                                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* ALL TIMELINE */}
                      <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} shadow-sm`}>
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={12} className="opacity-40" />
                            {selectedLanguage === 'Korean' ? '🔗 전체 장기 기억 반복 주기 타임라인' : '🔗 Spaced Repetition Retrospective'}
                          </span>
                          <span className="text-[9px] opacity-40 font-mono">
                            {ebbinghausItems.length} registered
                          </span>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                          {ebbinghausItems.length === 0 ? (
                            <div className="text-center py-10 opacity-30 italic text-[11px] font-medium leading-relaxed">
                              {selectedLanguage === 'Korean' ? '등록된 복습 주기가 없습니다.' : 'Spaced repetition schedule is empty.'}
                            </div>
                          ) : (
                            ebbinghausItems.map((item) => {
                              const stagesLabel = ["Original Study", "Day 1 (1st)", "Day 3 (2nd)", "Day 7 (3rd)", "Day 14 (4th)", "Day 30 (5th)"];
                              const isOverdue = !item.completed && item.nextReviewDate && new Date(item.nextReviewDate) <= new Date();
                              return (
                                <div key={item.id} className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                                  item.completed 
                                    ? (darkMode ? 'bg-zinc-950/10 border-emerald-950 opacity-55' : 'bg-emerald-50/5 border-emerald-100 opacity-70')
                                    : (darkMode ? 'bg-zinc-950/20 border-zinc-850' : 'bg-zinc-50 border-zinc-150')
                                }`}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs font-bold shrink-0">
                                        {item.completed ? '🍾' : item.type === 'material' ? '📖' : item.type === 'quiz' ? '✍️' : item.type === 'flashcard' ? '🎴' : '🧠'}
                                      </span>
                                      <p className="text-xs font-extrabold truncate max-w-[280px] leading-tight">{item.title}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteEbbinghausItem(item.id)}
                                      className="p-1 opacity-20 hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>

                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-zinc-150/20 dark:border-zinc-800/30 pt-2 text-[10px]">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono opacity-40">Stage:</span>
                                      <div className="flex gap-1">
                                        {[0, 1, 2, 3, 4, 5].map(step => (
                                          <div 
                                            key={step} 
                                            className={`w-3.5 h-1.5 rounded-sm ${
                                              item.completed 
                                                ? 'bg-emerald-500' 
                                                : (step <= item.stage ? 'bg-accent shadow-sm' : (darkMode ? 'bg-zinc-800' : 'bg-zinc-200'))
                                            }`} 
                                            title={stagesLabel[step]}
                                          />
                                        ))}
                                      </div>
                                      <span className="font-extrabold text-accent bg-accent/5 px-1 rounded">
                                        {item.completed ? 'LTM Engraved' : stagesLabel[Math.min(item.stage, 5)]}
                                      </span>
                                    </div>
                                    <div>
                                      {item.completed ? (
                                        <span className="text-emerald-500 font-bold">✓ {selectedLanguage === 'Korean' ? '완전 장기 기억화 완료!' : 'Mapped to permanent cortex'}</span>
                                      ) : (
                                        <span className={`font-mono font-bold ${isOverdue ? 'text-rose-500' : 'opacity-50'}`}>
                                          {selectedLanguage === 'Korean' ? '다음 복습일' : 'Next Review'}: {format(parseISO(item.nextReviewDate), 'yyyy-MM-dd')} {isOverdue ? `(${selectedLanguage === 'Korean' ? '지연됨!' : 'Overdue!'})` : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              ) : activeTab === 'mistake-diary' ? (
                <motion.div 
                  key="mistake-diary"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col space-y-6 text-zinc-900 dark:text-zinc-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">
                        {selectedLanguage === 'Korean' ? '📝 메타인지 AI 오답 리마인더' : '📝 Metacognitive Mistake Diary'}
                      </h4>
                      <p className="text-[10px] mono-label mt-1">
                        {selectedLanguage === 'Korean' ? '단순 오답 오기를 넘어 AI 오개념 진단과 실시간 유사 변형 문제를 제공하는 파괴적 인출 정복 엔진.' : 'Step beyond passive journals. Diagnose misconceptions and tackle dynamically engineered variant quizzes.'}
                      </p>
                    </div>
                  </div>

                  {mistakeQuestions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-ink/5 dark:border-white/5 rounded-[40px] opacity-60">
                      <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center mb-6 text-accent animate-float">
                        <Brain size={32} />
                      </div>
                      <h5 className="text-md font-black uppercase mb-2">
                        {selectedLanguage === 'Korean' ? '오답 축적 창고가 비어 있습니다!' : 'Mistake Ledger is Empty!'}
                      </h5>
                      <p className="text-xs leading-relaxed max-w-[340px] opacity-60">
                        {selectedLanguage === 'Korean' 
                          ? '성취도 평가 퀴즈(Quiz) 혹은 백지 인출(Recall) 시뮬레이터에서 오답이 발생하면 이곳에 실시간 연계 적재됩니다. 퀴즈를 풀고 오개념을 포착해 보세요!' 
                          : 'Incorrectly solved quiz or recall gaps are securely logged here automatically to reconstruct your cognitive gaps.'}
                      </p>
                      <button 
                        onClick={() => setActiveTab('quiz')}
                        className="mt-6 px-6 py-3 bg-accent text-ink rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                      >
                        ✍️ {selectedLanguage === 'Korean' ? '퀴즈 챌린지 풀러 가기' : 'Tackle Academic Quiz'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                      
                      {/* MISTAKE SIDEBAR - Columns 4 */}
                      <div className="lg:col-span-4 space-y-4 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                        <span className="text-[10px] font-black uppercase tracking-widest block opacity-40">
                          {selectedLanguage === 'Korean' ? '누적 오답 리스트' : 'Logged Mistake Gaps'} ({mistakeQuestions.length})
                        </span>
                        
                        {mistakeQuestions.map((mistake) => (
                          <div
                            key={mistake.id}
                            onClick={() => {
                              setActiveMistakeForVariant(mistake);
                              setActiveVariantQuestion(null);
                              setVariantFeedback(null);
                            }}
                            className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                              activeMistakeForVariant?.id === mistake.id 
                                ? 'border-accent bg-accent/5' 
                                : (darkMode ? 'bg-zinc-900 border-zinc-850 hover:border-zinc-700' : 'bg-white border-zinc-100 hover:border-zinc-300')
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[8px] font-bold uppercase tracking-widest font-mono">
                                Quiz Gap
                              </span>
                              <span className="text-[9px] opacity-40 font-mono">
                                Status: {mistake.reviewStatus || 'review'}
                              </span>
                            </div>
                            <p className="text-xs font-black truncate leading-normal text-zinc-900 dark:text-zinc-100">{mistake.question}</p>
                            <p className="text-[9px] opacity-40 mt-1 truncate">Wrong: {mistake.userAnswer}</p>
                          </div>
                        ))}
                      </div>

                      {/* DETAILED GAP DIAGNOSIS & VARIANT SOLVER - Columns 8 */}
                      <div className="lg:col-span-8 flex flex-col gap-6">
                        {!activeMistakeForVariant ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-45 border-2 border-dashed border-ink/5 dark:border-white/5 rounded-[40px]">
                            <HelpCircle size={32} className="text-accent mb-2 animate-pulse" />
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">
                              {selectedLanguage === 'Korean' ? '상세 포커스 기기 대기' : 'Awaiting Conception Focus'}
                            </p>
                            <p className="text-[9px] max-w-[210px] mt-1 leading-relaxed opacity-60">
                              {selectedLanguage === 'Korean' 
                                ? '왼쪽 오답 리스트에서 복습 오개념을 타겟 설정하면 AI 심층 처방이 가동됩니다.' 
                                : 'Select any gap card on the left sidebar to prompt AI socratic breakdown and tackle simulated breakthroughs.'}
                            </p>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col gap-6">
                            {/* ORIGINAL MISTAKE CARD */}
                            <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'} shadow-sm space-y-4 text-left`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-0.5">Original Mistake Source</span>
                                  <h5 className="text-sm font-black mr-4 leading-normal text-zinc-900 dark:text-zinc-100">{activeMistakeForVariant.question}</h5>
                                </div>
                                <button
                                  onClick={() => {
                                    setMistakeQuestions(prev => prev.filter(m => m.id !== activeMistakeForVariant.id));
                                    setActiveMistakeForVariant(null);
                                    setActiveVariantQuestion(null);
                                    setVariantFeedback(null);
                                  }}
                                  className="p-1.5 opacity-20 hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-semibold leading-relaxed pt-2">
                                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                  <span className="text-rose-500 block uppercase font-black tracking-widest text-[8px] mb-1">Your Incorrect Choice</span>
                                  <span className="opacity-80">{activeMistakeForVariant.userAnswer || "None / Blackout Gap"}</span>
                                </div>
                                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                  <span className="text-emerald-500 block uppercase font-black tracking-widest text-[8px] mb-1">Correct Answer</span>
                                  <span className="opacity-80 font-black">{activeMistakeForVariant.correctAnswer}</span>
                                </div>
                              </div>

                              {/* AI MISCONCEPTION DIAGNOSIS SECTION */}
                              <div className={`p-5 rounded-2xl border text-[11px] leading-relaxed flex flex-col gap-1.5 ${
                                darkMode ? 'bg-zinc-950 border-zinc-850 text-zinc-300' : 'bg-zinc-50 border-zinc-200/50 text-ink'
                              }`}>
                                <span className="text-[9px] font-extrabold text-accent uppercase tracking-widest flex items-center gap-1.5 mb-1 bg-accent/5 px-2 py-0.5 rounded w-max">
                                  <Brain size={11} className="text-accent" />
                                  {selectedLanguage === 'Korean' ? '🧠 AI 메타인지 오개념 심층 진단소' : '🧠 AI Misconception Diagnosis'}
                                </span>
                                {activeMistakeForVariant.aiFeedback ? (
                                  <p className="whitespace-pre-wrap font-medium">{activeMistakeForVariant.aiFeedback}</p>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-4 text-center">
                                    <p className="opacity-55 text-[10px] leading-relaxed mb-3">
                                      {selectedLanguage === 'Korean' 
                                        ? '성주의 근본 원인(First-principles)과 오인지를 심화 격파하기 위해 AI 피드백을 수신해 보세요.' 
                                        : 'Analyze the core educational mechanism and trigger diagnosis.'}
                                    </p>
                                    <button
                                      onClick={() => handleGetMistakeFeedback(activeMistakeForVariant.id)}
                                      disabled={loadingMistakeFeedbackId === activeMistakeForVariant.id}
                                      className="px-4 py-2 bg-accent text-ink rounded-lg font-black text-[9px] uppercase tracking-wider transition-all hover:scale-102 flex items-center gap-2"
                                    >
                                      {loadingMistakeFeedbackId === activeMistakeForVariant.id ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                                          Diagnosing Gaps...
                                        </>
                                      ) : (
                                        <>
                                          <Sparkles size={10} className="text-ink" />
                                          {selectedLanguage === 'Korean' ? '진단서 실시간 발급' : 'Acquire Diagnosis'}
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* DYNAMIC VARIANT SOLVER */}
                            <div className={`p-6 rounded-[32px] border ${darkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-zinc-50 border-zinc-200/50'} flex flex-col gap-4 text-left`}>
                              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-150/40 dark:border-zinc-800/40">
                                <div>
                                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">Metacognitive Breakthrough Simulator</span>
                                  <h6 className="text-xs font-black mt-0.5">{selectedLanguage === 'Korean' ? '🎯 AI 맞춤 유사 변형 고난도 퀴즈' : '🎯 AI Concept Variant Practice'}</h6>
                                </div>
                                {!activeVariantQuestion && (
                                  <button
                                    onClick={() => handleGenerateVariant(activeMistakeForVariant)}
                                    disabled={isGeneratingVariant}
                                    className="px-4 py-2.5 bg-ink text-white dark:bg-white dark:text-ink rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-20 flex items-center gap-1.5 shadow"
                                  >
                                    {isGeneratingVariant ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Thinking...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles size={11} className="text-accent" />
                                        {selectedLanguage === 'Korean' ? '신규 변형 문제 출제' : 'Tackle Variant Quiz'}
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>

                              {activeVariantQuestion ? (
                                <div className="space-y-4">
                                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950/40 border border-zinc-150/50 dark:border-zinc-850 font-bold text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed leading-normal">
                                    {activeVariantQuestion.question}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
                                    {activeVariantQuestion.options.map((opt, oIdx) => {
                                      const isSelected = variantUserAnswer === opt;
                                      return (
                                        <button
                                          key={oIdx}
                                          type="button"
                                          disabled={!!variantUserAnswer}
                                          onClick={() => handleSolveVariant(opt)}
                                          className={`p-4 rounded-xl border text-left text-xs font-bold leading-normal transition-all hover:scale-[1.01] ${
                                            isSelected 
                                              ? 'border-accent bg-accent/5' 
                                              : (darkMode ? 'bg-zinc-950/20 border-zinc-850 hover:border-zinc-700' : 'bg-white border-zinc-150 hover:border-zinc-300')
                                          } disabled:opacity-85`}
                                        >
                                          <div className="flex gap-2.5 items-start">
                                            <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[9px] font-black font-mono flex items-center justify-center shrink-0 mt-0.5">{oIdx+1}</span>
                                            <span>{opt}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* VARIANT SOLVER CORNER feedback */}
                                  <AnimatePresence>
                                    {variantFeedback && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className={`p-5 rounded-2xl border text-xs font-medium leading-relaxed leading-normal relative ${
                                          variantUserAnswer === activeVariantQuestion.correctAnswer
                                            ? 'bg-emerald-500/5 border-emerald-500/10 text-zinc-800 dark:text-zinc-200'
                                            : 'bg-rose-500/5 border-rose-500/10 text-zinc-800 dark:text-zinc-200'
                                        }`}
                                      >
                                        <button 
                                          onClick={() => {
                                            setActiveVariantQuestion(null);
                                            setVariantFeedback(null);
                                            setVariantUserAnswer('');
                                          }} 
                                          className="absolute right-3.5 top-3.5 opacity-30 hover:opacity-100 text-[10px] font-black transition-all hover:text-rose-500"
                                        >
                                          [ {selectedLanguage === 'Korean' ? '닫기' : 'CLOSE'} ]
                                        </button>
                                        <p className="whitespace-pre-line pr-10">{variantFeedback}</p>

                                        {variantUserAnswer === activeVariantQuestion.correctAnswer && (
                                          <div className="mt-4 flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handleAddEbbinghausItem(`${activeMistakeForVariant.question} (Breakthrough Review)`, 'quiz');
                                                alert(selectedLanguage === 'Korean' ? "📅 축하합니다! 변형 극복한 개념을 뇌에 완전 고착시키기 위해 에빙하우스 스케줄러에 추가 등록했습니다." : "Spaced repetition booked to cement this breakthrough.");
                                              }}
                                              className="px-3.5 py-2 bg-accent text-ink rounded-lg font-black text-[9px] uppercase tracking-widest transition-all hover:scale-105"
                                            >
                                              📅 에빙하우스 복습 주기 긴급 등록
                                            </button>
                                          </div>
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              ) : (
                                <div className="text-center py-6 opacity-30 italic text-[10px]">
                                  {selectedLanguage === 'Korean' ? '문제가 아직 생성되지 않았습니다.' : 'Click button above to simulate variant breakthroughs.'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="cornell"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col space-y-6 text-zinc-900 dark:text-zinc-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter">
                        {selectedLanguage === 'Korean' ? '✍️ 코넬식 실시간 스마트 필기장' : '✍️ Cornell Notes & Smart AI Cues'}
                      </h4>
                      <p className="text-[10px] mono-label mt-1">
                        {selectedLanguage === 'Korean' ? '좌측 인출 큐(Recall Cue), 우측 주 기록란(Notes/Summary)의 연동을 통해 수동적 요약을 극복하고 능동 기억 인출을 촉발.' : 'Bypass passive summarization. Use left Recall Cues to challenge your mental retrieval as you note theories.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    
                    {/* LEFT COLUMN: Recall Cues - Column 4 */}
                    <div className={`p-6 border rounded-[32px] flex flex-col gap-4 shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'}`}>
                      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-150/40 dark:border-zinc-800/40">
                        <div>
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest block">Recall Column</span>
                          <h6 className="text-[11px] font-extrabold uppercase tracking-tight mt-0.5">{selectedLanguage === 'Korean' ? '💡 단서 / 질문란 (Cue Prompts)' : '💡 Recall Cues / Prompts'}</h6>
                        </div>
                        <button
                          onClick={handleTriggerCornellCues}
                          disabled={!cornellNotes.trim() || isGeneratingCornellCues}
                          className="p-2 bg-accent text-ink rounded-lg font-black text-[9px] uppercase tracking-wider hover:scale-105 active:scale-95 disabled:opacity-25 flex items-center gap-1 shrink-0"
                        >
                          {isGeneratingCornellCues ? (
                            <>
                              <div className="w-2.5 h-2.5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} className="text-ink" />
                              {selectedLanguage === 'Korean' ? 'AI 큐 출제' : 'Ask AI'}
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
                        {cornellCues.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-45 border-2 border-dashed border-ink/5 dark:border-white/5 rounded-2xl">
                            <Brain size={24} className="text-accent animate-float mb-2" />
                            <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-500">Awaiting Note Cueing</p>
                            <p className="text-[8px] max-w-[180px] mt-1.5 leading-normal opacity-60">
                              {selectedLanguage === 'Korean' 
                                ? '우측 필기란에 노트를 적은 뒤 AI 큐 버튼을 누르시면 능동적 인출 질문이 처방됩니다.' 
                                : 'Draft your notes on the right and click AI Cue to generate active recall challenges.'}
                            </p>
                          </div>
                        ) : (
                          cornellCues.map((cue, cIdx) => {
                            const isExpanded = expandedCornellCueIdx === cIdx;
                            return (
                              <div key={cIdx} className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-2 ${
                                isExpanded 
                                  ? 'border-accent bg-accent/5' 
                                  : (darkMode ? 'bg-zinc-950/20 border-zinc-850 hover:border-zinc-750' : 'bg-zinc-50 border-zinc-150 hover:border-zinc-250')
                              }`}>
                                <div 
                                  onClick={() => setExpandedCornellCueIdx(isExpanded ? null : cIdx)}
                                  className="cursor-pointer flex items-start justify-between gap-1"
                                >
                                  <div>
                                    <span className="text-[8px] font-mono opacity-50 block uppercase tracking-wide">Cue #{cIdx + 1} - {cue.targetRecallConcept}</span>
                                    <p className="text-xs font-black leading-tight mt-1 text-zinc-900 dark:text-zinc-100">{cue.cueQuestion}</p>
                                  </div>
                                  <span className="text-[9px] opacity-40 font-mono self-start mt-0.5">{isExpanded ? '▲' : '▶'}</span>
                                </div>

                                {isExpanded && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-[10px] text-zinc-600 dark:text-zinc-300 border-t border-zinc-150/30 dark:border-zinc-850/30 pt-2 leading-relaxed leading-normal"
                                  >
                                    <span className="text-[8px] font-black uppercase text-accent tracking-wider block mb-1">💡 Socratic Clue Directive</span>
                                    {cue.hintText}
                                  </motion.div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Note Taking & Summary - Column 8 */}
                    <div className="flex flex-col gap-6">
                      {/* MAIN NOTES COLUMN */}
                      <div className={`p-6 border rounded-[32px] flex flex-col gap-4 shadow-sm flex-1 relative ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'}`}>
                        <div className="flex items-center justify-between pb-3 text-b border-b border-zinc-150/40 dark:border-zinc-800/40">
                          <div>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block">Record Column</span>
                            <h6 className="text-xs font-black mt-0.5">{selectedLanguage === 'Korean' ? '✍️ 필기 및 주 기록란 (Active Notes Section)' : '✍️ Main Cornell Recording Slate'}</h6>
                          </div>
                          <span className="text-[8px] font-mono opacity-40 font-bold tracking-wider py-1 px-2.5 bg-emerald-500/5 text-emerald-500 rounded-full">
                            Synced in Realtime to Local Device
                          </span>
                        </div>

                        {/* Notes text selection toolbar for dual-way mindmap mirroring */}
                        {notesSelectionDetails && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-6 top-16 z-50 flex items-center gap-1.5 p-1 px-2.5 bg-accent text-ink rounded-xl shadow-[0_4px_16px_rgba(255,214,10,0.35)] border border-accent/20 font-black text-[9px] uppercase tracking-wider select-none animate-bounce"
                          >
                            <span>🗺️ "{notesSelectionDetails.text.length > 10 ? notesSelectionDetails.text.substring(0, 10) + '...' : notesSelectionDetails.text}"</span>
                            <button
                              onClick={handleSyncSelectedTextToMindmap}
                              className="px-2 py-1 bg-ink text-white rounded-lg font-extrabold cursor-pointer hover:bg-ink/80 transition-all text-[8px]"
                            >
                              {selectedLanguage === 'Korean' ? '지식 공간에 노드로 동조화' : 'Sync to Concept Space'}
                            </button>
                            <button
                              onClick={() => setNotesSelectionDetails(null)}
                              className="p-1 px-1.5 hover:bg-ink/10 rounded-lg text-xs"
                            >
                              ✕
                            </button>
                          </motion.div>
                        )}

                        <textarea
                          ref={cornellNotesTextareaRef}
                          value={cornellNotes}
                          onSelect={handleNotesTextSelect}
                          onChange={(e) => {
                            setCornellNotes(e.target.value);
                            localStorage.setItem('study_cornell_notes', e.target.value);
                          }}
                          placeholder={selectedLanguage === 'Korean'
                            ? '공부 교재의 개념, 논픽션 인프라, 수식, 암기 대상을 자유롭고 세밀하게 타이핑 정리하세요...'
                            : 'Write down definitions, main structural points, flowcharts, or formulas from study slides here...'}
                          rows={11}
                          className={`w-full p-4 rounded-xl border text-xs font-bold leading-relaxed transition-all focus:outline-none focus:ring-1 focus:ring-accent resize-none flex-1 ${
                            darkMode ? 'bg-zinc-950 border-zinc-850 text-white placeholder-zinc-700 font-mono' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400'
                          }`}
                        />
                      </div>

                      {/* HOMLISTIC SUMMARY COLUMN */}
                      <div className={`p-6 border rounded-[32px] flex flex-col gap-3 shadow-sm ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'}`}>
                        <div>
                          <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">Summary Row</span>
                          <h6 className="text-xs font-black mt-0.5">{selectedLanguage === 'Korean' ? '📝 최하단 장기 기억 요약 정리란 (Systemic Recap)' : '📝 Holistic Retrospective Recap (bottom block)'}</h6>
                        </div>

                        <textarea
                          value={cornellSummary}
                          onChange={(e) => setCornellSummary(e.target.value)}
                          placeholder={selectedLanguage === 'Korean'
                            ? '필기장을 다시 훑어보고, 이 페이지의 가치를 3-4문장으로 구조화 요약하세요... (망각 장벽을 허무는 최종 장기 기억 전이 구간)'
                            : 'Synthesize the entire sheet into 3-4 powerful sentences. Recapping locks the engram forever...'}
                          rows={3}
                          className={`w-full p-4 rounded-xl border text-xs font-semibold leading-relaxed transition-all focus:outline-none focus:ring-1 focus:ring-accent resize-none ${
                            darkMode ? 'bg-zinc-950 border-zinc-850 text-white placeholder-zinc-700' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400'
                          }`}
                        />
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-20 bg-zinc-900 dark:bg-zinc-950 rounded-[40px] flex items-center px-8 gap-5 text-white shadow-xl">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/10 text-white'} transition-all`}>
              <Mic size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] mono-label !text-white/20">{t.neuralLink}</p>
              <div className="flex items-center gap-2">
                 {!isRecording && <div className="w-1 h-1 bg-accent rounded-full" />}
                 <p className="text-[14px] font-bold tracking-tight">{isRecording ? t.capturing : t.synchronized}</p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
              <Info size={16} />
            </button>
          </div>
        </section>
      </main>

      {/* Camera Overlay */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12"
          >
            <div className="max-w-2xl w-full flex flex-col items-center">
              <div className="w-full flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-white font-mono text-[10px] font-bold uppercase tracking-widest">{t.opticalActive}</span>
                </div>
                <button 
                  onClick={() => setShowCamera(false)}
                  className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-ink transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative w-full aspect-[4/3] rounded-[40px] overflow-hidden border-4 border-white/10 bg-black group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Viewfinder lines */}
                <div className="absolute inset-10 border-2 border-accent/30 rounded-2xl pointer-events-none transition-all group-hover:border-accent">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent -translate-x-1 -translate-y-1"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent translate-x-1 -translate-y-1"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent -translate-x-1 translate-y-1"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent translate-x-1 translate-y-1"></div>
                </div>

                {isScanning && (
                  <motion.div 
                    initial={{ y: -400 }}
                    animate={{ y: 400 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1 bg-accent/50 shadow-[0_0_30px_rgb(255,214,10)] z-10"
                  />
                )}
              </div>

              <div className="mt-12 flex flex-col items-center gap-6">
                <p className="text-white/40 text-center text-sm font-medium max-w-xs leading-relaxed">
                  {t.alignPaper}
                </p>
                <button 
                  onClick={handleCapture}
                  disabled={isScanning}
                  className="group relative w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-20"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-ink transition-transform group-hover:scale-[0.85] flex items-center justify-center">
                    <Scan size={32} className="text-ink" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-ink">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowGuide(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white'}`}
            >
              <div className="p-10 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start shrink-0">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-ink shadow-lg shadow-accent/20">
                    <BookOpen size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-2xl tracking-tighter uppercase leading-none mb-2">{t.guideTitle}</h4>
                    <p className="text-xs font-medium opacity-40">{t.guideDesc}</p>
                  </div>
                </div>
                <button onClick={() => setShowGuide(false)} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* 🍏 Tab Selectors inside Modal */}
              <div className="px-10 py-4 bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800/80 flex gap-3 shrink-0">
                <button
                  onClick={() => setActiveGuideTab('core')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    activeGuideTab === 'core'
                      ? 'bg-accent text-ink shadow-lg shadow-accent/20 scale-[1.01]'
                      : 'bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  {t.guideCoreTab || 'Core Features'}
                </button>
                <button
                  onClick={() => setActiveGuideTab('other')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                    activeGuideTab === 'other'
                      ? 'bg-accent text-ink shadow-lg shadow-accent/20 scale-[1.01]'
                      : 'bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
                  }`}
                >
                  <Zap size={13} />
                  {t.guideOtherTab || 'Smart Features'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 custom-scrollbar text-ink dark:text-white">
                {activeGuideTab === 'core' ? (
                  ((t.guideSteps || []) as any[]).map((step, idx) => {
                    const icons = [
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600"><Upload size={24} /></div>,
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"><Globe size={24} /></div>,
                      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600"><Zap size={24} /></div>,
                      <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600"><MessageSquare size={24} /></div>,
                      <div className="bg-rose-100 dark:bg-rose-900/30 text-rose-600"><CheckCircle2 size={24} /></div>,
                      <div className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600"><Users size={24} /></div>,
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"><Volume2 size={24} /></div>,
                      <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600"><BarChart3 size={24} /></div>,
                      <div className="bg-slate-100 dark:bg-slate-900/30 text-slate-600"><Moon size={24} /></div>
                    ];

                    return (
                      <motion.div 
                        key={`core-${idx}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`group flex flex-col md:flex-row gap-6 p-8 rounded-[40px] border transition-all hover:shadow-xl ${darkMode ? 'bg-zinc-800/40 border-zinc-700 hover:bg-zinc-800/60' : 'bg-zinc-50 border-zinc-100 hover:bg-white hover:border-accent/20'}`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-[28px] overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                            {icons[idx] || <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-400"><BookOpen size={24} /></div>}
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                            <h5 className="font-black text-xl tracking-tight text-ink dark:text-white">{step.title}</h5>
                          </div>
                          <p className="text-[14px] leading-relaxed font-medium opacity-60">
                            {step.desc}
                          </p>
                          
                          {/* Mini Visual Previews */}
                          {idx === 1 && (
                            <div className="flex gap-2 pt-2">
                              {['KO', 'EN', 'JP', 'CN'].map(l => (
                                <div key={l} className="px-2 py-1 bg-white dark:bg-zinc-700 border border-zinc-100 dark:border-zinc-800 rounded-md text-[10px] font-bold opacity-60">{l}</div>
                              ))}
                            </div>
                          )}
                          {idx === 4 && (
                            <div className="pt-2 flex flex-col gap-1">
                              <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div className="w-[70%] h-full bg-accent" />
                              </div>
                              <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Mastery 70%</span>
                            </div>
                          )}
                          {idx === 8 && (
                            <div className="flex gap-3 pt-2">
                              <div className="w-12 h-8 rounded bg-white border border-zinc-200" />
                              <div className="w-12 h-8 rounded bg-zinc-900 border border-zinc-800" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  ((t.otherGuideSteps || []) as any[]).map((step, idx) => {
                    const otherIcons = [
                      <div className="bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600"><Brain size={24} /></div>,
                      <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600"><FileQuestion size={24} /></div>,
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"><FileText size={24} /></div>,
                      <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-600"><Globe size={24} /></div>,
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"><Shield size={24} /></div>,
                      <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600"><Network size={24} /></div>,
                      <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600"><Clock size={24} /></div>
                    ];

                    return (
                      <motion.div 
                        key={`other-${idx}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`group flex flex-col md:flex-row gap-6 p-8 rounded-[40px] border transition-all hover:shadow-xl ${darkMode ? 'bg-zinc-800/40 border-zinc-700 hover:bg-zinc-800/60' : 'bg-zinc-50 border-zinc-100 hover:bg-white hover:border-accent/20'}`}
                      >
                        <div className="shrink-0 flex items-center justify-center">
                          <div className="w-20 h-20 rounded-[28px] overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                            {otherIcons[idx] || <div className="bg-zinc-100 dark:bg-zinc-800 text-zinc-400"><BookOpen size={24} /></div>}
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                            <h5 className="font-black text-xl tracking-tight text-ink dark:text-white">{step.title}</h5>
                          </div>
                          <p className="text-[14px] leading-relaxed font-medium opacity-60">
                            {step.desc}
                          </p>
                          
                          {idx === 0 && (
                            <div className="flex gap-1.5 pt-2">
                              {['1d', '3d', '7d', '14d', '30d'].map(d => (
                                <div key={d} className="px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-500 rounded text-[9px] font-bold border border-fuchsia-500/15">{selectedLanguage === 'Korean' ? `${d} 복습` : `${d} Rev`}</div>
                              ))}
                            </div>
                          )}
                          {idx === 1 && (
                            <div className="flex gap-1.5 pt-2">
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[9px] font-bold border border-amber-500/15">{selectedLanguage === 'Korean' ? '메타인지' : 'Metacognitive'}</span>
                              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded text-[9px] font-bold border border-rose-500/15">{selectedLanguage === 'Korean' ? 'AI 변형 문제' : 'AI Variation'}</span>
                            </div>
                          )}
                          {idx === 4 && (
                            <div className="flex gap-1.5 pt-2">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold border border-emerald-500/15">PII Guard</span>
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[9px] font-bold border border-emerald-500/15">{selectedLanguage === 'Korean' ? '저작권 수호' : 'Copyright Advice'}</span>
                            </div>
                          )}
                          {idx === 5 && (
                            <div className="flex gap-1 pt-2 items-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping mr-1" />
                              <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-wider">Concept Node Linkage Board</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="p-10 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button 
                  onClick={() => setShowGuide(false)}
                  className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-95 ${darkMode ? 'bg-white text-ink' : 'bg-ink text-white'}`}
                >
                  {selectedLanguage === 'Korean' ? '가이드 닫기' : 'Close Guide'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-ink">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`relative w-full max-w-sm rounded-[40px] shadow-2xl p-10 overflow-hidden ${darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-ink">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-xl tracking-tighter uppercase">{t.settings}</h4>
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40">System Preferences</p>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 block">
                    {t.playbackSpeed} ({playbackSpeed}x)
                  </label>
                  <input 
                    type="range" min="0.5" max="4" step="0.1" 
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-mono opacity-40">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>4.0x</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block">
                      {t.voiceChoice}
                    </label>
                    <button 
                      onClick={handlePreviewVoice}
                      disabled={isAudioPlaying || isGeneratingTTS}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isAudioPlaying ? 'bg-rose-500/10 text-rose-500' : 'bg-accent/10 text-accent hover:bg-accent hover:text-ink'}`}
                    >
                      {isAudioPlaying ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                      {t.previewVoice}
                    </button>
                  </div>
                  <select 
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none outline-none text-sm font-bold appearance-none cursor-pointer"
                  >
                    <optgroup label={t.premiumVoice}>
                      {['Aoide', 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map(v => (
                        <option key={v} value={v}>{(t.voiceNames as any)[v]}</option>
                      ))}
                    </optgroup>
                    <optgroup label={t.standardVoice}>
                      <option value="default">Default Browser Voice</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 block">{t.mode}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setDarkMode(false)}
                      className={`py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${!darkMode ? 'border-accent bg-accent/10' : 'border-zinc-100 dark:border-zinc-800 opacity-40'}`}
                    >
                      {t.lightMode}
                    </button>
                    <button 
                      onClick={() => setDarkMode(true)}
                      className={`py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${darkMode ? 'border-accent bg-accent/10' : 'border-zinc-100 dark:border-zinc-800 opacity-40'}`}
                    >
                      {t.darkMode}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className={`w-full mt-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all ${darkMode ? 'bg-white text-ink' : 'bg-ink text-white'}`}
              >
                Save & Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Weekly Tutor Letter Modal Overlay */}
      <AnimatePresence>
        {showWeeklyLetterModal && weeklyLetter && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-zinc-900 dark:text-white">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWeeklyLetterModal(false)}
              className="absolute inset-0 bg-ink/65 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className={`relative w-full max-w-lg rounded-[44px] shadow-3xl p-8 max-h-[85vh] overflow-y-auto custom-scrollbar ${
                darkMode ? 'bg-zinc-900 border border-zinc-800 text-white' : 'bg-white text-ink'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-ink">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight uppercase leading-none mb-1">
                      {selectedLanguage === 'Korean' ? 'AI 학습 진단서 & 튜터 편지' : 'AI Study Diagnoses & Letter'}
                    </h4>
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-40 font-mono">
                      {weeklyLetter.date}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowWeeklyLetterModal(false)} 
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6 text-left">
                {/* Stats Summary grid */}
                <div className="grid grid-cols-2 gap-3.5 p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60">
                  <div className="text-center p-2 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm">
                    <span className="text-[10px] font-mono opacity-40 uppercase block mb-1">Study Hours</span>
                    <span className="text-lg font-black font-mono">
                      {Math.ceil(totalStudyTime / 60)} {selectedLanguage === 'Korean' ? '분' : 'min'}
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm">
                    <span className="text-[10px] font-mono opacity-40 uppercase block mb-1">Streak Day</span>
                    <span className="text-lg font-black font-mono text-amber-500">
                      🔥 {getStudyStreak() || 1}
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm">
                    <span className="text-[10px] font-mono opacity-40 uppercase block mb-1">Quiz Score</span>
                    <span className="text-lg font-black font-mono text-emerald-500">
                      {quizCorrectCount} / {quizAnsweredCount}
                    </span>
                  </div>
                  <div className="text-center p-2 rounded-2xl bg-white dark:bg-zinc-900/60 shadow-sm">
                    <span className="text-[10px] font-mono opacity-40 uppercase block mb-1">Memorization</span>
                    <span className="text-lg font-black font-mono text-accent">
                      ⭐️ {flashcards.filter(c => c.mastered).length}
                    </span>
                  </div>
                </div>

                {/* AI Study Breakdown Metrics */}
                <div className="space-y-3.5">
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-45 block pre-title">
                     {selectedLanguage === 'Korean' ? 'AI 학습 분석 리포트' : 'AI Diagnostic Insights'}
                  </span>
                  
                  <div className="space-y-3">
                    {/* Strengths List */}
                    {weeklyLetter.strengths && weeklyLetter.strengths.length > 0 && (
                      <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 col-span-2">
                        <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-2">{t.strengthsLabel}</span>
                        <ul className="space-y-1.5 text-xs font-semibold opacity-85 leading-relaxed">
                          {weeklyLetter.strengths.map((str, sIdx) => (
                            <li key={sIdx} className="flex gap-2 items-start text-[11px]">
                              <span className="text-emerald-500">✓</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses List */}
                    {weeklyLetter.weaknesses && weeklyLetter.weaknesses.length > 0 && (
                      <div className="p-4 rounded-2xl border border-amber-500/10 bg-amber-500/5 col-span-2">
                        <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 block mb-2">{t.weaknessesLabel}</span>
                        <ul className="space-y-1.5 text-xs font-semibold opacity-85 leading-relaxed">
                          {weeklyLetter.weaknesses.map((wk, wIdx) => (
                            <li key={wIdx} className="flex gap-2 items-start text-[11px]">
                              <span className="text-amber-500">!</span>
                              <span>{wk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Advice recommendations */}
                    {weeklyLetter.advice && (
                      <div className="p-4 rounded-2xl border border-accent/10 bg-accent/5 col-span-2">
                        <span className="text-xs font-black uppercase text-accent block mb-2">{t.adviceLabel}</span>
                        <p className="text-[11px] font-semibold opacity-85 leading-relaxed">{weeklyLetter.advice}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Tutor Letter content */}
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-45 block">
                     {selectedLanguage === 'Korean' ? 'AI 프라이빗 튜터의 편지' : 'Personalized AI Tutor Letter'}
                  </span>
                  <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                    <div className="absolute right-3.5 top-3.5 text-accent opacity-25">
                      <Sparkles size={28} />
                    </div>
                    <p className="text-xs font-bold leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-200">
                      {weeklyLetter.letterText}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowWeeklyLetterModal(false)}
                className={`w-full mt-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest transition-all ${
                  darkMode ? 'bg-white text-ink hover:bg-accent hover:text-ink' : 'bg-ink text-white hover:bg-accent'
                }`}
              >
                {selectedLanguage === 'Korean' ? '처방전 숙지 완료' : 'Done & Apply Diagnostics'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🔮 Selection Highlight Floating Circle & Clip Toolbar */}
      {selectionDetails && selectionDetails.open && (
        <div 
          className={`absolute z-[999] p-3 flex items-center gap-3.5 rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border ${
            darkMode ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-white border-zinc-150 text-ink'
          }`}
          style={{
            left: `${selectionDetails.x}px`,
            top: `${selectionDetails.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {/* Highlight Circles */}
          <div className="flex gap-2.5 items-center pl-1.5">
            {['yellow', 'green', 'pink', 'blue'].map((colorName) => {
              const bgClass = colorName === 'yellow' ? 'bg-[#fef08a] border-amber-400' :
                              colorName === 'green' ? 'bg-[#bbf7d0] border-emerald-400' :
                              colorName === 'pink' ? 'bg-[#fbcfe8] border-rose-400' :
                              'bg-[#bfdbfe] border-blue-400';
              return (
                <button
                  key={colorName}
                  onClick={() => {
                    const newHighlight = {
                      id: `hl_${Date.now()}`,
                      text: selectionDetails.text,
                      color: colorName,
                      createdAt: new Date().toISOString()
                    };
                    setHighlights(prev => {
                      const updated = [...prev, newHighlight];
                      localStorage.setItem('study_highlights', JSON.stringify(updated));
                      return updated;
                    });
                    
                    window.getSelection()?.removeAllRanges();
                    setSelectionDetails(null);
                  }}
                  className={`w-[22px] h-[22px] rounded-full border-2 cursor-pointer transition-all hover:scale-125 hover:shadow-[0_0_10px_rgba(255,255,255,0.4)] ${bgClass}`}
                  title={`Highlight with ${colorName}`}
                />
              );
            })}
          </div>

          <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-805" />

          {/* Cornell Notes Linker button */}
          <button
            onClick={() => {
              setCornellNotes(prev => {
                const marker = prev.trim() 
                  ? `${prev}\n\n📌 [발췌 학습록]\n> "${selectionDetails.text}"\n`
                  : `📌 [발췌 학습록]\n> "${selectionDetails.text}"\n`;
                localStorage.setItem('study_cornell_notes', marker);
                return marker;
              });
              
              setShowSplitNote(true);
              localStorage.setItem('study_show_split_note', 'true');
              
              window.getSelection()?.removeAllRanges();
              setSelectionDetails(null);
            }}
            className="pr-2 py-1 hover:bg-accent/15 rounded-xl transition-all text-accent flex items-center gap-2 text-[10.5px] font-black uppercase tracking-wider cursor-pointer"
            title="Clip selection into Cornell active notes"
          >
            <PenTool size={13} />
            <span>{selectedLanguage === 'Korean' ? '필기에 인용구 추가' : 'Clip to Notes'}</span>
          </button>
        </div>
      )}

      {/* 📝 Highlight Note Detail Overlay Modal */}
      <AnimatePresence>
        {selectedHighlight && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
            onClick={() => setSelectedHighlight(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`p-8 rounded-[40px] border max-w-md w-full space-y-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)] relative ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-150 text-ink'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start pb-2">
                <div>
                  <span className="text-[9px] uppercase font-mono font-black tracking-widest text-[#f0b501]">Active Marker / 형광펜</span>
                  <h5 className="text-[15px] font-black leading-snug mt-1.5 italic opacity-95">"{selectedHighlight.text}"</h5>
                </div>
              </div>

              {/* 🔮 Real-time AI Contextual Dictionary Display */}
              <div className="space-y-2.5 p-4.5 rounded-[24px] border bg-accent/5 border-accent/15 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-mono font-black tracking-widest text-accent flex items-center gap-1.5">
                    <Sparkles size={11} className={isDefiningHighlight ? "animate-spin" : ""} />
                    {selectedLanguage === 'Korean' ? '실시간 AI 문맥 사전' : 'Real-time AI Contextual Dictionary'}
                  </span>
                  {selectedHighlight.aiDefinition && (
                    <button
                      onClick={() => handleTTS(`${selectedHighlight.text}: ${selectedHighlight.aiDefinition}`, selectedHighlight.text)}
                      className={`p-1.5 rounded-xl border active:scale-95 transition-all text-xs cursor-pointer flex items-center justify-center ${
                        isAudioPlaying 
                          ? 'bg-accent/20 border-accent/30 text-accent shadow-md shadow-accent/15' 
                          : 'bg-zinc-100 hover:bg-zinc-205 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 text-ink dark:text-white'
                      }`}
                      title="Speak definition"
                    >
                      <Volume2 size={11} />
                    </button>
                  )}
                </div>

                {isDefiningHighlight ? (
                  <div className="space-y-2 py-2">
                    <div className="h-2.5 w-5/6 bg-accent/20 rounded animate-pulse" />
                    <div className="h-2.5 w-full bg-accent/10 rounded animate-pulse" />
                    <div className="h-2.5 w-2/3 bg-accent/5 rounded animate-pulse" />
                    <p className="text-[9.5px] text-zinc-400 font-bold italic mt-1">
                      {selectedLanguage === 'Korean' 
                        ? '⚡️ 문맥 구조를 인계해 대화상자용 뜻풀이를 원격 도출 중입니다...' 
                        : '⚡️ Analyzing contextual meaning to generate targeted explanation balloon...'}
                    </p>
                  </div>
                ) : selectedHighlight.aiDefinition ? (
                  <div className="space-y-2">
                    <p className={`text-[12.5px] font-black leading-relaxed ${darkMode ? 'text-zinc-200' : 'text-zinc-850'}`}>
                      {selectedHighlight.aiDefinition}
                    </p>
                    {selectedHighlight.aiContextUsage && (
                      <p className={`text-[10px] font-bold leading-relaxed opacity-60 italic ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        "{selectedHighlight.aiContextUsage}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 font-bold italic">
                    {selectedLanguage === 'Korean' 
                      ? '뜻 분석을 완료하지 못했습니다.' 
                      : 'Not resolved. Click highlight to populate.'}
                  </p>
                )}
              </div>

              <div className="space-y-2.5">
                <label className="text-[9px] uppercase font-mono font-black tracking-widest block opacity-40">Memo Note / 나만의 연상 필기</label>
                <textarea
                  value={selectedHighlight.note || ''}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setHighlights(prev => {
                      const updated = prev.map(h => h.id === selectedHighlight.id ? { ...h, note: txt } : h);
                      localStorage.setItem('study_highlights', JSON.stringify(updated));
                      return updated;
                    });
                    setSelectedHighlight(prev => ({ ...prev, note: txt }));
                  }}
                  placeholder={selectedLanguage === 'Korean' ? '이 형광펜 칠한 단락에 대한 나만의 요약, 연상기억법을 필기해두세요...' : 'Attach a custom cognitive memory hook to this highlight...'}
                  rows={3}
                  className={`w-full p-4 rounded-[22px] border text-[12.5px] font-bold leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none ${
                    darkMode ? 'bg-black border-zinc-850 text-zinc-100 placeholder-zinc-700' : 'bg-zinc-50 border-zinc-150 text-ink placeholder-zinc-400 font-black'
                  }`}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setHighlights(prev => {
                      const updated = prev.filter(h => h.id !== selectedHighlight.id);
                      localStorage.setItem('study_highlights', JSON.stringify(updated));
                      return updated;
                    });
                    setSelectedHighlight(null);
                  }}
                  className="flex-1 py-4 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  {selectedLanguage === 'Korean' ? '형광펜 해제' : 'Unmark'}
                </button>
                <button
                  onClick={() => setSelectedHighlight(null)}
                  className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    darkMode ? 'bg-zinc-800 hover:bg-zinc-750 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-ink'
                  }`}
                >
                  {selectedLanguage === 'Korean' ? '보존' : 'Done'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating translation HUD sync indicator with AnimatePresence */}
      <AnimatePresence>
        {isTranslating && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3.5 px-5 py-4 bg-zinc-950 text-white shadow-[0_12px_40px_rgba(0,0,0,0.5)] rounded-2xl border border-zinc-800"
          >
            <div className="relative flex items-center justify-center h-5 w-5">
              <Globe size={15} className="text-accent animate-pulse" />
              <div className="absolute inset-x-0 inset-y-0 border-2 border-accent border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1.2s' }}></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent leading-none">
                {selectedLanguage === 'Korean' ? '실시간 다국어 동기화 중' : 'Multilingual Sync Active'}
              </span>
              <span className="text-[10px] font-bold opacity-70 mt-1 leading-none">
                {selectedLanguage === 'Korean' 
                  ? `모든 대시보드 요소를 ${selectedLanguage}로 자동 가공/번역중...` 
                  : `Syncing all dashboard elements to ${selectedLanguage}...`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
