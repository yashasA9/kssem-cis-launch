import { useCallback, useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

interface LaunchSequenceProps {
  onLaunch: () => void;
}

/**
 * Opening cinematic screen with keyboard flow.
 *
 * 1. Rotating ambient brain scene plays.
 * 2. User presses Space to see the ready prompt.
 * 3. User presses any key (or Space again) to proceed into the quiz.
 */
const LaunchSequence = ({ onLaunch }: LaunchSequenceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [promptVisible, setPromptVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current.children,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, stagger: 0.15, duration: 1, ease: "power3.out" }
    );
  }, []);

  const proceedToQuiz = useCallback(() => {
    if (!containerRef.current || !buttonRef.current) return;

    gsap.to(buttonRef.current, {
      scale: 1.08,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });

    gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.95,
      duration: 0.7,
      ease: "power2.in",
      onComplete: onLaunch,
    });
  }, [onLaunch]);

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.repeat) return;

      if (!promptVisible && event.code === "Space") {
        event.preventDefault();
        setPromptVisible(true);
        return;
      }

      if (promptVisible) {
        event.preventDefault();
        proceedToQuiz();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [promptVisible, proceedToQuiz]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center gap-6 text-center px-6"
    >
      {/* IEEE Logo text */}
      <div className="text-display text-xs tracking-[0.3em] text-muted-foreground">
        IEEE STUDENT BRANCH
      </div>

      {/* Title */}
      <h1 className="text-display text-4xl md:text-5xl text-foreground leading-tight">
        <span className="text-neural">IEEE CIS</span> Launching
      </h1>

      {/* Decorative line */}
      <div className="w-24 h-px bg-primary/30 my-2" />

      {/* Instructional / prompt area */}
      {promptVisible && (
        <div className="space-y-3 max-w-md">
          <p className="font-body text-base md:text-lg text-foreground/90">
            Ready to launch{" "}
            <span className="text-neural">
              KSSEM Computational Intelligence Society Student Branch
            </span>
            ?
          </p>
        </div>
      )}

      {/* Hidden button only used for launch animation pulse */}
      <button
        ref={buttonRef}
        className="mt-4 h-0 w-0 opacity-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Bottom decoration */}
      <div className="flex items-center gap-2 mt-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/40"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LaunchSequence;
