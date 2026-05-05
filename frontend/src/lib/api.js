const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

export async function analyzeText({ text, top_k = 5, use_semantic = false, signal } = {}) {
  return requestJson(`${API_BASE}/check`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, top_k, use_semantic }),
  });
}

export async function uploadFile(file, signal) {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson(`${API_BASE}/upload`, {
    method: "POST",
    signal,
    body: formData,
  });
}

export async function analyzeFiles(files, signal) {
  const formData = new FormData();

  for (const file of files || []) {
    formData.append("files", file);
  }

  return requestJson(`${API_BASE}/analyze-file`, {
    method: "POST",
    signal,
    body: formData,
  });
}

export async function compareText(payload, signal) {
  const hasFiles = Boolean(payload.file_a || payload.file_b);

  if (hasFiles) {
    const formData = new FormData();

    if (payload.text_a) formData.append("text_a", payload.text_a);
    if (payload.text_b) formData.append("text_b", payload.text_b);
    if (payload.file_a) formData.append("file_a", payload.file_a);
    if (payload.file_b) formData.append("file_b", payload.file_b);

    return requestJson(`${API_BASE}/compare-text`, {
      method: "POST",
      signal,
      body: formData,
    });
  }

  return requestJson(`${API_BASE}/compare-text`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text_a: payload.text_a, text_b: payload.text_b }),
  });
}

export async function fetchDocuments(signal) {
  return requestJson(`${API_BASE}/documents`, { signal });
}

export async function fetchReport(reportId, signal) {
  return requestJson(`${API_BASE}/report/${reportId}`, { signal });
}

export async function fetchReportExplanation(reportId, signal) {
  return requestJson(`${API_BASE}/report/${reportId}/explain`, { signal });
}

export function reportPdfUrl(reportId) {
  return `${API_BASE}/report/${reportId}/pdf`;
}

export function reportJsonUrl(reportId) {
  return `${API_BASE}/report/${reportId}/export`;
}

async function readError(response) {
  try {
    const payload = await response.json();
    return payload.detail || "Request failed";
  } catch {
    return "Request failed";
  }
}
