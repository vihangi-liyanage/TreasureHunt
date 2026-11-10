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

export async function postJsonWithRetry(url, body, { attempts = 3, delays = [250, 750] } = {}) {
  let response;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    response = await postJson(url, body);
    const transient = response.status === 0 || response.status === 429 || response.status >= 500;
    if (response.ok || !transient || attempt === attempts - 1) return response;
    await new Promise((resolve) => setTimeout(resolve, delays[Math.min(attempt, delays.length - 1)] ?? 750));
  }
  return response;
}
