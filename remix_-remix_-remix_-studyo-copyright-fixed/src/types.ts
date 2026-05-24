export type EducationLevel = 'elementary' | 'middle' | 'high' | 'university';

export interface Annotation {
  word: string;
  definition: string;
  context: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface CopyrightReport {
  isSafe: boolean;
  sensitiveInfoDetected: string[];
  copyrightAdvice: string;
}

export interface StudyInsight {
  suggestedQuestions: string[];
  keyTakeaways: string[];
}

export interface SummaryData {
  standard: string;
  simple: string;
}

export interface LectureScript {
  title: string;
  introduction: string;
  points: {
    topic: string;
    explanation: string;
  }[];
  conclusion: string;
}

export interface ProcessedDocument {
  originalText: string;
  annotatedText: string;
  annotations: Annotation[];
  language: string;
}

export interface StudySessionLog {
  date: string;
  durationSeconds: number;
  fileName?: string;
  level?: EducationLevel;
}

export interface FocusSound {
  id: string;
  name: string;
  icon: string;
  url: string;
  type?: 'audio' | 'youtube' | 'synth';
}

export interface RoomMessage {
  username: string;
  text: string;
  timestamp: string;
}

export interface ProgressSummary {
  totalSeconds: number;
  sessionsCompleted: number;
  lastStudyDate: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
  box?: 1 | 2 | 3;
}

export interface MistakeQuestion {
  id: string;
  question: string;
  options: string[];
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  aiFeedback?: string;
  timestamp: string;
  reviewStatus?: 'review' | 'mastered';
  tags?: string[];
  confidence?: number; // 0 to 100 or 1 to 5 scale
  userNotes?: string;
  resolvedAttemptsCount?: number;
}

export interface WeeklyLetter {
  date: string;
  letterText: string;
  strengths: string[];
  weaknesses: string[];
  advice: string;
}

// Knowledge Graph (Spatial Memory Mindmap) Types
export interface GraphNode {
  id: string;
  label: string;
  group: string;
  description: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  relation: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Blank Cloze Quiz Types
export interface ClozeQuestion {
  id: string;
  // E.g., "The mitochondria is the [blank_1] of the cell, generating [blank_2]."
  sentence: string;
  // E.g., ["powerhouse", "ATP"]
  blanks: {
    key: string; // e.g., "blank_1"
    answer: string;
    choices: string[]; // 3-4 options for this blank
  }[];
}

export interface ClozeQuiz {
  title: string;
  questions: ClozeQuestion[];
}

export interface ActiveRecallReport {
  matchScore: number; // 0 to 100
  rememberedPoints: string[];
  missedPoints: string[];
  feedbackSummary: string;
}



