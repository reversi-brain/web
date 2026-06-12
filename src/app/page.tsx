"use client";

import { useState } from 'react';
import Board from '@/components/Board';

type ScreenState = 'title' | 'color_select' | 'playing';
type GameMode = 'pvp' | 'pvc' | 'cvc';
type PlayerColor = 1 | -1; // 1: 黒(先攻), -1: 白(後攻)

export default function Home() {
  const [screen, setScreen] = useState<ScreenState>('title');
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [playerColor, setPlayerColor] = useState<PlayerColor>(1);

  const handleModeSelect = (mode: GameMode) => {
    setGameMode(mode);
    if (mode === 'pvc') {
      setScreen('color_select');
    } else {
      // PvPとCvCはデフォルトで1（黒）を人間側としてセット
      setPlayerColor(1);
      setScreen('playing');
    }
  };

  const handleColorSelect = (color: PlayerColor) => {
    setPlayerColor(color);
    setScreen('playing');
  };

  const handleBackToTitle = () => {
    setScreen('title');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans text-gray-800">
      
      {/* タイトル画面 */}
      {screen === 'title' && (
        <div className="flex flex-col items-center w-full max-w-sm">
          <h1 className="text-5xl font-black tracking-tighter mb-2 text-gray-900">REVERSI</h1>
          <p className="text-sm font-bold tracking-widest text-gray-400 mb-12">THE ULTIMATE BRAIN</p>
          
          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={() => handleModeSelect('pvp')}
              className="w-full py-4 bg-white rounded-2xl font-bold tracking-wider shadow-sm border border-gray-200 hover:border-gray-900 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              PLAYER VS PLAYER
            </button>
            <button 
              onClick={() => handleModeSelect('pvc')}
              className="w-full py-4 bg-white rounded-2xl font-bold tracking-wider shadow-sm border border-gray-200 hover:border-gray-900 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              PLAYER VS CPU
            </button>
            <button 
              onClick={() => handleModeSelect('cvc')}
              className="w-full py-4 bg-white rounded-2xl font-bold tracking-wider shadow-sm border border-gray-200 hover:border-gray-900 hover:shadow-md transition-all flex items-center justify-center gap-3"
            >
              CPU VS CPU
            </button>
          </div>
        </div>
      )}

      {/* 色（先攻後攻）選択画面 */}
      {screen === 'color_select' && (
        <div className="flex flex-col items-center w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-2xl font-bold tracking-tight mb-2">CHOOSE YOUR COLOR</h2>
          <p className="text-xs font-bold tracking-widest text-gray-400 mb-8">VS CPU MODE</p>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <button 
              onClick={() => handleColorSelect(1)}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-2 border-gray-200 hover:border-gray-900"
            >
              <div className="w-16 h-16 rounded-full bg-gray-900 mb-4"></div>
              <span className="font-bold tracking-wider text-sm">BLACK</span>
              <span className="text-[10px] text-gray-400 mt-1">FIRST TURN</span>
            </button>
            <button 
              onClick={() => handleColorSelect(-1)}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border-2 border-gray-200 hover:border-gray-900"
            >
              <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-300 mb-4"></div>
              <span className="font-bold tracking-wider text-sm">WHITE</span>
              <span className="text-[10px] text-gray-400 mt-1">SECOND TURN</span>
            </button>
          </div>
          
          <button 
            onClick={handleBackToTitle}
            className="text-xs font-bold tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
          >
            ← BACK TO TITLE
          </button>
        </div>
      )}

      {/* ゲームプレイ画面 */}
      {screen === 'playing' && (
        <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
          <Board 
            size={8} 
            gameMode={gameMode} 
            playerColor={playerColor} 
            onBackToTitle={handleBackToTitle} 
          />
        </div>
      )}
    </div>
  );
}