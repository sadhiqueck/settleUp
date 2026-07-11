import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { AlertTriangle, ExternalLink, Copy, Check, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface UpiPayButtonProps {
  receiverVpa: string | null;
  receiverName: string;
  amount: number;
  groupName: string;
}

function generateUpiUrl(
  vpa: string,
  name: string,
  amount: number,
  groupName: string,
): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: name,
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Fettl: ${groupName}`,
  });
  return `upi://pay?${params.toString()}`;
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent,
  );
}

function handleDownloadQr() {
  const svgEl = document.getElementById("upi-qr-code");
  if (!svgEl) return;

  const svgData = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "upi-qr-code.png";
    link.href = pngUrl;
    link.click();
  };

  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

export function UpiPayButton({
  receiverVpa,
  receiverName,
  amount,
  groupName,
}: UpiPayButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const isMobile = isMobileDevice();

  if (!receiverVpa) {
    return (
      <button
        disabled
        className="clay-btn-secondary text-xs px-4 py-2 shrink-0 opacity-50 cursor-not-allowed"
        title="Recipient hasn't set up their UPI ID yet"
      >
        No UPI ID
      </button>
    );
  }

  const upiUrl = generateUpiUrl(receiverVpa, receiverName, amount, groupName);

  const handlePayClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmPay = () => {
    window.location.href = upiUrl;
    setShowConfirm(false);
  };

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(receiverVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = receiverVpa;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={handlePayClick}
        className="clay-btn-primary text-xs px-4 py-2 shrink-0 shadow-sm flex items-center gap-1.5 hover:scale-[1.02] transition-transform"
      >
        <ExternalLink size={12} />
        Pay via UPI
      </button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="clay-card-elevated border-0 ring-0 rounded-3xl max-w-sm">
          <DialogHeader className="pb-2">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="clay-card-elevated p-4 rounded-2xl bg-primary/10">
                <span className="text-3xl">💳</span>
              </div>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  Pay {receiverName}
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Scan QR or open your UPI app
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3 my-1">
            <div className="clay-card-pressed p-4 rounded-2xl bg-white">
              <QRCodeSVG
                id="upi-qr-code"
                value={upiUrl}
                size={180}
                level="M"
                includeMargin={false}
                bgColor="transparent"
                fgColor="#1a1a1a"
              />
            </div>
            <button
              onClick={handleDownloadQr}
              className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download size={12} />
              Save QR Code
            </button>
          </div>

          {/* Payment details */}
          <div className="clay-card-pressed p-4 rounded-2xl text-center space-y-1.5">
            <p className="font-sans font-extrabold text-2xl text-foreground">
              ₹{amount.toLocaleString("en-IN")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground font-medium">
                to{" "}
                <span className="font-bold text-foreground">
                  {receiverVpa}
                </span>
              </p>
              <button
                onClick={handleCopyVpa}
                className="text-primary hover:scale-110 transition-transform p-1"
                title="Copy UPI ID"
              >
                {copied ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground/70 font-medium">
              Fettl: {groupName}
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-3 flex gap-3">
            <AlertTriangle
              size={16}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <p className="text-xs text-amber-700 leading-relaxed">
              Please verify the recipient's name matches your friend's name on
              your UPI app before entering your PIN.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              className="clay-btn-ghost font-display flex-1"
            >
              Cancel
            </Button>
            {isMobile ? (
              <button
                onClick={handleConfirmPay}
                className="clay-btn-primary flex-1 px-6 py-2.5 text-sm font-display font-bold flex items-center justify-center gap-2"
              >
              <ExternalLink size={14} />
              Open UPI App
              </button>
            ) : (
              <button
                onClick={handleCopyVpa}
                className="clay-btn-primary flex-1 px-6 py-2.5 text-sm font-display font-bold flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy UPI ID
                  </>
                )}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
