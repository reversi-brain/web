"use client";

import { useState } from 'react'
import Cell from './Cell';

type BoardProps = {
  /** 盤面の辺のサイズ（偶数必須）。未指定時は標準の8 */
  size?: number; 
};

// 探索用の8方向（上、右上、右、右下、下、左下、左、左上）
const DIRECTIONS = [
  [-1, 0], [-1, 1], [0, 1], [1, 1],
  [1, 0], [1, -1], [0, -1], [-1, -1]
];

export default function Board({ size = 8 }: BoardProps) {
  // --- 状態（State）の定義 ---
  // useStateを使って、盤面のデータと現在のターンを管理します。
  const [cells, setCells] = useState<(1 | -1 | 0)[]>(() => {
    // 初回のみ実行される初期盤面の生成ロジック
    const initialCells = Array(size * size).fill(0) as (1 | -1 | 0)[];
    const centerRow = size / 2;
    const centerCol = size / 2;
    initialCells[(centerRow - 1) * size + (centerCol - 1)] = -1;
    initialCells[(centerRow - 1) * size + centerCol] = 1;
    initialCells[centerRow * size + (centerCol - 1)] = 1;
    initialCells[centerRow * size + centerCol] = -1;
    return initialCells;
  });
  // 1: 黒, -1: 白。最初は黒番からスタート
  const [currentPlayer, setCurrentPlayer] = useState<1 | -1>(1);
  // --- ゲームロジック ---
  /**
   * 指定したマスに石を置いた場合、裏返せるマスのインデックス配列を返す
   */
  const getFlippableDisks = (index: number, player: 1 | -1, currentCells: (1 | -1 | 0)[]) => {
    // すでに石が置かれている場合は裏返せない
    if (currentCells[index] !== 0) return [];
    const row = Math.floor(index / size);
    const col = index % size;
    const flippable: number[] = [];
    // 8方向を順番に探索
    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      const flippedInDir: number[] = [];
      // 盤面の範囲内にいる間ループ
      while (r >= 0 && r < size && c >= 0 && c < size) {
        const targetIndex = r * size + c;
        const targetDisk = currentCells[targetIndex];
        if (targetDisk === 0) {
          // 空マスにぶつかったらこの方向は裏返せない
          break;
        }
        if (targetDisk === player) {
          // 自分の石で挟めたので、これまで見つけた相手の石を「裏返せるリスト」に追加
          flippable.push(...flippedInDir);
          break;
        }
        
        // 相手の石なら候補に追加して、さらに奥へ進む
        flippedInDir.push(targetIndex);
        r += dr;
        c += dc;
      }
    }
    return flippable;
  };
  /**
   * マスがクリックされた時の処理
   */
  const handleCellClick = (index: number) => {
    // 1. 裏返せる石を計算
    const flippableDisks = getFlippableDisks(index, currentPlayer, cells);
    // 2. 裏返せる石が1つもなければ何もせず終了
    if (flippableDisks.length === 0) return;
    
    // 3. 盤面の状態を更新
    const newCells = [...cells];
    newCells[index] = currentPlayer;
    flippableDisks.forEach(flipIndex => {
      newCells[flipIndex] = currentPlayer;
    });

    // 4. 次のターンの判定（パスとゲーム終了のロジック）
    const nextPlayer = (currentPlayer * -1) as 1 | -1;
    
    // 次のプレイヤーが打てる場所を全マス探索して確認
    const hasNextMove = newCells.some((_, i) => getFlippableDisks(i, nextPlayer, newCells).length > 0);

    if (hasNextMove) {
      // 普通にターン交代
      setCells(newCells);
      setCurrentPlayer(nextPlayer);
    } else {
      // 次のプレイヤーがパスになる場合、現在のプレイヤーがもう一度打てるか確認
      const hasCurrentMove = newCells.some((_, i) => getFlippableDisks(i, currentPlayer, newCells).length > 0);
      
      setCells(newCells);
      if (hasCurrentMove) {
        // 相手が打てないのでパス。連続で自分のターンになる
        setTimeout(() => alert(`${nextPlayer === 1 ? '黒' : '白'}は打てる場所がないため、パスになります！`), 10);
      } else {
        // どちらも打てない＝盤面が埋まったか完全にロックされたためゲーム終了
        const blackCount = newCells.filter(c => c === 1).length;
        const whiteCount = newCells.filter(c => c === -1).length;
        setTimeout(() => alert(`ゲーム終了！\n黒: ${blackCount} 枚\n白: ${whiteCount} 枚`), 10);
      }
    }
  };

    // 盤面から各色の石の数を計算
  const blackCount = cells.filter(c => c === 1).length;
  const whiteCount = cells.filter(c => c === -1).length;

  // --- 描画（UI） ---
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* スコアボード（Glassmorphismを取り入れたリッチなUI） */}
      <div className="flex items-center justify-between w-full mb-8 bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-4 border border-gray-200">
        
        {/* 黒（Black）のスコア */}
        <div className={`flex flex-col items-center px-6 py-2 rounded-xl transition-all duration-300 ${currentPlayer === 1 ? 'bg-gray-900 text-white scale-110 shadow-lg' : 'bg-transparent text-gray-400 scale-100'}`}>
          <div className="text-xs font-bold tracking-wider mb-1">BLACK</div>
          <div className="text-3xl font-black">{blackCount}</div>
        </div>
        {/* ターンインジケーター（どっちのターンか視覚的に表現） */}
        <div className="flex flex-col items-center px-4">
          <div className="text-[10px] font-bold tracking-widest text-gray-400 mb-2">CURRENT TURN</div>
          <div className="w-6 h-6 rounded-full shadow-inner border border-gray-300 transition-colors duration-500"
               style={{ backgroundColor: currentPlayer === 1 ? '#111827' : '#ffffff' }}
          />
        </div>
        {/* 白（White）のスコア */}
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