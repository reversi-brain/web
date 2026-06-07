"use client";

import Cell from './Cell';

type BoardProps = {
  /** 盤面の辺のサイズ（偶数必須）。未指定時は標準の8 */
  size?: number; 
};

export default function Board({ size = 8 }: BoardProps) {
  const totalCells = size * size;
  const cells = Array(totalCells).fill(0);
  
  // 中央の4マスに初期状態の石（黒・白）を配置する
  const centerRow = size / 2;
  const centerCol = size / 2;
  
  cells[(centerRow - 1) * size + (centerCol - 1)] = -1;
  cells[(centerRow - 1) * size + centerCol] = 1;
  cells[centerRow * size + (centerCol - 1)] = 1;
  cells[centerRow * size + centerCol] = -1;

  return (
    // Tailwindの動的クラス生成制限を回避するため、gridTemplateColumnsのみインラインスタイルで指定
    <div 
      className="grid gap-0 border-2 border-black bg-black w-max mx-auto p-1 shadow-2xl"
      style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
    >
      {cells.map((disk, index) => (
        <Cell 
          key={index} 
          disk={disk} 
          onClick={() => console.log(`Cell ${index} clicked`)} 
        />
      ))}
    </div>
  );
}