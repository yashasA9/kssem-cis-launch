import { useState, useCallback, useEffect, useRef } from 'react';
import Scene3D from '@/components/Scene3D';
import LaunchSequence from '@/components/LaunchSequence';
import QuizEngine from '@/components/QuizEngine';
import CompletionOverlay from '@/components/CompletionOverlay';

/**
 * IEEE CIS Chapter Launch Experience
 * Main page orchestrating the cinematic flow:
 * 1. Launch screen → 2. Quiz with brain formation → 3. Completion event
 */
const Index = () => {
  const [phase, setPhase] = useState<
    'intro' | 'quiz' | 'await-voice' | 'activating' | 'complete'
  >('intro');
  const [brainStage, setBrainStage] = useState(0);
  const [activated, setActivated] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const recognitionRef = useRef<any | null>(null);

  const beginQuiz = useCallback(() => {
    setPhase('quiz');
  }, []);

  const handleLaunch = useCallback(() => {
    beginQuiz();
  }, [beginQuiz]);

  const handleCorrectAnswer = useCallback((questionIndex: number) => {
    setBrainStage(questionIndex + 1);
  }, []);

  const handleComplete = useCallback(() => {
    // All quiz questions complete; move to voice-trigger stage
    setPhase('await-voice');
  }, []);

  // Setup speech recognition for post-quiz "Launch CIS" trigger
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setVoiceSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .toLowerCase()
        .trim();

      if (transcript.includes('launch cis')) {
        setListening(false);
        // Trigger brain activation sequence
        setPhase('activating');
        setActivated(true);
        setCountdown(3);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  // Countdown timer once activation has started
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setPhase('complete');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev === null ? prev : prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const startListeningForLaunch = useCallback(() => {
    if (!voiceSupported || !recognitionRef.current || listening) return;
    try {
      setListening(true);
      recognitionRef.current.start();
    } catch {
      setListening(false);
    }
  }, [listening, voiceSupported]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Gradient background overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, hsl(210 60% 8% / 0.8) 0%, transparent 50%), ' +
            'radial-gradient(ellipse at 70% 80%, hsl(260 40% 8% / 0.6) 0%, transparent 50%)',
        }}
      />

      {/* 3D Scene */}
      <Scene3D
        launched={phase !== 'intro'}
        brainStage={brainStage}
        activated={activated}
      />

      {/* UI Layer */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        {phase === 'intro' && <LaunchSequence onLaunch={handleLaunch} />}
        {phase === 'quiz' && (
          <QuizEngine
            onCorrectAnswer={handleCorrectAnswer}
            onComplete={handleComplete}
          />
        )}
        {phase === 'await-voice' && (
          <div className="glass-card rounded-xl p-8 max-w-lg mx-auto text-center neural-border">
            <div className="text-display text-sm tracking-[0.3em] text-muted-foreground mb-3">
              FINAL LAUNCH SEQUENCE
            </div>
            <h2 className="font-display text-xl md:text-2xl text-foreground mb-4">
              Say <span className="text-neural">"Launch CIS"</span> to ignite
              the neural core.
            </h2>
            <p className="font-body text-sm md:text-base text-muted-foreground mb-6">
              Your answers have constructed the pathways. Use your voice to
              activate the{' '}
              <span className="text-neural">
                KSSEM Computational Intelligence Society
              </span>
              .
            </p>
            {voiceSupported ? (
              <button
                type="button"
                onClick={startListeningForLaunch}
                className="glass-card neural-border-active rounded-lg px-6 py-3 text-display text-xs tracking-[0.25em] text-primary hover:bg-primary/10 transition-all duration-300"
              >
                {listening
                  ? 'LISTENING — SAY "LAUNCH CIS"'
                  : 'ENABLE MIC & START LISTENING'}
              </button>
            ) : (
              <p className="font-body text-xs text-destructive mt-2">
                Voice recognition is not supported in this browser.
              </p>
            )}
          </div>
        )}
        {phase === 'activating' && (
          <div className="glass-card rounded-xl p-8 max-w-lg mx-auto text-center neural-border-active">
            <div className="text-display text-xs tracking-[0.4em] text-muted-foreground mb-3">
              NEURAL CORE CHARGED
            </div>
            <h2 className="font-display text-2xl md:text-3xl text-neural mb-4">
              Launching in{' '}
              <span className="inline-block min-w-[1.5ch]">
                {countdown !== null ? countdown : 0}
              </span>
            </h2>
            <p className="font-body text-sm md:text-base text-muted-foreground/80">
              Synapses are locking, energy fields stabilizing. Stand by for
              activation.
            </p>
          </div>
        )}
      </div>

      {/* Completion overlay */}
      <CompletionOverlay active={phase === 'complete'} />

      {/* Bottom watermark */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 text-display text-[10px] tracking-[0.4em] text-muted-foreground/40">
        IEEE CIS STUDENT CHAPTER
      </div>
    </div>
  );
};

export default Index;
