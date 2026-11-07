<script setup>
import { ref } from "vue";
import BaseButton from "../../../components/common/BaseButton.vue";
import BaseInput from "../../../components/common/BaseInput.vue";
import BaseModal from "../../../components/common/BaseModal.vue";
import { useHome } from "../composables/useHome.js";

const {
  profile,
  name,
  initials,
  details,
  editOpen,
  editLoading,
  editError,
  editForm,
  openEditProfile,
  closeEditProfile,
  saveProfile,
  deleteOpen,
  deleteLoading,
  deleteError,
  openDeleteAccount,
  closeDeleteAccount,
  confirmDeleteAccount,
} = useHome();

const activeTab = ref("reviews");
const stats = [
  { value: "184", label: "Reseñas escritas" },
  { value: "32", label: "Listas creadas" },
  { value: "1.2k", label: "Seguidores" },
  { value: "420", label: "Siguiendo" },
];
const favorites = [
  { title: "Currents", artist: "Tame Impala", year: "2015", rating: "5.0", image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=480&h=480&fit=crop&auto=format&q=85" },
  { title: "Heaven or Las Vegas", artist: "Cocteau Twins", year: "1990", rating: "5.0", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop&auto=format&q=85" },
  { title: "Disintegration", artist: "The Cure", year: "1989", rating: "5.0", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=480&h=480&fit=crop&auto=format&q=85" },
  { title: "Selected Ambient Works", artist: "Aphex Twin", year: "1992", rating: "4.8", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=480&h=480&fit=crop&auto=format&q=85" },
];
const profileReviews = [
  { title: "Romance", artist: "Fontaines D.C. · 2024", rating: "4.5", published: "hace 2 días", image: favorites[2].image, text: "Una reinvención furiosa, melancólica y cinematográfica que transforma el post-punk en una confesión íntima." },
  { title: "BRAT", artist: "Charli XCX · 2024", rating: "5.0", published: "hace 1 semana", image: favorites[1].image, text: "Clubbing existencial: la consagración del hyperpop confesional y una radiografía brutal de la inseguridad moderna." },
];
const genres = [
  { name: "Indie Rock", value: 38 },
  { name: "Dream Pop", value: 24 },
  { name: "Electronic & Synth", value: 20 },
  { name: "Ambient & Drone", value: 18 },
];
const artists = ["Beach House", "The War on Drugs", "Japanese Breakfast"];
const playlists = ["Nostalgia de Neón: 1982–1988", "Gazers en la Madrugada", "Post-Punk Latinoamericano 2020s"];

async function shareProfile() {
  try {
    if (navigator.share) {
      await navigator.share({ title: name.value, url: location.href });
    } else {
      await navigator.clipboard?.writeText(location.href);
    }
  } catch {
    // Sharing can be dismissed by the user.
  }
}
</script>

<template>
  <main class="curator-page">
    <div class="curator-container">
      <section class="curator-overview">
        <div class="curator-identity">
          <div class="curator-avatar">
            <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="`Foto de ${name}`" />
            <span v-else>{{ initials }}</span>
            <span class="curator-pro-badge"><i class="fa-solid fa-check" aria-hidden="true"></i> Pro</span>
          </div>
          <div class="curator-copy">
            <div class="curator-name-line"><h1>{{ name }}</h1><span>@{{ (profile.displayName || profile.name || "curador").toLowerCase().replaceAll(" ", "") }}</span><span class="level-badge"><i class="fa-solid fa-award" aria-hidden="true"></i> Nivel 7 Curadora</span></div>
            <p>Curadora sonora, adicta al synthwave y a los vinilos de los 80s. Escribo para comprender por qué ciertas frecuencias nos desgarran el alma.</p>
            <div class="curator-meta"><span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Ciudad de México, MX</span><span><i class="fa-regular fa-calendar" aria-hidden="true"></i> Miembro desde Feb 2021</span><span class="helpful-count"><i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> 1,840 críticas útiles</span></div>
          </div>
          <div class="curator-actions">
            <RouterLink class="directory-link" :to="{ name: 'user-directory' }">Ver comunidad</RouterLink>
            <BaseButton type="button" color="secondary" @click="openEditProfile"><i class="fa-solid fa-pen" aria-hidden="true"></i> Editar perfil</BaseButton>
            <BaseButton type="button" @click="shareProfile"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Compartir</BaseButton>
          </div>
        </div>
        <div class="curator-stats" aria-label="Estadísticas del perfil">
          <div v-for="item in stats" :key="item.label"><strong>{{ item.value }}</strong><span>{{ item.label }}</span></div>
        </div>
      </section>

      <section class="profile-section" aria-labelledby="favorites-title">
        <div class="profile-section-heading"><div><div class="profile-title"><i class="fa-regular fa-heart" aria-hidden="true"></i><h2 id="favorites-title">Los 4 álbumes favoritos de todos los tiempos</h2></div><p>Un mapa personal de mis escuchas esenciales.</p></div><span class="section-note">Panteón personal</span></div>
        <div class="favorites-grid">
          <article v-for="(album, index) in favorites" :key="album.title" class="favorite-card">
            <div class="favorite-card__art"><img :src="album.image" :alt="`Portada de ${album.title}`" /><span>#{{ index + 1 }}</span><span class="favorite-rating"><i class="fa-solid fa-star" aria-hidden="true"></i> {{ album.rating }}</span></div>
            <h3>{{ album.title }}</h3><p>{{ album.artist }}</p><div class="favorite-meta"><span>{{ album.year }}</span><span>{{ ["Indie Rock", "Dream Pop", "Post-Punk", "Ambient"][index] }}</span></div>
          </article>
        </div>
      </section>

      <div class="profile-insights">
        <section class="insight-panel"><div class="insight-heading"><h2><i class="fa-solid fa-chart-pie" aria-hidden="true"></i> Géneros principales</h2><span>Histórico</span></div><div v-for="genre in genres" :key="genre.name" class="genre-stat"><div><span>{{ genre.name }}</span><b>{{ genre.value }}%</b></div><span class="genre-stat__track"><i :style="{ width: `${genre.value}%` }"></i></span></div><div class="genre-tags"><span>Post-Punk</span><span>Shoegaze</span><span>Art Pop</span><span>Nu-Disco</span><span>Krautrock</span></div></section>
        <section class="insight-panel artist-panel"><div class="insight-heading"><h2><i class="fa-solid fa-chart-column" aria-hidden="true"></i> Artistas del mes</h2><span>Mayo 2024</span></div><ol><li v-for="(artist, index) in artists" :key="artist"><span>{{ String(index + 1).padStart(2, "0") }}</span><i class="artist-avatar" :class="`artist-avatar--${index + 1}`"></i><div><strong>{{ artist }}</strong><small>{{ 148 - index * 36 }} reproducciones</small></div><i class="fa-solid fa-arrow-trend-up trend-icon" aria-hidden="true"></i></li></ol><button type="button" class="panel-link">Ver registro completo de artistas</button></section>
        <section class="insight-panel affinity-panel"><span class="affinity-eyebrow">Afinidad contigo <b>Muy alta</b></span><div class="affinity-ring"><div><strong>91%</strong><span>Match sonoro</span></div></div><p>Comparten el amor por sintetizadores análogos, dream pop nórdico y producciones de Brian Eno.</p><button type="button">Comparar bibliotecas</button></section>
      </div>

      <nav class="profile-tabs" aria-label="Actividad del perfil">
        <button type="button" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'"><i class="fa-regular fa-message" aria-hidden="true"></i> Reseñas <span>184</span></button>
        <button type="button" :class="{ active: activeTab === 'listening' }" @click="activeTab = 'listening'"><i class="fa-solid fa-headphones" aria-hidden="true"></i> Diario de escucha</button>
        <button type="button" :class="{ active: activeTab === 'lists' }" @click="activeTab = 'lists'"><i class="fa-solid fa-list" aria-hidden="true"></i> Listas creadas <span>32</span></button>
        <button type="button" :class="{ active: activeTab === 'saved' }" @click="activeTab = 'saved'"><i class="fa-regular fa-bookmark" aria-hidden="true"></i> Canciones guardadas</button>
      </nav>

      <div class="profile-activity">
        <section class="activity-feed" aria-live="polite">
          <template v-if="activeTab === 'reviews'">
            <article v-for="review in profileReviews" :key="review.title" class="profile-review">
              <img :src="review.image" :alt="`Portada de ${review.title}`" />
              <div class="profile-review__content"><div class="profile-review__meta"><span>★★★★★ <b>{{ review.rating }}</b></span><small>Publicada {{ review.published }}</small></div><h3>{{ review.title }}</h3><p class="profile-review__artist">{{ review.artist }}</p><p>{{ review.text }}</p><div class="review-foot"><span>♬ Canción clave: Starburster</span><span>Post-Punk</span><span>Cuchillo Editorial</span></div><footer><span><i class="fa-regular fa-heart" aria-hidden="true"></i> {{ review.title === 'BRAT' ? '189' : '42' }} Me gusta</span><span><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ review.title === 'BRAT' ? '37' : '14' }} comentarios</span><button type="button" aria-label="Guardar reseña"><i class="fa-regular fa-bookmark" aria-hidden="true"></i></button></footer></div>
            </article>
          </template>
          <div v-else-if="activeTab === 'listening'" class="tab-empty"><i class="fa-solid fa-headphones" aria-hidden="true"></i><h2>Diario de escucha</h2><p>Las últimas sesiones musicales aparecerán aquí.</p></div>
          <div v-else-if="activeTab === 'lists'" class="profile-list-grid"><article v-for="(playlist, index) in playlists" :key="playlist"><span class="playlist-symbol"><i class="fa-solid" :class="['fa-moon', 'fa-cloud-moon', 'fa-guitar'][index]" aria-hidden="true"></i></span><div><strong>{{ playlist }}</strong><small>{{ [48, 35, 62][index] }} canciones · {{ [1400, 820, 3100][index] }} guardados</small></div><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></article></div>
          <div v-else class="tab-empty"><i class="fa-regular fa-bookmark" aria-hidden="true"></i><h2>Canciones guardadas</h2><p>Guarda canciones para volver a ellas más tarde.</p></div>
        </section>

        <aside class="profile-rail">
          <section class="rail-panel now-playing"><span class="rail-eyebrow"><i class="fa-solid fa-circle" aria-hidden="true"></i> Escuchando ahora</span><div><img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&h=120&fit=crop&auto=format&q=80" alt="" /><span><strong>Inside Out</strong><small>Duster — Stratosphere</small><small><i class="fa-solid fa-headphones" aria-hidden="true"></i> Vía Spotify HiFi</small></span><i class="fa-solid fa-wave-square" aria-hidden="true"></i></div></section>
          <section class="rail-panel"><div class="rail-heading"><h2>Listas destacadas</h2><button type="button">Ver todas (32)</button></div><ul class="rail-playlists"><li v-for="(playlist, index) in playlists" :key="playlist"><span class="playlist-symbol"><i class="fa-solid" :class="['fa-moon', 'fa-cloud-moon', 'fa-guitar'][index]" aria-hidden="true"></i></span><span><strong>{{ playlist }}</strong><small>{{ [48, 35, 62][index] }} canciones · {{ [1400, 820, 3100][index] }} guardados</small></span></li></ul></section>
          <section class="rail-panel account-panel"><div class="rail-heading"><h2>Datos de cuenta</h2><button type="button" @click="openEditProfile">Editar</button></div><dl><div v-for="item in details" :key="item.label"><dt>{{ item.label }}</dt><dd>{{ item.value || "—" }}</dd></div></dl><BaseButton type="button" color="danger" size="sm" @click="openDeleteAccount">Eliminar cuenta</BaseButton></section>
        </aside>
      </div>
    </div>

    <BaseModal :model-value="editOpen" labelledby="edit-profile-title" :loading="editLoading" @update:model-value="closeEditProfile">
      <form class="profile-form" @submit.prevent="saveProfile">
        <header class="profile-form-header"><div><p class="eyebrow">Perfil Faudix</p><h2 id="edit-profile-title">Actualizar mis datos</h2></div><BaseButton type="button" color="secondary" size="sm" aria-label="Cerrar" title="Cerrar" :disabled="editLoading" @click="closeEditProfile"><i class="fa-solid fa-xmark" aria-hidden="true"></i></BaseButton></header>
        <p v-if="editError" class="profile-state error" role="alert">{{ editError }}</p>
        <div class="profile-form-fields">
          <label class="profile-form-group" for="profile-name"><span>Nombre</span><BaseInput id="profile-name" v-model="editForm.name" name="name" autocomplete="name" required :disabled="editLoading" /></label>
          <label class="profile-form-group" for="profile-email"><span>Correo electrónico</span><BaseInput id="profile-email" v-model="editForm.email" name="email" type="email" autocomplete="email" required :disabled="editLoading" /></label>
          <label class="profile-form-group" for="profile-tel"><span>Teléfono</span><BaseInput id="profile-tel" v-model="editForm.tel" name="tel" type="tel" autocomplete="tel" :disabled="editLoading" /></label>
          <label class="profile-form-group" for="profile-avatar"><span>URL del avatar</span><BaseInput id="profile-avatar" v-model="editForm.avatarUrl" name="avatarUrl" type="url" :disabled="editLoading" /></label>
          <label class="profile-form-group" for="profile-password"><span>Nueva contraseña (opcional)</span><BaseInput id="profile-password" v-model="editForm.password" name="password" type="password" autocomplete="new-password" minlength="8" :disabled="editLoading" /></label>
        </div>
        <footer class="profile-form-actions"><BaseButton type="button" color="neutral" :disabled="editLoading" @click="closeEditProfile">Cancelar</BaseButton><BaseButton type="submit" :loading="editLoading">Guardar cambios</BaseButton></footer>
      </form>
    </BaseModal>

    <BaseModal :model-value="deleteOpen" labelledby="delete-account-title" :loading="deleteLoading" @update:model-value="closeDeleteAccount">
      <form class="profile-form" @submit.prevent="confirmDeleteAccount">
        <header class="profile-form-header"><h2 id="delete-account-title">Eliminar mi cuenta</h2></header>
        <p class="delete-copy">Esta acción eliminará permanentemente tu cuenta y no se puede deshacer.</p>
        <p v-if="deleteError" class="profile-state error" role="alert">{{ deleteError }}</p>
        <footer class="profile-form-actions"><BaseButton type="button" color="neutral" :disabled="deleteLoading" @click="closeDeleteAccount">Cancelar</BaseButton><BaseButton type="submit" color="danger" :loading="deleteLoading">{{ deleteLoading ? "Eliminando..." : "Eliminar definitivamente" }}</BaseButton></footer>
      </form>
    </BaseModal>
  </main>
</template>

<style scoped>
.curator-page { min-height: calc(100vh - 64px); background: var(--color-background); }
.curator-container { width: min(1320px, 100%); margin: 0 auto; padding: 24px clamp(16px, 3vw, 40px) 60px; }
.curator-overview { padding: 24px; border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface); }
.curator-identity { display: flex; align-items: center; gap: 18px; }
.curator-avatar { position: relative; display: grid; width: 82px; height: 82px; flex: 0 0 82px; place-items: center; border-radius: 10px; background: var(--color-primary-container); color: var(--color-primary); font-family: var(--font-heading); font-size: 24px; font-weight: 800; }
.curator-avatar img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.curator-pro-badge { position: absolute; right: -5px; bottom: -6px; padding: 4px 7px; border: 2px solid var(--color-surface); border-radius: 999px; background: var(--color-primary); color: var(--color-primary-foreground); font-size: 9px; font-weight: 700; }
.curator-copy { min-width: 0; flex: 1; }
.curator-name-line { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; }
.curator-name-line h1 { font-family: var(--font-heading); font-size: 25px; }
.curator-name-line > span { color: var(--color-primary); font-size: 10px; }
.curator-name-line .level-badge { padding: 5px 8px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-primary); }
.curator-copy > p { max-width: 720px; margin-top: 6px; color: var(--color-muted); font-size: 12px; line-height: 1.55; }
.curator-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; color: var(--color-muted); font-size: 10px; }
.curator-meta span { display: inline-flex; align-items: center; gap: 5px; }
.curator-meta .helpful-count { color: var(--color-primary); font-weight: 600; }
.curator-actions { display: flex; align-items: center; gap: 8px; }
.directory-link { color: var(--color-primary); font-size: 11px; font-weight: 600; text-decoration: none; white-space: nowrap; }
.curator-actions :deep(.base-button) { min-height: 36px; padding-inline: 11px; font-size: 11px; }
.curator-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 22px; padding: 14px; border-radius: 7px; background: var(--color-surface-muted); }
.curator-stats div { display: flex; flex-direction: column; gap: 2px; }
.curator-stats strong { font-family: var(--font-heading); font-size: 19px; }
.curator-stats span { color: var(--color-muted); font-size: 9px; text-transform: uppercase; }
.profile-section { margin-top: 28px; }
.profile-section-heading,.profile-title,.insight-heading,.rail-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.profile-title { justify-content: flex-start; }
.profile-title i { color: var(--color-primary); }
.profile-title h2 { font-family: var(--font-heading); font-size: 19px; }
.profile-section-heading > div > p { margin-top: 4px; color: var(--color-muted); font-size: 11px; }
.section-note { color: var(--color-muted); font-size: 10px; }
.favorites-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
.favorite-card { min-width: 0; padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); }
.favorite-card__art { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 5px; background: var(--color-surface-muted); }
.favorite-card__art img { width: 100%; height: 100%; object-fit: cover; }
.favorite-card__art > span { position: absolute; top: 6px; left: 6px; padding: 3px 6px; border-radius: 999px; background: rgb(19 27 46 / 78%); color: white; font-size: 9px; font-weight: 700; }
.favorite-card__art .favorite-rating { right: 6px; left: auto; }
.favorite-rating i { color: var(--color-muted); }
.favorite-card h3 { margin-top: 8px; overflow: hidden; font-family: var(--font-heading); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.favorite-card > p { margin-top: 3px; overflow: hidden; color: var(--color-muted); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.favorite-meta { display: flex; justify-content: space-between; gap: 4px; margin-top: 9px; color: var(--color-muted); font-size: 9px; }
.favorite-meta span:last-child { padding: 3px 5px; border-radius: 3px; background: var(--color-surface-muted); color: var(--color-text); }
.profile-insights { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 14px; margin-top: 18px; }
.insight-panel,.rail-panel { min-width: 0; padding: 17px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); }
.insight-heading { margin-bottom: 15px; }
.insight-heading h2 { font-family: var(--font-heading); font-size: 13px; }
.insight-heading h2 i { margin-right: 5px; color: var(--color-primary); }
.insight-heading > span { color: var(--color-muted); font-size: 9px; text-transform: uppercase; }
.genre-stat { margin-top: 10px; }
.genre-stat > div { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 10px; }
.genre-stat b { color: var(--color-primary); font-size: 10px; }
.genre-stat__track { display: block; height: 5px; overflow: hidden; border-radius: 999px; background: var(--color-track); }
.genre-stat__track i { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); }
.genre-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 14px; }
.genre-tags span { padding: 4px 6px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-muted); font-size: 9px; }
.artist-panel ol { display: flex; flex-direction: column; gap: 8px; list-style: none; }
.artist-panel li { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 7px; border-radius: 5px; background: var(--color-surface-muted); }
.artist-panel li > span { color: var(--color-muted); font-size: 9px; }
.artist-avatar { width: 27px; height: 27px; flex: 0 0 27px; border-radius: 50%; background: var(--color-primary-container); }
.artist-avatar--1 { background: linear-gradient(135deg, #bac8ff, #3755c3); }
.artist-avatar--2 { background: linear-gradient(135deg, #c2e2f5, #436a97); }
.artist-avatar--3 { background: linear-gradient(135deg, #fad6df, #916f9a); }
.artist-panel li div { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.artist-panel li strong { overflow: hidden; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.artist-panel li small { color: var(--color-muted); font-size: 9px; }
.trend-icon { color: var(--color-primary); font-size: 10px; }
.panel-link { width: 100%; margin-top: 10px; padding: 8px; border-radius: 5px; background: var(--color-surface-muted); color: var(--color-primary); font-size: 10px; cursor: pointer; }
.affinity-panel { display: flex; flex-direction: column; align-items: center; }
.affinity-eyebrow { display: flex; width: 100%; justify-content: space-between; color: var(--color-muted); font-size: 9px; text-transform: uppercase; }
.affinity-eyebrow b { color: #16835d; font-size: 9px; }
.affinity-ring { display: grid; width: 116px; aspect-ratio: 1; place-items: center; margin: 10px auto; border-radius: 50%; background: conic-gradient(var(--color-primary) 0 91%, var(--color-track) 91% 100%); }
.affinity-ring > div { display: flex; width: 86px; aspect-ratio: 1; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: var(--color-surface); }
.affinity-ring strong { font-family: var(--font-heading); font-size: 24px; }
.affinity-ring span { color: var(--color-muted); font-size: 8px; text-transform: uppercase; }
.affinity-panel > p { color: var(--color-muted); font-size: 10px; line-height: 1.5; text-align: center; }
.affinity-panel > button { width: 100%; margin-top: 10px; padding: 8px; border-radius: 5px; background: var(--color-primary); color: var(--color-primary-foreground); font-size: 10px; font-weight: 700; cursor: pointer; }
.profile-tabs { display: flex; gap: 5px; overflow-x: auto; margin-top: 25px; border-bottom: 1px solid var(--color-border); }
.profile-tabs button { display: inline-flex; align-items: center; gap: 7px; flex: 0 0 auto; padding: 11px 13px; border-bottom: 2px solid transparent; background: transparent; color: var(--color-muted); font-size: 11px; cursor: pointer; }
.profile-tabs button.active { border-bottom-color: var(--color-primary); background: var(--color-primary-container); color: var(--color-primary); font-weight: 700; }
.profile-tabs button span { padding: 2px 5px; border-radius: 999px; background: var(--color-hover); font-size: 9px; }
.profile-activity { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(250px, .8fr); gap: 16px; margin-top: 16px; }
.activity-feed,.profile-rail { display: flex; min-width: 0; flex-direction: column; gap: 12px; }
.profile-review { display: grid; grid-template-columns: 88px minmax(0, 1fr); gap: 13px; padding: 14px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); }
.profile-review > img { width: 88px; aspect-ratio: 1; border-radius: 5px; object-fit: cover; }
.profile-review__content { min-width: 0; }
.profile-review__meta { display: flex; justify-content: space-between; gap: 8px; color: var(--color-primary); font-size: 10px; }
.profile-review__meta b { color: var(--color-text); }
.profile-review__meta small { color: var(--color-muted); }
.profile-review h3 { margin-top: 7px; font-family: var(--font-heading); font-size: 15px; }
.profile-review__artist { margin-top: 2px; color: var(--color-muted); font-size: 10px; }
.profile-review__content > p:not(.profile-review__artist) { margin-top: 9px; color: var(--color-muted); font-size: 11px; line-height: 1.55; }
.review-foot { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
.review-foot span { padding: 4px 6px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-muted); font-size: 8px; }
.profile-review footer { display: flex; align-items: center; gap: 13px; margin-top: 10px; padding-top: 9px; border-top: 1px solid var(--color-border); color: var(--color-muted); font-size: 9px; }
.profile-review footer button { margin-left: auto; background: transparent; color: var(--color-muted); cursor: pointer; }
.profile-review footer i { margin-right: 4px; }
.rail-eyebrow { color: var(--color-primary); font-size: 9px; font-weight: 700; text-transform: uppercase; }
.rail-eyebrow i { margin-right: 5px; font-size: 7px; }
.now-playing > div { display: flex; align-items: center; gap: 9px; margin-top: 10px; padding: 8px; border-radius: 5px; background: var(--color-surface-muted); }
.now-playing img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
.now-playing > div > span { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.now-playing strong { font-size: 10px; }
.now-playing small { color: var(--color-muted); font-size: 9px; }
.now-playing small i,.now-playing > div > i { color: var(--color-primary); }
.rail-heading { margin-bottom: 12px; }
.rail-heading h2 { font-family: var(--font-heading); font-size: 12px; }
.rail-heading button { background: transparent; color: var(--color-primary); font-size: 9px; cursor: pointer; }
.rail-playlists { display: flex; flex-direction: column; gap: 9px; list-style: none; }
.rail-playlists li { display: flex; align-items: center; gap: 8px; }
.playlist-symbol { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border-radius: 5px; background: var(--color-primary-container); color: var(--color-primary); font-size: 12px; }
.rail-playlists li > span:last-child { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.rail-playlists strong { overflow: hidden; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.rail-playlists small { color: var(--color-muted); font-size: 8px; }
.account-panel dl { display: grid; gap: 7px; margin-bottom: 12px; }
.account-panel dl div { display: flex; justify-content: space-between; gap: 8px; font-size: 9px; }
.account-panel dt { color: var(--color-muted); }
.account-panel dd { margin: 0; overflow-wrap: anywhere; text-align: right; }
.account-panel :deep(.base-button) { width: 100%; }
.tab-empty { display: grid; min-height: 220px; place-content: center; justify-items: center; gap: 8px; border: 1px dashed var(--color-border); border-radius: 8px; color: var(--color-muted); text-align: center; }
.tab-empty > i { color: var(--color-primary); font-size: 22px; }
.tab-empty h2 { color: var(--color-text); font-family: var(--font-heading); font-size: 15px; }
.tab-empty p { font-size: 11px; }
.profile-form { display: flex; flex-direction: column; gap: 16px; padding: 0; }
.profile-form-header,.profile-form-actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.profile-form-header { position: sticky; top: 0; z-index: 1; padding: 18px 22px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
.profile-form-header h2 { font-family: var(--font-heading); font-size: 18px; }
.profile-form-fields { display: grid; gap: 13px; padding: 4px 22px; }
.profile-form-group { display: grid; gap: 6px; color: var(--color-text); font-size: 11px; font-weight: 600; }
.profile-form-group :deep(.base-input) { height: 40px; }
.profile-form-actions { position: sticky; bottom: 0; justify-content: flex-end; padding: 13px 22px; border-top: 1px solid var(--color-border); background: var(--color-hover); }
.profile-state.error { margin: 0 22px; color: var(--color-danger); font-size: 12px; }
.delete-copy { padding: 0 22px; color: var(--color-muted); font-size: 13px; line-height: 1.6; }
@media (max-width: 1000px) { .profile-insights { grid-template-columns: repeat(2, minmax(0, 1fr)); } .affinity-panel { grid-column: 1 / -1; } .profile-activity { grid-template-columns: minmax(0, 1fr) 260px; } }
@media (max-width: 760px) { .curator-identity { align-items: flex-start; flex-wrap: wrap; } .curator-actions { width: 100%; justify-content: flex-end; } .profile-activity { grid-template-columns: 1fr; } .profile-rail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); } .account-panel { grid-column: 1 / -1; } }
@media (max-width: 560px) { .curator-container { padding: 14px 12px 40px; } .curator-overview { padding: 15px; } .curator-avatar { width: 66px; height: 66px; flex-basis: 66px; font-size: 20px; } .curator-name-line h1 { font-size: 20px; } .curator-name-line > span:not(.level-badge) { display: none; } .curator-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; } .profile-section-heading { align-items: flex-start; } .profile-title h2 { font-size: 16px; } .favorites-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .profile-insights,.profile-rail { grid-template-columns: 1fr; } .affinity-panel,.account-panel { grid-column: auto; } .profile-review { grid-template-columns: 62px minmax(0, 1fr); gap: 9px; padding: 10px; } .profile-review > img { width: 62px; } .profile-review__meta small { display: none; } .profile-form-header,.profile-form-fields,.profile-form-actions { padding-right: 16px; padding-left: 16px; } .profile-state.error,.delete-copy { margin-right: 16px; margin-left: 16px; padding-right: 0; padding-left: 0; } }
</style>
