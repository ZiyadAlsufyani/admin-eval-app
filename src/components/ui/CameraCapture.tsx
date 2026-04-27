import { useEffect, useRef, useState } from 'react';
import { Icon } from './icon';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Prefer rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera access denied or unavailable", err);
        setHasPermission(false);
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Use the actual video dimensions to avoid stretching
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a standard File object that mimics an input selection
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.9); // High quality 0.9 for crisp text readability
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <Icon name="CameraOff" size={48} className="text-red-500 mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">تعذر الوصول للكاميرا</h2>
        <p className="text-gray-400 mb-8">
          يرجى التحقق من إعدادات المتصفح والسماح للتطبيق بالوصول إلى الكاميرا.
        </p>
        <button 
          onClick={onCancel} 
          className="bg-white text-black px-8 py-3 rounded-xl font-bold w-full max-w-xs"
        >
          رجوع
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" dir="ltr">
      {/* Video Preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline // CRITICAL for iOS to prevent fullscreen takeover
        className="flex-1 object-cover w-full h-full"
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-between items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <button 
          onClick={onCancel} 
          className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-transform active:scale-95"
        >
          <Icon name="X" size={28} />
        </button>
        
        {/* Shutter Button */}
        <button 
          onClick={handleCapture} 
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-90"
        >
          <div className="w-16 h-16 rounded-full bg-white"></div>
        </button>
        
        {/* Spacer to keep the shutter centered */}
        <div className="w-14 h-14"></div>
      </div>
    </div>
  );
}
