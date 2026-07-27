async function request(path, { method = "GET", body } = {}) {
  let response;

  try {
    response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error("Sunucuya ulaşılamadı");
  }

  if (response.status === 401) {
    // Oturum düştüyse kullanıcıyı giriş ekranına al.
    window.location.href = "/login";
    throw new Error("Oturum süresi doldu");
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error((data && data.error) || `İstek başarısız (${response.status})`);
  }

  return data;
}

export const api = {
  createQuestion: (question) =>
    request("/api/questions", { method: "POST", body: { action: "create", question } }),

  createQuestionsBulk: (questions) =>
    request("/api/questions/bulk", { method: "POST", body: { questions } }),

  listQuestions: (params) => request("/api/questions", { method: "POST", body: params }),

  updateQuestion: (id, patch) =>
    request(`/api/questions/${id}`, { method: "PUT", body: patch }),

  deleteQuestion: (id) => request(`/api/questions/${id}`, { method: "DELETE" }),

  counts: () => request("/api/questions/count"),

  createTest: (rows) => request("/api/create-test", { method: "POST", body: { rows } }),
};
