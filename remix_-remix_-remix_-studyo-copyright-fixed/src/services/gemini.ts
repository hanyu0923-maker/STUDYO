import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EducationLevel, Annotation, Quiz, StudyInsight, CopyrightReport, SummaryData, LectureScript, WeeklyLetter, KnowledgeGraph, ClozeQuiz, ActiveRecallReport, ChatMessage, Flashcard } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuiz(text: string, level: EducationLevel, lang: string = "Korean") {
  const prompt = `
    Based on the following document, create a multiple-choice quiz to test comprehension for a ${level} level student.
    Return a title and 5 varied questions. Each question must have exactly 4 options.
    Provide a clear explanation for the correct answer.
    
    CRITICAL: The entire quiz (including title, questions, options, correct answers, and thorough explanation) MUST be written completely in "${lang}". If the input document is in a different language, translate and summarize it accurately into "${lang}".
    
    Text: ${text.substring(0, 8000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "options", "correctAnswer", "explanation"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    return JSON.parse(response.text) as Quiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    return null;
  }
}

export async function generateStudyInsights(text: string, level: EducationLevel, lang: string = "Korean") {
  const prompt = `
    Analyze this text for a ${level} level student and provide:
    1. 3 thought-provoking questions they should be able to answer after reading.
    2. 3 short key takeaways.
    Return in JSON format.
    CRITICAL: The entire response MUST be written completely in the language "${lang}". If the source text is in a different language, translate and summarize it accurately into "${lang}".
    Text: ${text.substring(0, 5000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["suggestedQuestions", "keyTakeaways"]
        }
      }
    });
    return JSON.parse(response.text) as StudyInsight;
  } catch (error) {
    return null;
  }
}

export async function analyzeCopyright(text: string, lang: string = "Korean") {
  const prompt = `
    Scan this text for Personally Identifiable Information (PII) like emails or phone numbers.
    Also, provide a brief advice on how to use this document legally for educational purposes (citing sources, fair use).
    CRITICAL: Write all detected sensitive data names and the legal advice completely in the language "${lang}". If the source text is in another language, translate and generate the report in "${lang}".
    Return in JSON format.
    Text: ${text.substring(0, 5000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            sensitiveInfoDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
            copyrightAdvice: { type: Type.STRING }
          },
          required: ["isSafe", "sensitiveInfoDetected", "copyrightAdvice"]
        }
      }
    });
    return JSON.parse(response.text) as CopyrightReport;
  } catch (error) {
    return null;
  }
}

export async function processDocument(text: string, level: EducationLevel, language: string = "Korean") {
  const prompt = `
    Analyze the following text and identify difficult or academic words that are challenging for a ${level} student.
    Provide a list of annotations for these words.

    CRITICAL: The definitions and context sentences MUST be written in the specified language: "${language}". 
    For example, if the language is "Korean", the "definition" and "context" MUST be in Korean. If the language is "English", they must be in English.

    Return the result as a JSON array of objects with the following structure:
    {
      "word": "the difficult word (keep it as it appears in the text)",
      "definition": "a clear and simple definition suitable for a ${level} student in ${language}",
      "context": "a short sentence in ${language} showing how the word is used"
    }
    
    Text:
    "${text.substring(0, 5000)}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              definition: { type: Type.STRING },
              context: { type: Type.STRING }
            },
            required: ["word", "definition", "context"]
          }
        }
      }
    });

    return JSON.parse(response.text) as Annotation[];
  } catch (error) {
    console.error("Error processing document:", error);
    return [];
  }
}

export async function extractTextFromFile(base64Data: string, mimeType: string) {
  const prompt = "Please read this entire document and extract EVERY word. Maintain the original formatting, headings, and structure as much as possible. If there are tables, interpret them into text format. Your goal is a full, high-fidelity text extraction. Use the language detected in the document.";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ]
    });
    
    if (!response || !response.text) {
      throw new Error("Empty response from AI model");
    }
    
    return response.text;
  } catch (error) {
    console.error("Error extracting text:", error);
    return "";
  }
}

export async function ocrFromImage(base64Image: string) {
  return extractTextFromFile(base64Image, "image/jpeg");
}

export async function summarizeDocument(text: string, level: EducationLevel, lang: string = "Korean"): Promise<SummaryData> {
  const prompt = `Analyze the following text and provide two versions of a summary for a ${level} student:
  1. "standard": A comprehensive summary with clear headings and key concepts explained.
  2. "simple": A very easy-to-read, conversational version that uses simple language, analogies, and short sentences to make it extremely accessible.
  
  Return the result in JSON format with keys "standard" and "simple".
  CRITICAL: The entire response (both "standard" and "simple" versions) MUST be written completely in the language "${lang}". If the input document is in a different language, translate and summarize it accurately into "${lang}".
  
  Text: ${text.substring(0, 10000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            standard: { type: Type.STRING },
            simple: { type: Type.STRING }
          },
          required: ["standard", "simple"]
        }
      }
    });
    return JSON.parse(response.text) as SummaryData;
  } catch (error) {
    console.error("Error summarizing document:", error);
    return { 
      standard: "Failed to generate standard summary.", 
      simple: "요약을 생성하는 데 실패했습니다. 원문이 너무 복잡하거나 짧을 수 있습니다." 
    };
  }
}

export async function generateLectureScript(text: string, level: EducationLevel, lang: string = "Korean"): Promise<LectureScript | null> {
  const prompt = `You are an expert ${level} level teacher. Transform the following text into a 2-3 minute lecture script.
  The lecture should:
  1. Have a welcoming introduction.
  2. Identify 3-4 most important highlights/points and explain them in a way that's easy to grasp, as if talking directly to a student.
  3. Use phrases like "Here's a key point...", "Think of it like this...", "Most importantly...".
  4. End with a brief encouraging wrap-up.
  
  Return in JSON format.
  CRITICAL: The entire lecture script (title, introduction, topic points, explain/explanations, and conclusion) MUST be completely in the language "${lang}". If the input document is in a different language, translate and summarize it accurately into "${lang}".
  
  Text: ${text.substring(0, 8000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            introduction: { type: Type.STRING },
            points: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["topic", "explanation"]
              }
            },
            conclusion: { type: Type.STRING }
          },
          required: ["title", "introduction", "points", "conclusion"]
        }
      }
    });

    return JSON.parse(response.text) as LectureScript;
  } catch (error) {
    console.error("Error generating lecture script:", error);
    return null;
  }
}

export async function describeVisuals(text: string, lang: string) {
  const prompt = `Based on the following text content, identify and describe any tables, charts, or data visualizations in detail for a visually impaired user.
  Focus on identifying:
  1. The overall structure and purpose of the visual.
  2. Key trends and patterns.
  3. Specific changes and significant data points.
  The description MUST be in ${lang}.
  Text: ${text.substring(0, 10000)}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error describing visuals:", error);
    return "Failed to generate description.";
  }
}

async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
    const isRateLimit = 
      error?.status === 429 || 
      error?.statusCode === 429 || 
      errorStr.includes("429") || 
      errorStr.includes("quota") || 
      errorStr.includes("RESOURCE_EXHAUSTED") ||
      (error?.error && (error.error.code === 429 || error.error.status === "RESOURCE_EXHAUSTED"));
      
    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit or quota hit. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function translateText(text: string, targetLanguage: string) {
  const prompt = `Translate the following text into ${targetLanguage}. Maintain the original meaning and tone.
  
  Text:
  "${text.substring(0, 5000)}"
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return response.text;
    });
  } catch (error) {
    console.error("Error translating text:", error);
    return text;
  }
}

export async function* chatWithAI(message: string, history: { role: 'user' | 'model', text: string }[], context?: string) {
  const systemInstruction = `You are a helpful AI study assistant. 
  The user is currently studying a document. 
  ${context ? `Here is the context of the document they are reading: ${context.substring(0, 1000)}` : ''}
  Keep your answers educational and encouraging. 
  Respond in the language the user uses.`;

  // Re-map history for the chat session
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction,
    },
    history: contents,
  });

  const stream = await chat.sendMessageStream({
    message,
  });

  for await (const chunk of stream) {
    yield chunk.text;
  }
}

export async function* textToSpeechStream(text: string, voiceName: string = 'Kore', lang: string = 'English') {
  try {
    const prompt = `You are a professional narrator. Please read the following text in ${lang} with a natural, clear, and expressive voice. Use a tone that matches the content's mood (e.g., educational, storytelling, or informative). Maintain a steady pace with natural pauses between sentences.

Text to read: 
${text.substring(0, 1000)}`;
    
    const stream = await ai.models.generateContentStream({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    for await (const chunk of stream) {
      const audioPart = chunk.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (audioPart?.inlineData?.data) {
        yield audioPart.inlineData.data;
      }
    }
  } catch (error) {
    console.error("Error generating TTS stream:", error);
  }
}

export async function textToSpeech(text: string, voiceName: string = 'Kore', lang: string = 'English') {
  let fullData = "";
  try {
    const stream = textToSpeechStream(text, voiceName, lang);
    for await (const chunk of stream) {
      fullData += chunk;
    }
    return fullData || null;
  } catch (error) {
    console.error("Error generating TTS:", error);
    return null;
  }
}

export async function generateFlashcards(text: string, level: EducationLevel, lang: string = 'English'): Promise<any[]> {
  const prompt = `
    Based on the following document content, create 8 interactive study flashcards for a ${level} level student to memorize key concepts or terms.
    Each flashcard must have a 'front' keyword or concept (question/term) and 'back' detailed definition or answer suitable for ${level} level.
    The entire response (both 'front' and 'back') MUST be completely in the following language: "${lang}". If the input document is in a different language, translate and summarize it accurately into "${lang}".
    Return the response as a JSON array of objects with keys 'front' and 'back'.
    Text: ${text.substring(0, 7000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING }
            },
            required: ["front", "back"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return [];
  }
}

export async function generateAIFeedbackForMistake(
  question: string,
  options: string[],
  userAnswer: string,
  correctAnswer: string,
  context?: string,
  persona?: string
): Promise<string> {
  let personaPrompt = "You are an exceptionally caring and intelligent academic tutor.";
  
  if (persona === 'cherry') {
    personaPrompt = `You are "Warm Senior Cherry" (따뜻한 선배 체리 🍒) - highly supportive, warm, comforting, and friendly. 
    Speak like a gentle, encouraging elder mentor or companion who uses warm language. Use expressions of high empathy, cheer them up, and assure them that making mistakes is a natural, beautiful stepping stone in learning. Emphasize that you are on this journey together.`;
  } else if (persona === 'tiger') {
    personaPrompt = `You are "Steel Coach Tiger" (혹독한 호랑이 교관 🐅) - strict, highly disciplined, intensely passionate, and firm. 
    Focus on high performance, accountability, and the absolute elimination of mental fatigue. Remind them that mistakes are gaps in their conceptual armor that must be targeted and patched immediately. Speak with roaring passion, command-level authority, and raw motivation to ignite their competitive spirit!`;
  } else if (persona === 'socrates') {
    personaPrompt = `You are "Socratic Sage Sol" (소크라테스 솔 박사 🦉) - deeply intellectual, clinical, analytical, and highly structured. 
    Explain concepts with deep logical rigor and scientific clarity. Guide them to reflect on their own thinking process, pointing out cognitive assumptions or logical missteps. Frame the explanation around fundamental intellectual rules and first-principles thinking.`;
  } else if (persona === 'teo') {
    personaPrompt = `You are "Star Lecturer Teo" (일타강사 테오 🌟) - highly efficient, pragmatic, exam-focused, sharp, and results-oriented. 
    Keep it laser-focused on core points, exam patterns, and bulletproof exam tips. Use crisp, high-impact language, highlight the 'classic trap' built into the distractor option, and outline quick memorization hacks using neat, easily recallable lists or formulas.`;
  }

  const prompt = `
    ${personaPrompt}

    A student answered a multiple choice question incorrectly.
    Question: "${question}"
    Options: ${options.map((opt, i) => `${i + 1}) ${opt}`).join(", ")}
    Student answered: "${userAnswer}"
    Correct answer is: "${correctAnswer}"
    ${context ? `Document context: "${context.substring(0, 1500)}"` : ""}

    Write an exceptionally tailored explanation based on your persona.
    1. Keep the styling and tone strictly faithful to your persona.
    2. Acknowledge the student's mistake with of-persona response.
    3. Explain why their chosen option ("${userAnswer}") is incorrect, diagnosing their likely misconception.
    4. Provide a clear, deep, and satisfying conceptual breakdown of the correct option ("${correctAnswer}").
    5. Keep it clear, friendly, and highly educational.
    6. Respond in the same language as the question (e.g. Korean for Korean questions, English for English).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });
    return response.text || "No feedback generated.";
  } catch (error) {
    console.error("Error generating mistake feedback:", error);
    return "Could not generate AI feedback at this moment.";
  }
}

export async function generateWeeklyLetter(
  stats: {
    totalStudyTimeSeconds: number;
    streakDays: number;
    sessionsCount: number;
    quizAnswered: number;
    quizCorrect: number;
    masteredWordsCount: number;
    masteredCardsCount: number;
  },
  level: EducationLevel,
  lang: string = "Korean",
  recentSummary?: string
): Promise<WeeklyLetter | null> {
  const prompt = `
    You are a deeply caring, elite personal academic mentor "STUDY O Master Tutor".
    Analyze the following weekly study diagnostics of our student:
    - Cumulative Study Time: ${Math.round(stats.totalStudyTimeSeconds / 60)} minutes
    - Study Streak: ${stats.streakDays} days
    - Unique Sessions Completed: ${stats.sessionsCount} sessions
    - Quiz Accuracy: ${stats.quizCorrect} correct out of ${stats.quizAnswered} attempts (${stats.quizAnswered > 0 ? Math.round((stats.quizCorrect / stats.quizAnswered) * 100) : 0}% accuracy)
    - Mastered Words Glossary: ${stats.masteredWordsCount} words
    - Mastered Memorizer Cards: ${stats.masteredCardsCount} cards
    - Current Education Level: ${level}
    ${recentSummary ? `- Recent Material Covered: "${recentSummary.substring(0, 1000)}"` : ""}

    Create an incredible academic diagnosis report and a warm mentor's letter. Encourage them sincerely, acknowledging their persistence.
    Provide actionable feedback:
    1. Letter Text (letterText): A heartwarming, beautifully written letter that builds immense confidence, addresses their level, highlights their accomplishments, and guides them in their future studies.
    2. Strengths (strengths): 2 distinct analytical strengths in their study patterns or accomplishments.
    3. Weaknesses/Opportunities (weaknesses): 2 areas of focus or conceptual challenges to conquer.
    4. Advice (advice): 1 major actionable mentorship recommendation for the upcoming week.

    The response MUST be written in the language "${lang}".
    Return the result in JSON format with keys "letterText", "strengths", "weaknesses", "advice".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            letterText: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.STRING }
          },
          required: ["letterText", "strengths", "weaknesses", "advice"]
        }
      }
    });

    const parsed = JSON.parse(response.text);
    return {
      date: new Date().toLocaleDateString(),
      letterText: parsed.letterText,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      advice: parsed.advice
    };
  } catch (error) {
    console.error("Error generating weekly letter:", error);
    return null;
  }
}

export async function generateKnowledgeGraph(text: string, level: EducationLevel, lang: string = "Korean"): Promise<KnowledgeGraph | null> {
  const prompt = `
    Based on the following document, extract a comprehensive Knowledge Graph (nodes and connecting edge relationships) to represent key academic concepts, main ideas, supporting details, and terms.
    This will be visualized as a highly interactive force-directed mind map / spatial memory visualizer to help a ${level} level student visualize complex academic connections.
    
    Identify 8 to 15 core concepts/nodes. Give them logical classifications as the "group" attribute (e.g., "Concept", "Process", "Structure", "Key Term", "Historical Figure", "Variable").
    Provide a robust 1-sentence "description" explaining that specific node in high-quality academic language suitable for a ${level} student.
    Define critical relationships as edge connections (from: [source node id], to: [target node id], relation: [the specific verb or relationship, e.g., "enables", "part of", "regulates", "developed by", "discovered in", "causes", "contradicts"]).
    
    CRITICAL: The entire response (nodes, labels, groups, descriptions, and relationship/relations) MUST be completely in the language "${lang}". If the input document is in a different language, translate and summarize it accurately into "${lang}".
    
    Text: ${text.substring(0, 8000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  group: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "label", "group", "description"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                  relation: { type: Type.STRING }
                },
                required: ["from", "to", "relation"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    return JSON.parse(response.text) as KnowledgeGraph;
  } catch (error) {
    console.error("Error generating knowledge graph:", error);
    return null;
  }
}

export async function generateClozeQuiz(text: string, level: EducationLevel, lang: string = "Korean"): Promise<ClozeQuiz | null> {
  const prompt = `
    Based on the following educational document, generate an interactive Blank Fill-In (Cloze Test) challenge consisting of exactly 5 questions for a ${level} level student.
    For each question:
    1. Extract a key, descriptive, intact educational sentence from the text.
    2. Replace 1 or 2 highly critical keywords or terms within the sentence with placeholder markers like "[blank_1]" and optionally "[blank_2]" depending on the sentence.
    3. For each blank marker, specify the "key" (e.g., "[blank_1]"), the correct "answer" word (e.g. "mitochondria"), and output exactly 4 elements in the "choices" array representing the answer and 3 beautiful distractor options suitable for ${level} level.
    
    CRITICAL: The entire response (title, sentences, correct answers, and choices) MUST be completely in the language "${lang}". If the input document is in a different language, translate and summarize it accurately into "${lang}".
    
    Text: ${text.substring(0, 7500)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  sentence: { type: Type.STRING },
                  blanks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        key: { type: Type.STRING },
                        answer: { type: Type.STRING },
                        choices: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["key", "answer", "choices"]
                    }
                  }
                },
                required: ["id", "sentence", "blanks"]
              }
            }
          },
          required: ["title", "questions"]
        }
      }
    });

    return JSON.parse(response.text) as ClozeQuiz;
  } catch (error) {
    console.error("Error generating cloze quiz:", error);
    return null;
  }
}

export async function analyzeActiveRecall(sourceText: string, recallInput: string, level: EducationLevel, lang: string = "Korean"): Promise<ActiveRecallReport | null> {
  const prompt = `
    You are an expert learning science coach. Evaluate this student's active recall "brain-dump" against the source document provided below.
    Compare what they wrote with the actual concepts in the source text.
    
    Return a JSON object containing:
    1. matchScore: A number from 0 to 100 capturing how much of the essential high-yield material they accurately recalled.
    2. rememberedPoints: An array of strings representing concepts they successfully and accurately recalled.
    3. missedPoints: An array of strings representing key concepts from the source text that they completely forgot or got wrong, which they must study further.
    4. feedbackSummary: A conversational feedback letter highlighting strengths, pointing out misconceptions, and recommending concrete study suggestions suitable for ${level} level.

    CRITICAL: The entire response (rememberedPoints, missedPoints, and feedbackSummary) MUST be completely in the language "${lang}". If the texts are in a different language, translate and summarize them accurately into "${lang}".

    Source Document:
    ${sourceText.substring(0, 7000)}

    Student's Active Recall Input:
    ${recallInput.substring(0, 3000)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.INTEGER },
            rememberedPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            missedPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            feedbackSummary: { type: Type.STRING }
          },
          required: ["matchScore", "rememberedPoints", "missedPoints", "feedbackSummary"]
        }
      }
    });

    return JSON.parse(response.text) as ActiveRecallReport;
  } catch (error) {
    console.error("Error analyzing active recall:", error);
    return null;
  }
}

export interface VariantQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateVariantQuestion(
  originalQuestion: string,
  correctAnswer: string,
  originalExplanation: string,
  level: string,
  lang: string = "Korean"
): Promise<VariantQuestion | null> {
  const prompt = `
    You are an expert metacognitive study tutor.
    A student made a mistake in the following multiple-choice question:
    - Original Question: "${originalQuestion}"
    - Correct Answer: "${correctAnswer}"
    - Explanation: "${originalExplanation}"

    Your task is to analyze the core academic concept represented here, and generate a new, highly effective, similar "variant" question testing the EXACT same concept, but with completely different phrasing, framing, or scenarios.
    Provide exactly 4 options. Make sure one is the clear correct answer.
    Provide an in-depth explanatory answer that specifically directly addresses the misconception from the original question and shows how this new scenario relates to the same underlying first-principles.

    CRITICAL: The variant question, options, correctAnswer, and explanation MUST be generated completely in the language "${lang}". If they are originally in a different language, translate them accurately into "${lang}".
    Return the response as a JSON object of this structure:
    {
      "question": "The new variant question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact string matching the correct option in options array",
      "explanation": "Extremely thorough explanation showing how the student can solve this by correcting their misconception"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    });

    return JSON.parse(response.text) as VariantQuestion;
  } catch (error) {
    console.error("Error generating variant question:", error);
    return null;
  }
}

export interface HighlightDefinition {
  wordOrPhrase: string;
  definition: string;
  contextUsage: string;
}

export async function defineHighlightedText(
  phrase: string,
  docContext: string,
  level: EducationLevel,
  language: string = "Korean"
): Promise<HighlightDefinition | null> {
  const prompt = `
    Analyze the following highlighted word or phrase from a document:
    "Phrase": "${phrase}"
    
    Document context:
    "${docContext.substring(0, 3000)}"

    Provide:
    1. A clear, straightforward, and beautiful definition of this phrase suitable for a ${level} level student.
    2. A short contextual example showcasing high-yield usage.

    CRITICAL: The definition and contextUsage MUST be written completely in "${language}".
    For example, if the language is "Korean", write the answer in Korean.

    Return the response as a JSON object:
    {
      "wordOrPhrase": "${phrase}",
      "definition": "The clear academic/intellectual definition in ${language}",
      "contextUsage": "The helpful context example sentence in ${language}"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wordOrPhrase: { type: Type.STRING },
            definition: { type: Type.STRING },
            contextUsage: { type: Type.STRING }
          },
          required: ["wordOrPhrase", "definition", "contextUsage"]
        }
      }
    });

    return JSON.parse(response.text) as HighlightDefinition;
  } catch (error) {
    console.error("Error defining highlighted text:", error);
    return null;
  }
}




export interface CornellCue {
  cueQuestion: string; // The active thinking question
  targetRecallConcept: string; // What concept this targets
  hintText: string; // Minimal socratic hint
}

export async function generateCornellCues(
  notes: string,
  sourceContext?: string,
  level: string = "high",
  lang: string = "Korean"
): Promise<CornellCue[]> {
  const prompt = `
    You are an expert educational designer specializing in the Cornell Note-Taking System.
    Review the student's current handwritten/typed summaries and notes:
    "${notes.substring(0, 4000)}"
    
    ${sourceContext ? `The underlying master study textbook the student reads is: "${sourceContext.substring(0, 3000)}"` : ""}

    Generate 3 to 4 Socratic "Recall Cues / Questions" of high cognitive density.
    A Recall Cue is NOT a simple factual prompt; it is an active-thinking cue placed in the left-hand column of a Cornell card to force the brain to synthesize mechanics, analyze causes/effects, or question context (e.g., "Why does the charge density increase only at the boundary in this system?").
    Provide a socratic hint for each cue.

    CRITICAL: The entire response (cueQuestions, targetRecallConcepts, and hintTexts) MUST be completely in the language "${lang}". If they are originally in a different language, translate them accurately into "${lang}".
    Return the response as a JSON array of objects of this structure:
    [
      {
        "cueQuestion": "The high-quality recall cue question",
        "targetRecallConcept": "The specific central keyword/concept this question targets",
        "hintText": "A socratic, helpful hint or thinking direction to guide their review"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cueQuestion: { type: Type.STRING },
              targetRecallConcept: { type: Type.STRING },
              hintText: { type: Type.STRING }
            },
            required: ["cueQuestion", "targetRecallConcept", "hintText"]
          }
        }
      }
    });

    return JSON.parse(response.text) as CornellCue[];
  } catch (error) {
    console.error("Error generating Cornell cues:", error);
    return [];
  }
}

export async function translateQuiz(quiz: Quiz, targetLanguage: string): Promise<Quiz> {
  const prompt = `Translate the following quiz JSON object into ${targetLanguage}. Maintain the exact JSON schema structure and keys. All text fields like title, question, options, correctAnswer, and explanation must be fully translated into ${targetLanguage}.
  
  Quiz JSON:
  ${JSON.stringify(quiz)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as Quiz;
    });
  } catch (error) {
    console.error("Error translating quiz:", error);
    return quiz;
  }
}

export async function translateClozeQuiz(clozeQuiz: ClozeQuiz, targetLanguage: string): Promise<ClozeQuiz> {
  const prompt = `Translate the following fill-in-the-blank close quiz JSON object into ${targetLanguage}. Maintain the exact JSON schema structure and keys. All text fields like title, sentence, blank answers, and blank choices must be fully translated into ${targetLanguage}. Keep placeholders like [blank_x] intact.
  
  Cloze Quiz JSON:
  ${JSON.stringify(clozeQuiz)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as ClozeQuiz;
    });
  } catch (error) {
    console.error("Error translating clozeQuiz:", error);
    return clozeQuiz;
  }
}

export async function translateKnowledgeGraph(graph: KnowledgeGraph, targetLanguage: string): Promise<KnowledgeGraph> {
  const prompt = `Translate the following mindmap knowledge graph JSON object into ${targetLanguage}. Maintain the exact JSON structure, IDs, and keys. Only translate text fields like label, description, and relation into ${targetLanguage}. Do not translate node IDs or from/to connection keys.
  
  Knowledge Graph JSON:
  ${JSON.stringify(graph)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as KnowledgeGraph;
    });
  } catch (error) {
    console.error("Error translating knowledge graph:", error);
    return graph;
  }
}

export async function translateFlashcards(flashcards: Flashcard[], targetLanguage: string): Promise<Flashcard[]> {
  if (flashcards.length === 0) return flashcards;
  const prompt = `Translate the following flashcards JSON array into ${targetLanguage}. Maintain the exact JSON structure and keys (id, front, back, mastered, box). Only translate front and back values into ${targetLanguage}.
  
  Flashcards JSON:
  ${JSON.stringify(flashcards)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as Flashcard[];
    });
  } catch (error) {
    console.error("Error translating flashcards:", error);
    return flashcards;
  }
}

export async function translateAnnotations(annotations: Annotation[], targetLanguage: string): Promise<Annotation[]> {
  if (annotations.length === 0) return annotations;
  const prompt = `Translate the following vocabulary annotations JSON array into ${targetLanguage}. Maintain the exact JSON structure and keys (word, definition, context). Translate context and definition values into ${targetLanguage}. You can translate or transliterate "word" if contextually helpful, but keep its reference intact.
  
  Annotations JSON:
  ${JSON.stringify(annotations)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as Annotation[];
    });
  } catch (error) {
    console.error("Error translating annotations:", error);
    return annotations;
  }
}

export async function translateChatMessageArray(messages: ChatMessage[], targetLanguage: string): Promise<ChatMessage[]> {
  if (messages.length === 0) return messages;
  const prompt = `Translate the text fields in the following chat messages JSON array into ${targetLanguage}. Maintain the exact JSON structure and roles. Only translate the text parameter values into ${targetLanguage}.
  
  Chat Messages JSON:
  ${JSON.stringify(messages)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as ChatMessage[];
    });
  } catch (error) {
    console.error("Error translating chat messages:", error);
    return messages;
  }
}

export async function translateWeeklyLetter(letter: WeeklyLetter, targetLanguage: string): Promise<WeeklyLetter> {
  const prompt = `Translate the following private AI tutor letter JSON object into ${targetLanguage}. Maintain the exact JSON schema structure and keys. Translate the letterText, strengths list, weaknesses list, and advice into ${targetLanguage}.
  
  Weekly Letter JSON:
  ${JSON.stringify(letter)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as WeeklyLetter;
    });
  } catch (error) {
    console.error("Error translating weekly letter:", error);
    return letter;
  }
}

export async function translateInsights(insights: StudyInsight, targetLanguage: string): Promise<StudyInsight> {
  const prompt = `Translate the following study insights JSON object into ${targetLanguage}. Maintain the exact JSON structure and keys. All text fields like suggestedQuestions and keyTakeaways must be fully translated into ${targetLanguage}.
  
  Insights JSON:
  ${JSON.stringify(insights)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as StudyInsight;
    });
  } catch (error) {
    console.error("Error translating insights:", error);
    return insights;
  }
}

export async function translateActiveRecallReport(report: ActiveRecallReport, targetLanguage: string): Promise<ActiveRecallReport> {
  const prompt = `Translate the following active recall diagnostic report JSON object into ${targetLanguage}. Maintain the exact JSON structure and keys. Translate feedbackSummary, rememberedPoints, and missedPoints into ${targetLanguage}. Keep numeric matchScore intact.
  
  Active Recall Report JSON:
  ${JSON.stringify(report)}
  `;

  try {
    return await callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      return JSON.parse(response.text) as ActiveRecallReport;
    });
  } catch (error) {
    console.error("Error translating active recall report:", error);
    return report;
  }
}
