<script setup>
import { onMounted, ref } from "vue";
import { useAuthStore } from "../../../stores/authStore";
import { getErrorMessagge } from "../../../utils/errorHandler";
import { socialService } from "../services/socialService";

const props = defineProps({
  reviewId: { type: String, required: true },
});
const emit = defineEmits(["count-updated"]);
const authStore = useAuthStore();
const comments = ref([]);
const draft = ref("");
const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");

function valueOf(value, camel, pascal) {
  return value?.[camel] ?? value?.[pascal];
}

function commentList(response) {
  const list = Array.isArray(response) ? response : response?.data ?? response?.items ?? [];
  return list.map((item) => {
    const profile = item.profile ?? item.Profile ?? {};
    const name = valueOf(profile, "name", "Name") || "Miembro de Faudix";
    return {
      id: valueOf(item, "id", "Id"),
      userId: valueOf(item, "userId", "UserId"),
      name,
      initials: name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      avatar: valueOf(profile, "avatarUrl", "AvatarUrl") || "",
      text: valueOf(item, "comment", "Comment") || "",
      updatedAt: valueOf(item, "updatedAt", "UpdatedAt"),
    };
  });
}

async function loadComments() {
  loading.value = true;
  errorMessage.value = "";
  try {
    comments.value = commentList(await socialService.getReviewComments(props.reviewId));
    emit("count-updated", comments.value.length);
  } catch (error) {
    errorMessage.value = getErrorMessagge(error);
  } finally {
    loading.value = false;
  }
}

async function submitComment() {
  const text = draft.value.trim();
  if (!text || submitting.value) return;

  submitting.value = true;
  errorMessage.value = "";
  try {
    await socialService.createReviewComment(props.reviewId, text);
    draft.value = "";
    await loadComments();
  } catch (error) {
    errorMessage.value = getErrorMessagge(error);
  } finally {
    submitting.value = false;
  }
}

onMounted(loadComments);
</script>

<template>
  <section class="review-discussion" :aria-label="`Opiniones sobre la reseña`">
    <header class="review-discussion__heading">
      <div><p class="discussion-kicker">Comunidad</p><h4>Opiniones <span>{{ comments.length }}</span></h4></div>
      <i class="fa-regular fa-comments" aria-hidden="true"></i>
    </header>

    <p v-if="loading && !comments.length" class="discussion-state" role="status">Cargando opiniones...</p>
    <p v-else-if="!comments.length && !errorMessage" class="discussion-state">Aún no hay opiniones. Abre la conversación.</p>
    <ul v-if="comments.length" class="discussion-list">
      <li v-for="comment in comments" :key="comment.id" class="discussion-comment">
        <img v-if="comment.avatar" :src="comment.avatar" :alt="`Retrato de ${comment.name}`" />
        <span v-else class="discussion-avatar" aria-hidden="true">{{ comment.initials }}</span>
        <div class="discussion-comment__body">
          <div class="discussion-comment__meta">
            <RouterLink v-if="comment.userId" :to="{ name: 'profile', params: { userId: comment.userId } }">{{ comment.name }}</RouterLink>
            <strong v-else>{{ comment.name }}</strong>
            <time v-if="comment.updatedAt" :datetime="comment.updatedAt">{{ new Date(comment.updatedAt).toLocaleDateString() }}</time>
          </div>
          <p>{{ comment.text }}</p>
        </div>
      </li>
    </ul>

    <p v-if="errorMessage" class="discussion-error" role="alert">{{ errorMessage }}</p>
    <form class="discussion-form" @submit.prevent="submitComment">
      <label class="sr-only" :for="`comment-${reviewId}`">Escribe tu opinión</label>
      <textarea :id="`comment-${reviewId}`" v-model="draft" rows="2" maxlength="1000" placeholder="Escribe una opinión respetuosa..." :disabled="submitting"></textarea>
      <button type="submit" :disabled="submitting || !draft.trim()" :aria-label="submitting ? 'Publicando opinión' : 'Publicar opinión'" title="Publicar opinión">
        <i class="fa-solid" :class="submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'" aria-hidden="true"></i>
      </button>
    </form>
  </section>
</template>

<style scoped>
.review-discussion { display: grid; gap: 12px; margin-top: 14px; padding: 14px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background); }
.review-discussion__heading { display: flex; align-items: center; justify-content: space-between; }
.review-discussion__heading > i { color: var(--color-primary); }
.discussion-kicker { color: var(--color-primary); font-size: 9px; font-weight: 750; text-transform: uppercase; }
.review-discussion h4 { margin-top: 3px; color: var(--color-text); font-family: var(--font-heading); font-size: 13px; }
.review-discussion h4 span { margin-left: 4px; color: var(--color-muted); font-weight: 500; }
.discussion-state { color: var(--color-muted); font-size: 11px; }
.discussion-list { display: grid; gap: 12px; max-height: 260px; overflow-y: auto; list-style: none; }
.discussion-comment { display: flex; align-items: flex-start; gap: 9px; min-width: 0; }
.discussion-comment > img,.discussion-avatar { width: 30px; height: 30px; flex: 0 0 30px; border-radius: 50%; object-fit: cover; }
.discussion-avatar { display: grid; place-items: center; background: var(--color-primary-container); color: var(--color-primary); font-size: 9px; font-weight: 700; }
.discussion-comment__body { min-width: 0; flex: 1; }
.discussion-comment__meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.discussion-comment__meta a,.discussion-comment__meta strong { color: var(--color-text); font-size: 10px; font-weight: 700; text-decoration: none; }
.discussion-comment__meta a:hover { color: var(--color-primary); }
.discussion-comment__meta time { color: var(--color-muted); font-size: 9px; }
.discussion-comment__body > p { margin-top: 3px; color: var(--color-muted); font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.discussion-error { color: var(--color-danger); font-size: 10px; }
.discussion-form { display: flex; align-items: flex-end; gap: 8px; }
.discussion-form textarea { width: 100%; min-height: 42px; max-height: 120px; resize: vertical; padding: 9px 10px; border: 1px solid var(--color-border); border-radius: 7px; background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 11px; }
.discussion-form textarea:focus { border-color: var(--color-primary); outline: 2px solid var(--color-focus-ring); }
.discussion-form button { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border-radius: 7px; background: var(--color-primary); color: var(--color-primary-foreground); cursor: pointer; }
.discussion-form button:disabled { background: var(--color-surface-muted); color: var(--color-muted); cursor: not-allowed; }
</style>