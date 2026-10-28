<script setup>
import { ref, onMounted } from "vue";
import { api, login, getSession, clearSession, canEdit } from "./api";
const posts = ref([]),
  selected = ref(null),
  title = ref(""),
  content = ref(""),
  editing = ref(null);
const email = ref("alice@class.test"),
  password = ref("Classroom!2026"),
  user = ref(null),
  busy = ref(false),
  message = ref("질문 목록을 불러오는 중입니다.");
const refresh = async () => {
  posts.value = await api.list();
};

// FE-03: HTTP 상태와 JSON code에 맞는 안내 문구를 고릅니다.
function describe(e) {
  if (e.status === 401) {
    const text = {
      INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
      TOKEN_REQUIRED: "로그인이 필요합니다. 로그인한 뒤 다시 시도하세요.",
      INVALID_TOKEN:
        "인증 정보가 올바르지 않아 로그아웃되었습니다. 다시 로그인하세요.",
      TOKEN_EXPIRED:
        "로그인 시간이 만료되어 로그아웃되었습니다. 다시 로그인하세요.",
    }[e.code];
    return text ?? "인증에 실패했습니다. 다시 로그인하세요.";
  }
  if (e.status === 403)
    return "본인이 작성한 질문만 수정·삭제할 수 있습니다. (로그인은 유지됩니다)";
  if (e.status === 404)
    return "해당 질문을 찾을 수 없습니다. 이미 삭제되었을 수 있어 목록을 새로 불러왔습니다.";
  if (e.status === 400)
    return `입력을 확인하세요: ${e.message} (제목 1~100자, 내용 1~5000자, 공백만 입력 불가)`;
  return e.message || "요청을 처리하지 못했습니다. 서버 실행 상태를 확인하세요.";
}

// 모든 화면 동작은 run()을 거칩니다. 성공 안내는 action이 성공했을 때만 표시합니다.
async function run(action, success) {
  busy.value = true;
  try {
    await action();
    message.value = typeof success === "function" ? success() : success;
  } catch (e) {
    message.value = describe(e);
    if (e.status === 404) {
      // 없는 글: 상세 선택과 수정 상태를 지우고 목록을 갱신합니다.
      selected.value = null;
      reset();
      await refresh().catch(() => {});
    }
    // 400은 입력값을 그대로 두어 사용자가 고칠 수 있게 합니다.
  } finally {
    // 401이면 api.js가 session을 비웠으므로 여기서 화면의 로그인 표시도 해제됩니다.
    user.value = getSession().user;
    if (!user.value) editing.value = null;
    busy.value = false;
  }
}
onMounted(() => run(refresh, "질문 목록을 불러왔습니다."));
function reset() {
  title.value = "";
  content.value = "";
  editing.value = null;
}
function doLogin() {
  run(
    async () => {
      reset(); // 계정을 바꿀 때 이전 계정의 수정 상태가 남지 않게 합니다.
      await login(email.value, password.value);
    },
    () => `${getSession().user.name}님으로 로그인했습니다.`,
  );
}
function save() {
  if (!user.value) {
    message.value = "질문을 등록하려면 먼저 로그인하세요.";
    return;
  }
  run(async () => {
    const input = { title: title.value, content: content.value };
    selected.value = editing.value
      ? await api.update(editing.value, input)
      : await api.create(input);
    reset();
    await refresh();
  }, editing.value ? "질문을 수정했습니다." : "질문을 등록했습니다.");
}
function edit() {
  editing.value = selected.value.id;
  title.value = selected.value.title;
  content.value = selected.value.content;
}
function remove() {
  if (confirm("이 질문을 삭제할까요?"))
    run(async () => {
      await api.remove(selected.value.id); // 204: 본문 없음
      selected.value = null;
      reset();
      await refresh();
    }, "질문을 삭제했습니다.");
}
// FE-04: 로그아웃은 메모리의 토큰·사용자와 화면 상태를 즉시 지웁니다.
// 이미 복사된 토큰을 서버에서 무효화하는 기능은 아닙니다(만료 시각까지 유효).
function logout() {
  clearSession();
  user.value = null;
  reset();
  message.value = "로그아웃했습니다. 이 탭의 토큰과 사용자 정보를 지웠습니다.";
}
function me() {
  run(async () => {
    const u = await api.me();
    alert(`${u.name} (${u.email})`);
  }, "내 정보를 조회했습니다.");
}
</script>
<template>
  <main>
    <header>
      <span class="eyebrow">WEB SERVICE DESIGN · JWT BOARD</span>
      <h1>스터디 Q&amp;A</h1>
      <p class="muted">
        공부하다 막힌 부분을 질문하고 함께 해결하는 게시판입니다.
      </p>
    </header>
    <p class="banner">
      질문 목록과 내용은 누구나 볼 수 있습니다. 질문 등록은 로그인한 사용자만,
      수정·삭제는 질문을 작성한 본인만 할 수 있습니다. 로그인 상태는 이 탭의
      메모리에만 보관되어 새로고침하면 해제됩니다.
    </p>
    <div role="status" class="message">{{ message }}</div>
    <div class="grid">
      <aside>
        <section class="card">
          <h2>로그인</h2>
          <p>
            <strong v-if="user">{{ user.name }}님 로그인 중</strong>
            <span v-else>로그아웃 상태</span>
          </p>
          <form v-if="!user" @submit.prevent="doLogin">
            <label>이메일<input type="email" v-model="email" required /></label
            ><label
              >비밀번호<input type="password" v-model="password" required
            /></label>
            <div class="actions">
              <button :disabled="busy">로그인</button>
            </div>
          </form>
          <div class="actions" v-else>
            <button type="button" class="secondary" @click="logout">
              로그아웃
            </button>
          </div>
          <!-- T11: 로그아웃 상태에서도 눌러 토큰 없이 /me가 401이 되는지 확인할 수 있게 항상 표시 -->
          <div class="actions">
            <button type="button" class="secondary" :disabled="busy" @click="me">
              내 정보 조회
            </button>
          </div>
          <p>
            <small
              >테스트 계정: alice@class.test / bob@class.test<br />공통
              비밀번호: Classroom!2026</small
            >
          </p>
        </section>
        <section class="card">
          <h2>{{ editing ? "질문 수정" : "새 질문 등록" }}</h2>
          <p class="muted" v-if="!user">
            질문을 등록하려면 먼저 로그인하세요.
          </p>
          <form @submit.prevent="save">
            <label
              >제목<input
                maxlength="100"
                v-model="title"
                required
                :disabled="!user"
            /></label>
            <label
              >내용<textarea
                maxlength="5000"
                v-model="content"
                required
                :disabled="!user"
              />
            </label>
            <div class="actions">
              <button :disabled="busy || !user">
                {{ editing ? "수정 저장" : "질문 등록" }}</button
              ><button type="button" class="secondary" @click="reset">
                {{ editing ? "수정 취소" : "입력 초기화" }}
              </button>
            </div>
          </form>
        </section>
      </aside>
      <div>
        <section class="card">
          <h2>
            질문 목록 <small>{{ posts.length }}개</small>
          </h2>
          <p v-if="!posts.length">아직 질문이 없습니다. 첫 질문을 남겨 보세요.</p>
          <article class="post" v-for="p in posts" :key="p.id">
            <button
              class="post-title"
              :disabled="busy"
              @click="
                run(
                  async () => (selected = await api.detail(p.id)),
                  '질문을 불러왔습니다.',
                )
              "
            >
              {{ p.title }}
            </button>
            <p>
              <small
                >{{ p.authorName }} ·
                {{ new Date(p.createdAt).toLocaleString() }}</small
              >
            </p>
          </article>
        </section>
        <section class="card">
          <h2>질문 상세</h2>
          <template v-if="selected"
            ><h3>{{ selected.title }}</h3>
            <p class="content">{{ selected.content }}</p>
            <p>
              <small
                >작성자 {{ selected.authorName }} ·
                {{ new Date(selected.createdAt).toLocaleString() }}
                <template v-if="selected.updatedAt !== selected.createdAt">
                  (수정 {{ new Date(selected.updatedAt).toLocaleString() }})
                </template></small
              >
            </p>
            <div class="actions" v-if="user && canEdit(selected)">
              <button class="secondary" @click="edit">수정</button
              ><button class="danger" :disabled="busy" @click="remove">
                삭제
              </button>
            </div>
            <p class="muted" v-else-if="user">
              다른 사용자의 질문은 수정·삭제할 수 없습니다.
            </p>
            <p class="muted" v-else>
              로그인하면 본인이 작성한 질문을 수정·삭제할 수 있습니다.
            </p></template
          >
          <p class="muted" v-else>목록에서 질문 제목을 선택하세요.</p>
        </section>
      </div>
    </div>
  </main>
</template>
