export function getApiBaseUrl(): string {
  // Server-side preferred; fallback to public for client parity
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080"
  )
}
