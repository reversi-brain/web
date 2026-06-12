"use client";

import { useState, useEffect } from 'react';
import Cell from './Cell';

type BoardProps = {
  /** 盤面の辺のサイズ（偶数必須）。未指定時は標準の8 */
  size?: number; 
};

// 環境変数からAPIのURLを取得（未設定時はデフォルト値）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Board({ size = 8 }: BoardProps) {
  const [cells, setCells] = useState<(1 | -1 | 0)[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | -1>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [blackCount, setBlackCount] = useState<number>(0);
  const [whiteCount, setWhiteCount] = useState<number>(0);

  // 【新機能】CPU対戦モードのフラグと、ゲーム終了フラグを追加
  const [isCpuMode, setIsCpuMode] = useState<boolean>(true);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // オリジナルの初期化ロジック
  useEffect(() => {
    const fetchInitialBoard = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/init?size=${size}`, {
          method: 'POST',
        });
        
        if (!res.ok) throw new Error('Failed to fetch initial board');
        
        const data = await res.json();
        setCells(data.cells);
        setCurrentPlayer(data.current_player); // 初期化時は current_player
        setBlackCount(data.cells.filter((c: number) => c === 1).length);
        setWhiteCount(data.cells.filter((c: number) => c === -1).length);
        setIsGameOver(false);
      } catch (error) {
        console.error("Error initializing game:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialBoard();
  }, [size]);

  // 【新機能】リスタート処理（初期化と同じ）
  const handleRestart = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/init?size=${size}`, { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      setCells(data.cells);
      setCurrentPlayer(data.current_player);
      setBlackCount(data.cells.filter((c: number) => c === 1).length);
      setWhiteCount(data.cells.filter((c: number) => c === -1).length);
      setIsGameOver(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // オリジナルの人間が石を置くロジック
  const handleCellClick = async (index: number) => {
    if (cells[index] !== 0 || isLoading || isGameOver) return;
    
    // 【新機能】CPUモード時、CPUのターンなら人間のクリックを禁止する
    if (isCpuMode && currentPlayer === -1) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cells,
          current_player: currentPlayer,
          size,
          move_index: index,
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      
      setCells(data.cells);
      setCurrentPlayer(data.next_player); // 手を打った後は next_player
      setBlackCount(data.black_count);
      setWhiteCount(data.white_count);

      if (data.is_game_over) {
        setIsGameOver(true);
        setTimeout(() => alert(`ゲーム終了！\n黒: ${data.black_count} 枚\n白: ${data.white_count} 枚`), 10);
      } else if (data.is_pass) {
        setTimeout(() => alert(`${data.next_player === 1 ? '黒' : '白'}は打てる場所がないため、パスになります！`), 10);
      }

    } catch (error) {
      console.error("Error making move:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 【新機能】CPUの手番になったら自動的にAPIを叩くロジックを追加
  useEffect(() => {
    const handleCpuMove = async () => {
      try {
        setIsLoading(true);
        // 少し考えるフリをして人間らしさを演出
        await new Promise(resolve => setTimeout(resolve, 1000));

        const res = await fetch(`${API_BASE_URL}/api/ai-move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cells,
            current_player: currentPlayer,
            size,
          }),
        });

        if (!res.ok) return;

        const data = await res.json();
        
        setCells(data.cells);
        setCurrentPlayer(data.next_player);
        setBlackCount(data.black_count);
        setWhiteCount(data.white_count);

        if (data.is_game_over) {
          setIsGameOver(true);
          setTimeout(() => alert(`ゲーム終了！\n黒: ${data.black_count} 枚\n白: ${data.white_count} 枚`), 10);
        } else if (data.is_pass) {
          setTimeout(() => alert(`${data.next_player === 1 ? '黒' : '白'}は打てる場所がないため、パスになります！`), 10);
        }

      } catch (error) {
        console.error("Error fetching AI move:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isCpuMode && currentPlayer === -1 && cells.length > 0 && !isGameOver) {
      handleCpuMove();
    }
  }, [currentPlayer, isCpuMode, cells, size, isGameOver]);

  if (cells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-600 font-bold tracking-widest animate-pulse">CONNECTING TO BRAIN...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto relative">
      
      {/* 【新UI】 モード選択とリスタートボタン */}
      <div className="flex w-full justify-between items-center mb-6 px-2">
        <button 
          onClick={() => setIsCpuMode(!isCpuMode)}
          className={`px-4 py-2 rounded-full font-bold text-xs tracking-wider transition-all shadow-md ${isCpuMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          {isCpuMode ? '🤖 VS CPU MODE' : '👤 VS HUMAN MODE'}
        </button>
        <button 
          onClick={handleRestart}
          className="px-4 py-2 bg-gray-900 text-white rounded-full font-bold text-xs tracking-wider shadow-md hover:bg-gray-800 transition-colors"
        >
          RESTART
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          {isCpuMode && currentPlayer === -1 && (
             <div className="font-bold text-gray-800 tracking-widest bg-white/90 px-4 py-1 rounded-full text-xs shadow-sm">AI IS THINKING...</div>
          )}
        </div>
      )}

      {/* スコアボード */}
      <div className="flex items-center justify-between w-full mb-8 bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-4 border border-gray-200">
        <div className={`flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-300 ${currentPlayer === 1 ? 'bg-gray-900 text-white scale-110 shadow-lg' : 'bg-transparent text-gray-400 scale-100'}`}>
          <div className="text-xs font-bold tracking-wider mb-1">BLACK</div>
          <div className="text-3xl font-black">{blackCount}</div>
        </div>

        <div className="flex flex-col items-center px-4">
          <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-2">CURRENT TURN</div>
          <div className="w-6 h-6 rounded-full shadow-inner border border-gray-300 transition-colors duration-500 flex items-center justify-center"
               style={{ backgroundColor: currentPlayer === 1 ? '#111827' : '#ffffff' }}
          >
            {isCpuMode && currentPlayer === -1 && <span className="text-[10px]">🤖</span>}
          </div>
        </div>

        <div className={`flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-300 ${currentPlayer === -1 ? 'bg-white text-gray-900 scale-110 shadow-lg border border-gray-200' : 'bg-transparent text-gray-400 scale-100'}`}>
          <div className="text-xs font-bold tracking-wider mb-1">WHITE</div>
          <div className="text-3xl font-black">{whiteCount}</div>
        </div>
      </div>
      
      {/* 盤面 */}
      <div 
        className="grid gap-0 border-4 border-gray-800 bg-gray-800 w-max mx-auto p-1 shadow-2xl rounded-md relative"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {cells.map((disk, index) => (
          <Cell 
            key={index} 
            disk={disk} 
            onClick={() => handleCellClick(index)} 
          />
        ))}
      </div>
    </div>
  );
}