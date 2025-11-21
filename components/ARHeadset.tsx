
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FilesetResolver, FaceLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { useAppContext } from '../store/AppContext';

// Configuration for the AR experience
const AR_CONFIG = {
    hudOffset: { x: 180, y: -50 }, // Offset from face
    colorCyan: 0x00f3ff,
    colorBlue: 0x0051ff,
    colorRed: 0xff0055,
    colorGreen: 0x00ff88
};

interface ARHeadsetProps {
    videoRef: React.RefObject<HTMLVideoElement>;
}

const ARHeadset: React.FC<ARHeadsetProps> = ({ videoRef }) => {
    const { state, dispatch } = useAppContext();
    const { assistantTranscript, networkStatus, motionStatus, isListening, currentEmotion, userTranscript } = state;
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hudRef = useRef<HTMLDivElement>(null);
    
    // Three.js Refs
    const sceneRef = useRef<THREE.Scene | null>(null);
    const handReticleRef = useRef<THREE.Mesh | null>(null);
    const handRingRef = useRef<THREE.Mesh | null>(null);
    
    // Gesture State
    const gestureState = useRef({
        isPinching: false,
        lastToggleTime: 0
    });

    const [isLoading, setIsLoading] = useState(true);
    const [faceCoords, setFaceCoords] = useState({ x: 0, y: 0, detected: false });
    const [handStatus, setHandStatus] = useState<'IDLE' | 'DETECTED' | 'PINCHED'>('IDLE');

    // Helper to map 2D screen coords to 3D world coords (at z=-10)
    const screenToWorld = (x: number, y: number, width: number, height: number) => {
        // Simple orthographic-like mapping for visual effect
        const wx = (x - 0.5) * 16; // Multiplier adjusts spread
        const wy = -(y - 0.5) * 12;
        return { x: wx, y: wy };
    };

    useEffect(() => {
        let scene: THREE.Scene;
        let camera: THREE.PerspectiveCamera;
        let renderer: THREE.WebGLRenderer;
        let faceLandmarker: FaceLandmarker | null = null;
        let handLandmarker: HandLandmarker | null = null;
        let animationId: number;
        let lastVideoTime = -1;
        let lastDetectionTime = 0;
        const DETECTION_INTERVAL = 100; // Limit vision processing to ~10 FPS to save CPU

        const initAR = async () => {
            if (!canvasRef.current || !videoRef.current) return;

            // 1. THREE.JS SETUP
            try {
                scene = new THREE.Scene();
                sceneRef.current = scene;
                
                camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
                camera.position.set(0, 0, 10);

                renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setPixelRatio(window.devicePixelRatio);

                // --- Holographic Grid (Floor/Ceiling effect) ---
                const gridHelper = new THREE.GridHelper(40, 40, AR_CONFIG.colorBlue, AR_CONFIG.colorBlue);
                gridHelper.position.y = -5;
                gridHelper.rotation.x = 0.1; // Slight tilt
                // @ts-ignore - Material transparency on helper
                gridHelper.material.transparent = true;
                // @ts-ignore
                gridHelper.material.opacity = 0.15;
                scene.add(gridHelper);

                // --- Hand Reticle (The Pointer) ---
                const reticleGeo = new THREE.RingGeometry(0.15, 0.2, 32);
                const reticleMat = new THREE.MeshBasicMaterial({ color: AR_CONFIG.colorCyan, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
                const reticle = new THREE.Mesh(reticleGeo, reticleMat);
                reticle.visible = false; // Hide initially
                scene.add(reticle);
                handReticleRef.current = reticle;

                // --- Hand Ring (The Pulse) ---
                const ringGeo = new THREE.TorusGeometry(0.4, 0.02, 16, 32);
                const ringMat = new THREE.MeshBasicMaterial({ color: AR_CONFIG.colorBlue, transparent: true, opacity: 0.4 });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.visible = false;
                scene.add(ring);
                handRingRef.current = ring;

                // Lighting
                const light = new THREE.PointLight(AR_CONFIG.colorCyan, 2, 50);
                light.position.set(2, 2, 5);
                scene.add(light);
            } catch (e) {
                console.error("ThreeJS Init Failed", e);
                setIsLoading(false);
                return;
            }

            // 2. MEDIAPIPE SETUP
            try {
                // Use matching 0.10.9 version for WASM to prevent version mismatch freeze
                const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm");
                
                try {
                    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numFaces: 1
                    });
                } catch (e) {
                    console.warn("Face Landmarker GPU failed, trying CPU...", e);
                     faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                            delegate: "CPU"
                        },
                        runningMode: "VIDEO",
                        numFaces: 1
                    });
                }

                try {
                    handLandmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numHands: 1
                    });
                } catch (e) {
                     console.warn("Hand Landmarker GPU failed, trying CPU...", e);
                     handLandmarker = await HandLandmarker.createFromOptions(vision, {
                        baseOptions: {
                            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                            delegate: "CPU"
                        },
                        runningMode: "VIDEO",
                        numHands: 1
                    });
                }

                setIsLoading(false);
                renderLoop();
            } catch (error) {
                console.error("AR Vision Init Failed:", error);
                setIsLoading(false);
                renderLoop(); // Try to loop anyway for rendering
            }
        };

        const renderLoop = () => {
            const video = videoRef.current;
            if (video && video.readyState >= 2) {
                const now = performance.now();
                
                // Run Detection Loop (Throttled)
                if (faceLandmarker && handLandmarker && (now - lastDetectionTime > DETECTION_INTERVAL)) {
                    lastDetectionTime = now;
                    
                    if (video.currentTime !== lastVideoTime) {
                        lastVideoTime = video.currentTime;
                        
                        try {
                            // A. Face Tracking (HUD Position)
                            const faceResult = faceLandmarker.detectForVideo(video, now);
                            if (faceResult.faceLandmarks.length > 0) {
                                const lm = faceResult.faceLandmarks[0];
                                const anchor = lm[454]; // Right ear/cheek
                                // Mirror X calculation because we mirrored the video in CSS
                                const rawX = (1 - anchor.x) * window.innerWidth + AR_CONFIG.hudOffset.x;
                                const rawY = anchor.y * window.innerHeight + AR_CONFIG.hudOffset.y;
                                
                                // CLAMPING LOGIC: Ensure HUD stays on screen
                                const hudWidth = 320; 
                                const hudHeight = 150; 
                                const safeX = Math.max(10, Math.min(rawX, window.innerWidth - hudWidth - 10));
                                const safeY = Math.max(60, Math.min(rawY, window.innerHeight - hudHeight - 60)); 

                                setFaceCoords({ x: safeX, y: safeY, detected: true });
                            } else {
                                setFaceCoords(prev => ({ ...prev, detected: false }));
                            }

                            // B. Hand Tracking (Comms Link)
                            const handResult = handLandmarker.detectForVideo(video, now);
                            
                            if (handResult.landmarks.length > 0) {
                                const hand = handResult.landmarks[0];
                                const thumb = hand[4];
                                const index = hand[8];
                                
                                // Map Index Finger to 3D Space
                                // Mirroring X (1 - x)
                                const pos = screenToWorld(1 - index.x, index.y, window.innerWidth, window.innerHeight);
                                
                                if (handReticleRef.current && handRingRef.current) {
                                    // Update position
                                    handReticleRef.current.position.set(pos.x, pos.y, -10);
                                    handRingRef.current.position.set(pos.x, pos.y, -10);
                                    
                                    handReticleRef.current.visible = true;
                                    handRingRef.current.visible = true;
                                }

                                // Calculate Pinch Distance
                                const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
                                const isPinched = dist < 0.05;

                                if (isPinched) {
                                    setHandStatus('PINCHED');
                                    if (handReticleRef.current) handReticleRef.current.material.color.setHex(AR_CONFIG.colorRed);
                                    if (handRingRef.current) handRingRef.current.material.color.setHex(AR_CONFIG.colorRed);
                                } else {
                                    setHandStatus('DETECTED');
                                    const color = isListening ? AR_CONFIG.colorGreen : AR_CONFIG.colorCyan;
                                    if (handReticleRef.current) handReticleRef.current.material.color.setHex(color);
                                    if (handRingRef.current) handRingRef.current.material.color.setHex(AR_CONFIG.colorBlue);
                                }
                            } else {
                                setHandStatus('IDLE');
                                if (handReticleRef.current) handReticleRef.current.visible = false;
                                if (handRingRef.current) handRingRef.current.visible = false;
                            }
                        } catch (e) {
                            console.warn("Vision inference error", e);
                        }
                    }
                }
                
                // Run Animation Loop (Full Speed 60 FPS)
                if (handRingRef.current && handRingRef.current.visible) {
                    handRingRef.current.rotation.z -= 0.05;
                    handRingRef.current.rotation.x += 0.02;
                }
            }

            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
            animationId = requestAnimationFrame(renderLoop);
        };

        initAR();

        const handleResize = () => {
            if (camera && renderer) {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            // Cleanup
            try {
                if (faceLandmarker) faceLandmarker.close();
                if (handLandmarker) handLandmarker.close();
                if (renderer) {
                    renderer.dispose();
                    if (renderer.domElement && renderer.domElement.parentNode) {
                        renderer.domElement.parentNode.removeChild(renderer.domElement);
                    }
                }
            } catch (e) {
                console.warn("Cleanup error", e);
            }
        };
    }, [videoRef, isListening]); 

    return (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            
            {isLoading && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 border border-cyan-500 text-cyan-400 p-4 font-mono text-xl tracking-widest">
                    INITIALIZING AR OPTICS...
                </div>
            )}

            {/* HEAD-TRACKED DATA FEED */}
            <div 
                ref={hudRef}
                className="absolute w-80 transition-transform duration-100 ease-linear"
                style={{
                    transform: `translate(${faceCoords.x}px, ${faceCoords.y}px)`,
                    opacity: faceCoords.detected ? 1 : 0
                }}
            >
                {/* Glassmorphic Panel */}
                <div className="bg-gray-900/80 backdrop-blur-lg border border-blue-500/30 rounded-lg p-4 shadow-[0_0_30px_rgba(0,100,255,0.15)] text-cyan-100 font-mono text-xs relative overflow-hidden">
                    
                    {/* Top Bar */}
                    <div className="flex justify-between items-center mb-3 border-b border-blue-500/30 pb-2">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                            <span className="font-bold tracking-widest text-blue-300">ISSIE.LINK</span>
                        </div>
                        <span className="text-[10px] text-blue-400">{networkStatus}</span>
                    </div>

                    {/* Hand Status Indicator */}
                    <div className="absolute top-0 right-0 p-1">
                        {handStatus === 'PINCHED' && (
                            <span className="text-[10px] bg-red-900/50 text-red-400 px-1 border border-red-500/50">CMD: ACTIVE</span>
                        )}
                        {handStatus === 'DETECTED' && !isListening && (
                            <span className="text-[10px] text-gray-500">AWAITING INPUT</span>
                        )}
                    </div>

                    {/* Dynamic Content Area */}
                    <div className="space-y-3">
                        
                        {/* Current Assistant Output */}
                        <div className="min-h-[60px]">
                            <div className="text-[9px] text-blue-500 uppercase mb-1 tracking-wider">AUDIO STREAM</div>
                            <div className="text-white leading-relaxed text-sm">
                                {assistantTranscript ? (
                                    <span className="animate-in fade-in duration-300">{assistantTranscript}</span>
                                ) : (
                                    <span className="text-gray-600 italic">...monitoring...</span>
                                )}
                            </div>
                        </div>

                        {/* User Input Echo (Confidence Monitor) */}
                        {userTranscript && (
                            <div className="border-t border-blue-500/20 pt-2">
                                <div className="text-[9px] text-gray-500 uppercase mb-1">YOU</div>
                                <div className="text-gray-400 italic truncate">"{userTranscript}"</div>
                            </div>
                        )}

                        {/* Emotion Analysis */}
                        {currentEmotion && (
                            <div className="flex items-center justify-between border-t border-blue-500/20 pt-2">
                                <span className="text-[9px] text-blue-500 uppercase">TONE ANALYSIS</span>
                                <span className="text-blue-300 uppercase tracking-wider">{currentEmotion}</span>
                            </div>
                        )}
                    </div>

                    {/* Decorative Tech Elements */}
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                    <div className="absolute top-0 left-0 w-1 h-4 bg-blue-500"></div>
                    <div className="absolute top-0 right-0 w-1 h-4 bg-blue-500"></div>
                </div>
                
                {/* Connecting Line to User */}
                <svg className="absolute top-6 -left-12 w-12 h-20 pointer-events-none opacity-50">
                    <path d="M40,10 L20,10 L0,60" fill="none" stroke="#0051ff" strokeWidth="1" />
                    <circle cx="0" cy="60" r="2" fill="#00f3ff" />
                </svg>
            </div>
        </div>
    );
};

export default ARHeadset;
