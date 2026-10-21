import { useEffect, useState } from 'react';

export type ApiDataState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export function useApiData<T>(path: string, load: (path: string) => Promise<T>): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load(path).then(
      (data) => {
        if (active) setState({ status: 'success', data });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unable to load data',
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [load, path]);

  return state;
}
