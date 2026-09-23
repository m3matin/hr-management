const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || 'Request failed.');
  return body;
}
export const api = {
  dashboard: () => request('/dashboard'),
  employees: (params) => request(`/employees?${new URLSearchParams(params)}`),
  employee: (id) => request(`/employees/${id}`),
  history: (id) => request(`/employees/${id}/salary-history`),
  reviseSalary: (id, payload) => request(`/employees/${id}/salary-revisions`, { method: 'POST', body: JSON.stringify(payload) })
};
