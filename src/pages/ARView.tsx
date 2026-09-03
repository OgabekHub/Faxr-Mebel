import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, Box, Smartphone, RotateCcw, ZoomIn, AlertCircle } from 'lucide-react';
import type { ModelViewerElement } from '../types/model-viewer';

// Demo model mapping - productId bo'yicha 3D model tanlanadi
const PRODUCT_MODELS: Record<string, { glb: string; name: string; color: string }> = {
  '1': { glb: '/models/SheenChair.glb', name: 'Havorang Chesterfield Divani', color: '#7BB8D4' },
  '2': { glb: '/models/SheenChair.glb', name: 'Marmar Ovqatlanish Stoli', color: '#C5A059' },
  '3': { glb: '/models/SheenChair.glb', name: 'Qora va Oltin Spalniy', color: '#2D2D2D' },
  '4': { glb: '/models/SheenChair.glb', name: 'Och-Jigarrang Chesterfield', color: '#B8926A' },
  '5': { glb: '/models/SheenChair.glb', name: 'LED yoritgichli TV Gorka', color: '#505050' },
  '6': { glb: '/models/SheenChair.glb', name: 'Qirollik Oltin TV Gorka', color: '#C5A059' },
  '7': { glb: '/models/SheenChair.glb', name: 'Olive Green Hashamatli Oshxona', color: '#6B8F6A' },
  '8': { glb: '/models/SheenChair.glb', name: 'Oq va Eman Zamonaviy Oshxona', color: '#E8E0D0' },
  '9': { glb: '/models/SheenChair.glb', name: 'Klassik Oltin Oshxona', color: '#C5A059' },
  '10': { glb: '/models/SheenChair.glb', name: 'Yaltiroq Oq-Qora Oshxona', color: '#1A1A1A' },
};

const DEFAULT_MODEL = { glb: '/models/SheenChair.glb', name: 'Premium Mebel', color: '#C5A059' };

export const ARView: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const modelViewerRef = useRef<ModelViewerElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isARSupported, setIsARSupported] = useState<boolean | null>(null);
  const [modelScriptLoaded, setModelScriptLoaded] = useState(false);

  const product = (productId && PRODUCT_MODELS[productId]) ? PRODUCT_MODELS[productId] : DEFAULT_MODEL;

  // model-viewer script'ini dinamik yuklash
  useEffect(() => {
    if (document.querySelector('script[data-model-viewer]')) {
      setModelScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
    script.setAttribute('data-model-viewer', 'true');
    script.onload = () => setModelScriptLoaded(true);
    document.head.appendChild(script);
    return () => {};
  }, []);

  // Robustly handle model load events (custom elements often need native listeners on mobile)
  useEffect(() => {
    const mv = modelViewerRef.current;
    if (mv) {
      const handleLoad = () => setIsModelLoaded(true);
      const handleError = (event: Event) => {
        console.error('model-viewer failed to load the model:', event);
        // Fallback: remove loading state so user isn't stuck forever, even if model failed
        setIsModelLoaded(true);
      };

      mv.addEventListener('load', handleLoad);
      mv.addEventListener('error', handleError);

      return () => {
        mv.removeEventListener('load', handleLoad);
        mv.removeEventListener('error', handleError);
      };
    }
  }, [modelScriptLoaded]);

  // AR qo'llab-quvvatlashini tekshirish
  useEffect(() => {
    const checkARSupport = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isAndroid = /android/.test(ua);
      const isChrome = /chrome/.test(ua);

      if (isIOS) {
        // iOS — Quick Look orqali ishlaydi
        setIsARSupported(true);
      } else if (isAndroid && isChrome) {
        // Android Chrome — Scene Viewer orqali ishlaydi
        setIsARSupported(true);
      } else {
        setIsARSupported(false);
      }
    };
    checkARSupport();
  }, []);

  const handleARClick = () => {
    const mv = modelViewerRef.current;
    // The custom element may not be upgraded yet; guard the runtime API.
    if (mv && typeof mv.activateAR === 'function') {
      void mv.activateAR();
    }
  };

  const handleReset = () => {
    const mv = modelViewerRef.current;
    if (mv && typeof mv.resetTurntableRotation === 'function') {
      mv.cameraOrbit = 'auto auto auto';
      mv.resetTurntableRotation();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* Luxury top bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-5 pt-safe pt-4 pb-4 z-20 relative"
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Orqaga</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[8px] uppercase font-black tracking-[0.3em] text-brand-gold">
            FAXR MEBEL
          </span>
          <span className="text-[8px] uppercase font-black tracking-widest text-white/20">
            AR VIEW
          </span>
        </div>

        {/* Mebel nomi */}
        <div className="w-16" />
      </motion.header>

      {/* Product name */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-5 pb-2 z-10"
      >
        <p className="text-[9px] uppercase tracking-[0.3em] text-brand-gold font-black">
          AR Namoyish
        </p>
        <h1 className="text-lg font-bold text-white mt-0.5 leading-tight">
          {product.name}
        </h1>
      </motion.div>

      {/* 3D Model Viewer — asosiy ko'rinish */}
      <div className="flex-1 relative min-h-[55vh]">
        {/* Loading overlay */}
        {!isModelLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#050505]/60 pointer-events-none backdrop-blur-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-12 h-12 border-2 border-brand-gold/20 border-t-brand-gold rounded-full mb-4 shadow-[0_0_15px_rgba(197,160,89,0.3)]"
            />
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/60 font-black drop-shadow-md">
              3D Model yuklanmoqda...
            </p>
          </div>
        )}

        {/* model-viewer tagi */}
        {modelScriptLoaded && (
          <model-viewer
            ref={modelViewerRef}
            src={product.glb}
            alt={product.name}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            ar-placement="floor"
            camera-controls
            auto-rotate
            auto-rotate-delay={500}
            rotation-per-second="30deg"
            shadow-intensity="1.2"
            shadow-softness="0.8"
            exposure="1.1"
            loading="eager"
            style={{
              width: '100%',
              height: '100%',
              minHeight: '55vh',
              background: 'transparent',
              '--poster-color': 'transparent',
            }}
            onLoad={() => setIsModelLoaded(true)}
            interaction-prompt="none"
          />
        )}

        {/* AR not supported warning */}
        {isARSupported === false && isModelLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-300/80 leading-relaxed font-medium">
              AR rejimi faqat mobil telefonlarda (iOS/Android Chrome) ishlaydi.
              Kompyuterda 3D modelni aylantirib ko'ring.
            </p>
          </motion.div>
        )}

        {/* Quick camera controls */}
        {isModelLoaded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={handleReset}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm"
          >
            <RotateCcw className="w-4 h-4 text-white/60" />
          </motion.button>
        )}
      </div>

      {/* Bottom action panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="px-5 pb-safe pb-8 pt-4 space-y-3"
      >
        {/* Hint text */}
        <div className="flex items-center gap-3 px-1 mb-4">
          <div className="flex items-center gap-2 text-white/30">
            <ZoomIn className="w-3.5 h-3.5" />
            <span className="text-[8px] uppercase tracking-widest font-bold">Pinch — Kattalashtirish</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-2 text-white/30">
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[8px] uppercase tracking-widest font-bold">Drag — Aylantirish</span>
          </div>
        </div>

        {/* Main AR Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleARClick}
          disabled={!isModelLoaded || isARSupported === false}
          className="w-full py-4 bg-brand-gold text-black rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-brand-gold/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <Camera className="w-5 h-5" />
          O'z Xonangizda Ko'ring (AR)
        </motion.button>

        {/* iOS fallback instruction */}
        {isARSupported && (
          <div className="flex items-start gap-2 px-1">
            <Smartphone className="w-3.5 h-3.5 text-brand-gold/60 shrink-0 mt-0.5" />
            <p className="text-[8px] text-white/30 leading-relaxed">
              iOS qurilmalarida tugma bosish bilan AR avtomatik ochiladi.
              Android qurilmalarida Google Scene Viewer ishga tushadi.
            </p>
          </div>
        )}

        {/* 3D badge */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <Box className="w-3 h-3 text-white/15" />
          <span className="text-[7px] uppercase tracking-[0.35em] text-white/15 font-black">
            Powered by WebXR + Google Model Viewer
          </span>
        </div>
      </motion.div>
    </div>
  );
};
