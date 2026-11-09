<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { getErrorMessagge } from "../../../utils/errorHandler";
import { musicService } from "../services/musicService";
import { socialService } from "../services/socialService";
import ReviewComments from "../components/ReviewComments.vue";
import { useMiniPlayer } from "../composables/useMiniPlayer";

const route = useRoute();
const album = ref(null);
const tracks = ref([]);
const reviews = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const activeReviewId = ref("");
const {
  currentTrack: miniPlayerTrack,
  isPlaying: miniPlayerIsPlaying,
  currentTime: playbackTime,
  duration: playbackDuration,
  playTrack: playMiniTrack,
  seek: seekMiniPlayer,
} = useMiniPlayer();
const playingTrackId = computed(() => miniPlayerIsPlaying.value ? miniPlayerTrack.value?.key ?? "" : "");

const albumReviews = computed(() => reviews.value.filter((review) => String(review.musicItemId).toLowerCase() === String(album.value?.id).toLowerCase()));
const ratingReviews = computed(() => albumReviews.value);
const averageRating = computed(() => ratingReviews.value.length
  ? (ratingReviews.value.reduce((sum, review) => sum + Number(review.rating), 0) / ratingReviews.value.length).toFixed(1)
  : "0.0");
const reviewBars = computed(() => [5, 4, 3, 2, 1].map((rating) => {
  const count = ratingReviews.value.filter((review) => Math.round(Number(review.rating)) === rating).length;
  return { rating, count, percentage: ratingReviews.value.length ? Math.round((count / ratingReviews.value.length) * 100) : 0 };
}));
const featuredReviews = computed(() => [...albumReviews.value].sort((a, b) => b.likes - a.likes).slice(0, 12));
const reviewedTracks = computed(() => tracks.value.filter((track) => reviewsForTrack(track).length).length);
const currentTrack = computed(() => tracks.value.find((track) => track.id === miniPlayerTrack.value?.key) ?? tracks.value[0] ?? null);
const playbackProgress = computed(() => playbackDuration.value ? (playbackTime.value / playbackDuration.value) * 100 : 0);

function valueOf(value, camel, pascal) {
  return value?.[camel] ?? value?.[pascal];
}

function getArray(data) {
  const value = data?.data ?? data?.Data ?? data?.items ?? data?.Items ?? data;
  return Array.isArray(value) ? value : [];
}

function artistNames(artists = []) {
  if (typeof artists === "string") return artists;
  if (!Array.isArray(artists)) artists = artists ? [artists] : [];
  return artists
    .map((artist) => typeof artist === "string" ? artist : artist.name ?? artist.Name)
    .filter(Boolean)
    .join(", ");
}

function normalizeSong(song, index) {
  return {
    id: valueOf(song, "id", "Id"),
    title: valueOf(song, "title", "Title") || `Pista ${index + 1}`,
    artists: valueOf(song, "artistDetails", "ArtistDetails") ?? valueOf(song, "artists", "Artists") ?? [],
    duration: valueOf(song, "durationSeconds", "DurationSeconds") ?? 0,
    previewUrl: valueOf(song, "previewUrl", "PreviewUrl") ?? "",
    externalId: valueOf(song, "externalId", "ExternalId") ?? "",
    trackNumber: valueOf(song, "trackNumber", "TrackNumber") ?? index + 1,
    imageUrl: valueOf(song, "albumImageUrl", "AlbumImageUrl") ?? valueOf(song, "imageUrl", "ImageUrl") ?? "",
  };
}

function reviewsForTrack(track) {
  return reviews.value.filter((review) => String(review.musicItemId).toLowerCase() === String(track.id).toLowerCase());
}

function formatDuration(seconds) {
  if (!seconds) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

async function toggleTrack(track) {
  const played = await playMiniTrack({ ...track, artist: artistNames(track.artists) || album.value?.artist, cover: album.value?.cover });
  if (!played) errorMessage.value = "No se pudo reproducir la preview de esta pista.";
}

function seekPlayback(event) {
  seekMiniPlayer(event.target.value);
}

function toggleReviewComments(review) {
  activeReviewId.value = activeReviewId.value === String(review.id) ? "" : String(review.id);
}

async function loadAlbum() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const albumIdentifier = String(route.params.externalId);
    const isInternalId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(albumIdentifier);
    const [albumResponse, socialResponse] = await Promise.all([
      isInternalId ? musicService.getItem("album", albumIdentifier) : musicService.importAlbum(albumIdentifier),
      socialService.getReviews(),
    ]);
    const songs = getArray(valueOf(albumResponse, "tracks", "Tracks") ?? valueOf(albumResponse, "songs", "Songs"));
    if (!songs.length) throw new Error("El álbum no tiene pistas disponibles.");

    const firstSong = songs[0];
    const albumId = valueOf(albumResponse, "id", "Id") ?? valueOf(albumResponse, "albumId", "AlbumId");
    if (!albumId || /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(albumId)) {
      throw new Error("Music no devolvió un identificador válido para este álbum.");
    }
    album.value = {
      id: albumId,
      externalId: valueOf(albumResponse, "externalId", "ExternalId") ?? valueOf(albumResponse, "albumExternalId", "AlbumExternalId"),
      title: valueOf(albumResponse, "title", "Title") || valueOf(albumResponse, "albumTitle", "AlbumTitle") || valueOf(firstSong, "album", "Album") || "Álbum",
      cover: valueOf(albumResponse, "imageUrl", "ImageUrl") || valueOf(firstSong, "albumImageUrl", "AlbumImageUrl") || valueOf(firstSong, "imageUrl", "ImageUrl") || "",
      artist: artistNames(valueOf(albumResponse, "artist", "Artist") ?? valueOf(firstSong, "artistDetails", "ArtistDetails") ?? valueOf(firstSong, "artists", "Artists") ?? []),
      totalTracks: valueOf(albumResponse, "totalTracks", "TotalTracks") ?? songs.length,
      releaseDate: valueOf(albumResponse, "releaseDate", "ReleaseDate") ?? valueOf(firstSong, "releaseDate", "ReleaseDate") ?? "",
    };
    tracks.value = songs.map(normalizeSong);
    const songsById = new Map(tracks.value.map((track) => [String(track.id).toLowerCase(), track]));
    reviews.value = getArray(socialResponse).map((review) => {
      const musicItemId = valueOf(review, "musicItemId", "MusicItemId");
      const profile = review.profile ?? review.Profile ?? {};
      const name = valueOf(profile, "name", "Name") || "Miembro de Faudix";
      return {
        id: valueOf(review, "id", "Id"),
        userId: valueOf(review, "userId", "UserId"),
        musicItemId,
        track: songsById.get(String(musicItemId).toLowerCase()) ?? null,
        title: valueOf(review, "title", "Title") || "Reseña sin título",
        comment: valueOf(review, "comment", "Comment") ?? "",
        rating: Number(valueOf(review, "rating", "Rating") ?? 0).toFixed(1),
        likes: Number(valueOf(review, "likesCount", "LikesCount") ?? 0),
        comments: Number(valueOf(review, "commentsCount", "CommentsCount") ?? 0),
        profile: { ...profile, name, initials: name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() },
      };
    });
  } catch (error) {
    errorMessage.value = error.response ? getErrorMessagge(error) : error.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadAlbum);
</script>

<template>
  <main class="album-detail-page">
    <div class="album-detail-container">
      <nav class="album-breadcrumb" aria-label="Ruta">
        <RouterLink :to="{ name: 'home' }">Explorar</RouterLink><i class="fa-solid fa-chevron-right" aria-hidden="true"></i><span>{{ album?.title || "Álbum" }}</span>
      </nav>

      <p v-if="loading" class="album-state" role="status">Cargando álbum y reseñas...</p>
      <p v-if="errorMessage" class="album-state album-state--error" role="alert">{{ errorMessage }}</p>

      <template v-if="album">
        <section class="album-hero">
          <div class="album-cover-frame">
            <img v-if="album.cover" class="album-hero__cover" :src="album.cover" :alt="`Portada de ${album.title}`" />
            <span v-else class="album-hero__placeholder"><i class="fa-solid fa-compact-disc" aria-hidden="true"></i></span>
            <span class="album-cover-caption"><i class="fa-solid fa-record-vinyl" aria-hidden="true"></i> Faudix · Álbum</span>
          </div>
          <div class="album-hero__info">
            <div class="album-tags"><span class="album-feature-tag">Álbum destacado</span><span>{{ album.albumType || "Álbum" }}</span><span>{{ album.provider || "Deezer" }}</span></div>
            <h1>{{ album.title }}</h1>
            <p class="album-artist">{{ album.artist || "Artista no disponible" }}<span v-if="album.releaseDate"> · {{ album.releaseDate }}</span><span> · {{ album.totalTracks }} pistas</span></p>
            <div class="album-meta"><span><i class="fa-solid fa-compact-disc" aria-hidden="true"></i> {{ album.albumType || "Álbum" }}</span><span><i class="fa-solid fa-headphones" aria-hidden="true"></i> {{ reviewedTracks }} pistas reseñadas</span></div>
            <div class="album-rating-panel">
              <div class="album-rating-summary"><span>Puntuación colectiva</span><div><strong>{{ averageRating }}</strong><span>/ 5.0</span></div><span class="album-rating-stars" :aria-label="`${averageRating} de 5`">{{ "★".repeat(Math.round(Number(averageRating))) }}{{ "☆".repeat(5 - Math.round(Number(averageRating))) }}</span><small>{{ ratingReviews.length }} valoraciones de la comunidad</small></div>
              <div class="album-rating-bars">
                <div v-for="bar in reviewBars" :key="bar.rating"><span>{{ bar.rating }}★</span><i><b :style="{ width: `${bar.percentage}%` }"></b></i><small>{{ bar.percentage }}%</small></div>
              </div>
            </div>
            <div class="album-hero__actions"><RouterLink class="button-primary album-review-link" :to="{ name: 'write-review', query: { musicItemId: album.id, kind: 'album' } }"><i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Añadir reseña</RouterLink><span class="album-review-count"><i class="fa-regular fa-message" aria-hidden="true"></i> {{ albumReviews.length }} reseñas del álbum</span></div>
          </div>
        </section>

        <section class="album-player" aria-label="Reproductor de preview">
          <button type="button" class="album-player__toggle" :disabled="!currentTrack" :aria-label="playingTrackId ? 'Pausar preview' : 'Reproducir pista destacada'" @click="currentTrack && toggleTrack(currentTrack)"><i class="fa-solid" :class="playingTrackId ? 'fa-pause' : 'fa-play'" aria-hidden="true"></i></button>
          <div class="album-player__track"><strong>{{ currentTrack?.title || "Sin pista disponible" }}</strong><small>{{ album.artist }} · Preview de Deezer</small></div>
          <span class="album-player__time">{{ formatDuration(playbackTime) }}</span>
          <input class="album-player__seek" type="range" min="0" :max="playbackDuration || 30" step="0.1" :value="playbackTime" :style="{ '--progress': `${playbackProgress}%` }" aria-label="Posición de reproducción" @input="seekPlayback" />
          <span class="album-player__time">{{ formatDuration(playbackDuration) || "0:30" }}</span>
          <i class="fa-solid fa-volume-high album-player__volume-icon" aria-hidden="true"></i>
        </section>

        <div class="album-content-grid">
          <section class="album-track-section" aria-labelledby="track-list-title">
            <header class="album-section-heading"><div><h2 id="track-list-title">Lista de canciones</h2><p>Orden oficial del álbum · Votos de la comunidad</p></div><span>{{ tracks.length }} temas</span></header>
            <ol class="album-track-list">
              <li v-for="track in tracks" :key="track.id" class="album-track" :class="{ 'album-track--playing': playingTrackId === track.id }">
                <span class="album-track__number">{{ String(track.trackNumber).padStart(2, "0") }}</span>
                <button class="album-track__play" type="button" :aria-label="playingTrackId === track.id ? `Pausar ${track.title}` : `Reproducir ${track.title}`" :title="track.previewUrl ? 'Reproducir preview' : 'Buscar preview'" @click="toggleTrack(track)"><i class="fa-solid" :class="playingTrackId === track.id ? 'fa-pause' : 'fa-play'" aria-hidden="true"></i></button>
                <span class="album-track__copy"><strong>{{ track.title }}</strong><small>{{ artistNames(track.artists) || album.artist }}</small></span>
                <span class="album-track__review-count" :class="{ 'has-reviews': reviewsForTrack(track).length }">{{ reviewsForTrack(track).length }} reseñas</span>
                <span class="album-track__duration">{{ formatDuration(track.duration) }}</span>
                <RouterLink class="album-track__write" :to="{ name: 'write-review', query: { musicItemId: track.id, kind: 'song' } }" :aria-label="`Reseñar ${track.title}`" title="Reseñar pista"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i></RouterLink>
              </li>
            </ol>
          </section>

          <section class="album-reviews" aria-labelledby="album-reviews-title">
            <header class="album-section-heading album-reviews__heading"><div><h2 id="album-reviews-title">Críticas y reseñas del álbum</h2><p>{{ albumReviews.length }} reseñas de esta obra</p></div><RouterLink :to="{ name: 'write-review', query: { musicItemId: album.id, kind: 'album' } }">Añadir reseña</RouterLink></header>
            <p v-if="!featuredReviews.length" class="album-empty">Aún no hay reseñas para este álbum.</p>
            <article v-for="review in featuredReviews" :key="review.id" class="album-review-card">
              <header class="album-review-card__author"><span class="album-review-card__avatar">{{ review.profile.initials }}</span><div><strong>{{ review.profile.name }}</strong><small>{{ String(review.musicItemId).toLowerCase() === String(album.id).toLowerCase() ? 'Reseña del álbum' : `Pista · ${review.track?.title || album.title}` }}</small></div><span class="album-review-card__rating">★ {{ review.rating }}</span></header>
              <h3>{{ review.title }}</h3><p class="album-review-card__text">{{ review.comment }}</p>
              <footer><span><i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> {{ review.likes }}</span><button type="button" :aria-expanded="activeReviewId === String(review.id)" @click="toggleReviewComments(review)"><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ review.comments }} comentarios</button></footer>
              <ReviewComments v-if="activeReviewId === String(review.id)" :review-id="String(review.id)" @count-updated="review.comments = $event" />
            </article>
          </section>
        </div>
      </template>
    </div>
  </main>
</template>

<style scoped>
.album-detail-page { min-height: calc(100vh - 64px); background: var(--color-background); }
.album-detail-container { width: min(1320px, 100%); margin: 0 auto; padding: 20px clamp(16px, 2.5vw, 36px) 56px; }
.album-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; color: var(--color-muted); font-size: 10px; }
.album-breadcrumb a { color: var(--color-text); text-decoration: none; }
.album-breadcrumb a:hover { color: var(--color-primary); }
.album-breadcrumb i { font-size: 8px; }
.album-state { margin: 18px 0; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-muted); font-size: 12px; }
.album-state--error { border-color: var(--color-danger-border); background: var(--color-danger-bg); color: var(--color-danger); }
.album-hero { display: grid; grid-template-columns: minmax(220px, 34%) minmax(0, 1fr); align-items: center; gap: clamp(24px, 4vw, 56px); }
.album-cover-frame { position: relative; overflow: hidden; aspect-ratio: 1; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); box-shadow: var(--shadow-card); }
.album-hero__cover,.album-hero__placeholder { display: grid; width: 100%; height: 100%; place-items: center; background: var(--color-surface-muted); color: var(--color-primary); object-fit: cover; font-size: 44px; }
.album-cover-caption { position: absolute; top: 10px; left: 10px; padding: 6px 9px; border: 1px solid var(--color-border); border-radius: 6px; background: color-mix(in srgb, var(--color-surface) 92%, transparent); color: var(--color-text); font-size: 9px; font-weight: 700; backdrop-filter: blur(12px); }
.album-cover-caption i { margin-right: 4px; color: var(--color-primary); }
.album-hero__info { min-width: 0; }
.album-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.album-tags > span { padding: 5px 8px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-muted); font-size: 9px; font-weight: 650; }
.album-tags .album-feature-tag { background: var(--color-primary); color: var(--color-primary-foreground); text-transform: uppercase; }
.album-hero h1 { margin: 11px 0 3px; color: var(--color-text); font-family: var(--font-heading); font-size: clamp(30px, 4.2vw, 54px); font-weight: 800; line-height: 1.06; overflow-wrap: anywhere; }
.album-artist { color: var(--color-text); font-size: 14px; font-weight: 650; }
.album-artist span { color: var(--color-muted); font-size: 11px; font-weight: 450; }
.album-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; color: var(--color-muted); font-size: 10px; }
.album-meta i { margin-right: 5px; color: var(--color-primary); }
.album-rating-panel { display: grid; grid-template-columns: minmax(145px, .75fr) minmax(180px, 1fr); gap: 18px; margin-top: 20px; padding: 17px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); box-shadow: var(--shadow-card); }
.album-rating-summary { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.album-rating-summary > span:first-child { color: var(--color-muted); font-size: 9px; font-weight: 700; text-transform: uppercase; }
.album-rating-summary > div { display: flex; align-items: baseline; gap: 5px; }
.album-rating-summary > div strong { color: var(--color-primary); font-family: var(--font-heading); font-size: 38px; line-height: 1; }
.album-rating-summary > div span { color: var(--color-muted); font-size: 11px; }
.album-rating-stars { color: var(--color-primary); font-size: 16px; }
.album-rating-summary small { color: var(--color-muted); font-size: 9px; }
.album-rating-bars { display: grid; align-content: center; gap: 7px; }
.album-rating-bars > div { display: grid; grid-template-columns: 20px minmax(0, 1fr) 25px; align-items: center; gap: 7px; color: var(--color-muted); font-size: 9px; }
.album-rating-bars i { height: 6px; overflow: hidden; border-radius: 999px; background: var(--color-primary-container); }
.album-rating-bars b { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); }
.album-rating-bars small { text-align: right; }
.album-hero__actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
.album-review-link { text-decoration: none; }
.album-review-count { color: var(--color-muted); font-size: 10px; }
.album-review-count i { margin-right: 4px; color: var(--color-primary); }
.album-player { display: grid; grid-template-columns: 38px minmax(120px, 1fr) 34px minmax(60px, 1.4fr) 34px 24px; align-items: center; gap: 12px; margin-top: 28px; padding: 14px 18px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); box-shadow: var(--shadow-card); }
.album-player__toggle { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 50%; background: var(--color-primary); color: var(--color-primary-foreground); cursor: pointer; }
.album-player__toggle:disabled { opacity: .5; cursor: not-allowed; }
.album-player__track { display: grid; min-width: 0; gap: 3px; }
.album-player__track strong,.album-player__track small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.album-player__track strong { color: var(--color-text); font-size: 11px; }
.album-player__track small,.album-player__time { color: var(--color-muted); font-size: 9px; }
.album-player__time { text-align: center; }
.album-player__seek { width: 100%; height: 5px; accent-color: var(--color-primary); cursor: pointer; }
.album-player__volume-icon { color: var(--color-muted); font-size: 12px; text-align: right; }
.album-content-grid { display: grid; grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr); align-items: start; gap: 24px; margin-top: 30px; }
.album-track-section,.album-reviews { min-width: 0; }
.album-section-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.album-section-heading h2 { color: var(--color-text); font-family: var(--font-heading); font-size: 18px; }
.album-section-heading p { margin-top: 3px; color: var(--color-muted); font-size: 10px; }
.album-section-heading > span { flex: 0 0 auto; padding: 5px 8px; border-radius: 999px; background: var(--color-primary-container); color: var(--color-primary); font-size: 9px; font-weight: 700; }
.album-track-list { overflow: hidden; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); list-style: none; }
.album-track { display: grid; grid-template-columns: 23px 28px minmax(0, 1fr) auto 34px 28px; align-items: center; gap: 7px; min-width: 0; min-height: 52px; padding: 7px 10px; border-bottom: 1px solid var(--color-border); }
.album-track:nth-child(even) { background: var(--color-surface-muted); }
.album-track:last-child { border-bottom: 0; }
.album-track--playing { background: var(--color-primary-container) !important; }
.album-track__number { color: var(--color-muted); font-size: 9px; text-align: center; }
.album-track__play { display: grid; width: 26px; height: 26px; place-items: center; border-radius: 50%; background: transparent; color: var(--color-muted); font-size: 9px; cursor: pointer; }
.album-track__play:hover,.album-track--playing .album-track__play { background: var(--color-primary); color: var(--color-primary-foreground); }
.album-track__copy { display: grid; min-width: 0; gap: 3px; }
.album-track__copy strong,.album-track__copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.album-track__copy strong { color: var(--color-text); font-size: 10px; }
.album-track__copy small { color: var(--color-muted); font-size: 9px; }
.album-track__review-count { color: var(--color-muted); font-size: 8px; text-align: right; white-space: nowrap; }
.album-track__review-count.has-reviews { color: var(--color-primary); font-weight: 700; }
.album-track__duration { color: var(--color-muted); font-size: 9px; text-align: right; }
.album-track__write { display: grid; width: 27px; height: 27px; place-items: center; border-radius: 5px; color: var(--color-primary); font-size: 11px; text-decoration: none; }
.album-track__write:hover { background: var(--color-primary-container); }
.album-reviews__heading > a { color: var(--color-primary); font-size: 10px; font-weight: 700; text-decoration: none; white-space: nowrap; }
.album-reviews__heading > a:hover { text-decoration: underline; }
.album-review-card { margin-bottom: 12px; padding: 15px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); box-shadow: var(--shadow-card); }
.album-review-card__author { display: flex; align-items: center; gap: 9px; }
.album-review-card__avatar { display: grid; width: 32px; height: 32px; flex: 0 0 32px; place-items: center; border-radius: 50%; background: var(--color-primary-container); color: var(--color-primary); font-size: 9px; font-weight: 700; }
.album-review-card__author > div { display: grid; min-width: 0; flex: 1; gap: 3px; }
.album-review-card__author strong { color: var(--color-text); font-size: 10px; }
.album-review-card__author small { color: var(--color-muted); font-size: 9px; }
.album-review-card__rating { padding: 5px 7px; border-radius: 6px; background: var(--color-primary-container); color: var(--color-primary); font-size: 10px; font-weight: 750; }
.album-review-card h3 { margin-top: 12px; color: var(--color-text); font-family: var(--font-heading); font-size: 13px; }
.album-review-card__text { margin-top: 6px; color: var(--color-muted); font-size: 10px; line-height: 1.65; }
.album-review-card > footer { display: flex; align-items: center; gap: 14px; margin-top: 12px; padding-top: 9px; border-top: 1px solid var(--color-border); color: var(--color-muted); font-size: 9px; }
.album-review-card > footer i { margin-right: 4px; color: var(--color-primary); }
.album-review-card > footer button { padding: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.album-empty { padding: 22px; border: 1px dashed var(--color-border); border-radius: 8px; color: var(--color-muted); font-size: 11px; text-align: center; }
@media (max-width: 760px) { .album-hero { grid-template-columns: minmax(160px, .8fr) minmax(0, 1.2fr); gap: 18px; } .album-content-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .album-detail-container { padding: 16px 12px 40px; } .album-hero { grid-template-columns: 1fr; } .album-cover-frame { width: min(100%, 300px); margin: 0 auto; } .album-rating-panel { grid-template-columns: 1fr; } .album-player { grid-template-columns: 38px minmax(0, 1fr) 30px; gap: 8px; padding: 12px; } .album-player__time:nth-of-type(1) { display: none; } .album-player__seek { grid-column: 2; grid-row: 2; } .album-player__time:nth-of-type(2) { grid-column: 3; grid-row: 2; } .album-player__volume-icon { display: none; } .album-track { grid-template-columns: 18px 26px minmax(0, 1fr) 30px; gap: 4px; padding: 7px 6px; } .album-track__review-count { display: none; } .album-track__write { grid-column: 4; grid-row: 1; } .album-track__duration { grid-column: 3; justify-self: start; margin-top: -3px; } }
</style>
