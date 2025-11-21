export function getApiBaseUrl(): string {
  // Server-side preferred; fallback to public for client parity
  return (
    "http://backend:8080"
  )
}
