export default function PlayerList({ players }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Players</h2>
      <ul className="space-y-2">
        {players.map((player) => (
          <li key={player.id} className="flex justify-between">
            <span>{player.name}</span>
            <span>{player.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}