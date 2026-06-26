import { useEffect, useRef, useState } from "react";
import InfiniteGallery from "@/components/ui/3d-gallery-photography";
import image01 from "../../../images/f23219488.jpg";
import image02 from "../../../images/f23280416.jpg";
import image03 from "../../../images/f24427552.jpg";
import image04 from "../../../images/f24473632.jpg";
import image05 from "../../../images/f24923424.jpg";
import image06 from "../../../images/f24957216.jpg";
import image07 from "../../../images/f25019168.jpg";
import image08 from "../../../images/f25255712.jpg";
import image09 from "../../../images/f25371168.jpg";
import image10 from "../../../images/f25472544.jpg";
import image11 from "../../../images/f25509152.jpg";
import image12 from "../../../images/f25796384.jpg";
import image13 from "../../../images/f26341152.jpg";
import image14 from "../../../images/f27183648.jpg";
import image15 from "../../../images/f27378208.jpg";
import image16 from "../../../images/f27631648.jpg";
import image17 from "../../../images/f28672032.jpg";
import image18 from "../../../images/f30021408.jpg";
import image19 from "../../../images/IMG_8591.jpeg";
import image20 from "../../../images/IMG_2928.jpeg";
import image21 from "../../../images/IMG_2927.jpeg";
import image22 from "../../../images/IMG_2929.jpeg";
import image23 from "../../../images/IMG_4555.jpeg";
import image24 from "../../../images/IMG_4618.jpeg";
import image25 from "../../../images/IMG_4748.jpeg";
import image26 from "../../../images/IMG_4814.jpeg";
import image27 from "../../../images/IMG_5012.jpeg";
import image28 from "../../../images/IMG_8643.jpeg";

const ACCESS_PASSWORD = "mygallery";
const ACCESS_STORAGE_KEY = "3d-gallery-unlocked";

const sampleImages = [
  { src: image01, alt: "Gallery image 1" },
  { src: image02, alt: "Gallery image 2" },
  { src: image03, alt: "Gallery image 3" },
  { src: image04, alt: "Gallery image 4" },
  { src: image05, alt: "Gallery image 5" },
  { src: image06, alt: "Gallery image 6" },
  { src: image07, alt: "Gallery image 7" },
  { src: image08, alt: "Gallery image 8" },
  { src: image09, alt: "Gallery image 9" },
  { src: image10, alt: "Gallery image 10" },
  { src: image11, alt: "Gallery image 11" },
  { src: image12, alt: "Gallery image 12" },
  { src: image13, alt: "Gallery image 13" },
  { src: image14, alt: "Gallery image 14" },
  { src: image15, alt: "Gallery image 15" },
  { src: image16, alt: "Gallery image 16" },
  { src: image17, alt: "Gallery image 17" },
  { src: image18, alt: "Gallery image 18" },
  { src: image19, alt: "Gallery image 19" },
  { src: image20, alt: "Gallery image 20" },
  { src: image21, alt: "Gallery image 21" },
  { src: image22, alt: "Gallery image 22" },
  { src: image23, alt: "Gallery image 23" },
  { src: image24, alt: "Gallery image 24" },
  { src: image25, alt: "Gallery image 25" },
  { src: image26, alt: "Gallery image 26" },
  { src: image27, alt: "Gallery image 27" },
  { src: image28, alt: "Gallery image 28" },
];

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem(ACCESS_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      if (!audio.duration) {
        setProgress(0);
        return;
      }

      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      setIsPlaying(true);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.trim() !== ACCESS_PASSWORD) {
      setPasswordError("Wrong password. Please try again.");
      return;
    }

    sessionStorage.setItem(ACCESS_STORAGE_KEY, "true");
    setPasswordError("");
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return (
      <main
        className="min-h-screen h-screen w-full overflow-hidden bg-black text-white"
        style={{
          width: "100vw",
          height: "100vh",
          margin: 0,
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.08), transparent 34%), #030303",
          color: "white",
        }}
      >
        <form
          onSubmit={handleUnlock}
          style={{
            width: "min(88vw, 22rem)",
            display: "grid",
            gap: "1rem",
            textAlign: "center",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "0.72rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.52)",
              }}
            >
              Private gallery
            </p>
            <h1
              style={{
                margin: "0.45rem 0 0",
                fontSize: "1.35rem",
                fontWeight: 600,
              }}
            >
              Enter password to continue
            </h1>
          </div>

          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
            }}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%",
              border: "none",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.1)",
              padding: "0.95rem 1.15rem",
              color: "white",
              outline: "none",
              textAlign: "center",
            }}
          />

          {passwordError ? (
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#fca5a5" }}>
              {passwordError}
            </p>
          ) : null}

          <button
            type="submit"
            style={{
              border: "none",
              borderRadius: "9999px",
              background: "white",
              padding: "0.95rem 1.15rem",
              color: "black",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Proceed
          </button>
        </form>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen h-screen w-full overflow-hidden bg-black text-white"
      style={{
        width: "100vw",
        height: "100vh",
        minHeight: "100vh",
        margin: 0,
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#030303",
        color: "white",
      }}
    >
      <InfiniteGallery
        images={sampleImages}
        speed={0.55}
        visibleCount={6}
        className="h-screen w-full overflow-hidden bg-black"
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          inset: 0,
          background: "#030303",
        }}
      />
      <div
        className="fixed bottom-7 left-1/2 z-10 w-[min(88vw,20rem)] -translate-x-1/2 text-white"
        style={{
          position: "fixed",
          left: "50%",
          bottom: "1.75rem",
          zIndex: 99999,
          width: "min(88vw, 20rem)",
          transform: "translateX(-50%)",
          color: "white",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "grid", justifyItems: "center", gap: "0.65rem" }}>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.68rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              I recommend playing this song while scrolling :&gt;
            </p>
            <p
              style={{
                margin: "0.2rem 0 0",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "white",
              }}
            >
              Libu-libong Buwan
            </p>
            <p
              style={{
                margin: "0.05rem 0 0",
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.58)",
              }}
            >
              Kyle Raphael
            </p>
          </div>

          <button
            type="button"
            onClick={togglePlayback}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-black transition hover:scale-105 hover:bg-white/90"
            style={{
              display: "grid",
              width: "3rem",
              height: "3rem",
              placeItems: "center",
              borderRadius: "9999px",
              border: "none",
              background: "white",
              color: "black",
              cursor: "pointer",
            }}
            aria-label={isPlaying ? "Pause song" : "Play song"}
          >
            <span className="text-base font-bold leading-none">
              {isPlaying ? "❚❚" : "▶"}
            </span>
          </button>

          <div style={{ width: "100%" }}>
            <div
              style={{
                marginBottom: "0.3rem",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.72)",
              }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div
              className="h-1 overflow-hidden rounded-full bg-white/25"
              style={{
                height: "0.22rem",
                overflow: "hidden",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.28)",
              }}
            >
              <div
                className="h-full rounded-full bg-white transition-[width] duration-300"
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  borderRadius: "9999px",
                  background: "white",
                  transition: "width 300ms ease",
                }}
              />
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          preload="none"
          src="/audio/libu-libong-buwan.mp3"
        />
      </div>
    </main>
  );
}
