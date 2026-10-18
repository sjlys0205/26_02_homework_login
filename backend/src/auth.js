import jwt from "jsonwebtoken";
import { ApiError } from "./errors.js";

// 서버 시작 시 .env 설정을 한 번 읽고 검사합니다. (수업 예제 jwt-basic/auth.mjs의 createAuth 참고)
// 예시 키·빈 키·형식 오류이면 예외를 던져 서버가 시작되지 않게 합니다.
function loadConfig(env) {
  const secret = env.JWT_SECRET ?? "";
  if (!/^[0-9a-f]{64}$/i.test(secret)) {
    throw new Error(
      "JWT_SECRET은 64자리 16진수여야 합니다. 예시 값이나 빈 값은 사용할 수 없습니다.",
    );
  }
  const ttl = Number(env.TOKEN_TTL || 90);
  if (!Number.isInteger(ttl) || ttl < 1) {
    throw new Error("TOKEN_TTL은 1 이상의 정수(초)여야 합니다.");
  }
  return {
    key: Buffer.from(secret, "hex"), // 64자리 16진수 → 32바이트 키
    issuer: env.JWT_ISSUER || "webservice-class",
    audience: env.JWT_AUDIENCE || "board-api",
    ttl,
  };
}
const config = loadConfig(process.env);

// BE-01: 비밀번호 검증을 통과한 사용자에게만 호출됩니다. (app.js의 /api/auth/login)
// 토큰에는 공개해도 되는 클레임만 넣고 비밀번호·해시는 넣지 않습니다.
export function issueToken(user) {
  return jwt.sign({}, config.key, {
    algorithm: "HS256",
    subject: String(user.id), // sub: 문자열 사용자 ID
    issuer: config.issuer, // iss
    audience: config.audience, // aud
    expiresIn: config.ttl, // exp = 발급 시각(iat) + ttl초
  });
}

export function currentUserId(req) {
  // TODO BE-02: Bearer 추출 → 서명/알고리즘/만료/클레임 검증 → 실제 사용자 확인.
  // 완성 후 아래 데모 ID 반환을 제거하세요. 토큰 없음/변조/만료는 401입니다.
  return 1;
}
export function assertOwner(userId, authorId) {
  // TODO BE-03: 다른 작성자이면 403 FORBIDDEN. 현재는 검사하지 않습니다.
}
