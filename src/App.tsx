/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 80;

const PLAYLIST = [
  {
    id: 1,
    title: "ERR_0x001",
    artist: "UNKNOWN_ENTITY",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "MEM_DUMP_44",
    artist: "SYS_ADMIN",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "VOID_POINTER",
    artist: "NULL",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  }
];

// --- Types ---
type Point = { x: number, y: number };

export default function App() {
  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  const currentTrack = PLAYLIST[currentTrackIndex];

  // --- Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        setIsPaused(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
        case 'r': case 'R': resetGame(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (timestamp - lastUpdateTimeRef.current >= GAME_SPEED) {
        moveSnake();
        lastUpdateTimeRef.current = timestamp;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [moveSnake]);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  // --- Canvas Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (Harsh)
    ctx.strokeStyle = '#003333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food (Magenta Square)
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(
      food.x * cellSize + 1,
      food.y * cellSize + 1,
      cellSize - 2,
      cellSize - 2
    );

    // Draw Snake (Cyan Squares)
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#FFFFFF' : '#00FFFF'; // Head is white, body is cyan
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
      // Add a jarring inner square for the head
      if (index === 0) {
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(
          segment.x * cellSize + cellSize/4,
          segment.y * cellSize + cellSize/4,
          cellSize/2,
          cellSize/2
        );
      }
    });

  }, [snake, food]);

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.play().catch(() => setIsPlayingMusic(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlayingMusic, currentTrackIndex]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    if (dir === 'next') {
      setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    }
    setIsPlayingMusic(true);
  };

  return (
    <div className="min-h-screen bg-black text-cyan font-term flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="static-overlay" />
      <div className="screen-tear w-full max-w-6xl z-10">
        
        {/* Header */}
        <div className="mb-8 text-center border-b-4 border-magenta pb-4">
          <h1 className="text-4xl md:text-6xl font-pixel text-cyan glitch-text-harsh" data-text="SYS.CORRUPT // SNAKE">
            SYS.CORRUPT // SNAKE
          </h1>
          <p className="text-xl text-magenta mt-4 tracking-[0.5em]">MEMORY LEAK DETECTED. PROCEED WITH CAUTION.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
          
          {/* Left Panel: Stats */}
          <div className="flex-1 w-full lg:w-auto space-y-6">
            <div className="bg-black border-blocky p-6">
              <h2 className="text-2xl font-pixel text-magenta mb-6 border-b-2 border-cyan pb-2">DATA_FRAGMENTS</h2>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="text-xl text-cyan">VOLATILE_MEM (SCORE)</span>
                  <div className="flex justify-end">
                    <span className="text-5xl font-pixel text-magenta glitch-text-harsh" data-text={score}>{score}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xl text-cyan">MAX_CORRUPTION (HIGH)</span>
                  <div className="flex justify-end">
                    <span className="text-5xl font-pixel text-cyan glitch-text-harsh" data-text={highScore}>{highScore}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-black border-blocky-magenta p-6">
              <h2 className="text-2xl font-pixel text-cyan mb-4">INPUT_VECTORS</h2>
              <div className="grid grid-cols-1 gap-2 text-xl text-magenta">
                <div>[ARROWS] : OVERRIDE_COORD</div>
                <div>[SPACE]  : HALT_THREAD</div>
                <div>[R]      : FORCE_REBOOT</div>
              </div>
            </div>
          </div>

          {/* Center: Game Window */}
          <div className="relative group flex-none">
            <div className="bg-black p-2 border-blocky">
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={400} 
                className="w-full aspect-square max-w-[400px] cursor-crosshair bg-black"
              />
              
              {(isGameOver || isPaused) && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center border-4 border-magenta m-2">
                  {isGameOver ? (
                    <>
                      <h2 className="text-3xl font-pixel text-magenta mb-4 glitch-text-harsh" data-text="FATAL_EXCEPTION">FATAL_EXCEPTION</h2>
                      <p className="text-cyan mb-8 text-xl">SEGMENTATION FAULT (CORE DUMPED)</p>
                      <button 
                        onClick={resetGame}
                        className="bg-magenta text-black px-6 py-3 font-pixel text-sm hover:bg-cyan hover:text-black transition-none border-2 border-cyan cursor-pointer"
                      >
                        [ INITIATE_RECOVERY ]
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-pixel text-cyan mb-4 glitch-text-harsh" data-text="THREAD_SUSPENDED">THREAD_SUSPENDED</h2>
                      <p className="text-magenta mb-8 text-xl">AWAITING USER INTERRUPT...</p>
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="bg-cyan text-black px-6 py-3 font-pixel text-sm hover:bg-magenta hover:text-black transition-none border-2 border-magenta cursor-pointer"
                      >
                        [ RESUME_EXECUTION ]
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Music Player */}
          <div className="flex-1 w-full lg:w-auto">
            <div className="bg-black border-blocky p-6 flex flex-col h-full min-h-[400px]">
              <h2 className="text-2xl font-pixel text-magenta mb-6 border-b-2 border-cyan pb-2">AUDIO_STREAM_INTERCEPT</h2>

              <div className="flex-1 flex flex-col items-center justify-center text-center border-2 border-dashed border-magenta p-4 mb-6">
                <div className="text-6xl mb-4 text-cyan animate-pulse">
                  {isPlayingMusic ? '>>||<<' : '[ IDLE ]'}
                </div>
                <h3 className="text-2xl font-pixel text-cyan mb-2 glitch-text-harsh" data-text={currentTrack.title}>{currentTrack.title}</h3>
                <p className="text-xl text-magenta">SRC: {currentTrack.artist}</p>
              </div>

              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="h-4 w-full border-2 border-cyan bg-black relative">
                    <div 
                      className="h-full bg-magenta"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-lg text-cyan">
                    <span>{Math.floor(progress)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 font-pixel">
                  <button 
                    onClick={() => skipTrack('prev')}
                    className="text-cyan hover:text-magenta hover:bg-cyan p-2 border-2 border-cyan cursor-pointer"
                  >
                    [PREV]
                  </button>
                  <button 
                    onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                    className="text-black bg-magenta hover:bg-cyan p-4 border-2 border-cyan text-xl cursor-pointer"
                  >
                    {isPlayingMusic ? '[HALT]' : '[EXEC]'}
                  </button>
                  <button 
                    onClick={() => skipTrack('next')}
                    className="text-cyan hover:text-magenta hover:bg-cyan p-2 border-2 border-cyan cursor-pointer"
                  >
                    [NEXT]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xl text-magenta text-center border-t-4 border-cyan pt-4">
          TERMINAL_ID: 0x8F9A // CONNECTION_UNSTABLE
        </div>
      </div>
      
      {/* Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => skipTrack('next')}
      />
    </div>
  );
}
