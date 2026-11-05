export async function postJson(url, body, method = "POST") {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, ...payload };
  } catch {
    return { ok: false, status: 0, error: "The server could not be reached. Please try again." };
  }
}
