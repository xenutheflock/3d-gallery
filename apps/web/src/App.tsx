import InfiniteGallery from "@/components/ui/3d-gallery-photography";
import libuLibongBuwanAudio from "../../../Kyle Raphael - Libu-libong buwan (uuwian) (Official Lyric Video) [tVRfUqyDJyM].mp3";

const sampleImages = [
  { src: "https://images.unsplash.com/photo-1741332966416-414d8a5b8887?w=900&auto=format&fit=crop&q=80", alt: "Image 1" },
  { src: "https://images.unsplash.com/photo-1754769440490-2eb64d715775?w=900&auto=format&fit=crop&q=80", alt: "Image 2" },
  { src: "https://images.unsplash.com/photo-1758640920659-0bb864175983?w=900&auto=format&fit=crop&q=80", alt: "Image 3" },
  { src: "https://images.unsplash.com/photo-1746023841657-e5cd7cc90d2c?w=900&auto=format&fit=crop&q=80", alt: "Image 4" },
  { src: "https://images.unsplash.com/photo-1741715661559-6149723ea89a?w=900&auto=format&fit=crop&q=80", alt: "Image 5" },
  { src: "https://images.unsplash.com/photo-1725878746053-407492aa4034?w=900&auto=format&fit=crop&q=80", alt: "Image 6" },
  { src: "https://images.unsplash.com/photo-1752588975168-d2d7965a6d64?w=900&auto=format&fit=crop&q=80", alt: "Image 7" },
  { src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&auto=format&fit=crop&q=80", alt: "Image 8" },
  { src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&auto=format&fit=crop&q=80", alt: "Image 9" },
  { src: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=900&auto=format&fit=crop&q=80", alt: "Image 10" },
];

export default function App() {
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
        className="fixed bottom-6 left-1/2 z-10 w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 p-4 text-white shadow-2xl backdrop-blur-md"
        aria-label="Music player"
      >
        <div className="mb-3 text-center">
          <p className="text-sm font-semibold">Libu-libong Buwan</p>
          <p className="text-xs text-white/60">Kyle Raphael</p>
        </div>
        <audio
          className="w-full accent-white"
          controls
          preload="none"
          src={libuLibongBuwanAudio}
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </main>
  );
}
