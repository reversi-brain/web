import Board from '@/components/Board';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Reversi</h1>
      <Board size={8} />
    </div>
  );
}