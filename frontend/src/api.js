// 토큰과 로그인 사용자는 이 모듈의 변수(브라우저 메모리)에만 보관합니다.
// localStorage·sessionStorage에 저장하지 않으므로 새로고침하면 로그인 상태가 해제됩니다.
let session = { accessToken: "", user: null };
export const getSession = () => session;
export function clearSession() {
  session = { accessToken: "", user: null };
}

// FE-02: 토큰이 있을 때만 Authorization: Bearer <JWT> 헤더를 만듭니다.
// 토큰이 없으면 헤더를 아예 보내지 않아 "Bearer undefined" 같은 값이 생기지 않습니다. (수업 예제 getMyInfo 참고)
function authorizationHeaders() {
  return session.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};
}

export async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authorizationHeaders(),
      ...options.headers,
    },
  });
  // 204는 본문이 없으므로 JSON으로 읽지 않습니다. 본문이 JSON이 아닐 때도 오류 객체를 만들 수 있게 합니다.
  const text = response.status === 204 ? "" : await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    // FE-03: 401은 토큰이 없거나 무효·만료라는 뜻이므로 메모리의 로그인 상태를 해제합니다.
    // 403은 인증은 유효하고 권한만 없는 경우이므로 로그인 상태를 유지합니다.
    if (response.status === 401) clearSession();
    const error = new Error(
      data?.message || data?.code || `HTTP ${response.status}`,
    );
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}

// FE-01: 로그인 성공 시 응답의 토큰과 사용자를 메모리에 저장하고 user를 반환합니다.
// 실패하면 request()가 오류를 던지므로 session은 비어 있는 상태로 남습니다. (수업 예제 login 참고)
export async function login(email, password) {
  clearSession(); // 다른 계정으로 다시 로그인할 때 이전 토큰이 남지 않게 합니다.
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  session = { accessToken: data.accessToken, user: data.user };
  return data.user;
}

// FE-04: 로그인한 사용자가 글 작성자일 때만 수정·삭제 버튼을 보여 줍니다.
// 화면 편의를 위한 검사이며, 실제 권한 검사는 서버(assertOwner)가 합니다.
export function canEdit(post) {
  return Boolean(session.user && post && post.authorId === session.user.id);
}

export const api = {
  list: () => request("/posts"),
  detail: (id) => request(`/posts/${id}`),
  create: (input) =>
    request("/posts", { method: "POST", body: JSON.stringify(input) }),
  update: (id, input) =>
    request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  me: () => request("/me"),
};
