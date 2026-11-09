<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "../../../stores/authStore";
import { getErrorMessagge } from "../../../utils/errorHandler";
import { musicService } from "../services/musicService";
import { socialService } from "../services/socialService";
import { useMiniPlayer } from "../composables/useMiniPlayer";

const authStore = useAuthStore();
const route = useRoute();
const rating = ref(4);
const format = ref("Digital");
const title = ref("");
const body = ref("");
const selectedMoods = ref(["Introspectivo"]);
const selectedTrack = ref(null);
const previewError = ref("");
const {
  currentTrack: miniPlayerTrack,
  isPlaying: miniPlayerIsPlaying,
  isLoading: previewLoading,
  playTrack: playMiniTrack,
} = useMiniPlayer();
const previewPlaying = computed(() => miniPlayerIsPlaying.value && miniPlayerTrack.value?.key === String(selectedTrack.value?.id ?? ""));
const selectedType = ref("song");
const searchType = ref(String(route.query.kind ?? "song") === "album" ? "album" : "song");
const searchQuery = ref("");
const searchResults = ref([]);
const searchOpen = ref(true);
const isSearching = ref(false);
const importingTrackId = ref("");
const isSubmitting = ref(false);
const spoiler = ref(false);
const shareProfile = ref(true);
const notice = ref("");
const isPublished = ref(false);
const moods = ["Nocturno", "Introspectivo", "Eufórico", "Melancólico", "Chill", "Bailable", "Enérgico"];
const editingReviewId = computed(() => String(route.query.reviewId ?? "").trim());
const isEditing = computed(() => Boolean(editingReviewId.value));
const reviewerName = computed(() => authStore.user?.displayName || authStore.user?.name || "Tu nombre");
const reviewerInitials = computed(() => reviewerName.value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase());
const selectedSong = computed(() => selectedTrack.value?.title || "Selecciona una canción");
const selectedTypeLabel = computed(() => selectedType.value === "album" ? "Álbum seleccionado" : "Canción seleccionada");

function normalizeTrack(track) {
  const artists = track.artists ?? track.Artists ?? track.artistDetails ?? track.ArtistDetails
    ?? (track.artist ? [track.artist] : track.Artist ? [track.Artist] : []);
  return {
    id: track.id ?? track.Id,
    title: track.name ?? track.title ?? track.Name ?? track.Title ?? "Canción sin título",
    artists,
    albumTitle: track.albumTitle ?? track.AlbumTitle ?? track.album?.title ?? track.album?.Title ?? track.Album?.Title ?? "",
    imageUrl: track.imageUrl ?? track.ImageUrl ?? null,
    durationSeconds: track.durationSeconds ?? track.DurationSeconds ?? null,
    genres: track.genres ?? track.Genres ?? [],
    previewUrl: track.previewUrl ?? track.PreviewUrl ?? "",
    type: track.type ?? track.Type ?? "song",
    trackCount: track.trackCount ?? track.TrackCount ?? 0,
  };
}

function formatDuration(seconds) {
  if (!seconds) return "";
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function artistNames(artists = []) {
  return artists
    .map((artist) => typeof artist === "string" ? artist : artist.name ?? artist.Name)
    .filter(Boolean)
    .join(", ");
}

async function toggleSelectedPreview() {
  if (!selectedTrack.value) return;
  previewError.value = "";
  const played = await playMiniTrack({ ...selectedTrack.value, artist: artistNames(selectedTrack.value.artists), cover: selectedTrack.value.imageUrl });
  if (played) selectedTrack.value = { ...selectedTrack.value, previewUrl: miniPlayerTrack.value?.previewUrl ?? selectedTrack.value.previewUrl };
  else previewError.value = "No hay una preview reproducible para esta selección.";
}

async function searchTracks() {
  const query = searchQuery.value.trim();
  if (!query) {
    notice.value = "Escribe el nombre de una canción o artista para buscar.";
    return;
  }

  isSearching.value = true;
  notice.value = "";
  try {
    const response = await musicService.searchDeezer(query, searchType.value);
    const results = Array.isArray(response) ? response : response?.data ?? response?.items ?? [];
    searchResults.value = results.map((item) => normalizeTrack({ ...item, type: searchType.value }));
  } catch (error) {
    notice.value = getErrorMessagge(error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

async function importAlbumForReview(track) {
  const imported = await musicService.importAlbum(track.id, track.genres ?? []);
  const songs = imported?.songs ?? imported?.Songs ?? [];
  const albumId = imported?.albumId ?? imported?.AlbumId;
  const firstSong = songs[0] ?? {};
  if (!albumId || /^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(albumId)) {
    throw new Error("Music no devolvió un identificador interno válido para el álbum.");
  }

  selectedTrack.value = {
    id: albumId,
    type: "album",
    title: imported.albumTitle ?? imported.AlbumTitle ?? track.title ?? "Álbum",
    artists: firstSong.artistDetails ?? firstSong.ArtistDetails ?? firstSong.artists ?? firstSong.Artists ?? track.artists ?? [],
    albumTitle: imported.albumTitle ?? imported.AlbumTitle ?? track.title ?? "Álbum",
    imageUrl: firstSong.albumImageUrl ?? firstSong.AlbumImageUrl ?? track.imageUrl ?? "",
    previewUrl: firstSong.previewUrl ?? firstSong.PreviewUrl ?? "",
    previewTitle: firstSong.title ?? firstSong.Title ?? "",
    previewExternalId: firstSong.externalId ?? firstSong.ExternalId ?? "",
    externalId: track.id,
    durationSeconds: firstSong.durationSeconds ?? firstSong.DurationSeconds ?? null,
    trackCount: imported.totalTracks ?? imported.TotalTracks ?? songs.length,
    genres: track.genres ?? [],
  };
  selectedType.value = "album";
  searchOpen.value = false;
  notice.value = "Álbum listo para reseñar.";
}

async function selectTrack(track) {
  previewError.value = "";
  importingTrackId.value = track.id;
  notice.value = `Importando ${track.type === "album" ? "el álbum" : "la canción"} para preparar la reseña...`;
  try {
    if (track.type === "album") {
      await importAlbumForReview(track);
      return;
    }

    const imported = await musicService.importTrack(track.id, track.genres);
    const song = imported?.song ?? imported;
    const internalId = song?.id ?? song?.Id;
    if (!internalId) throw new Error("Music no devolvió el identificador de la canción.");

    selectedTrack.value = {
      ...track,
      id: internalId,
      title: song.title ?? song.Title ?? track.title,
      artists: song.artists ?? song.Artists ?? song.artistDetails ?? song.ArtistDetails ?? track.artists,
      albumTitle: song.album ?? song.Album ?? track.albumTitle,
      imageUrl: song.imageUrl ?? song.ImageUrl ?? song.albumImageUrl ?? song.AlbumImageUrl ?? track.imageUrl,
      durationSeconds: song.durationSeconds ?? song.DurationSeconds ?? track.durationSeconds,
      previewUrl: song.previewUrl ?? song.PreviewUrl ?? track.previewUrl ?? "",
      externalId: song.externalId ?? song.ExternalId ?? track.id,
      type: "song",
    };
    selectedType.value = "song";
    searchOpen.value = false;
    notice.value = "Canción lista para reseñar.";
  } catch (error) {
    notice.value = error.response?.data?.message ?? error.message ?? getErrorMessagge(error);
  } finally {
    importingTrackId.value = "";
  }
}

function toggleMood(mood) {
  selectedMoods.value = selectedMoods.value.includes(mood)
    ? selectedMoods.value.filter((item) => item !== mood)
    : [...selectedMoods.value, mood];
}

async function submitReview() {
  if (!selectedTrack.value?.id) {
    notice.value = "Busca y selecciona una canción o álbum antes de publicar.";
    searchOpen.value = true;
    return;
  }
  if (!title.value.trim() || !body.value.trim()) {
    notice.value = "Añade un título y escribe tu crítica antes de publicar.";
    return;
  }

  isSubmitting.value = true;
  notice.value = "";
  try {
    const review = {
      rating: rating.value,
      title: title.value.trim(),
      comment: body.value.trim(),
    };
    if (isEditing.value) {
      await socialService.updateReview(editingReviewId.value, {
        ...review,
        musicItemId: selectedTrack.value.id,
      });
    } else {
      await socialService.createReview(selectedTrack.value.id, review);
    }
    isPublished.value = true;
    notice.value = isEditing.value ? "Tu reseña se actualizó correctamente." : "Tu reseña se publicó correctamente.";
  } catch (error) {
    notice.value = getErrorMessagge(error);
  } finally {
    isSubmitting.value = false;
  }
}

function saveDraft() {
  const draft = { rating: rating.value, format: format.value, title: title.value, body: body.value, selectedMoods: selectedMoods.value, selectedTrack: selectedTrack.value, selectedType: selectedType.value, searchType: searchType.value };
  try {
    localStorage.setItem("faudix-review-draft", JSON.stringify(draft));
    notice.value = "Borrador guardado en este dispositivo.";
  } catch {
    notice.value = "No se pudo guardar el borrador en este dispositivo.";
  }
}

async function loadReviewForEdit(reviewId) {
  if (!authStore.user?.id) throw new Error("Inicia sesión para editar esta reseña.");
  const response = await socialService.getReviews({ userId: authStore.user.id });
  const source = Array.isArray(response) ? response : response?.data ?? response?.items ?? [];
  const review = source.find((item) => String(item.id ?? item.Id) === reviewId);
  if (!review) throw new Error("No encontramos esta reseña en tu perfil.");

  const musicItemId = review.musicItemId ?? review.MusicItemId;
  let musicItem;
  let kind = "song";
  try {
    musicItem = await musicService.getItem("song", musicItemId);
  } catch {
    musicItem = await musicService.getItem("album", musicItemId);
    kind = "album";
  }
  selectedTrack.value = normalizeTrack({ ...musicItem, type: kind });
  selectedType.value = kind;
  rating.value = Number(review.rating ?? review.Rating ?? 4);
  title.value = review.title ?? review.Title ?? "";
  body.value = review.comment ?? review.Comment ?? "";
  searchOpen.value = false;
  notice.value = `Editando la reseña de ${kind === "album" ? "este álbum" : "esta canción"}.`;
}

onMounted(() => {
  try {
    const draft = JSON.parse(localStorage.getItem("faudix-review-draft") ?? "null");
    if (draft) {
      if (Number.isInteger(draft.rating)) rating.value = draft.rating;
      format.value = draft.format ?? format.value;
      title.value = draft.title ?? "";
      body.value = draft.body ?? "";
      selectedMoods.value = Array.isArray(draft.selectedMoods) ? draft.selectedMoods : selectedMoods.value;
      selectedTrack.value = draft.selectedTrack ?? null;
      selectedType.value = draft.selectedType ?? selectedTrack.value?.type ?? "song";
      searchType.value = draft.searchType ?? searchType.value;
    }
  } catch {
    localStorage.removeItem("faudix-review-draft");
  }

  const externalId = String(route.query.deezerId ?? "").trim();
  const externalAlbumId = String(route.query.deezerAlbumId ?? "").trim();
  const reviewId = editingReviewId.value;
  const internalId = String(route.query.musicItemId ?? "").trim();
  const internalKind = String(route.query.kind ?? "song") === "album" ? "album" : "song";
  const initialQuery = String(route.query.q ?? "").trim();
  if (reviewId) {
    searchOpen.value = false;
    importingTrackId.value = reviewId;
    void loadReviewForEdit(reviewId)
      .catch((error) => {
        searchOpen.value = true;
        notice.value = getErrorMessagge(error);
      })
      .finally(() => { importingTrackId.value = ""; });
  } else if (internalId) {
    searchOpen.value = false;
    selectedType.value = internalKind;
    importingTrackId.value = internalId;
    void musicService.getItem(internalKind, internalId)
      .then((song) => {
        selectedTrack.value = normalizeTrack({ ...song, type: internalKind });
        notice.value = `${internalKind === "album" ? "Álbum" : "Canción"} cargado${internalKind === "album" ? "" : "a"}. Tu reseña está lista para escribir.`;
      })
      .catch((error) => {
        selectedTrack.value = null;
        searchOpen.value = true;
        notice.value = getErrorMessagge(error);
      })
      .finally(() => {
        importingTrackId.value = "";
      });
  } else if (externalAlbumId) {
    searchOpen.value = false;
    importingTrackId.value = externalAlbumId;
    void importAlbumForReview({
      id: externalAlbumId,
      title: initialQuery || "Álbum",
      genres: [],
      artists: [],
    })
      .catch((error) => {
        selectedTrack.value = null;
        searchOpen.value = true;
        notice.value = error.response?.data?.message ?? getErrorMessagge(error);
      })
      .finally(() => {
        importingTrackId.value = "";
      });
  } else if (externalId) {
    searchOpen.value = false;
    importingTrackId.value = externalId;
    void musicService.importTrack(externalId)
      .then((response) => {
        const song = response?.song ?? response?.data ?? response;
        selectedTrack.value = normalizeTrack({ ...song, type: "song" });
        selectedType.value = "song";
        notice.value = "Canción importada. Tu reseña está lista para escribir.";
      })
      .catch((error) => {
        selectedTrack.value = null;
        searchOpen.value = true;
        notice.value = getErrorMessagge(error);
      })
      .finally(() => {
        importingTrackId.value = "";
      });
  } else if (initialQuery) {
    searchQuery.value = initialQuery;
    searchOpen.value = true;
    void searchTracks();
  } else {
    searchOpen.value = !selectedTrack.value;
  }
});
</script>

<template>
  <main class="compose-page">
    <div class="compose-container">
      <div class="compose-topline">
        <RouterLink :to="{ name: 'home' }" class="back-link"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver a explorar</RouterLink>
        <span class="draft-indicator"><i class="fa-solid fa-circle" aria-hidden="true"></i> {{ isEditing ? "Editando reseña" : "Borrador guardado localmente" }}</span>
      </div>

      <div class="compose-grid">
        <form class="review-editor" @submit.prevent="submitReview">
          <div class="album-select" :class="{ 'album-select--empty': !selectedTrack }">
            <img v-if="selectedTrack?.imageUrl" :src="selectedTrack.imageUrl" :alt="`Portada de ${selectedTrack.albumTitle || selectedTrack.title}`" />
            <span v-else class="album-placeholder" aria-hidden="true"><i class="fa-solid fa-music"></i></span>
            <div>
              <span class="eyebrow">{{ selectedTrack ? selectedTypeLabel : "Obra para reseñar" }}</span>
              <h1>{{ selectedTrack?.title || `Elige un${selectedType === 'album' ? ' álbum' : 'a canción'}` }}</h1>
              <p v-if="selectedTrack">{{ artistNames(selectedTrack.artists) }}<span v-if="selectedTrack.albumTitle && selectedType !== 'album'"> · {{ selectedTrack.albumTitle }}</span><span v-if="selectedType === 'album' && selectedTrack.trackCount"> · {{ selectedTrack.trackCount }} pistas</span></p>
              <p v-else>Busca una canción o un álbum en el catálogo musical.</p>
            </div>
            <button type="button" class="change-album" @click="searchOpen = !searchOpen">{{ selectedTrack ? "Cambiar" : "Buscar" }}</button>
          </div>

          <div v-if="selectedTrack" class="selected-preview">
            <button type="button" class="selected-preview__button" :disabled="previewLoading" :aria-pressed="previewPlaying" @click="toggleSelectedPreview">
              <i class="fa-solid" :class="previewLoading ? 'fa-spinner fa-spin' : previewPlaying ? 'fa-pause' : 'fa-play'" aria-hidden="true"></i>
            </button>
            <span class="selected-preview__copy"><strong>{{ previewLoading ? 'Buscando preview...' : previewPlaying ? 'Reproduciendo preview' : 'Preview de 30 segundos' }}</strong><small>{{ selectedTrack.type === 'album' ? selectedTrack.previewTitle || 'Primera pista del álbum' : selectedTrack.title }}</small></span>
            <span class="selected-preview__duration">{{ formatDuration(selectedTrack.durationSeconds) }}</span>
          </div>
          <p v-if="previewError" class="track-search__hint" role="status">{{ previewError }}</p>

          <section v-if="searchOpen" class="track-search" aria-label="Buscar canciones o álbumes">
            <div class="track-search__heading">
              <div><span class="field-eyebrow">Buscar en Deezer</span><p>Elige qué quieres reseñar</p></div>
              <div class="music-kind-switch" role="group" aria-label="Tipo de obra">
                <button type="button" :aria-pressed="searchType === 'song'" :class="{ selected: searchType === 'song' }" @click="searchType = 'song'; searchResults = []">Canción</button>
                <button type="button" :aria-pressed="searchType === 'album'" :class="{ selected: searchType === 'album' }" @click="searchType = 'album'; searchResults = []">Álbum</button>
              </div>
            </div>
            <form class="track-search__form" @submit.prevent="searchTracks">
              <label class="editor-field">
                <span class="sr-only">{{ searchType === 'album' ? 'Nombre de álbum o artista' : 'Nombre de canción o artista' }}</span>
                <span class="track-search__input"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input v-model="searchQuery" type="search" :placeholder="searchType === 'album' ? 'Álbum o artista' : 'Canción o artista'" autocomplete="off" /></span>
              </label>
              <button class="button-primary" type="submit" :disabled="isSearching">
                <i class="fa-solid" :class="isSearching ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'" aria-hidden="true"></i>
                {{ isSearching ? "Buscando" : "Buscar" }}
              </button>
            </form>
            <p v-if="!searchResults.length && !isSearching" class="track-search__hint">Busca por título o artista para encontrar {{ searchType === 'album' ? 'álbumes' : 'canciones' }}.</p>
            <div v-for="track in searchResults" :key="track.id" class="track-result-row">
              <button class="track-result" type="button" :disabled="Boolean(importingTrackId)" @click="selectTrack(track)">
                <img v-if="track.imageUrl" :src="track.imageUrl" alt="" />
                <span v-else class="track-result__placeholder"><i class="fa-solid" :class="track.type === 'album' ? 'fa-compact-disc' : 'fa-music'" aria-hidden="true"></i></span>
                <span class="track-result__copy"><strong>{{ track.title }}</strong><small>{{ track.type === 'album' ? 'Álbum' : 'Canción' }} · {{ artistNames(track.artists) }}<span v-if="track.albumTitle && track.type !== 'album'"> · {{ track.albumTitle }}</span></small></span>
                <small v-if="track.type !== 'album'" class="track-result__duration">{{ formatDuration(track.durationSeconds) }}</small>
                <i class="fa-solid" :class="importingTrackId === track.id ? 'fa-spinner fa-spin' : 'fa-plus'" aria-hidden="true"></i>
              </button>
              <RouterLink v-if="track.type === 'album'" class="track-result__details" :to="{ name: 'album-detail', params: { externalId: track.id } }" :aria-label="`Ver pistas de ${track.title}`" :title="`Ver pistas de ${track.title}`">
                <i class="fa-solid fa-list" aria-hidden="true"></i>
              </RouterLink>
            </div>
            <p v-if="searchQuery && !searchResults.length && !isSearching" class="track-search__hint">No se encontraron {{ searchType === 'album' ? 'álbumes' : 'canciones' }}. Prueba otra búsqueda.</p>
          </section>

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

          <label class="editor-field"><span class="field-eyebrow">Cuerpo de la crítica <small>{{ body.length }} caracteres</small></span><textarea v-model="body" rows="8" :placeholder="selectedType === 'album' ? '¿Qué hace especial a este álbum? Habla de su sonido, sus letras y lo que te hizo sentir...' : '¿Qué destaca en esta canción? Cuéntanos qué te hicieron sentir su sonido y su letra...' "></textarea></label>

          <fieldset class="editor-field mood-field"><legend class="field-eyebrow">Atmósfera y vibra <small>(elige hasta 3)</small></legend><div class="mood-options"><button v-for="mood in moods" :key="mood" type="button" :aria-pressed="selectedMoods.includes(mood)" :class="{ selected: selectedMoods.includes(mood) }" @click="toggleMood(mood)"><i class="fa-solid fa-circle" aria-hidden="true"></i>{{ mood }}</button></div></fieldset>

          <div class="editor-field"><span class="field-eyebrow">{{ selectedType === 'album' ? "Álbum reseñado" : "Canción reseñada" }}</span><div class="selected-track-name"><i class="fa-solid" :class="selectedType === 'album' ? 'fa-compact-disc' : 'fa-music'" aria-hidden="true"></i>{{ selectedSong }}</div></div>

          <div class="editor-settings">
            <label class="setting-row"><span><i class="fa-solid fa-eye-slash" aria-hidden="true"></i><span><strong>Contiene spoilers o análisis lírico profundo</strong><small>Ocultaremos el contenido hasta que se confirme.</small></span></span><input v-model="spoiler" type="checkbox" /></label>
            <label class="setting-row"><span><i class="fa-solid fa-share-nodes" aria-hidden="true"></i><span><strong>Mostrar en mi perfil y listas públicas</strong><small>Tu crítica aparecerá en tu actividad de Faudix.</small></span></span><input v-model="shareProfile" type="checkbox" /></label>
          </div>

          <p v-if="notice" class="compose-notice" role="status">{{ notice }}</p>
          <footer class="editor-actions"><button class="button-secondary" type="button" @click="saveDraft"><i class="fa-regular fa-floppy-disk" aria-hidden="true"></i> Guardar borrador</button><RouterLink v-if="isPublished" class="button-primary" :to="isEditing ? { name: 'profile' } : { name: 'home' }">{{ isEditing ? "Volver a mi perfil" : "Ver en comunidad" }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></RouterLink><button v-else class="button-primary" type="submit" :disabled="isSubmitting"><i v-if="isSubmitting" class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>{{ isSubmitting ? (isEditing ? "Guardando..." : "Publicando...") : (isEditing ? "Guardar cambios" : "Publicar reseña") }} <i v-if="!isSubmitting" class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></footer>
        </form>

        <aside class="review-preview" aria-label="Previsualización de la reseña">
          <div class="preview-heading"><span><i class="fa-regular fa-eye" aria-hidden="true"></i> Previsualización en vivo</span><span>Comunidad</span></div>
          <article class="preview-card">
            <header><span class="preview-avatar">{{ reviewerInitials }}</span><div><strong>{{ reviewerName }}</strong><small>@{{ reviewerName.toLowerCase().replaceAll(' ', '') }} · ahora</small></div><span class="preview-format">{{ format }}</span></header>
            <div class="preview-album"><img v-if="selectedTrack?.imageUrl" :src="selectedTrack.imageUrl" alt="" /><span v-else class="track-result__placeholder"><i class="fa-solid fa-music" aria-hidden="true"></i></span><div><strong>{{ selectedTrack?.title || "Canción seleccionada" }}</strong><small>{{ artistNames(selectedTrack?.artists) || "Artista" }}<span v-if="selectedTrack?.albumTitle"> · {{ selectedTrack.albumTitle }}</span></small><span class="preview-stars" :aria-label="`${rating} de 5`">{{ "★".repeat(rating) }}{{ "☆".repeat(5 - rating) }} <b>{{ rating.toFixed(1) }}/5</b></span></div></div>
            <h2>{{ title || "Tu título aparecerá aquí" }}</h2>
            <p>{{ body || "Tu crítica se irá mostrando aquí mientras escribes." }}</p>
            <div class="preview-song"><i class="fa-solid" :class="selectedType === 'album' ? 'fa-compact-disc' : 'fa-music'" aria-hidden="true"></i> {{ selectedType === 'album' ? 'Álbum reseñado:' : 'Canción reseñada:' }} {{ selectedSong }} <span>{{ formatDuration(selectedTrack?.durationSeconds) }}</span></div>
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
.compose-container { width: min(1360px, 100%); margin: 0 auto; padding: 28px clamp(16px, 3vw, 40px) 64px; }
.compose-topline { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 24px; }
.back-link { color: var(--color-muted); font-size: 12px; font-weight: 600; text-decoration: none; }
.back-link:hover { color: var(--color-primary); }
.back-link i { margin-right: 7px; }
.draft-indicator { display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-surface); color: var(--color-muted); font-size: 10px; }
.draft-indicator i { color: var(--color-success); font-size: 7px; }
.compose-grid { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(300px, .82fr); align-items: start; gap: 28px; }
.review-editor,.preview-card { border: 1px solid var(--color-border); border-radius: 12px; background: var(--color-surface); }
.review-editor { display: flex; flex-direction: column; gap: 20px; padding: 24px; }
.album-select { display: flex; align-items: center; gap: 15px; padding: 14px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface-muted); }
.album-select img { width: 68px; height: 68px; flex: 0 0 68px; border-radius: 7px; object-fit: cover; }
.album-select div { min-width: 0; flex: 1; }
.album-placeholder,.track-result__placeholder { display: grid; width: 68px; height: 68px; flex: 0 0 68px; place-items: center; border: 1px solid var(--color-border); border-radius: 7px; background: var(--color-hover); color: var(--color-primary); font-size: 19px; }
.album-select--empty { border-style: dashed; }
.track-search { display: grid; gap: 8px; padding: 14px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); }
.track-search__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.track-search__heading p { margin-top: 4px; color: var(--color-muted); font-size: 10px; }
.track-search__form { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 10px; }
.track-search__input { display: flex; align-items: center; min-height: 44px; padding-left: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-muted); }
.track-search__input:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); }
.track-search__input i { font-size: 12px; }
.track-search__input input { min-height: 42px; border: 0; background: transparent; box-shadow: none; }
.track-search__input input:focus { border: 0; box-shadow: none; }
.music-kind-switch { display: flex; flex: 0 0 auto; gap: 2px; padding: 3px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-muted); }
.music-kind-switch button { min-height: 36px; padding: 0 10px; border: 0; border-radius: 5px; background: transparent; color: var(--color-muted); font-size: 10px; font-weight: 650; cursor: pointer; }
.music-kind-switch button.selected { background: var(--color-surface); color: var(--color-primary); box-shadow: var(--shadow-card); }
.track-search__form .editor-field { min-width: 0; }
.track-search__form .button-primary { min-height: 44px; padding: 0 14px; border-radius: var(--radius-md); font-size: 11px; }
.selected-preview { display: flex; align-items: center; gap: 10px; min-height: 58px; margin: -8px 0 0 82px; padding: 8px 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); }
.selected-preview__button { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border-radius: 50%; background: var(--color-primary); color: var(--color-primary-foreground); cursor: pointer; }
.selected-preview__button:disabled { cursor: wait; opacity: .7; }
.selected-preview__copy { display: grid; min-width: 0; flex: 1; gap: 3px; }
.selected-preview__copy strong,.selected-preview__copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.selected-preview__copy strong { color: var(--color-text); font-size: 11px; }
.selected-preview__copy small,.selected-preview__duration { color: var(--color-muted); font-size: 10px; }
.track-search__hint { padding: 5px 2px; color: var(--color-muted); font-size: 11px; }
.track-result { display: flex; align-items: center; gap: 10px; width: 100%; min-width: 0; padding: 8px; border: 1px solid transparent; border-radius: var(--radius-md); background: var(--color-surface-muted); color: var(--color-text); text-align: left; cursor: pointer; transition: border-color 140ms ease, background-color 140ms ease; }
.track-result--link { text-decoration: none; }
.track-result-row { display: flex; align-items: center; gap: 7px; }
.track-result-row .track-result { flex: 1; }
.track-result__details { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-surface); color: var(--color-primary); }
.track-result__details:hover { border-color: var(--color-primary); background: var(--color-hover); }
.track-result:hover:not(:disabled) { border-color: var(--color-primary); background: var(--color-hover); }
.track-result:disabled { cursor: wait; opacity: .7; }
.track-result img,.track-result__placeholder { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 5px; }
.track-result__placeholder { font-size: 14px; }
.track-result__copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3px; }
.track-result__copy strong,.track-result__copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.track-result__copy strong { font-size: 11px; }
.track-result__copy small,.track-result__duration { color: var(--color-muted); font-size: 10px; }
.track-result > i:last-child { color: var(--color-primary); font-size: 11px; }
.selected-track-name { display: flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-muted); color: var(--color-text); font-size: 12px; }
.selected-track-name i { color: var(--color-primary); }
.eyebrow,.field-eyebrow { display: block; color: var(--color-primary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.album-select h1 { margin-top: 4px; font-family: var(--font-heading); font-size: 21px; line-height: 1.2; }
.album-select p { margin-top: 2px; color: var(--color-muted); font-size: 11px; }
.change-album { padding: 9px 11px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-size: 10px; font-weight: 600; cursor: pointer; }
.change-album:hover { border-color: var(--color-primary); color: var(--color-primary); }
.rating-panel { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 15px; border: 1px solid var(--color-primary-container); border-radius: 9px; background: var(--color-surface-muted); }
.star-picker { display: flex; gap: 1px; margin-top: 4px; }
.star-picker button { padding: 0 1px; background: transparent; color: var(--color-muted); font-size: 25px; line-height: 1; cursor: pointer; }
.star-picker button.selected { color: var(--color-primary); }
.rating-summary { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.rating-summary span { color: var(--color-muted); font-size: 10px; }
.rating-summary strong { padding: 7px 10px; border-radius: 999px; background: var(--color-primary); color: var(--color-primary-foreground); font-size: 10px; }
.rating-number { font-family: var(--font-heading); font-size: 19px; font-weight: 700; }
.editor-row--split { display: grid; grid-template-columns: .8fr 1.2fr; gap: 16px; }
.editor-field { display: flex; min-width: 0; flex-direction: column; gap: 7px; border: 0; padding: 0; }
.field-eyebrow { display: flex; align-items: center; justify-content: space-between; color: var(--color-text); font-size: 10px; }
.field-eyebrow small { color: var(--color-muted); font-size: 9px; font-weight: 500; text-transform: none; }
.editor-field input,.editor-field select,.editor-field textarea { width: 100%; min-width: 0; padding: 11px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); outline: 0; background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 13px; transition: border-color 140ms ease, box-shadow 140ms ease; }
.editor-field input,.editor-field select { min-height: 44px; }
.editor-field textarea { min-height: 210px; resize: vertical; line-height: 1.7; }
.editor-field input:focus,.editor-field select:focus,.editor-field textarea:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); }
.format-options { display: flex; gap: 5px; }
.format-options button,.mood-options button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 0 11px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font-size: 11px; cursor: pointer; transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease; }
.format-options button.selected,.mood-options button.selected { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-primary-foreground); }
.mood-options { display: flex; flex-wrap: wrap; gap: 6px; }
.mood-options button { min-height: 32px; border-radius: 999px; }
.mood-options button i { font-size: 6px; }
.editor-settings { display: flex; flex-direction: column; gap: 2px; padding: 6px 12px; border: 1px solid var(--color-border); border-radius: 9px; background: var(--color-surface); }
.setting-row,.setting-row > span { display: flex; align-items: center; }
.setting-row { justify-content: space-between; gap: 12px; padding: 10px 2px; cursor: pointer; }
.setting-row + .setting-row { border-top: 1px solid var(--color-border); }
.setting-row > span { min-width: 0; align-items: flex-start; gap: 10px; }
.setting-row > span > i { margin-top: 3px; color: var(--color-primary); font-size: 12px; }
.setting-row > span > span { display: flex; flex-direction: column; gap: 3px; }
.setting-row strong { font-size: 11px; }
.setting-row small { color: var(--color-muted); font-size: 10px; line-height: 1.45; }
.setting-row input { width: 17px; height: 17px; accent-color: var(--color-primary); }
.compose-notice { padding: 10px 12px; border: 1px solid var(--color-primary-container); border-radius: 6px; background: var(--color-surface-muted); color: var(--color-text); font-size: 11px; line-height: 1.5; }
.editor-actions { display: flex; justify-content: flex-end; gap: 9px; padding-top: 16px; border-top: 1px solid var(--color-border); }
.editor-actions .button-primary,.editor-actions .button-secondary { min-height: 42px; padding: 0 15px; font-size: 12px; }
.editor-actions .button-secondary { background: var(--color-surface-muted); color: var(--color-text); }
.review-preview { position: sticky; top: 84px; }
.preview-heading { display: flex; justify-content: space-between; align-items: center; margin: 0 0 12px; color: var(--color-text); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.preview-heading span:first-child i { margin-right: 6px; color: var(--color-primary); }
.preview-heading span:last-child { padding: 4px 8px; border-radius: 999px; background: var(--color-primary-container); color: var(--color-primary); font-size: 9px; }
.preview-card { padding: 18px; box-shadow: var(--shadow-card); }
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
.editorial-guideline { display: flex; gap: 9px; margin-top: 14px; padding: 13px; border: 1px solid var(--color-border); border-radius: 7px; background: var(--color-surface); color: var(--color-muted); font-size: 10px; line-height: 1.55; }
.editorial-guideline i { color: var(--color-primary); }
@media (max-width: 840px) { .compose-grid { grid-template-columns: 1fr; } .review-preview { position: static; } }
@media (max-width: 560px) { .compose-container { padding: 16px 12px 40px; } .compose-topline { align-items: flex-start; } .draft-indicator { max-width: 130px; text-align: right; } .review-editor { gap: 16px; padding: 14px; } .album-select { flex-wrap: wrap; } .change-album { margin-left: auto; } .track-search__heading { align-items: flex-start; flex-direction: column; } .track-search__form { grid-template-columns: 1fr; } .track-search__form .button-primary { width: 100%; } .selected-preview { margin: -8px 0 0; } .rating-panel { flex-wrap: wrap; } .editor-row--split { grid-template-columns: 1fr; } .format-options button { flex: 1; } .editor-actions { flex-direction: column-reverse; } .editor-actions button,.editor-actions a { width: 100%; } }
</style>
