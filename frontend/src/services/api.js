const BASE = '/api'

async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE}${path}${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  dashboard:     ()       => get('/dashboard'),
  vehicles:      (params) => get('/vehicles', params),
  vehicle:       (id)     => get(`/vehicles/${id}`),
  alerts:        (params) => get('/alerts', params),
  health:        ()       => get('/health'),
}
