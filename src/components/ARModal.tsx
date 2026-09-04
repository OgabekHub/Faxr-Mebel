import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Smartphone, Check, ExternalLink, RotateCcw, Info, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { ModelViewerElement } from '../types/model-viewer';
import { useModelViewer } from '../hooks/useModelViewer';
import { site } from '../config/site';

interface ARModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productId?: string;
}

type ModelState = 'loading' | 'ready' | 'error';

export const ARModal: React.FC<ARModalProps> = ({
  isOpen,
  onClose,
  productName,
  productId = '1',
}) => {
  // The script (and the 4 MB model) are only fetched once the modal is opened.
  const { status: scriptStatus, retry: retryScript } = useModelViewer(isOpen);
  const [modelState, setModelState] = useState<ModelState>('loading');
  const [modelAttempt, setModelAttempt] = useState(0);
  const [qrCopied, setQrCopied] = useState(false);
  const viewerRef = useRef<ModelViewerElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const arUrl = `${site.appUrl}/ar/${productId}`;

  // Reset model state when modal reopens
  useEffect(() => {
    if (isOpen) {
      setModelState('loading');
      setQrCopied(false);
    }
  }, [isOpen]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  // Native listeners on the custom element: React's onLoad is not fired by <model-viewer>.
  useEffect(() => {
    if (scriptStatus !== 'ready' || !isOpen) return;
    const mv = viewerRef.current;
    if (!mv) return;

    const handleLoad = () => setModelState('ready');
    const handleError = (event: Event) => {
      console.error('ARModal: model-viewer failed to load the model', event);
      setModelState('error');
    };

    mv.addEventListener('load', handleLoad);
    mv.addEventListener('error', handleError);
    return () => {
      mv.removeEventListener('load', handleLoad);
      mv.removeEventListener('error', handleError);
    };
  }, [scriptStatus, isOpen, productId, modelAttempt]);

  const handleRetry = () => {
    setModelState('loading');
    if (scriptStatus === 'error') retryScript();
    else setModelAttempt(n => n + 1); // remount <model-viewer> to refetch the GLB
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(arUrl);
    } catch {
      // Clipboard API unavailable (insecure context / old browser): show the URL so it can be copied by hand.
      window.prompt('Havola:', arUrl);
      return;
    }
    setQrCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setQrCopied(false), 2500);
  };

  const showSpinner = scriptStatus !== 'error' && modelState === 'loading';
  const showError = scriptStatus === 'error' || modelState === 'error';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-md"
        >
          {/* Main Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto overflow-x-hidden bg-background border-0 md:border border-foreground/10 rounded-none md:rounded-[3rem] shadow-2xl relative"
          >


            <div className="grid grid-cols-1 md:grid-cols-12 min-h-screen md:min-h-[500px]">

              {/* Left Side: 3D Model Viewer */}
              <div className="md:col-span-7 bg-[#0A0A0A] relative flex flex-col overflow-hidden min-h-[360px] md:min-h-[500px]">

                {/* Loading overlay */}
                {showSpinner && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0A0A0A]/60 pointer-events-none backdrop-blur-sm">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      className="w-10 h-10 border-2 border-brand-gold/20 border-t-brand-gold rounded-full mb-4 shadow-[0_0_15px_rgba(197,160,89,0.3)]"
                    />
                    <p className="text-[8px] uppercase tracking-[0.3em] text-white/60 font-black drop-shadow-md">
                      3D Model yuklanmoqda...
                    </p>
                  </div>
                )}

                {/* Error overlay */}
                {showError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0A0A0A]/80 backdrop-blur-sm text-center px-8">
                    <AlertCircle className="w-8 h-8 text-amber-400 mb-3" aria-hidden="true" />
                    <p className="text-[10px] uppercase tracking-widest text-white/70 font-black mb-4">
                      3D modelni yuklab bo'lmadi
                    </p>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="px-5 py-2.5 bg-brand-gold text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-gold-muted"
                    >
                      Qayta urinish
                    </button>
                  </div>
                )}

                {/* model-viewer */}
                {scriptStatus === 'ready' && (
                  <model-viewer
                    key={modelAttempt}
                    ref={viewerRef}
                    id={`mv-${productId}`}
                    src="/models/SheenChair.glb"
                    alt={productName}
                    camera-controls
                    auto-rotate
                    auto-rotate-delay={1000}
                    rotation-per-second="20deg"
                    shadow-intensity="1"
                    shadow-softness="0.7"
                    exposure="1.05"
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '360px',
                      background: 'transparent',
                      '--poster-color': 'transparent',
                    }}
                    interaction-prompt="none"
                  />
                )}

                {/* Top overlay badges */}
                <div className="absolute top-5 left-5 z-10 flex items-center gap-2 pointer-events-none">
                  <div className="px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur flex items-center gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                    <span className="text-[8px] uppercase tracking-[0.25em] font-black">3D LIVE VIEW</span>
                  </div>
                </div>

                {/* Bottom: 3D control hint */}
                {modelState === 'ready' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-4 left-4 right-4 pointer-events-none"
                  >
                    <div className="flex items-center justify-center gap-3 text-white/25">
                      <span className="text-[7px] uppercase tracking-widest font-bold">↕ Kattalashtirish</span>
                      <span className="w-px h-2.5 bg-white/10" />
                      <RotateCcw className="w-2.5 h-2.5" aria-hidden="true" />
                      <span className="text-[7px] uppercase tracking-widest font-bold">Aylantirish</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Side: QR Code + Info */}
              <div className="md:col-span-5 p-7 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-brand-gold uppercase tracking-[0.3em] text-[9px] font-black block">
                        Kengaytirilgan Borliq
                      </span>
                      <h3 className="text-xl font-bold mt-2 leading-tight">
                        Mebelni O'z Xonangizda Ko'ring
                      </h3>
                    </div>
                    {/* Close Button */}
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Yopish"
                      className="shrink-0 w-9 h-9 rounded-full bg-foreground/8 hover:bg-foreground/15 flex items-center justify-center border border-foreground/10 text-foreground mt-1"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-[10px] text-foreground/45 leading-relaxed font-light mt-2">
                    Telefoningiz kamerasini quyidagi QR-kodga qarating va mebelni haqiqiy xonangizga 3D formatida joylashtiring.
                  </p>
                </div>

                {/* QR Code Section */}
                <div className="bg-foreground/5 border border-foreground/5 rounded-[1.75rem] p-5 my-4 flex flex-col items-center gap-4 text-center">

                  {/* QR Code */}
                  <div className="relative group">
                    <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden">
                      <QRCodeSVG
                        value={arUrl}
                        size={136}
                        level="M"
                        marginSize={0}
                        fgColor="#050505"
                        bgColor="#FFFFFF"
                      />
                    </div>
                    {/* Gold corner accents */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-brand-gold rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-brand-gold rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-brand-gold rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-brand-gold rounded-br-lg" />
                  </div>

                  {/* Scan label */}
                  <div>
                    <div className="flex items-center justify-center gap-1.5 text-brand-gold">
                      <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-[9px] uppercase font-black tracking-widest">
                        Kamerani Yaqinlashtiring
                      </span>
                    </div>
                    <p className="text-[8px] text-foreground/35 mt-1 font-medium italic">
                      iOS & Android qurilmalarida ishlaydi
                    </p>
                  </div>

                  {/* Info note */}
                  <div className="flex items-start gap-2 bg-brand-gold/5 border border-brand-gold/15 rounded-xl p-2.5 text-left">
                    <Info className="w-3 h-3 text-brand-gold shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-[8px] text-foreground/50 leading-relaxed">
                      QR kodni skaner qilgach, "O'z xonangizda ko'ring" tugmasini bosing
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2.5">
                  {/* Copy link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-3 flex items-center justify-center gap-2 bg-foreground/5 border border-foreground/10 hover:border-brand-gold/40 rounded-2xl text-[9px] font-black uppercase tracking-widest text-foreground/60 hover:text-brand-gold"
                  >
                    {qrCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span className="text-emerald-400">Havola nusxalandi!</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        Havolani nusxalash
                      </>
                    )}
                  </button>

                  {/* Close / OK */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-3.5 bg-brand-gold text-black rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-gold-muted shadow-xl shadow-brand-gold/15"
                  >
                    Tushunarli / Yopish
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
