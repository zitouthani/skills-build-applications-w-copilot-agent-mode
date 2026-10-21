import { getJson } from '../api/client.js';
import { useApiData } from '../hooks/useApiData.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const result = useApiData<ActivityResponse>('/api/activities', getJson<ActivityResponse>);

  return (
    <section aria-labelledby="activities-heading">
      <h2 id="activities-heading">Activities</h2>
      <p>Track student activity minutes and points.</p>
      {result.status === 'loading' && <p role="status">Loading activities...</p>}
      {result.status === 'error' && <p role="alert">Unable to load activities: {result.message}</p>}
      {result.status === 'success' && (
        result.data.activities.length === 0
          ? <p>No activities yet.</p>
          : <ul>
              {result.data.activities.map((activity, index) => (
                <li key={`${activity.type}-${index}`}>
                  {activity.type}: {activity.minutes} minutes, {activity.points} points
                </li>
              ))}
            </ul>
      )}
    </section>
  );
}
