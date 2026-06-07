type CellProps = {
  disk: 1 | -1 | 0; // 1: 黒, -1: 白, 0: 空
  onClick: () => void;
};

export default function Cell({ disk, onClick }: CellProps) {
  return (
    <div 
      onClick={onClick}
      className="w-12 h-12 bg-green-600 border border-black flex items-center justify-center cursor-pointer hover:bg-green-500 transition-colors"
    >
      {disk === 1 && <div className="w-10 h-10 bg-black rounded-full shadow-md" />}
      {disk === -1 && <div className="w-10 h-10 bg-white rounded-full shadow-md" />}
    </div>
  );
}