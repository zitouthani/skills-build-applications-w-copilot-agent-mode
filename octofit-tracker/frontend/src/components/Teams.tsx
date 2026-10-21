import { getJson } from '../api/client.js';
import { useApiData } from '../hooks/useApiData.js';

type Team = {
  name: string;
  mascot: string;
  members: string[];
};

type TeamResponse = { teams: Team[] };

export default function Teams() {
  const result = useApiData<TeamResponse>('/api/teams', getJson<TeamResponse>);

  return (
    <section aria-labelledby="teams-heading">
      <h2 id="teams-heading">Teams</h2>
      <p>Manage teams and members.</p>
      {result.status === 'loading' && <p role="status">Loading teams...</p>}
      {result.status === 'error' && <p role="alert">Unable to load teams: {result.message}</p>}
      {result.status === 'success' && (
        result.data.teams.length === 0
          ? <p>No teams yet.</p>
          : <ul>
              {result.data.teams.map((team) => (
                <li key={team.name}>
                  {team.name} ({team.mascot}) - {team.members.length} members
                </li>
              ))}
            </ul>
      )}
    </section>
  );
}
