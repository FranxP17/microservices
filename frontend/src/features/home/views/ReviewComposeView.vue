<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../stores/authStore";

const router = useRouter();
const authStore = useAuthStore();
const rating = ref(4);
const format = ref("Digital");
const title = ref("");
const body = ref("");
const selectedMoods = ref(["Introspectivo"]);
const selectedSong = ref("Nebula Drift");
const spoiler = ref(false);
const shareProfile = ref(true);
const notice = ref("");
const moods = ["Nocturno", "Introspectivo", "Eufórico", "Melancólico", "Chill", "Bailable", "Enérgico"];
const reviewerName = computed(() => authStore.user?.displayName || authStore.user?.name || "Tu nombre");
const reviewerInitials = computed(() => reviewerName.value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase());

function toggleMood(mood) {
  selectedMoods.value = selectedMoods.value.includes(mood)
    ? selectedMoods.value.filter((item) => item !== mood)
    : [...selectedMoods.value, mood];
}

function submitReview() {
  if (!title.value.trim() || !body.value.trim()) {
    notice.value = "Añade un título y escribe tu crítica antes de publicar.";
    return;
  }
  notice.value = "Tu reseña está lista. La publicación musical se conectará cuando esté disponible el servicio de reseñas.";
}

function saveDraft() {
  const draft = { rating: rating.value, format: format.value, title: title.value, body: body.value, selectedMoods: selectedMoods.value, selectedSong: selectedSong.value };
  localStorage.setItem("faudix-review-draft", JSON.stringify(draft));
  notice.value = "Borrador guardado en este dispositivo.";
}
</script>

<template>
  <main class="compose-page">
    <div class="compose-container">
      <div class="compose-topline">
        <RouterLink :to="{ name: 'home' }" class="back-link"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver a explorar</RouterLink>
        <span class="draft-indicator"><i class="fa-solid fa-circle" aria-hidden="true"></i> Borrador guardado localmente</span>
      </div>

      <div class="compose-grid">
        <form class="review-editor" @submit.prevent="submitReview">
          <div class="album-select">
            <img src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=160&h=160&fit=crop&auto=format&q=85" alt="Portada de Solaris" />
            <div><span class="eyebrow">Álbum completo · 2024</span><h1>Solaris</h1><p>Nova Drift · 10 temas (44 min)</p></div>
            <button type="button" class="change-album">Cambiar obra</button>
          </div>

          <section class="rating-panel" aria-labelledby="rating-title">
            <div><p id="rating-title" class="field-eyebrow">Veredicto crítico</p><div class="star-picker" role="radiogroup" aria-label="Valoración">
              <button v-for="star in 5" :key="star" type="button" role="radio" :aria-checked="rating === star" :aria-label="`${star} de 5 estrellas`" :class="{ selected: star <= rating }" @click="rating = star">★</button>
            </div></div>
            <div class="rating-summary"><span>Sensación general</span><strong>{{ rating >= 4 ? "Muy bueno · Recomendado" : "Una escucha interesante" }}</strong></div>
            <span class="rating-number">{{ rating.toFixed(1) }}</span>
          </section>

          <div class="editor-row editor-row--split">
            <label class="editor-field"><span class="field-eyebrow">Fecha de escucha</span><input type="date" value="2024-10-24" /></label>
            <fieldset class="editor-field format-field"><legend class="field-eyebrow">Formato / experiencia</legend><div class="format-options"><button v-for="option in ['Digital', 'Vinilo', 'En vivo']" :key="option" type="button" :aria-pressed="format === option" :class="{ selected: format === option }" @click="format = option"><i class="fa-solid" :class="option === 'Digital' ? 'fa-headphones' : option === 'Vinilo' ? 'fa-record-vinyl' : 'fa-microphone-lines'" aria-hidden="true"></i>{{ option }}</button></div></fieldset>
          </div>

          <label class="editor-field"><span class="field-eyebrow">Título de tu reseña</span><input v-model="title" type="text" placeholder="Resume tu veredicto en una frase" maxlength="100" /></label>

          <label class="editor-field"><span class="field-eyebrow">Cuerpo de la crítica <small>{{ body.length }} caracteres</small></span><textarea v-model="body" rows="8" placeholder="¿Qué hace especial a este álbum? Habla de su sonido, sus letras y lo que te hizo sentir..."></textarea></label>

          <fieldset class="editor-field mood-field"><legend class="field-eyebrow">Atmósfera y vibra <small>(elige hasta 3)</small></legend><div class="mood-options"><button v-for="mood in moods" :key="mood" type="button" :aria-pressed="selectedMoods.includes(mood)" :class="{ selected: selectedMoods.includes(mood) }" @click="toggleMood(mood)"><i class="fa-solid fa-circle" aria-hidden="true"></i>{{ mood }}</button></div></fieldset>

          <label class="editor-field"><span class="field-eyebrow">Canción favorita del disco</span><select v-model="selectedSong"><option>Nebula Drift</option><option>Horizon Fade</option><option>Solaris</option><option>Afterglow</option></select></label>

          <div class="editor-settings">
            <label class="setting-row"><span><i class="fa-solid fa-eye-slash" aria-hidden="true"></i><span><strong>Contiene spoilers o análisis lírico profundo</strong><small>Ocultaremos el contenido hasta que se confirme.</small></span></span><input v-model="spoiler" type="checkbox" /></label>
            <label class="setting-row"><span><i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span><strong>Mostrar en mi perfil y listas públicas</strong><small>Tu crítica aparecerá en tu actividad de Faudix.</small></span></span><input v-model="shareProfile" type="checkbox" /></label>
          </div>

          <p v-if="notice" class="compose-notice" role="status">{{ notice }}</p>
          <footer class="editor-actions"><button class="button-secondary" type="button" @click="saveDraft"><i class="fa-regular fa-floppy-disk" aria-hidden="true"></i> Guardar borrador</button><button class="button-primary" type="submit">Publicar reseña <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></footer>
        </form>

        <aside class="review-preview" aria-label="Previsualización de la reseña">
          <div class="preview-heading"><span><i class="fa-regular fa-eye" aria-hidden="true"></i> Previsualización en vivo</span><span>Comunidad</span></div>
          <article class="preview-card">
            <header><span class="preview-avatar">{{ reviewerInitials }}</span><div><strong>{{ reviewerName }}</strong><small>@{{ reviewerName.toLowerCase().replaceAll(' ', '') }} · ahora</small></div><span class="preview-format">{{ format }}</span></header>
            <div class="preview-album"><img src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=120&h=120&fit=crop&auto=format&q=80" alt="" /><div><strong>Solaris</strong><small>Nova Drift · 2024</small><span class="preview-stars" :aria-label="`${rating} de 5`">{{ "★".repeat(rating) }}{{ "☆".repeat(5 - rating) }} <b>{{ rating.toFixed(1) }}/5</b></span></div></div>
            <h2>{{ title || "Tu título aparecerá aquí" }}</h2>
            <p>{{ body || "Tu crítica se irá mostrando aquí mientras escribes." }}</p>
            <div class="preview-song"><i class="fa-solid fa-music" aria-hidden="true"></i> Pista clave: {{ selectedSong }} <span>04:12</span></div>
            <div class="mood-options preview-moods"><span v-for="mood in selectedMoods" :key="mood">#{{ mood.replaceAll(' ', '') }}</span></div>
            <footer><span><i class="fa-regular fa-thumbs-up" aria-hidden="true"></i> De acuerdo</span><span><i class="fa-regular fa-comment" aria-hidden="true"></i> 0 debates</span></footer>
          </article>
          <p class="editorial-guideline"><i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> <span>Escribe con respeto. Las críticas se valoran por su argumento, no por coincidir con la mayoría.</span></p>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.compose-page { min-height: calc(100vh - 64px); background: var(--color-background); }
.compose-container { width: min(1320px, 100%); margin: 0 auto; padding: 24px clamp(16px, 3vw, 40px) 56px; }
.compose-topline { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 20px; }
.back-link { color: var(--color-muted); font-size: 12px; text-decoration: none; }
.back-link:hover { color: var(--color-primary); }
.back-link i { margin-right: 7px; }
.draft-indicator { color: var(--color-muted); font-size: 11px; }
.draft-indicator i { margin-right: 5px; color: #16a36a; font-size: 7px; }
.compose-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(300px, .8fr); align-items: start; gap: 24px; }
.review-editor,.preview-card { border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-surface); }
.review-editor { display: flex; flex-direction: column; gap: 20px; padding: 20px; }
.album-select { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 7px; background: var(--color-surface-muted); }
.album-select img { width: 54px; height: 54px; border-radius: 5px; object-fit: cover; }
.album-select div { min-width: 0; flex: 1; }
.eyebrow,.field-eyebrow { display: block; color: var(--color-primary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.album-select h1 { margin-top: 3px; font-family: var(--font-heading); font-size: 18px; }
.album-select p { margin-top: 2px; color: var(--color-muted); font-size: 11px; }
.change-album { padding: 8px 10px; border-radius: 5px; background: var(--color-surface); color: var(--color-text); font-size: 10px; font-weight: 600; cursor: pointer; }
.rating-panel { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px; border-radius: 7px; background: var(--color-surface-muted); }
.star-picker { display: flex; gap: 1px; margin-top: 4px; }
.star-picker button { padding: 0 1px; background: transparent; color: var(--color-muted); font-size: 25px; line-height: 1; cursor: pointer; }
.star-picker button.selected { color: var(--color-primary); }
.rating-summary { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.rating-summary span { color: var(--color-muted); font-size: 10px; }
.rating-summary strong { padding: 7px 10px; border-radius: 999px; background: var(--color-primary); color: var(--color-primary-foreground); font-size: 10px; }
.rating-number { font-family: var(--font-heading); font-size: 19px; font-weight: 700; }
.editor-row--split { display: grid; grid-template-columns: .8fr 1.2fr; gap: 12px; }
.editor-field { display: flex; min-width: 0; flex-direction: column; gap: 7px; border: 0; padding: 0; }
.field-eyebrow { display: flex; align-items: center; justify-content: space-between; color: var(--color-text); font-size: 10px; }
.field-eyebrow small { color: var(--color-muted); font-size: 9px; font-weight: 500; text-transform: none; }
.editor-field input,.editor-field select,.editor-field textarea { width: 100%; min-width: 0; padding: 10px 11px; border: 1px solid var(--color-border); border-radius: 6px; outline: 0; background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 12px; }
.editor-field input,.editor-field select { min-height: 40px; }
.editor-field textarea { min-height: 150px; resize: vertical; line-height: 1.6; }
.editor-field input:focus,.editor-field select:focus,.editor-field textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); }
.format-options { display: flex; gap: 5px; }
.format-options button,.mood-options button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 38px; padding: 0 9px; border: 1px solid var(--color-border); border-radius: 5px; background: var(--color-surface); color: var(--color-text); font-size: 10px; cursor: pointer; }
.format-options button.selected,.mood-options button.selected { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-primary-foreground); }
.mood-options { display: flex; flex-wrap: wrap; gap: 6px; }
.mood-options button { min-height: 30px; border-radius: 999px; }
.mood-options button i { font-size: 6px; }
.editor-settings { display: flex; flex-direction: column; gap: 9px; padding: 12px; border-radius: 7px; background: var(--color-surface-muted); }
.setting-row,.setting-row > span { display: flex; align-items: center; }
.setting-row { justify-content: space-between; gap: 12px; cursor: pointer; }
.setting-row > span { min-width: 0; align-items: flex-start; gap: 10px; }
.setting-row > span > i { margin-top: 3px; color: var(--color-primary); font-size: 12px; }
.setting-row > span > span { display: flex; flex-direction: column; gap: 3px; }
.setting-row strong { font-size: 10px; }
.setting-row small { color: var(--color-muted); font-size: 9px; line-height: 1.4; }
.setting-row input { width: 17px; height: 17px; accent-color: var(--color-primary); }
.compose-notice { padding: 10px 12px; border: 1px solid var(--color-primary-container); border-radius: 6px; background: var(--color-surface-muted); color: var(--color-text); font-size: 11px; line-height: 1.5; }
.editor-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 12px; border-top: 1px solid var(--color-border); }
.editor-actions .button-primary,.editor-actions .button-secondary { min-height: 38px; padding: 0 12px; font-size: 11px; }
.editor-actions .button-secondary { background: var(--color-surface-muted); color: var(--color-text); }
.review-preview { position: sticky; top: 84px; }
.preview-heading { display: flex; justify-content: space-between; align-items: center; margin: 0 0 10px; color: var(--color-text); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.preview-heading span:first-child i { margin-right: 6px; color: var(--color-primary); }
.preview-heading span:last-child { padding: 4px 8px; border-radius: 999px; background: var(--color-primary-container); color: var(--color-primary); font-size: 9px; }
.preview-card { padding: 16px; }
.preview-card > header { display: flex; align-items: center; gap: 9px; }
.preview-avatar { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 50%; background: var(--color-primary); color: var(--color-primary-foreground); font-size: 10px; font-weight: 700; }
.preview-card > header div { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.preview-card > header strong { font-size: 11px; }
.preview-card > header small { color: var(--color-muted); font-size: 9px; }
.preview-format { padding: 5px 7px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-primary); font-size: 9px; }
.preview-album { display: flex; align-items: center; gap: 9px; margin-top: 13px; padding: 9px; border-radius: 6px; background: var(--color-surface-muted); }
.preview-album img { width: 42px; height: 42px; border-radius: 4px; object-fit: cover; }
.preview-album div { display: flex; flex-direction: column; gap: 3px; }
.preview-album strong { font-size: 11px; }
.preview-album small { color: var(--color-muted); font-size: 9px; }
.preview-stars { color: var(--color-primary); font-size: 10px; }
.preview-stars b { margin-left: 4px; color: var(--color-text); font-size: 9px; }
.preview-card h2 { margin-top: 14px; font-family: var(--font-heading); font-size: 15px; line-height: 1.4; }
.preview-card > p { display: -webkit-box; overflow: hidden; margin-top: 6px; color: var(--color-muted); font-size: 11px; line-height: 1.6; -webkit-box-orient: vertical; -webkit-line-clamp: 5; }
.preview-song { display: flex; align-items: center; gap: 7px; margin-top: 12px; padding: 8px; border-radius: 5px; background: var(--color-primary-container); color: var(--color-primary); font-size: 9px; }
.preview-song span { margin-left: auto; }
.preview-moods { margin-top: 10px; }
.preview-moods span { padding: 5px 7px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-muted); font-size: 9px; }
.preview-card > footer { display: flex; gap: 14px; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--color-border); color: var(--color-muted); font-size: 9px; }
.preview-card > footer i { margin-right: 4px; }
.editorial-guideline { display: flex; gap: 9px; margin-top: 14px; padding: 12px; border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-muted); font-size: 10px; line-height: 1.5; }
.editorial-guideline i { color: var(--color-primary); }
@media (max-width: 840px) { .compose-grid { grid-template-columns: 1fr; } .review-preview { position: static; } }
@media (max-width: 560px) { .compose-container { padding: 16px 12px 40px; } .compose-topline { align-items: flex-start; } .draft-indicator { max-width: 130px; text-align: right; } .review-editor { gap: 16px; padding: 14px; } .album-select { flex-wrap: wrap; } .change-album { margin-left: auto; } .rating-panel { flex-wrap: wrap; } .editor-row--split { grid-template-columns: 1fr; } .format-options button { flex: 1; } .editor-actions { flex-direction: column-reverse; } .editor-actions button { width: 100%; } }
</style>
