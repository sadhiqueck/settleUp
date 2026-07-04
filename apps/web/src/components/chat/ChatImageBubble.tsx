import React, { useState, useEffect, useCallback } from "react";
import { Download, X, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Image Lightbox (Full-screen viewer with download) ───

interface ImageLightboxProps {
  src: string;
  isOpen: boolean;
  onClose: () => void;
  senderName?: string;
}

function ImageLightbox({ src, isOpen, onClose, senderName }: ImageLightboxProps) {
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settleup-${Date.now()}.${blob.type.split("/")[1] || "jpg"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  }, [src]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-black/95 backdrop-blur-xl rounded-2xl overflow-hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Image from {senderName || "chat"}</DialogTitle>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
          <span className="text-white/90 text-sm font-medium truncate">
            {senderName || "Image"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Download image"
            >
              <Download size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center w-full h-full min-h-[50vh] p-4">
          <img
            src={src}
            alt="Full size"
            className="max-w-full max-h-[85vh] object-contain rounded-lg select-none"
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Chat Image Bubble (Blur-up loading + click to open) ───

interface ChatImageBubbleProps {
  src: string;
  senderName: string;
}

type ImageLoadState = "loading" | "loaded" | "error";

export const ChatImageBubble = React.memo(function ChatImageBubble({ src, senderName }: ChatImageBubbleProps) {
  const [loadState, setLoadState] = useState<ImageLoadState>("loading");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => loadState === "loaded" && setLightboxOpen(true)}
      >
        {/* Blurred placeholder while loading */}
        {loadState === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/30 backdrop-blur-sm animate-pulse">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-[10px] text-muted-foreground font-medium">Loading...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {loadState === "error" && (
          <div className="flex items-center justify-center h-32 bg-muted/20 rounded-xl">
            <span className="text-xs text-muted-foreground">Failed to load image</span>
          </div>
        )}

        {/* Actual image */}
        <img
          src={src}
          alt="Attached"
          className={`max-w-full h-auto object-cover transition-all duration-500 ${
            loadState === "loaded" ? "blur-0 scale-100 opacity-100" : "blur-lg scale-105 opacity-40"
          }`}
          loading="lazy"
          onLoad={() => setLoadState("loaded")}
          onError={() => setLoadState("error")}
        />

        {/* Hover overlay with zoom icon */}
        {loadState === "loaded" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
            <ZoomIn
              size={28}
              className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Full-screen lightbox */}
      <ImageLightbox
        src={src}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        senderName={senderName}
      />
    </>
  );
});
