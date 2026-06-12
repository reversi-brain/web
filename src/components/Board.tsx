"use client";

import { useState, useEffect } from 'react';
import Cell from './Cell';

type BoardProps = {
  size?: number; 
  gameMode: 'pvp' | 'pvc' | 'cvc';
  playerColor: 1 | -1;
  onBackToTitle: () => void;
};

type GameMessage = {
  title: string;
  description: string;
} | null;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Board({ size = 8, gameMode, playerColor, onBackToTitle }: BoardProps) {
  const [cells, setCells] = useState<(1 | -1 | 0)[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | -1>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [blackCount, setBlackCount] = useState<number>(0);
  const [whiteCount, setWhiteCount] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  
  const [gameMessage, setGameMessage] = useState<GameMessage>(null);

  const isBlackAi = gameMode === 'cvc' || (gameMode === 'pvc' && playerColor === -1);
  const isWhiteAi = gameMode === 'cvc' || (gameMode === 'pvc' && playerColor === 1);

  useEffect(() => {
    const fetchInitialBoard = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/init?size=${size}`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to fetch initial board');
        
        const data = await res.json();
        setCells(data.cells);
        setCurrentPlayer(data.current_player);
        setBlackCount(data.cells.filter((c: number) => c === 1).length);
        setWhiteCount(data.cells.filter((c: number) => c === -1).length);
        setIsGameOver(false);
        setGameMessage(null);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialBoard();
  }, [size]);

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
      setGameMessage(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const processApiResponse = (data: any) => {
    setCells(data.cells);
    setCurrentPlayer(data.next_player);
    setBlackCount(data.black_count);
    setWhiteCount(data.white_count);

    if (data.is_game_over) {
      setIsGameOver(true);
      
      let winnerText = data.black_count > data.white_count ? 'BLACK WINS' : (data.white_count > data.black_count ? 'WHITE WINS' : 'DRAW');
      let titleText = 'GAME OVER';

      // 「人間 VS CPU」モードの時だけ、YOU WIN / YOU LOSE の判定を入れる
      if (gameMode === 'pvc') {
        const isBlackWin = data.black_count > data.white_count;
        const isWhiteWin = data.white_count > data.black_count;
        const isPlayerBlack = playerColor === 1;
        
        if ((isBlackWin && isPlayerBlack) || (isWhiteWin && !isPlayerBlack)) {
          titleText = 'YOU WIN !!';
        } else if ((isWhiteWin && isPlayerBlack) || (isBlackWin && !isPlayerBlack)) {
          titleText = 'YOU LOSE...';
        } else {
          titleText = 'DRAW GAME';
        }
      }

      setGameMessage({
        title: titleText,
        description: `${winnerText} (Black: ${data.black_count} / White: ${data.white_count})`
      });
    } else if (data.is_pass) {
      setGameMessage({
        title: 'PASS',
        description: `${data.next_player === 1 ? 'Black' : 'White'} has no valid moves.`
      });
      setTimeout(() => setGameMessage(null), 2000);
    }
  };

  const handleCellClick = async (index: number) => {
    if (cells[index] !== 0 || isLoading || isGameOver) return;
    if ((currentPlayer === 1 && isBlackAi) || (currentPlayer === -1 && isWhiteAi)) return;

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells, current_player: currentPlayer, size, move_index: index }),
      });

      if (!res.ok) return;
      const data = await res.json();
      processApiResponse(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleCpuMove = async () => {
      try {
        setIsLoading(true);
        
        // API通信と1秒待機を同時にスタートし、両方が終わるまで待つ（最低でも1秒はUIが止まる）
        const [res] = await Promise.all([
          fetch(`${API_BASE_URL}/api/ai-move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cells, current_player: currentPlayer, size }),
          }),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);

        if (!res.ok) return;
        const data = await res.json();
        processApiResponse(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    const shouldCpuMove = (currentPlayer === 1 && isBlackAi) || (currentPlayer === -1 && isWhiteAi);
    if (shouldCpuMove && cells.length > 0 && !isGameOver) {
      handleCpuMove();
    }
  }, [currentPlayer, isBlackAi, isWhiteAi, cells, size, isGameOver]);

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
      
      <div className="flex w-full justify-between items-center mb-6 px-2">
        <div className="flex items-center">
           <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full font-bold text-[10px] tracking-widest">
             {gameMode === 'pvp' ? 'PLAYER VS PLAYER' : gameMode === 'pvc' ? 'PLAYER VS CPU' : 'CPU VS CPU'}
           </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRestart}
            className="px-4 py-2 bg-gray-900 text-white rounded-full font-bold text-xs tracking-wider shadow-sm hover:bg-gray-800 transition-colors"
          >
            RETRY
          </button>
          <button 
            onClick={onBackToTitle}
            className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-full font-bold text-xs tracking-wider shadow-sm hover:bg-gray-50 transition-colors"
          >
            QUIT
          </button>
        </div>
      </div>

      {isLoading && gameMode !== 'cvc' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
        </div>
      )}

      {/* 枠の中に縛られない、画面全体（fixed）を覆うシネマティックなUI */}
      {gameMessage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <h3 className="text-5xl font-black tracking-widest text-white mb-4 drop-shadow-lg text-center px-4">{gameMessage.title}</h3>
          <p className="text-xl font-bold text-gray-300 tracking-widest text-center">{gameMessage.description}</p>
          {isGameOver && (
            <div className="flex flex-col items-center gap-4 mt-12">
              <button 
                onClick={handleRestart}
                className="px-8 py-3 bg-white text-gray-900 rounded-full font-black tracking-widest shadow-2xl hover:bg-gray-200 hover:scale-105 transition-all w-64"
              >
                PLAY AGAIN
              </button>
              <button 
                onClick={onBackToTitle}
                className="px-8 py-3 bg-transparent text-gray-400 border border-gray-600 rounded-full font-bold tracking-widest hover:text-white hover:border-gray-400 hover:bg-gray-800 transition-all w-64"
              >
                BACK TO TITLE
              </button>
            </div>
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
            {((currentPlayer === 1 && isBlackAi) || (currentPlayer === -1 && isWhiteAi)) && <span className="text-[10px]">🤖</span>}
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