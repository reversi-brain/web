"use client";

import { useState, useEffect } from 'react'
import Cell from './Cell';

type BoardProps = {
  /** 盤面の辺のサイズ（偶数必須）。未指定時は標準の8 */
  size?: number; 
};

// 環境変数からAPIのURLを取得（未設定時はデフォルト値）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Board({ size = 8 }: BoardProps) {
  // --- 状態（State）の定義 ---
  const [cells, setCells] = useState<(1 | -1 | 0)[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | -1>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [blackCount, setBlackCount] = useState<number>(0);
  const [whiteCount, setWhiteCount] = useState<number>(0);
  // --- API通信: 初期盤面の取得 ---
  // コンポーネントがマウントされた時（画面が開いた時）に自動で実行されます
  useEffect(() => {
    const fetchInitialBoard = async () => {
      try {
        setIsLoading(true);
        // Python APIの /api/init を叩く
        const res = await fetch(`${API_BASE_URL}/api/init?size=${size}`, {
          method: 'POST',
        });
        
        if (!res.ok) throw new Error('Failed to fetch initial board');
        
        const data = await res.json();
        setCells(data.cells);
        setCurrentPlayer(data.current_player);
        setBlackCount(data.cells.filter((c: number) => c === 1).length);
        setWhiteCount(data.cells.filter((c: number) => c === -1).length);
      } catch (error) {
        console.error("Error initializing game:", error);
        alert("APIサーバーに接続できませんでした。Pythonサーバーが起動しているか確認してください。");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialBoard();
  }, [size]);
  // --- API通信: 石を置く処理 ---
  const handleCellClick = async (index: number) => {
    // 既に石がある、または「通信中」ならクリックを無視する
    if (cells[index] !== 0 || isLoading) return;
    try {
      setIsLoading(true);
      // Python APIの /api/move に現在の盤面と置きたい場所を送信する
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
      if (!res.ok) {
        // API側で「ルール違反（裏返せない場所）」と判定された場合
        return;
      }
      const data = await res.json();
      
      // バックエンド（Python）から返ってきた新しい計算結果で画面を更新する
      setCells(data.cells);
      setCurrentPlayer(data.next_player);
      setBlackCount(data.black_count);
      setWhiteCount(data.white_count);
      // パスやゲーム終了の通知
      if (data.is_game_over) {
        setTimeout(() => alert(`ゲーム終了！\n黒: ${data.black_count} 枚\n白: ${data.white_count} 枚`), 10);
      } else if (data.is_pass) {
        setTimeout(() => alert(`${data.next_player === 1 ? '黒' : '白'}は打てる場所がないため、パスになります！`), 10);
      }
    } catch (error) {
      console.error("Error making move:", error);
      alert("通信エラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };
  // --- 描画（UI） ---
  // API通信が完了するまで（初回ロード時）はローディング画面を表示
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
      
      {/* 石を置いて通信している間の半透明オーバーレイ（連打防止） */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 backdrop-blur-sm rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
          <div className="w-6 h-6 rounded-full shadow-inner border border-gray-300 transition-colors duration-500"
               style={{ backgroundColor: currentPlayer === 1 ? '#111827' : '#ffffff' }}
          />
        </div>
        <div className={`flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-300 ${currentPlayer === -1 ? 'bg-white text-gray-900 scale-110 shadow-lg border border-gray-200' : 'bg-transparent text-gray-400 scale-100'}`}>
          <div className="text-xs font-bold tracking-wider mb-1">WHITE</div>
          <div className="text-3xl font-black">{whiteCount}</div>
        </div>
      </div>
      
      {/* 盤面 */}
      <div 
        className="grid gap-0 border-4 border-gray-800 bg-gray-800 w-max mx-auto p-1 shadow-2xl rounded-md"
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