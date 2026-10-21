import { getJson } from '../api/client.js';
import { useApiData } from '../hooks/useApiData.js';

type Workout = {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
};

type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const userEmail = 'mona@example.com';
  const result = useApiData<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`, getJson<WorkoutResponse>);

  return (
    <section aria-labelledby="workouts-heading">
      <h2 id="workouts-heading">Workout suggestions</h2>
      <p>Recommend workouts from activity patterns.</p>
      {result.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
      {result.status === 'error' && <p role="alert">Unable to load workout suggestions: {result.message}</p>}
      {result.status === 'success' && (
        result.data.suggestions.length === 0
          ? <p>No workout suggestions yet.</p>
          : <ul>
              {result.data.suggestions.map((workout) => (
                <li key={workout.title}>
                  <strong>{workout.title}</strong> - {workout.focus}, {workout.minutes} minutes, {workout.difficulty}. {workout.reason}
                </li>
              ))}
            </ul>
      )}
    </section>
  );
}
