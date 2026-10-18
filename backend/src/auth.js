import { ApiError } from "./errors.js";
// jsonwebtoken은 설치되어 있습니다. 아래 함수의 본문을 구현하세요.
export function issueToken(user) {
  // TODO BE-01: 서버 환경변수 키로 HS256 JWT 발급. sub, exp, iss, aud 필수.
  throw new ApiError(501, "NOT_IMPLEMENTED", "JWT 발급을 구현하세요. BE-01");
}
export function currentUserId(req) {
  // TODO BE-02: Bearer 추출 → 서명/알고리즘/만료/클레임 검증 → 실제 사용자 확인.
  // 완성 후 아래 데모 ID 반환을 제거하세요. 토큰 없음/변조/만료는 401입니다.
  return 1;
}
export function assertOwner(userId, authorId) {
  // TODO BE-03: 다른 작성자이면 403 FORBIDDEN. 현재는 검사하지 않습니다.
}
