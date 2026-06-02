import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type CSSWithVars = CSSProperties & Record<`--${string}`, string | number | undefined>;
import "./index.css";

const PRODUCT_URL = "/app";
const MEDIA = "/landing-media/";
const TYPING_PHRASES = ["Any Age", "Any Time", "Anywhere"];
const STORY_STEPS_STORAGE_KEY = "anyturn-story-step-v2";
const WHY_PARENTS_STORAGE_KEY = "anyturn-why-parents-step-v2";
const MOMENTS_STORAGE_KEY = "anyturn-moments-step-v1";
const REAL_FAMILY_STORY_STORAGE_KEY = "anyturn-real-family-story-v3";
const FAQ_STORAGE_KEY = "anyturn-faq-open-v1";

const STORY_STEPS = [
  {
    letter: "C",
    color: "#2166BD",
    title: "Choose a story idea or create your own",
    displayTitle: ["hoose a story", "idea or create", "your own"],
    copy: "Choose from a few starters or invent your own — a brave fox, a shy dragon, your child's favourite stuffed bear. Whoever they fancy tonight.",
    ideas: [
      "Luna falls into an underground cave — and discovers something amazing.",
      "Luna falls into an underground cave — and discovers something amazing.",
      "Luna falls into an underground cave — and discovers something amazing.",
    ],
    custom:
      "Write a fantasy adventure story for a 10-year-old child. The story should begin with a child discovering a magical door in an attic that leads to a fantastical world. Include these elements: singing trees, rivers that flow with",
    visual: "ideas",
  },
  {
    letter: "Y",
    color: "#E7A735",
    title: "Your child decides what happens next",
    displayTitle: ["our child", "decides what", "happens next"],
    copyOffset: "100px",
    copy: "They tell you, you type. The story unfolds with pictures and plot twists \u2014 surprising even you. No script, no right answer, no homework.",
    ideas: [
      "The hero hears music coming from inside a teacup.",
      "A tiny train arrives with a ticket to tomorrow morning.",
      "The family dog starts speaking in riddles at bedtime.",
    ],
    custom:
      "Make the next choice feel playful and safe. Add one funny twist, one brave moment, and a soft ending that still leaves room for tomorrow.",
    visual: "bookSpread",
  },
  {
    letter: "S",
    color: "#438F5D",
    title: "Save it. Read it again. Carry on tomorrow.",
    displayTitle: ["ave it. Read it", "again. Carry on", "tomorrow."],
    copyOffset: "105px",
    titleXOffset: "-16px",
    copy: "Every story lives in your library. Loved last night's adventure? Open it again \u2014 or pick up where you left off and write the next chapter.",
    ideas: [
      "The first page opens with a glowing forest and a whispering compass.",
      "The hero's drawing climbs off the paper and asks for help.",
      "A bedtime blanket becomes the sail of a moonlit ship.",
    ],
    custom:
      "Keep the story warm, visual, and easy to read aloud. The ending should feel complete, but leave a tiny spark for the next story.",
    visual: "library",
  },
  {
    letter: "N",
    color: "#5D4678",
    title: "Now you are ready to start your interactive journey",
    displayTitle: [
      "ow you are ready to start",
      "your first interactive",
      "journey",
    ],
    copy: "",
    copyOffset: "246px",
    titleMaxWidth: "390px",
    ideas: [
      "A bedtime quest with a brave little inventor.",
      "A gentle adventure where the hero learns to ask for help.",
      "A funny mystery that ends under the blanket fort.",
    ],
    custom: "Start Your First Story For Free",
    visual: "finalCta",
  },
];

const WHY_PARENTS_SLIDES = [
  {
    letter: "S",
    color: "#2166BD",
    displayTitle: ["creen time", "you won't", "regret"],
    copy: "Not another video to zone out to. You're sitting next to each other, laughing at what the dragon did next, deciding together what happens on the next page.",
    image: "why-screen-time.png",
  },
  {
    letter: "A",
    color: "#438F5D",
    displayTitle: ["dventure that", "travels with", "you"],
    copy: "Long car ride? Waiting at the doctor's? Quiet half-hour before tea? Open Anyturn, pick up where you left off, and reading ritual goes wherever you go.",
    image: "why-travels.png",
  },
  {
    letter: "T",
    color: "#F5B347",
    displayTitle: ["ogether even", "when you’re", "apart"],
    copy: "Granny down the road or on the other side of the world — share your screen on a video call and create the next chapter together. Distance stops being the thing that ends storytime.",
    image: "why-together.png",
  },
  {
    letter: "H",
    color: "#5D4678",
    displayTitle: ["elps to teach", "about decision-", "making"],
    copy: "Decisions shape the story. Every choice has consequences — in a world that’s safe, but full of possibilities. Kindness, risk, and curiosity all lead to different paths.",
    image: "why-decisions.png",
  },
];

const MOMENT_SLIDES = [
  {
    letter: "G",
    color: "#F5B347",
    activeText: "#0C1C31",
    displayTitle: ["randparents", "and remote", "parents"],
    copy: "Share a story over a call  - and discover more about your child while spending real time together.",
    image: "moment-grandparents.png",
    page: "Far apart",
  },
  {
    letter: "B",
    color: "#5D4678",
    activeText: "#FFFFFF",
    displayTitle: ["edtime story -", "your way to be", "closer"],
    copy: "Choose the mood and length -then read one more chapter together before lights out.",
    image: "moment-bedtime.png",
    page: "Every evening",
  },
  {
    letter: "R",
    color: "#2166BD",
    activeText: "#FFFFFF",
    displayTitle: ["ainy days at", "home at your", "pace"],
    copy: "An afternoon on the sofa, building a world together. No need to find the right book - make the one your child wants right now.",
    image: "moment-weekends.png",
    page: "Weekends",
  },
  {
    letter: "T",
    color: "#438F5D",
    activeText: "#FFFFFF",
    displayTitle: [
      "urn waiting time and long",
      "drives into something",
      "meaningful",
    ],
    copy: 'Five minutes is enough to start a story, and forty minutes goes by without "are we there yet?"',
    image: "moment-onthego.png",
    page: "On the go",
  },
];

const REAL_FAMILY_STORIES = [
  {
    title: "The Graphic Ghost",
    chapters: "3 chapters",
    author: "Noah",
    age: "6 years old",
    cover: "real-family-book.png",
    quote: '"The ghost only came out when someone forgot to say goodnight..."',
  },
  {
    title: "The Moonlit Map",
    chapters: "5 chapters",
    author: "Ava",
    age: "7 years old",
    cover: "real-family-book.png",
    quote: '"The map folded itself into a bird and flew toward the window..."',
  },
  {
    title: "The Dragon Who Lost His Hat",
    chapters: "4 chapters",
    author: "Lily",
    age: "5 years old",
    cover: "real-family-cover.png",
    quote:
      '"The dragon looked everywhere. Under the clouds, behind the moon, even inside a volcano..."',
  },
  {
    title: "The Graphic Ghost",
    chapters: "2 chapters",
    author: "Mia",
    age: "6 years old",
    cover: "real-family-book.png",
    quote:
      '"A tiny blue door opened in the skirting board and whispered her name..."',
  },
  {
    title: "The Graphic Ghost",
    chapters: "6 chapters",
    author: "Leo",
    age: "8 years old",
    cover: "real-family-book.png",
    quote:
      '"Every stair creaked in a different voice, and one of them sounded friendly..."',
  },
  {
    title: "The Graphic Ghost",
    chapters: "4 chapters",
    author: "Sofia",
    age: "5 years old",
    cover: "real-family-book.png",
    quote:
      '"The blanket fort became a castle the moment the lights went out..."',
  },
  {
    title: "The Graphic Ghost",
    chapters: "5 chapters",
    author: "Oliver",
    age: "7 years old",
    cover: "real-family-book.png",
    quote:
      '"He packed one biscuit, two wishes, and a compass that pointed to cake..."',
  },
];

const FAMILY_QUOTES = [
  {
    quote:
      "\"My daughter asks for 'our story' every single night now. It's become our favourite bedtime ritual.\"",
    author: "Emma, Mum, Bristol",
    avatar: "family-say-emma.png",
  },
  {
    quote:
      '"Finally screen time I don\'t feel guilty about. We make it together — he’s thinking, deciding, creating."',
    author: "James, Dad, Manchester",
    avatar: "family-say-james.png",
  },
  {
    quote:
      '"I live 200 miles from my granddaughter. We FaceTime and make stories together. She saves them all."',
    author: "Margaret, Grandmother, Edinburgh",
    avatar: "family-say-margaret.png",
  },
  {
    quote:
      '"It turns bedtime from a negotiation into something we both look forward to."',
    author: "Sarah, Mum of Two, London",
    avatar: "social-proof-avatar.png",
  },
  {
    quote:
      '"The best part is hearing what he chooses. The story feels like it belongs to him."',
    author: "Daniel, Dad, Leeds",
    avatar: "family-say-james.png",
  },
];

const PRICING_PLANS = [
  {
    price: "\u00a30.00",
    cadence: "/forever",
    quote: "... Best suited to try creating interactive stories",
    features: [
      "2 stories / week",
      "Basic illustrations",
      "Save up to 5 stories",
    ],
    bg: "pricing-watercolor-green.png",
    variant: "mint",
  },
  {
    price: "\u00a36.99",
    cadence: "/month",
    quote: "... Best suited for regular time-to-time activities",
    features: [
      "15 stories / month",
      "HD illustrations",
      "Unlimited library",
      "Share stories",
    ],
    bg: "pricing-watercolor-purple.png",
    variant: "purple",
  },
  {
    price: "\u00a312.99",
    cadence: "/month",
    quote: "... Best suited for long stories with printed books features",
    features: [
      "Unlimited stories",
      "HD illustrations",
      "Print physical books",
      "Priority support",
    ],
    bg: "pricing-watercolor-green.png",
    variant: "mint pricing-card--premium",
  },
];

const FAQ_ITEMS = [
  {
    id: "internet",
    question: "Do I need the Internet?",
    answer:
      "You need the internet to create new chapters and illustrations. Saved stories stay in your library, so you can come back to them later.",
  },
  {
    id: "safety",
    question: "Is it safe for children?",
    answer:
      "Anyturn is made for shared parent-child story time. The child chooses the direction, while the grown-up stays in the loop and keeps the experience age-appropriate.",
  },
  {
    id: "print",
    question: "Can I print a book?",
    answer:
      "Yes. Stories can be prepared for print, and the detailed print flow will sit inside the product once that part is released.",
  },
];

const FOOTER_LINKS = [
  {
    label: "Terms of service",
    title: "Terms of service",
    copy: "The full terms page is in development. For now, this landing links into the upcoming product/legal flow.",
  },
  {
    label: "Privacy policy",
    title: "Privacy policy",
    copy: "The privacy policy popup is a placeholder for the final UK GDPR and PECR copy.",
  },
  {
    label: "Safety",
    title: "Safety",
    copy: "Anyturn is designed for shared family story-making, with grown-ups staying involved in every important choice.",
  },
  {
    label: "Contact",
    title: "Contact",
    copy: "The contact flow is in development. This will open the support/contact information for families.",
  },
];

function goToProduct() {
  window.location.href = PRODUCT_URL;
}

function Button({ children, variant = "primary", className = "" }: { children: ReactNode; variant?: string; className?: string }) {
  return (
    <button
      className={`landing-button ${variant} ${className}`}
      onClick={goToProduct}
      type="button"
    >
      {children}
    </button>
  );
}

function Header() {
  return (
    <header className="landing-header">
      <div className="landing-header__inner">
        <img
          className="landing-logo"
          src={`${MEDIA}logo-dark.png`}
          alt="anyturn"
        />

        <nav
          className="landing-header__actions"
          aria-label="Landing navigation"
        >
          <a href="/app/login"><Button variant="outline">Sign In</Button></a>
          <a href="/app/register"><Button variant="navy">Start Free</Button></a>
        </nav>
      </div>
    </header>
  );
}

function TypingPhrase() {
  const [typing, setTyping] = useState<{ phraseIndex: number; charCount: number; deleting: boolean }>({
    phraseIndex: 0,
    charCount: TYPING_PHRASES[0].length,
    deleting: false,
  });

  useEffect(() => {
    const phrase = TYPING_PHRASES[typing.phraseIndex];
    const isFull = typing.charCount === phrase.length;
    const isEmpty = typing.charCount === 0;
    const delay = isFull && !typing.deleting ? 1250 : typing.deleting ? 42 : 68;

    const timer = window.setTimeout(() => {
      if (isFull && !typing.deleting) {
        setTyping((current) => ({ ...current, deleting: true }));
        return;
      }

      if (isEmpty && typing.deleting) {
        setTyping((current) => ({
          phraseIndex: (current.phraseIndex + 1) % TYPING_PHRASES.length,
          charCount: 1,
          deleting: false,
        }));
        return;
      }

      setTyping((current) => ({
        ...current,
        charCount: current.charCount + (current.deleting ? -1 : 1),
      }));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typing]);

  const phrase = TYPING_PHRASES[typing.phraseIndex];

  return (
    <em className="hero__typing" aria-label={phrase}>
      <span>{phrase.slice(0, typing.charCount)}</span>
    </em>
  );
}

function Hero() {
  return (
    <section
      className="hero"
      aria-label="A book you make together with your child"
    >
      <video
        className="hero__bg-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={`${MEDIA}hero-watercolor-bg.png`}
        aria-hidden="true"
        data-playback="once-freeze"
      >
        <source src={`${MEDIA}hero-bg-video.mp4?v=once-1`} type="video/mp4" />
      </video>

      <div className="hero__content">
        <img
          className="hero__mini-logo"
          src={`${MEDIA}hero-logo.png`}
          alt="anyturn"
        />

        <h1 className="hero__title">
          <span className="hero__title-desktop">A Book You Make Together</span>
          <span className="hero__title-mobile">A Book You</span>
          <span className="hero__title-mobile">Make Together</span>
          <span>With Your Child</span>
          <TypingPhrase />
        </h1>

        <p className="hero__copy">
          <span>They imagine the hero. They decide what happens next.</span>
          <span>
            The pages come to life in front of you — words, pictures, plot
            twists and all.
          </span>
        </p>

        <Button className="hero__cta">Start Your First Story For Free</Button>

        <img
          className="hero__book"
          src={`${MEDIA}hero-book.png`}
          alt="A parent and child sitting on an open storybook with fairytale characters"
          fetchPriority="high"
        />
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="social-proof" aria-label="Parent testimonial">
      <div className="social-proof__inner">
        <img
          className="social-proof__quote-mark"
          src={`${MEDIA}quote-mark.png`}
          alt=""
          aria-hidden="true"
        />

        <blockquote className="social-proof__quote">
          My daughter asks for 'our story' every single night now. It's become
          our favorite bedtime ritual.
        </blockquote>

        <div
          className="social-proof__author"
          aria-label="Sarah, mum of two, London"
        >
          <img
            className="social-proof__avatar"
            src={`${MEDIA}social-proof-avatar.png`}
            alt=""
            aria-hidden="true"
          />
          <p>Sarah, mum of two, London</p>
        </div>
      </div>
    </section>
  );
}

type StoryStep = typeof STORY_STEPS[number];
function StoryStepVisual({ step }: { step: StoryStep }) {
  if (step.visual === "bookSpread") {
    return (
      <div
        className="story-steps__panel story-steps__panel--spread"
        aria-label="Generated storybook preview"
      >
        <img
          className="story-steps__spread-image"
          src={`${MEDIA}story-step-book-spread.png`}
          alt=""
          aria-hidden="true"
        />
      </div>
    );
  }

  if (step.visual === "choice") {
    return (
      <div
        className="story-steps__panel story-steps__panel--book"
        aria-label="Story continuation preview"
      >
        <div className="story-steps__book-preview">
          <div className="story-steps__book-page">
            <span aria-hidden="true">Chapter 1</span>
            <p>
              The fox found a bright blue door under the roots of the oldest
              tree.
            </p>
          </div>
          <div className="story-steps__book-illustration" aria-hidden="true">
            <span />
          </div>
        </div>

        <div className="story-steps__choice-list">
          {step.ideas.map((idea) => (
            <button
              className="story-steps__choice"
              key={idea}
              onClick={goToProduct}
              type="button"
            >
              {idea}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step.visual === "library") {
    return (
      <div
        className="story-steps__panel story-steps__panel--library"
        aria-label="Generated story covers"
      >
        <div className="story-steps__covers">
          {Array.from({ length: 6 }, (_, index) => (
            <button
              className="story-steps__cover"
              key={`saved-book-${index}`}
              onClick={goToProduct}
              type="button"
            >
              <img
                src={`${MEDIA}story-step-cover.png`}
                alt=""
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step.visual === "finalCta") {
    return (
      <div
        className="story-steps__panel story-steps__panel--final"
        aria-label="Start your first story"
      >
        <button
          className="story-steps__final-button"
          onClick={goToProduct}
          type="button"
        >
          {step.custom}
        </button>
      </div>
    );
  }

  return (
    <div
      className="story-steps__panel story-steps__panel--ideas"
      aria-label="Story idea examples"
    >
      <h3>Ideas for your story</h3>

      <div className="story-steps__ideas">
        {step.ideas.map((idea, index) => (
          <button
            className="story-steps__idea"
            key={`${idea}-${index}`}
            onClick={goToProduct}
            type="button"
          >
            <span className="story-steps__idea-icon" aria-hidden="true" />
            <span>{idea}</span>
          </button>
        ))}
      </div>

      <div className="story-steps__custom">
        <h4>Or create your own</h4>
        <button
          className="story-steps__prompt"
          onClick={goToProduct}
          type="button"
        >
          <span className="story-steps__prompt-icon" aria-hidden="true" />
          <span>{step.custom}</span>
        </button>
      </div>
    </div>
  );
}

function StorySteps() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const interactionLockRef = useRef<number>(0);
  const activeStepIndexRef = useRef<number>(0);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(() => {
    const saved = window.sessionStorage.getItem(STORY_STEPS_STORAGE_KEY);
    const parsed = Number(saved);

    return Number.isInteger(parsed) &&
      parsed >= 0 &&
      parsed < STORY_STEPS.length
      ? parsed
      : 0;
  });

  useEffect(() => {
    activeStepIndexRef.current = activeStepIndex;
    window.sessionStorage.setItem(
      STORY_STEPS_STORAGE_KEY,
      String(activeStepIndex),
    );
  }, [activeStepIndex]);

  useEffect(
    () => () => {
      window.clearTimeout(interactionLockRef.current);
    },
    [],
  );

  const setActiveStep = (index: number) => {
    activeStepIndexRef.current = index;
    setActiveStepIndex(index);
  };

  const lockStoryInteraction = (duration = 620) => {
    window.clearTimeout(interactionLockRef.current);

    interactionLockRef.current = window.setTimeout(() => {
      interactionLockRef.current = 0;
    }, duration);
  };

  const snapSectionToTop = (behavior: ScrollBehavior = "auto") => {
    const section = sectionRef.current;
    const control = trackRef.current;

    if (!section) {
      return;
    }

    const snapOffset = Math.min(150, window.innerHeight * 0.2);
    const targetTop = control
      ? window.scrollY + control.getBoundingClientRect().top - snapOffset
      : window.scrollY + section.getBoundingClientRect().top;

    window.scrollTo({
      top: targetTop,
      behavior,
    });
  };

  const scrollToAdjacentSection = (direction: number, event?: WheelEvent) => {
    const section = sectionRef.current;
    const target =
      direction > 0
        ? section?.nextElementSibling
        : section?.previousElementSibling;

    if (!section || !target) {
      return false;
    }

    event?.preventDefault?.();
    window.clearTimeout(interactionLockRef.current);

    const targetTop = window.scrollY + target.getBoundingClientRect().top;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });

    lockStoryInteraction(520);
    return true;
  };

  const handleStepIntent = (direction: number, event?: WheelEvent) => {
    const section = sectionRef.current;
    const control = trackRef.current;

    if (!section || !control || direction === 0) {
      return false;
    }

    const sectionRect = section.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight * 0.5;
    const lastStepIndex = STORY_STEPS.length - 1;
    const currentIndex = activeStepIndexRef.current;
    const canMoveForward = direction > 0 && currentIndex < lastStepIndex;
    const canMoveBack = direction < 0 && currentIndex > 0;
    const isInControlZone =
      controlRect.top <= viewportCenter && controlRect.bottom >= viewportCenter;
    const isVisible =
      sectionRect.top < viewportHeight && sectionRect.bottom > 0;
    const isEnteringFromAbove =
      direction > 0 &&
      controlRect.top > viewportHeight * 0.18 &&
      controlRect.top <= viewportHeight * 0.92;
    const isEnteringFromBelow =
      direction < 0 &&
      controlRect.bottom < viewportHeight * 0.82 &&
      controlRect.bottom >= viewportHeight * 0.08;

    if (interactionLockRef.current) {
      if (event && isVisible) {
        event.preventDefault();
      }

      return isVisible;
    }

    if (isEnteringFromAbove) {
      event?.preventDefault?.();
      setActiveStep(0);
      snapSectionToTop();
      lockStoryInteraction(520);
      return true;
    }

    if (isEnteringFromBelow) {
      event?.preventDefault?.();
      setActiveStep(lastStepIndex);
      snapSectionToTop();
      lockStoryInteraction(520);
      return true;
    }

    if (!isInControlZone) {
      return false;
    }

    if (canMoveForward || canMoveBack) {
      event?.preventDefault?.();
      setActiveStep(currentIndex + direction);
      snapSectionToTop();
      lockStoryInteraction();
      return true;
    }

    return event ? scrollToAdjacentSection(direction, event) : false;
  };

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (
        Math.abs(event.deltaY) < 10 ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ) {
        return;
      }

      handleStepIntent(event.deltaY > 0 ? 1 : -1, event);
    };

    window.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel, true);
    };
  }, []);

  const handleManualStep = (index: number) => {
    if (index >= activeStepIndexRef.current) {
      return;
    }

    setActiveStep(index);
    snapSectionToTop("smooth");
  };

  const handleStepDelta = (direction: number) => {
    const currentIndex = activeStepIndexRef.current;
    const nextIndex = Math.min(
      STORY_STEPS.length - 1,
      Math.max(0, currentIndex + direction),
    );

    if (nextIndex === currentIndex) {
      return;
    }

    setActiveStep(nextIndex);
    snapSectionToTop("smooth");
  };

  const handleTrackKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();

    handleStepDelta(event.key === "ArrowRight" ? 1 : -1);
  };

  return (
    <section
      className="story-steps"
      aria-labelledby="story-steps-title"
      ref={sectionRef}
    >
      <div className="story-steps__pin">
        <div className="story-steps__heading">
          <h2 id="story-steps-title">
            <span>One Step To Begin</span>
            <span>Your Own Story</span>
          </h2>
          <p>
            No setup, no rules, no right answer. Just sit down together and
            start.
          </p>
        </div>

        <div
          aria-roledescription="carousel"
          className="story-steps__viewport"
          onKeyDown={handleTrackKeyDown}
          ref={trackRef}
          tabIndex={0}
        >
          <div
            className="story-steps__track"
            style={{
              transform: `translate3d(-${activeStepIndex * 100}%, 0, 0)`,
            }}
          >
            {STORY_STEPS.map((step, index) => (
              <article
                aria-label={`Step ${index + 1} of ${STORY_STEPS.length}: ${step.title}`}
                aria-roledescription="slide"
                className="story-steps__slide"
                data-state={index === activeStepIndex ? "active" : "inactive"}
                key={step.title}
                style={{
                  "--step-color": step.color,
                  "--copy-y-offset": step.copyOffset ?? "0px",
                  "--title-max-width": step.titleMaxWidth ?? "270px",
                  "--title-x-offset": step.titleXOffset ?? "0px",
                } as CSSWithVars}
              >
                <div className="story-steps__stage">
                  <div className="story-steps__copy">
                    <span className="story-steps__letter" aria-hidden="true">
                      {step.letter}
                    </span>

                    <div className="story-steps__title-wrap">
                      <h3>
                        {Array.isArray(step.displayTitle)
                          ? step.displayTitle.map((line) => (
                              <span key={line}>{line}</span>
                            ))
                          : (step.displayTitle ?? step.title)}
                      </h3>
                    </div>

                    {step.copy ? <p>{step.copy}</p> : null}

                    {step.visual === "finalCta" ? (
                      <img
                        className="story-steps__final-arrow"
                        src={`${MEDIA}story-final-arrow.png`}
                        alt=""
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>

                  <StoryStepVisual step={step} />
                </div>
              </article>
            ))}
          </div>
        </div>

        <div
          className="story-steps__pagination"
          aria-label="Story step pagination"
        >
          {STORY_STEPS.map((step, index) => {
            const isPastStep = index < activeStepIndex;
            const isActiveStep = index === activeStepIndex;

            return (
              <button
                aria-label={
                  isPastStep
                    ? `Return to step ${index + 1}: ${step.title}`
                    : isActiveStep
                      ? `Current step ${index + 1}: ${step.title}`
                      : `Step ${index + 1} appears after scrolling`
                }
                aria-pressed={isActiveStep}
                className="story-steps__page"
                data-state={
                  isActiveStep ? "active" : isPastStep ? "past" : "future"
                }
                disabled={!isPastStep}
                key={step.title}
                onClick={() => handleManualStep(index)}
                style={{ "--step-color": step.color } as CSSWithVars}
                type="button"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

const STORY_CHOICE_STATES = {
  start: {
    prompt: "What to do with a trapped little Woolfy?",
    stageImage: "story-choice-stage-start.png",
  },
  help: {
    prompt:
      "Now you are ready to return to the Village with a Golden key and continue your adventure...",
    stageImage: "story-choice-stage-help.png",
  },
  leave: {
    prompt:
      "The offended Woolfie you left in the net is now protecting the Golden Key and won't let you get any closer.",
    stageImage: "story-choice-stage-leave.png",
  },
};

type ChoiceStateKey = keyof typeof STORY_CHOICE_STATES;
interface StageTransition { direction: "forward" | "back"; from: ChoiceStateKey; to: ChoiceStateKey; }

function StoryChoicePreview() {
  const [choiceState, setChoiceState] = useState<ChoiceStateKey>("start");
  const [stageTransition, setStageTransition] = useState<StageTransition | null>(null);
  const turnTimersRef = useRef<number[]>([]);
  const isChangingStage = Boolean(stageTransition);
  const transitionDirection = stageTransition?.direction ?? "forward";
  const currentChoice = STORY_CHOICE_STATES[choiceState];

  useEffect(
    () => () => {
      turnTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const turnTo = (nextState: ChoiceStateKey) => {
    if (stageTransition || nextState === choiceState) {
      return;
    }

    turnTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    setStageTransition({
      direction: nextState === "start" ? "back" : "forward",
      from: choiceState,
      to: nextState,
    });
    setChoiceState(nextState);

    turnTimersRef.current = [
      window.setTimeout(() => {
        setStageTransition(null);
      }, 240),
    ];
  };

  return (
    <section
      className="story-choice"
      aria-labelledby="story-choice-title"
      data-state={choiceState}
    >
      <div className="story-choice__inner">
        <div className="story-choice__heading">
          <h2 id="story-choice-title">Once Upon Their Time...</h2>
          <p>
            Every decision has a consequence. Just like real life, but in a
            safe, magical world
          </p>
        </div>

        <div className="story-choice__demo" aria-live="polite">
          <div
            className="story-choice__stage"
            data-changing={isChangingStage}
            data-direction={transitionDirection}
          >
            <img
              className="story-choice__stage-image"
              key={currentChoice.stageImage}
              src={`${MEDIA}${currentChoice.stageImage}`}
              alt=""
              aria-hidden="true"
            />

            {stageTransition ? (
              <img
                className="story-choice__stage-transition"
                data-direction={stageTransition.direction}
                src={`${MEDIA}${STORY_CHOICE_STATES[stageTransition.from].stageImage}`}
                alt=""
                aria-hidden="true"
              />
            ) : null}

            <p className="story-choice__live-copy">{currentChoice.prompt}</p>

            {choiceState === "start" ? (
              <>
                <button
                  aria-label="Help Woolfy"
                  className="story-choice__hotspot story-choice__hotspot--help"
                  onClick={() => turnTo("help")}
                  type="button"
                />
                <button
                  aria-label="Leave Woolfy"
                  className="story-choice__hotspot story-choice__hotspot--leave"
                  onClick={() => turnTo("leave")}
                  type="button"
                />
              </>
            ) : (
              <>
                <button
                  aria-label="Back to the Crossroad"
                  className="story-choice__hotspot story-choice__hotspot--back"
                  onClick={() => turnTo("start")}
                  type="button"
                />
                <button
                  aria-label="Go to the App and continue the Journey"
                  className="story-choice__hotspot story-choice__hotspot--continue"
                  onClick={goToProduct}
                  type="button"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyParentsLoveIt() {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const interactionLockRef = useRef<number>(0);
  const activeSlideIndexRef = useRef<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(() => {
    const saved = window.sessionStorage.getItem(WHY_PARENTS_STORAGE_KEY);
    const parsed = Number(saved);

    return Number.isInteger(parsed) &&
      parsed >= 0 &&
      parsed < WHY_PARENTS_SLIDES.length
      ? parsed
      : 0;
  });

  useEffect(() => {
    activeSlideIndexRef.current = activeSlideIndex;
    window.sessionStorage.setItem(
      WHY_PARENTS_STORAGE_KEY,
      String(activeSlideIndex),
    );
  }, [activeSlideIndex]);

  useEffect(
    () => () => {
      window.clearTimeout(interactionLockRef.current);
    },
    [],
  );

  const setActiveSlide = (index: number) => {
    activeSlideIndexRef.current = index;
    setActiveSlideIndex(index);
  };

  const lockWhyInteraction = (duration = 620) => {
    window.clearTimeout(interactionLockRef.current);

    interactionLockRef.current = window.setTimeout(() => {
      interactionLockRef.current = 0;
    }, duration);
  };

  const snapWhySectionToTop = (behavior: ScrollBehavior = "auto") => {
    const section = sectionRef.current;
    const carousel = carouselRef.current;

    if (!section) {
      return;
    }

    const snapOffset = Math.min(150, window.innerHeight * 0.2);
    const targetTop = carousel
      ? window.scrollY + carousel.getBoundingClientRect().top - snapOffset
      : window.scrollY + section.getBoundingClientRect().top;

    window.scrollTo({
      top: targetTop,
      behavior,
    });
  };

  const scrollToAdjacentWhySection = (direction: number, event?: WheelEvent) => {
    const section = sectionRef.current;
    const target =
      direction > 0
        ? section?.nextElementSibling
        : section?.previousElementSibling;

    if (!section || !target) {
      return false;
    }

    event?.preventDefault?.();
    window.clearTimeout(interactionLockRef.current);

    window.scrollTo({
      top: window.scrollY + target.getBoundingClientRect().top,
      behavior: "smooth",
    });

    lockWhyInteraction(520);
    return true;
  };

  const handleWhyStepIntent = (direction: number, event?: WheelEvent) => {
    const section = sectionRef.current;
    const carousel = carouselRef.current;

    if (!section || !carousel || direction === 0) {
      return false;
    }

    const sectionRect = section.getBoundingClientRect();
    const controlRect = carousel.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight * 0.5;
    const lastSlideIndex = WHY_PARENTS_SLIDES.length - 1;
    const currentIndex = activeSlideIndexRef.current;
    const canMoveForward = direction > 0 && currentIndex < lastSlideIndex;
    const canMoveBack = direction < 0 && currentIndex > 0;
    const isInControlZone =
      controlRect.top <= viewportCenter && controlRect.bottom >= viewportCenter;
    const isVisible =
      sectionRect.top < viewportHeight && sectionRect.bottom > 0;
    const isEnteringFromAbove =
      direction > 0 &&
      controlRect.top > viewportHeight * 0.18 &&
      controlRect.top <= viewportHeight * 0.92;
    const isEnteringFromBelow =
      direction < 0 &&
      controlRect.bottom < viewportHeight * 0.82 &&
      controlRect.bottom >= viewportHeight * 0.08;

    if (interactionLockRef.current) {
      if (event && isVisible) {
        event.preventDefault();
      }

      return isVisible;
    }

    if (isEnteringFromAbove) {
      event?.preventDefault?.();
      setActiveSlide(0);
      snapWhySectionToTop();
      lockWhyInteraction(520);
      return true;
    }

    if (isEnteringFromBelow) {
      event?.preventDefault?.();
      setActiveSlide(lastSlideIndex);
      snapWhySectionToTop();
      lockWhyInteraction(520);
      return true;
    }

    if (!isInControlZone) {
      return false;
    }

    if (canMoveForward || canMoveBack) {
      event?.preventDefault?.();
      setActiveSlide(currentIndex + direction);
      snapWhySectionToTop();
      lockWhyInteraction();
      return true;
    }

    return event ? scrollToAdjacentWhySection(direction, event) : false;
  };

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (
        Math.abs(event.deltaY) < 10 ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ) {
        return;
      }

      handleWhyStepIntent(event.deltaY > 0 ? 1 : -1, event);
    };

    window.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel, true);
    };
  }, []);

  const handleManualWhyStep = (index: number) => {
    if (index >= activeSlideIndexRef.current) {
      return;
    }

    setActiveSlide(index);
    snapWhySectionToTop("smooth");
  };

  const handleWhyKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const currentIndex = activeSlideIndexRef.current;
    const nextIndex = Math.min(
      WHY_PARENTS_SLIDES.length - 1,
      Math.max(0, currentIndex + direction),
    );

    if (nextIndex === currentIndex) {
      return;
    }

    event.preventDefault();
    setActiveSlide(nextIndex);
    snapWhySectionToTop("smooth");
  };

  return (
    <section
      className="why-parents"
      aria-labelledby="why-parents-title"
      ref={sectionRef}
    >
      <div className="why-parents__heading">
        <h2 id="why-parents-title">Why Parents Love It</h2>
        <p>Made for the moments that matter</p>
      </div>

      <div
        className="why-parents__carousel"
        aria-roledescription="carousel"
        onKeyDown={handleWhyKeyDown}
        ref={carouselRef}
        tabIndex={0}
      >
        <div
          className="why-parents__track"
          style={{
            transform: `translate3d(-${activeSlideIndex * 100}%, 0, 0)`,
          }}
        >
          {WHY_PARENTS_SLIDES.map((slide, index) => (
            <article
              aria-label={`Benefit ${index + 1} of ${WHY_PARENTS_SLIDES.length}`}
              aria-roledescription="slide"
              aria-hidden={index !== activeSlideIndex}
              className="why-parents__slide"
              data-state={index === activeSlideIndex ? "active" : "inactive"}
              key={slide.displayTitle.join(" ")}
              style={{ "--why-color": slide.color } as CSSWithVars}
            >
              <div className="why-parents__visual" aria-hidden="true">
                <img src={`${MEDIA}${slide.image}`} alt="" />
              </div>

              <div className="why-parents__copy">
                <div className="why-parents__title-row">
                  <span className="why-parents__letter" aria-hidden="true">
                    {slide.letter}
                  </span>

                  <h3>
                    {slide.displayTitle.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </h3>
                </div>

                <p>{slide.copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div
          className="why-parents__pagination"
          aria-label="Why parents love it pagination"
        >
          {WHY_PARENTS_SLIDES.map((page, pageIndex) => {
            const isPastSlide = pageIndex < activeSlideIndex;
            const isActiveSlide = pageIndex === activeSlideIndex;

            return (
              <button
                aria-label={
                  isPastSlide
                    ? `Return to benefit ${pageIndex + 1}`
                    : isActiveSlide
                      ? `Current benefit ${pageIndex + 1}`
                      : `Benefit ${pageIndex + 1} appears after scrolling`
                }
                aria-pressed={isActiveSlide}
                className="why-parents__page"
                data-state={
                  isActiveSlide ? "active" : isPastSlide ? "past" : "future"
                }
                disabled={!isPastSlide}
                key={page.displayTitle.join(" ")}
                onClick={() => handleManualWhyStep(pageIndex)}
                style={{ "--why-page-color": page.color } as CSSWithVars}
                type="button"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StoriesFromRealFamilies() {
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(() => {
    try {
      const saved = window.sessionStorage.getItem(
        REAL_FAMILY_STORY_STORAGE_KEY,
      );
      const parsed = saved ? JSON.parse(saved) : null;

      return Number.isInteger(parsed?.index) &&
        parsed.index >= 0 &&
        parsed.index < REAL_FAMILY_STORIES.length
        ? parsed.index
        : 2;
    } catch {
      return 2;
    }
  });
  const activeStory = REAL_FAMILY_STORIES[activeStoryIndex];

  const selectStory = (index: number) => {
    setActiveStoryIndex(index);
    window.sessionStorage.setItem(
      REAL_FAMILY_STORY_STORAGE_KEY,
      JSON.stringify({ index }),
    );
  };

  return (
    <section className="real-stories" aria-labelledby="real-stories-title">
      <div className="real-stories__heading">
        <h2 id="real-stories-title">Stories From Real Families</h2>
        <p>
          <span>Every one of these is a real book made by a real child.</span>
          <span>No two are the same - that's rather the point</span>
        </p>
      </div>

      <div className="real-stories__showcase">
        <div className="real-stories__feature">
          <button
            className="real-stories__cover-button"
            onClick={goToProduct}
            type="button"
          >
            <img
              src={`${MEDIA}${activeStory.cover}`}
              alt={`${activeStory.title} book cover`}
            />
          </button>

          <div className="real-stories__details">
            <p className="real-stories__chapters">{activeStory.chapters}</p>
            <h3>{activeStory.title}</h3>

            <div
              className="real-stories__meta"
              aria-label={`Created by ${activeStory.author}, ${activeStory.age}`}
            >
              <span>Created by&nbsp; {activeStory.author}</span>
              <span>{activeStory.age}</span>
            </div>

            <blockquote>{activeStory.quote}</blockquote>
          </div>
        </div>

        <div
          className="real-stories__rail"
          aria-label="Choose a real family story"
        >
          {REAL_FAMILY_STORIES.map((story, index) => (
            <button
              aria-label={`Show ${story.title}`}
              aria-pressed={index === activeStoryIndex}
              className="real-stories__thumb"
              data-state={index === activeStoryIndex ? "active" : "inactive"}
              key={`${story.title}-${story.author}-${index}`}
              onClick={() => selectStory(index)}
              type="button"
            >
              <img src={`${MEDIA}${story.cover}`} alt="" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FamilyVideoBlock() {
  return (
    <section className="family-video" aria-label="Anyturn family video">
      <button
        className="family-video__button"
        type="button"
        aria-label="Play Anyturn family video"
      >
        <img src={`${MEDIA}family-video-frame.png`} alt="" aria-hidden="true" />
      </button>
    </section>
  );
}

function ForEveryMoment() {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const interactionLockRef = useRef<number>(0);
  const activeSlideIndexRef = useRef<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(() => {
    const saved = window.sessionStorage.getItem(MOMENTS_STORAGE_KEY);
    const parsed = Number(saved);

    return Number.isInteger(parsed) &&
      parsed >= 0 &&
      parsed < MOMENT_SLIDES.length
      ? parsed
      : 0;
  });

  useEffect(() => {
    activeSlideIndexRef.current = activeSlideIndex;
    window.sessionStorage.setItem(
      MOMENTS_STORAGE_KEY,
      String(activeSlideIndex),
    );
  }, [activeSlideIndex]);

  useEffect(
    () => () => {
      window.clearTimeout(interactionLockRef.current);
    },
    [],
  );

  const setActiveMomentSlide = (index: number) => {
    activeSlideIndexRef.current = index;
    setActiveSlideIndex(index);
  };

  const lockMomentInteraction = (duration = 620) => {
    window.clearTimeout(interactionLockRef.current);

    interactionLockRef.current = window.setTimeout(() => {
      interactionLockRef.current = 0;
    }, duration);
  };

  const snapMomentSectionToTop = (behavior: ScrollBehavior = "auto") => {
    const section = sectionRef.current;
    const carousel = carouselRef.current;

    if (!section) {
      return;
    }

    const snapOffset = Math.min(150, window.innerHeight * 0.2);
    const targetTop = carousel
      ? window.scrollY + carousel.getBoundingClientRect().top - snapOffset
      : window.scrollY + section.getBoundingClientRect().top;

    window.scrollTo({
      top: targetTop,
      behavior,
    });
  };

  const scrollToAdjacentMomentSection = (direction: number, event?: WheelEvent) => {
    const section = sectionRef.current;
    const target =
      direction > 0
        ? section?.nextElementSibling
        : section?.previousElementSibling;

    if (!section || !target) {
      return false;
    }

    event?.preventDefault?.();
    window.clearTimeout(interactionLockRef.current);

    window.scrollTo({
      top: window.scrollY + target.getBoundingClientRect().top,
      behavior: "smooth",
    });

    lockMomentInteraction(520);
    return true;
  };

  const handleMomentStepIntent = (direction: number, event?: WheelEvent) => {
    const section = sectionRef.current;
    const carousel = carouselRef.current;

    if (!section || !carousel || direction === 0) {
      return false;
    }

    const sectionRect = section.getBoundingClientRect();
    const controlRect = carousel.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight * 0.5;
    const lastSlideIndex = MOMENT_SLIDES.length - 1;
    const currentIndex = activeSlideIndexRef.current;
    const canMoveForward = direction > 0 && currentIndex < lastSlideIndex;
    const canMoveBack = direction < 0 && currentIndex > 0;
    const isInControlZone =
      controlRect.top <= viewportCenter && controlRect.bottom >= viewportCenter;
    const isVisible =
      sectionRect.top < viewportHeight && sectionRect.bottom > 0;
    const isEnteringFromAbove =
      direction > 0 &&
      controlRect.top > viewportHeight * 0.18 &&
      controlRect.top <= viewportHeight * 0.92;
    const isEnteringFromBelow =
      direction < 0 &&
      controlRect.bottom < viewportHeight * 0.82 &&
      controlRect.bottom >= viewportHeight * 0.08;

    if (interactionLockRef.current) {
      if (event && isVisible) {
        event.preventDefault();
      }

      return isVisible;
    }

    if (isEnteringFromAbove) {
      event?.preventDefault?.();
      setActiveMomentSlide(0);
      snapMomentSectionToTop();
      lockMomentInteraction(520);
      return true;
    }

    if (isEnteringFromBelow) {
      event?.preventDefault?.();
      setActiveMomentSlide(lastSlideIndex);
      snapMomentSectionToTop();
      lockMomentInteraction(520);
      return true;
    }

    if (!isInControlZone) {
      return false;
    }

    if (canMoveForward || canMoveBack) {
      event?.preventDefault?.();
      setActiveMomentSlide(currentIndex + direction);
      snapMomentSectionToTop();
      lockMomentInteraction();
      return true;
    }

    return event ? scrollToAdjacentMomentSection(direction, event) : false;
  };

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (
        Math.abs(event.deltaY) < 10 ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ) {
        return;
      }

      handleMomentStepIntent(event.deltaY > 0 ? 1 : -1, event);
    };

    window.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel, true);
    };
  }, []);

  const handleManualMomentStep = (index: number) => {
    if (index >= activeSlideIndexRef.current) {
      return;
    }

    setActiveMomentSlide(index);
    snapMomentSectionToTop("smooth");
  };

  const handleMomentKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const currentIndex = activeSlideIndexRef.current;
    const nextIndex = Math.min(
      MOMENT_SLIDES.length - 1,
      Math.max(0, currentIndex + direction),
    );

    if (nextIndex === currentIndex) {
      return;
    }

    event.preventDefault();
    setActiveMomentSlide(nextIndex);
    snapMomentSectionToTop("smooth");
  };

  return (
    <section
      className="moments"
      aria-labelledby="moments-title"
      ref={sectionRef}
    >
      <div className="moments__heading">
        <h2 id="moments-title">For Every Moment Together</h2>
        <p>It works at every time you want to spend a quality and fun time</p>
      </div>

      <div
        className="moments__carousel"
        aria-roledescription="carousel"
        onKeyDown={handleMomentKeyDown}
        ref={carouselRef}
        tabIndex={0}
      >
        <div
          className="moments__track"
          style={{
            transform: `translate3d(-${activeSlideIndex * 100}%, 0, 0)`,
          }}
        >
          {MOMENT_SLIDES.map((slide, index) => (
            <article
              aria-label={`Use case ${index + 1} of ${MOMENT_SLIDES.length}`}
              aria-roledescription="slide"
              aria-hidden={index !== activeSlideIndex}
              className="moments__slide"
              data-state={index === activeSlideIndex ? "active" : "inactive"}
              key={slide.page}
              style={{ "--moment-color": slide.color } as CSSWithVars}
            >
              <div className="moments__copy">
                <div className="moments__title-row">
                  <span className="moments__letter" aria-hidden="true">
                    {slide.letter}
                  </span>

                  <h3>
                    {slide.displayTitle.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </h3>
                </div>

                <p>{slide.copy}</p>
              </div>

              <div className="moments__visual" aria-hidden="true">
                <img src={`${MEDIA}${slide.image}`} alt="" />
              </div>
            </article>
          ))}
        </div>

        <div
          className="moments__pagination"
          aria-label="For every moment pagination"
        >
          {MOMENT_SLIDES.slice(0, activeSlideIndex + 1).map(
            (page, pageIndex) => {
              const isPastSlide = pageIndex < activeSlideIndex;
              const isActiveSlide = pageIndex === activeSlideIndex;

              return (
                <button
                  aria-label={
                    isPastSlide
                      ? `Return to ${page.page}`
                      : isActiveSlide
                        ? `Current moment: ${page.page}`
                        : `${page.page} appears after scrolling`
                  }
                  aria-pressed={isActiveSlide}
                  className="moments__page"
                  data-state={isActiveSlide ? "active" : "past"}
                  disabled={!isPastSlide}
                  key={page.page}
                  onClick={() => handleManualMomentStep(pageIndex)}
                  style={{
                    "--moment-page-color": page.color,
                    "--moment-page-text": page.activeText,
                  } as CSSWithVars}
                  type="button"
                >
                  {page.page}
                </button>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}

function WhatFamiliesSay() {
  const carouselQuotes = [...FAMILY_QUOTES, ...FAMILY_QUOTES];

  return (
    <section className="family-quotes" aria-labelledby="family-quotes-title">
      <h2 id="family-quotes-title">What Families Say</h2>

      <div
        className="family-quotes__viewport"
        aria-label="Family testimonials carousel"
      >
        <div className="family-quotes__track">
          {carouselQuotes.map((item, index) => (
            <figure
              className="family-quotes__card"
              aria-hidden={index >= FAMILY_QUOTES.length}
              key={`${item.author}-${index}`}
            >
              <blockquote>{item.quote}</blockquote>

              <figcaption>
                <img src={`${MEDIA}${item.avatar}`} alt="" aria-hidden="true" />
                <span>{item.author}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function SimplePlans() {
  return (
    <section className="pricing" aria-labelledby="pricing-title">
      <div className="pricing__heading">
        <h2 id="pricing-title">Simple Plans</h2>
        <p>Takes under a minute to start. No card required.</p>
      </div>

      <div className="pricing__cards">
        {PRICING_PLANS.map((plan) => (
          <article
            className={`pricing-card pricing-card--${plan.variant}`}
            key={plan.price}
            style={{ "--pricing-bg": `url(${MEDIA}${plan.bg})` } as CSSWithVars}
          >
            <div className="pricing-card__top">
              <strong>{plan.price}</strong>
              <span>{plan.cadence}</span>
            </div>

            <p className="pricing-card__quote">{plan.quote}</p>

            <ul
              className="pricing-card__features"
              aria-label={`${plan.price} plan features`}
            >
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <button
              className="pricing-card__cta"
              onClick={goToProduct}
              type="button"
            >
              <span>Start the Adventure</span>
              <span aria-hidden="true">{"\u2192"}</span>
            </button>
            <span className="pricing-card__curl" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}

function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    try {
      const saved = window.sessionStorage.getItem(FAQ_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      return Array.isArray(parsed)
        ? parsed.filter((id) => FAQ_ITEMS.some((item) => item.id === id))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.sessionStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(openItems));
  }, [openItems]);

  const toggleFAQ = (id: string) => {
    setOpenItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <section className="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">FAQ</h2>

      <div className="faq__list">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openItems.includes(item.id);
          const panelId = `faq-answer-${item.id}`;

          return (
            <article
              className="faq-card"
              data-state={isOpen ? "open" : "closed"}
              key={item.id}
            >
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="faq-card__button"
                onClick={() => toggleFAQ(item.id)}
                type="button"
              >
                <span>{item.question}</span>
                <span className="faq-card__icon" aria-hidden="true" />
              </button>

              <div className="faq-card__answer" id={panelId}>
                <div className="faq-card__answer-box">
                  <span aria-hidden="true" />
                  <p>{item.answer}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="final-cta__inner">
        <h2 id="final-cta-title">
          <span>Tonight&apos;s</span>
          <span>Bedtime Story Is Waiting</span>
        </h2>
        <p>
          <span>Start your first story in under a minute.</span>
          <span>
            No card, no pressure &mdash; just a chance to see what your child
            does with it.
          </span>
        </p>
        <button
          className="final-cta__button"
          onClick={goToProduct}
          type="button"
        >
          Start Your First Story &mdash; Free
        </button>
      </div>
    </section>
  );
}

function LandingFooter() {
  const [activeModal, setActiveModal] = useState<typeof FOOTER_LINKS[number] | null>(null);

  useEffect(() => {
    if (!activeModal) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  return (
    <footer className="landing-footer">
      <div className="landing-footer__inner">
        <img
          className="landing-footer__logo"
          src={`${MEDIA}logo-dark.png`}
          alt="anyturn"
        />

        <nav className="landing-footer__nav" aria-label="Footer navigation">
          {FOOTER_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => setActiveModal(link)}
              type="button"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <p className="landing-footer__copyright">
          &copy; 2026 Anyturn Ltd. Made with <span>♥</span> in London.
        </p>
      </div>

      {activeModal ? (
        <div
          className="footer-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-modal-title"
        >
          <button
            className="footer-modal__backdrop"
            onClick={() => setActiveModal(null)}
            type="button"
            aria-label="Close popup"
          />
          <div className="footer-modal__panel">
            <button
              className="footer-modal__close"
              onClick={() => setActiveModal(null)}
              type="button"
              aria-label="Close popup"
            >
              ×
            </button>
            <h2 id="footer-modal-title">{activeModal.title}</h2>
            <p>{activeModal.copy}</p>
          </div>
        </div>
      ) : null}
    </footer>
  );
}

export default function Landing() {
  return (
    <main className="anyturn-landing">
      <Header />
      <Hero />
      <SocialProof />
      <StorySteps />
      <StoryChoicePreview />
      <WhyParentsLoveIt />
      <StoriesFromRealFamilies />
      <FamilyVideoBlock />
      <ForEveryMoment />
      <WhatFamiliesSay />
      <SimplePlans />
      <FAQSection />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
