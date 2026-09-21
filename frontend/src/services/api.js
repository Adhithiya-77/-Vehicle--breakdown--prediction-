const BASE = '/api'

async function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
  ).toString()
  const res = await fetch(`${BASE}${path}${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  dashboard:   ()       => get('/dashboard'),
  vehicles:    (params) => get('/vehicles', params),
  vehicle:     (id)     => get(`/vehicles/${id}`),
  alerts:      (params) => get('/alerts', params),
  maintenance: ()       => get('/maintenance'),
  analytics:   ()       => get('/analytics'),
  predict:     (body)   => post('/predict', body),
  health:      ()       => get('/health'),
}
