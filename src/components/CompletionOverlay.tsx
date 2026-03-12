import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface CompletionOverlayProps {
  active: boolean;
}

/**
 * Final completion event - plays "Computational Intelligence Activated"
 * and reveals the IEEE Computational Intelligence Society launch card.
 */
const CompletionOverlay = ({ active }: CompletionOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showText, setShowText] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!active) return;

    const timer = setTimeout(() => {
      setShowText(true);

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(
          "Computational Intelligence Activated."
        );
        utterance.rate = 0.7;
        utterance.pitch = 0.3;
        utterance.volume = 0.8;

        const voices = window.speechSynthesis.getVoices();
        const deepVoice = voices.find(
          (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")
        );
        if (deepVoice) utterance.voice = deepVoice;

        utterance.onend = () => {
          // Show dropdown after speech ends
          setTimeout(() => setShowDropdown(true), 600);
        };

        window.speechSynthesis.speak(utterance);

        // Fallback if onend doesn't fire
        setTimeout(() => setShowDropdown(true), 5000);
      } else {
        setTimeout(() => setShowDropdown(true), 3500);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [active]);

  // Animate activation text
  useEffect(() => {
    if (showText && overlayRef.current) {
      gsap.fromTo(
        overlayRef.current.querySelectorAll(".reveal-text"),
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.3, duration: 1.2, ease: "power3.out" }
      );
    }
  }, [showText]);

  // Animate dropdown card after voice
  useEffect(() => {
    if (!showDropdown) return;

    // Fade out "Intelligence Recorded" text first
    if (overlayRef.current) {
      gsap.to(overlayRef.current.querySelectorAll(".reveal-text"), {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: "power2.in",
        stagger: 0.05,
      });
    }

    // Animate dropdown card in
    const dropdownEl = document.getElementById("cis-dropdown");
    if (dropdownEl) {
      gsap.fromTo(
        dropdownEl,
        { y: -120, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: "power3.out", delay: 0.9 }
      );

      // Stagger children inside
      gsap.fromTo(
        dropdownEl.querySelectorAll(".dropdown-item"),
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, stagger: 0.2, duration: 0.8, ease: "power3.out", delay: 1.3 }
      );

      // Animate the society text falling in with a bounce
      gsap.fromTo(
        dropdownEl.querySelectorAll(".fall-text"),
        { opacity: 0, y: -60, rotateX: 40 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.12,
          duration: 1,
          ease: "bounce.out",
          delay: 1.8,
        }
      );
    }
  }, [showDropdown]);

  if (!active) return null;

  return (
    <>
      {/* Activation text */}
      <div
        ref={overlayRef}
        className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none"
      >
        {showText && (
          <>
            <div className="reveal-text text-display text-4xl md:text-6xl text-neural mb-2 tracking-wider">
              COMPUTATIONAL
            </div>
            <div className="reveal-text text-display text-3xl md:text-5xl text-foreground/90 tracking-[0.4em]">
              INTELLIGENCE
            </div>
            <div className="reveal-text text-display text-xl md:text-2xl text-muted-foreground/80 tracking-[0.3em] mt-2">
              ACTIVATED
            </div>
          </>
        )}
      </div>

      {/* Dropdown reveal card */}
      {showDropdown && (
        <div
          id="cis-dropdown"
          className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div className="glass-card neural-border-active rounded-2xl p-8 md:p-10 max-w-md w-[90%] mx-auto text-center">
            {/* Image placeholder */}
            <div className="dropdown-item mx-auto mb-6 w-28 h-28 md:w-36 md:h-36 rounded-xl neural-border overflow-hidden flex items-center justify-center bg-muted/20">
              {/* Replace the src below with your actual image */}
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span className="text-[10px] text-display tracking-widest">ADD IMAGE</span>
              </div>
            </div>

            {/* Divider line */}
            <div className="dropdown-item w-16 h-px bg-primary/30 mx-auto mb-6" />

            {/* Society name - each word falls down */}
            <div className="flex flex-col items-center gap-1" style={{ perspective: "600px" }}>
              <span className="fall-text text-display text-xs tracking-[0.5em] text-muted-foreground">
                IEEE
              </span>
              <span className="fall-text text-display text-2xl md:text-3xl text-neural tracking-wider">
                COMPUTATIONAL
              </span>
              <span className="fall-text text-display text-2xl md:text-3xl text-foreground tracking-wider">
                INTELLIGENCE
              </span>
              <span className="fall-text text-display text-lg md:text-xl text-muted-foreground tracking-[0.4em]">
                SOCIETY
              </span>
            </div>

            {/* Bottom accent dots */}
            <div className="dropdown-item flex justify-center gap-2 mt-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/50 pulse-glow"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompletionOverlay;
