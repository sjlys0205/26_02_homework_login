import jwt from "jsonwebtoken";
import { ApiError } from "./errors.js";
import { findPublic } from "./users.js";

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

// Authorization 헤더에서 "Bearer <토큰>"의 토큰 부분만 꺼냅니다. 형식이 다르면 null. (수업 예제 readBearer)
function readBearer(req) {
  const header = req.get("Authorization") ?? "";
  const match = /^Bearer ([^\s]+)$/.exec(header);
  return match ? match[1] : null;
}

// 라이브러리 검증 뒤 서비스가 요구하는 클레임 형식을 한 번 더 확인합니다. (수업 예제 validClaims)
// sub는 양의 정수를 표현한 문자열, exp는 정수여야 합니다.
function validClaims(p) {
  return (
    typeof p === "object" &&
    p !== null &&
    /^[1-9]\d*$/.test(p.sub ?? "") &&
    Number.isSafeInteger(Number(p.sub)) &&
    Number.isInteger(p.exp)
  );
}

// BE-02: 보호 API(/me, 글 등록·수정·삭제)가 호출합니다. 검증된 사용자 ID만 반환합니다.
// 실패하면 401 ApiError를 던지고, app.js의 오류 처리기가 WWW-Authenticate: Bearer를 붙여 응답합니다.
export function currentUserId(req) {
  const token = readBearer(req);
  if (!token) {
    throw new ApiError(401, "TOKEN_REQUIRED", "로그인이 필요합니다.");
  }
  let payload;
  try {
    // 허용 알고리즘을 HS256으로 고정하고 서명·exp·iss·aud를 라이브러리로 검증합니다.
    payload = jwt.verify(token, config.key, {
      algorithms: ["HS256"],
      issuer: config.issuer,
      audience: config.audience,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(
        401,
        "TOKEN_EXPIRED",
        "로그인 시간이 만료되었습니다. 다시 로그인하세요.",
      );
    }
    throw new ApiError(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다.");
  }
  if (!validClaims(payload)) {
    throw new ApiError(401, "INVALID_TOKEN", "토큰 정보가 올바르지 않습니다.");
  }
  const userId = Number(payload.sub);
  // 서명이 맞아도 실제 계정이 없으면 거부합니다.
  if (!findPublic(userId)) {
    throw new ApiError(401, "INVALID_TOKEN", "사용자를 확인할 수 없습니다.");
  }
  return userId;
}
// BE-03: 수정·삭제 전에 호출됩니다. userId는 currentUserId()로 검증된 값, authorId는 DB에 저장된 작성자입니다.
// 인증은 됐지만 본인 글이 아니면 403으로 거부하고, 이후의 입력 검사와 DB 변경은 실행되지 않습니다.
export function assertOwner(userId, authorId) {
  if (userId !== authorId) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "본인이 작성한 글만 수정·삭제할 수 있습니다.",
    );
  }
}
