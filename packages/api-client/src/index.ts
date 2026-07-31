export interface HealthResponse {
  status: "ok";
  service: string;
  version: string;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function getHealth(
  baseUrl: string,
  fetcher: typeof fetch = fetch,
): Promise<HealthResponse> {
  const response = await fetcher(`${baseUrl.replace(/\/$/, "")}/api/v1/health`);
  if (!response.ok) {
    throw new ApiError(response.status, `Health request failed (${response.status})`);
  }

  return (await response.json()) as HealthResponse;
}
