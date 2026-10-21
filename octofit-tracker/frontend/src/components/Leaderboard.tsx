import { getJson } from '../api/client.js';
import { useApiData } from '../hooks/useApiData.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const result = useApiData<LeaderboardResponse>('/api/leaderboard', getJson<LeaderboardResponse>);

  return (
    <section aria-labelledby="leaderboard-heading">
      <h2 id="leaderboard-heading">Leaderboard</h2>
      <p>Compare team point totals.</p>
      {result.status === 'loading' && <p role="status">Loading leaderboard...</p>}
      {result.status === 'error' && <p role="alert">Unable to load leaderboard: {result.message}</p>}
      {result.status === 'success' && (
        result.data.leaderboard.length === 0
          ? <p>No leaderboard rankings yet.</p>
          : <ol>
              {result.data.leaderboard.map((entry) => (
                <li key={entry.teamName}>
                  {entry.teamName}: {entry.totalPoints} points (rank {entry.rank})
                </li>
              ))}
            </ol>
      )}
    </section>
  );
}
