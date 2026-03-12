import { useState, useCallback } from "react";
import { gsap } from "gsap";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

const questions: Question[] = [
  {
    question: "What does CIS stand for in IEEE CIS?",
    options: [
      "Computer Integrated Systems",
      "Computational Intelligence Society",
      "Cyber Information Security",
      "Circuit Integration Standards",
    ],
    correctIndex: 1,
  },
  {
    question: "Which of these is a core area of Computational Intelligence?",
    options: [
      "Blockchain Mining",
      "Neural Networks",
      "Web Development",
      "Cloud Storage",
    ],
    correctIndex: 1,
  },
  {
    question: "What year was IEEE CIS formally established?",
    options: ["1990", "2005", "2014", "1985"],
    correctIndex: 0,
  },
];

interface QuizEngineProps {
  onCorrectAnswer: (questionIndex: number) => void;
  onComplete: () => void;
}

/**
 * Interactive quiz interface with glassmorphism styling.
 * Each correct answer triggers brain formation via callback.
 */
const QuizEngine = ({ onCorrectAnswer, onComplete }: QuizEngineProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [completed, setCompleted] = useState(false);

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (answerState !== "idle") return;

      setSelectedAnswer(optionIndex);
      const isCorrect = optionIndex === questions[currentQuestion].correctIndex;

      if (isCorrect) {
        setAnswerState("correct");
        onCorrectAnswer(currentQuestion);

        // Animate transition to next question
        setTimeout(() => {
          if (currentQuestion < questions.length - 1) {
            setCurrentQuestion((prev) => prev + 1);
            setSelectedAnswer(null);
            setAnswerState("idle");
          } else {
            setCompleted(true);
            onComplete();
          }
        }, 1500);
      } else {
        setAnswerState("wrong");
        setTimeout(() => {
          setSelectedAnswer(null);
          setAnswerState("idle");
        }, 1000);
      }
    },
    [answerState, currentQuestion, onCorrectAnswer, onComplete]
  );

  if (completed) {
    return (
      <div className="glass-card rounded-xl p-8 max-w-lg mx-auto text-center neural-glow-intense animate-[scale-in_0.5s_ease-out]">
        <div className="text-neural text-display text-2xl mb-4">Neural Network Complete</div>
        <p className="font-body text-foreground/80 text-lg">
          All synapses connected. Intelligence activated.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-primary pulse-glow"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const q = questions[currentQuestion];
  const progress = ((currentQuestion) / questions.length) * 100;

  return (
    <div className="glass-card rounded-xl p-8 max-w-lg mx-auto neural-border">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-display text-xs text-muted-foreground tracking-widest">
            NEURAL LINK {currentQuestion + 1}/{questions.length}
          </span>
          <span className="text-display text-xs text-primary tracking-widest">
            {Math.round(progress)}% CONNECTED
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="font-display text-lg text-foreground mb-6 leading-relaxed">
        {q.question}
      </h3>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((option, idx) => {
          let optionClass = "glass-card neural-border rounded-lg p-4 cursor-pointer transition-all duration-300 ";
          if (selectedAnswer === idx) {
            if (answerState === "correct") {
              optionClass += "neural-border-active bg-primary/10 ";
            } else if (answerState === "wrong") {
              optionClass += "border-destructive/50 bg-destructive/10 ";
            }
          } else {
            optionClass += "hover:neural-border-active hover:bg-primary/5 ";
          }

          return (
            <button
              key={idx}
              className={optionClass + "w-full text-left"}
              onClick={() => handleAnswer(idx)}
              disabled={answerState !== "idle"}
            >
              <div className="flex items-center gap-3">
                <span className="text-display text-xs text-muted-foreground w-6">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-body text-foreground/90">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answerState === "correct" && (
        <div className="mt-4 text-center text-neural text-display text-sm animate-[fade-in_0.3s_ease-out]">
          ✦ SYNAPSE CONNECTED ✦
        </div>
      )}
      {answerState === "wrong" && (
        <div className="mt-4 text-center text-destructive text-display text-sm animate-[fade-in_0.3s_ease-out]">
          CONNECTION FAILED — TRY AGAIN
        </div>
      )}
    </div>
  );
};

export default QuizEngine;
