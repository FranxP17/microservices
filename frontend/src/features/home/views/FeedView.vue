<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getErrorMessagge } from "../../../utils/errorHandler";
import { musicService } from "../services/musicService";
import { socialService } from "../services/socialService";
import { useAuthStore } from "../../../stores/authStore";
import ReviewComments from "../components/ReviewComments.vue";
import { useMiniPlayer } from "../composables/useMiniPlayer";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const feedMode = ref("community");
const followingIds = ref(new Set());
const reviews = ref([]);
const activeCommentReviewId = ref("");
const reviewsLoading = ref(false);
const loadingMoreReviews = ref(false);
const reviewsPage = ref(0);
const hasMoreReviews = ref(false);
const reviewsError = ref("");
const {
  currentTrack: miniPlayerTrack,
  isPlaying: miniPlayerIsPlaying,
  playTrack: playMiniTrack,
} = useMiniPlayer();
const previewPlaying = computed(() =>
  miniPlayerIsPlaying.value && miniPlayerTrack.value?.sourceId === featuredReview.value?.id,
);
const newAlbums = ref([]);
const albumsLoading = ref(false);
const albumsError = ref("");
const featuredIndex = ref(0);
const featuredPaused = ref(false);
let featuredTimer = null;
let reviewsRequestId = 0;
const reviewsPageSize = 4;

const searchQuery = computed(() =>
  String(route.query.q ?? "")
    .trim()
    .toLowerCase(),
);
const visibleReviews = computed(() => {
  if (!searchQuery.value) return reviews.value;
  return reviews.value.filter((review) =>
    [review.author, review.album, review.artist, review.text, ...review.moods]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.value),
  );
});
const genreStats = computed(() => {
  const counts = new Map();
  reviews.value.forEach((review) => {
    review.genres.forEach((genre) =>
      counts.set(genre, (counts.get(genre) ?? 0) + 1),
    );
  });
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([name, count]) => ({
      name,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});
const trending = computed(() => genreStats.value.map((genre) => genre.name));
const featuredReviews = computed(() =>
  [...reviews.value]
    .sort(
      (a, b) =>
        b.likes +
        b.comments * 2 +
        Number(b.rating) -
        (a.likes + a.comments * 2 + Number(a.rating)),
    )
    .slice(0, 3),
);
const featuredReview = computed(
  () => featuredReviews.value[featuredIndex.value] ?? null,
);
const featuredReviewGroup = computed(() =>
  featuredReview.value
    ? reviews.value.filter(
        (review) => review.album === featuredReview.value.album,
      )
    : [],
);
const featuredRating = computed(() => {
  if (!featuredReviewGroup.value.length) return "0.0";
  const average =
    featuredReviewGroup.value.reduce(
      (sum, review) => sum + Number(review.rating),
      0,
    ) / featuredReviewGroup.value.length;
  return average.toFixed(1);
});
watch(featuredReviews, (items) => {
  if (!items.length) featuredIndex.value = 0;
  else if (featuredIndex.value >= items.length) featuredIndex.value = 0;
  if (items.length > 1) startFeaturedCarousel();
  else stopFeaturedCarousel();
});
const topReviewers = computed(() => {
  const grouped = new Map();
  for (const review of reviews.value) {
    if (!review.userId) continue;
    const key = String(review.userId).toLowerCase();
    const reviewer = grouped.get(key) ?? {
      userId: review.userId,
      author: review.author,
      handle: review.handle,
      avatar: review.avatar,
      count: 0,
    };
    reviewer.count += 1;
    grouped.set(key, reviewer);
  }
  return [...grouped.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((reviewer) => ({
      ...reviewer,
      following: followingIds.value.has(String(reviewer.userId).toLowerCase()),
    }));
});

function getAlbumArtist(album) {
  const artist = album.artist ?? album.Artist;
  if (typeof artist === "string") return artist;
  const artists = album.artists ?? album.Artists ?? [];
  const artistList = artists
    .map((item) => (typeof item === "string" ? item : (item.name ?? item.Name)))
    .filter(Boolean)
    .join(", ");
  return artistList || artist?.name || artist?.Name || "Artista no disponible";
}

async function loadNewAlbums() {
  albumsLoading.value = true;
  albumsError.value = "";
  const firstGenre = genreStats.value[0]?.name;
  const queries = [...new Set([firstGenre, "popular", "rock"].filter(Boolean))];
  let lastError = null;

  try {
    for (const query of queries) {
      try {
        const response = await musicService.searchDeezer(query, "album");
        const source = Array.isArray(response)
          ? response
          : response?.data ?? response?.Data ?? response?.albums ?? response?.Albums ?? response?.items ?? response?.Items ?? [];
        const albums = source.filter((album) => album?.id || album?.Id).slice(0, 4).map((album) => ({
          id: album.id ?? album.Id,
          title: album.title ?? album.name ?? album.Title ?? album.Name ?? "Álbum",
          artist: getAlbumArtist(album),
          cover: album.cover_medium ?? album.cover ?? album.imageUrl ?? album.ImageUrl ?? "",
          releaseDate: album.release_date ?? album.releaseDate ?? album.ReleaseDate ?? "",
          externalId: String(album.id ?? album.Id ?? ""),
        }));
        if (albums.length) {
          newAlbums.value = albums;
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }

    newAlbums.value = [];
    albumsError.value = lastError
      ? getErrorMessagge(lastError)
      : "Deezer no devolvió álbumes para estas búsquedas.";
  } finally {
    albumsLoading.value = false;
  }
}

function retryAlbums() {
  void loadNewAlbums();
}

function valueOf(object, camelCase, pascalCase) {
  return object?.[camelCase] ?? object?.[pascalCase];
}

function getArtistNames(track) {
  const artists =
    track?.artists ??
    track?.Artists ??
    track?.artistDetails ??
    track?.ArtistDetails ??
    (track?.artist ? [track.artist] : track?.Artist ? [track.Artist] : []);
  return artists
    .map((artist) =>
      typeof artist === "string" ? artist : (artist.name ?? artist.Name),
    )
    .filter(Boolean)
    .join(", ");
}

async function loadReviews({ append = false } = {}) {
  if (
    append &&
    (loadingMoreReviews.value || reviewsLoading.value || !hasMoreReviews.value)
  )
    return;

  const requestId = ++reviewsRequestId;
  const requestPage = append ? reviewsPage.value + 1 : 1;
  if (append) {
    loadingMoreReviews.value = true;
  } else {
    reviewsLoading.value = true;
    loadingMoreReviews.value = false;
    reviews.value = [];
    reviewsPage.value = 0;
    hasMoreReviews.value = false;
  }
  reviewsError.value = "";
  try {
    const response = await socialService.getReviewPage(
      feedMode.value === "following" ? { following: true } : {},
      requestPage,
      reviewsPageSize,
    );
    const source = Array.isArray(response)
      ? response
      : (response?.items ?? response?.Items ?? response?.data ?? []);
    const mapped = await Promise.all(
      source.map(async (item) => {
        const musicItemId = valueOf(item, "musicItemId", "MusicItemId");
        let track = null;
        let musicType = "song";
        try {
          if (musicItemId)
            track = await musicService.getItem("song", musicItemId);
        } catch {
          try {
            if (musicItemId) {
              track = await musicService.getItem("album", musicItemId);
              musicType = "album";
            }
          } catch {
            track = null;
          }
        }

        const profile = item.profile ?? item.Profile ?? {};
        const author = profile.name ?? profile.Name ?? "Miembro de Faudix";
        const albumValue = track?.album ?? track?.Album;
        const albumTitle =
          musicType === "album"
            ? (track?.title ?? track?.Title ?? "Álbum")
            : typeof albumValue === "string"
              ? albumValue
              : (albumValue?.title ?? albumValue?.Title ?? "Álbum");
        const musicTitle = track?.title ?? track?.Title ?? albumTitle;
        const albumId =
          musicType === "album" ? musicItemId : valueOf(albumValue, "id", "Id");
        const firstAlbumTrack = track?.tracks?.[0] ?? track?.Tracks?.[0];
        const previewUrl =
          track?.previewUrl ??
          track?.PreviewUrl ??
          firstAlbumTrack?.previewUrl ??
          firstAlbumTrack?.PreviewUrl ??
          "";
        return {
          id: valueOf(item, "id", "Id"),
          userId: valueOf(item, "userId", "UserId"),
          musicItemId,
          musicType,
          musicTitle,
          albumTitle,
          albumId,
          externalId: valueOf(track, "externalId", "ExternalId"),
          previewTitle: valueOf(firstAlbumTrack, "title", "Title"),
          previewExternalId: valueOf(
            firstAlbumTrack,
            "externalId",
            "ExternalId",
          ),
          author,
          initials: author
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase(),
          handle: profile.username ?? profile.Username ?? "",
          avatar: profile.avatarUrl ?? profile.AvatarUrl ?? "",
          cover:
            musicType === "album"
              ? (track?.imageUrl ?? track?.ImageUrl ?? "")
              : (track?.albumImageUrl ??
                track?.AlbumImageUrl ??
                albumValue?.imageUrl ??
                albumValue?.ImageUrl ??
                track?.imageUrl ??
                track?.ImageUrl ??
                ""),
          album: albumTitle,
          artist: getArtistNames(track) || "Artista no disponible",
          previewUrl,
          rating: Number(valueOf(item, "rating", "Rating") ?? 0).toFixed(1),
          genres: (track?.genres ?? track?.Genres ?? [])
            .map((genre) =>
              typeof genre === "string" ? genre : (genre.name ?? genre.Name),
            )
            .filter(Boolean),
          text: valueOf(item, "comment", "Comment") ?? "",
          likes: Number(valueOf(item, "likesCount", "LikesCount") ?? 0),
          comments: Number(
            valueOf(item, "commentsCount", "CommentsCount") ?? 0,
          ),
          liked: Boolean(valueOf(item, "isLiked", "IsLiked")),
        };
      }),
    );
    if (requestId !== reviewsRequestId) return;
    if (append) {
      const currentIds = new Set(
        reviews.value.map((review) => String(review.id)),
      );
      reviews.value = [
        ...reviews.value,
        ...mapped.filter((review) => !currentIds.has(String(review.id))),
      ];
    } else {
      reviews.value = mapped;
    }
    reviewsPage.value = Number(response?.page ?? response?.Page ?? requestPage);
    hasMoreReviews.value = Boolean(response?.hasNext ?? response?.HasNext);
  } catch (error) {
    if (requestId === reviewsRequestId)
      reviewsError.value = getErrorMessagge(error);
  } finally {
    if (requestId === reviewsRequestId) {
      reviewsLoading.value = false;
      loadingMoreReviews.value = false;
    }
  }
}

function loadMoreReviews() {
  return loadReviews({ append: true });
}

function toggleReviewComments(review) {
  activeCommentReviewId.value =
    activeCommentReviewId.value === String(review.id) ? "" : String(review.id);
}

async function toggleLike(review) {
  const wasLiked = review.liked;
  review.liked = !wasLiked;
  review.likes += wasLiked ? -1 : 1;
  try {
    if (review.liked) await socialService.likeReview(review.id);
    else await socialService.unlikeReview(review.id);
  } catch (error) {
    review.liked = wasLiked;
    review.likes += wasLiked ? 1 : -1;
    reviewsError.value = getErrorMessagge(error);
  }
}

async function loadFollowing() {
  if (!authStore.user?.id) return;
  try {
    const response = await socialService.getFollowing(authStore.user.id);
    const relations = Array.isArray(response)
      ? response
      : (response?.data ?? []);
    followingIds.value = new Set(
      relations.map((item) => String(item.id ?? item.Id).toLowerCase()),
    );
  } catch {
    followingIds.value = new Set();
  }
}

async function toggleFollow(reviewer) {
  if (
    !reviewer.userId ||
    String(reviewer.userId) === String(authStore.user?.id)
  )
    return;
  const key = String(reviewer.userId).toLowerCase();
  const wasFollowing = followingIds.value.has(key);
  const next = new Set(followingIds.value);
  if (wasFollowing) next.delete(key);
  else next.add(key);
  followingIds.value = next;

  try {
    if (wasFollowing) await socialService.unfollow(reviewer.userId);
    else await socialService.follow(reviewer.userId);
  } catch (error) {
    const reverted = new Set(followingIds.value);
    if (wasFollowing) reverted.add(key);
    else reverted.delete(key);
    followingIds.value = reverted;
    reviewsError.value = getErrorMessagge(error);
  }
}

function searchTrend(term) {
  router.push({ name: "home", query: { q: term } });
}

async function shareFeatured() {
  try {
    const title = featuredReview.value?.album ?? "Faudix";
    if (navigator.share) {
      await navigator.share({ title, url: location.href });
    } else {
      await navigator.clipboard?.writeText(location.href);
    }
  } catch {
    // Sharing can be dismissed by the user.
  }
}

async function togglePreview(review) {
  const played = await playMiniTrack({
    ...review,
    id: review.musicItemId,
    sourceId: review.id,
    title: review.musicTitle,
    cover: review.cover,
    previewTitle: review.previewTitle ?? review.musicTitle,
    previewExternalId: review.previewExternalId ?? review.externalId,
  });
  if (!played) reviewsError.value = "No se pudo reproducir la preview de esta obra.";
}

function showFeatured(index) {
  const total = featuredReviews.value.length;
  if (!total) return;
  featuredIndex.value = (index + total) % total;
}

function navigateFeatured(index) {
  stopFeaturedCarousel();
  showFeatured(index);
  startFeaturedCarousel();
}

function stopFeaturedCarousel() {
  if (!featuredTimer) return;
  clearInterval(featuredTimer);
  featuredTimer = null;
}

function startFeaturedCarousel() {
  if (
    featuredPaused.value ||
    featuredReviews.value.length < 2 ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  if (featuredTimer) return;
  featuredTimer = setInterval(
    () => showFeatured(featuredIndex.value + 1),
    6500,
  );
}

function toggleFeaturedPause() {
  featuredPaused.value = !featuredPaused.value;
  if (featuredPaused.value) stopFeaturedCarousel();
  else startFeaturedCarousel();
}

function handleFeaturedFocusOut(event) {
  if (!event.currentTarget.contains(event.relatedTarget))
    startFeaturedCarousel();
}

function handleVisibilityChange() {
  if (document.hidden) stopFeaturedCarousel();
  else startFeaturedCarousel();
}

onMounted(() => {
  loadReviews();
  loadFollowing();
  loadNewAlbums();
  startFeaturedCarousel();
  document.addEventListener("visibilitychange", handleVisibilityChange);
});
onBeforeUnmount(() => {
  stopFeaturedCarousel();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
watch(feedMode, () => loadReviews());
</script>

<template>
  <main class="feed-page">
    <div class="trend-strip" aria-label="Tendencias musicales">
      <span class="trend-strip__label"
        ><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> En
        tendencia</span
      >
      <button
        v-for="term in trending"
        :key="term"
        type="button"
        @click="searchTrend(term)"
      >
        {{ term }}
      </button>
      <span class="trend-strip__note"
        ><i class="fa-solid fa-headphones" aria-hidden="true"></i>
        {{ reviews.length }} reseñas de la comunidad</span
      >
    </div>

    <div class="feed-container">
      <div
        v-if="featuredReview"
        class="featured-carousel"
        @mouseenter="stopFeaturedCarousel"
        @mouseleave="startFeaturedCarousel"
        @focusin="stopFeaturedCarousel"
        @focusout="handleFeaturedFocusOut"
      >
        <Transition name="featured-slide" mode="out-in">
          <section
            :key="featuredReview.id"
            class="featured-album"
            aria-labelledby="featured-title"
          >
            <div class="featured-album__art-wrap">
              <img
                v-if="featuredReview.cover"
                class="featured-album__art"
                :src="featuredReview.cover"
                :alt="`Portada de ${featuredReview.album}`"
              />
              <span v-else class="featured-album__placeholder"
                ><i class="fa-solid fa-music" aria-hidden="true"></i
              ></span>
              <span class="featured-album__badge"
                ><i class="fa-solid fa-circle" aria-hidden="true"></i> Destacada
                en Faudix</span
              >
              <span class="featured-album__length"
                >{{ featuredReview.rating }} / 5</span
              >
            </div>
            <div class="featured-album__body">
              <div class="tag-row">
                <span class="tag tag--primary">{{ featuredReview.musicType === "album" ? "Álbum reseñado" : "Canción reseñada" }}</span>
              </div>
              <div>
                <p class="eyebrow">
                  {{
                    featuredReview.musicType === "album"
                      ? "Álbum reseñado por"
                      : "Canción reseñada por"
                  }}
                  {{ featuredReview.author }}
                </p>
                <h1 id="featured-title">{{ featuredReview.musicTitle }}</h1>
                <p class="featured-album__artist">
                  {{ featuredReview.artist
                  }}<span
                    v-if="
                      featuredReview.musicType === 'song' &&
                      featuredReview.albumTitle
                    "
                  >
                    · {{ featuredReview.albumTitle }}</span
                  >
                </p>
              </div>
              <div
                class="aggregate-rating"
                :aria-label="`Puntuación media ${featuredRating} de 5, basada en ${featuredReviewGroup.length} reseñas`"
              >
                <span class="aggregate-rating__stars" aria-hidden="true"
                  >★★★★★</span
                >
                <strong>{{ featuredRating }}</strong
                ><span class="aggregate-rating__out-of">/ 5.0</span>
                <span class="aggregate-rating__divider"></span>
                <small
                  >Basado en
                  <b>{{ featuredReviewGroup.length }} reseñas</b></small
                >
              </div>
              <blockquote class="featured-album__quote">
                {{ featuredReview.title }}: {{ featuredReview.text }}
              </blockquote>
              <div class="featured-album__actions">
                <button
                  class="button-primary"
                  type="button"
                  :aria-pressed="previewPlaying"
                  @click="togglePreview(featuredReview)"
                >
                  <i
                    class="fa-solid"
                    :class="previewPlaying ? 'fa-pause' : 'fa-play'"
                    aria-hidden="true"
                  ></i>
                  {{
                    previewPlaying
                      ? "Pausar preview"
                      : featuredReview.previewUrl
                        ? "Reproducir preview"
                        : "Buscar preview"
                  }}
                </button>
                <RouterLink
                  v-if="
                    featuredReview.musicType === 'album' &&
                    featuredReview.albumId
                  "
                  class="button-secondary"
                  :to="{
                    name: 'album-detail',
                    params: { externalId: featuredReview.albumId },
                  }"
                >
                  <i class="fa-regular fa-message" aria-hidden="true"></i>
                  Detalles del álbum
                </RouterLink>
                <RouterLink
                  class="button-secondary featured-review-link"
                  :to="{
                    name: 'write-review',
                    query: {
                      musicItemId: featuredReview.musicItemId,
                      kind: featuredReview.musicType,
                    },
                  }"
                >
                  <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i>
                  Reseñar
                  {{
                    featuredReview.musicType === "album" ? "álbum" : "canción"
                  }}
                </RouterLink>
                <RouterLink
                  v-if="featuredReview.userId"
                  class="button-secondary"
                  :to="{
                    name: 'profile',
                    params: { userId: featuredReview.userId },
                  }"
                  >Ver perfil</RouterLink
                >
                <button
                  class="icon-action featured-share"
                  type="button"
                  aria-label="Compartir reseña destacada"
                  @click="shareFeatured"
                >
                  <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </section>
        </Transition>
        <div
          v-if="featuredReviews.length > 1"
          class="featured-carousel__controls"
          aria-label="Controles de reseñas destacadas"
        >
          <button
            type="button"
            aria-label="Reseña anterior"
            @click="navigateFeatured(featuredIndex - 1)"
          >
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          </button>
          <div
            class="featured-carousel__dots"
            role="group"
            aria-label="Elegir reseña destacada"
          >
            <button
              v-for="(review, index) in featuredReviews"
              :key="review.id"
              type="button"
              :aria-label="`Mostrar reseña ${index + 1}`"
              :aria-pressed="featuredIndex === index"
              :class="{ active: featuredIndex === index }"
              @click="navigateFeatured(index)"
            ></button>
          </div>
          <span>{{ featuredIndex + 1 }} / {{ featuredReviews.length }}</span>
          <button
            type="button"
            aria-label="Siguiente reseña"
            @click="navigateFeatured(featuredIndex + 1)"
          >
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            :aria-label="
              featuredPaused ? 'Reanudar carrusel' : 'Pausar carrusel'
            "
            :aria-pressed="featuredPaused"
            @click="toggleFeaturedPause"
          >
            <i
              class="fa-solid"
              :class="featuredPaused ? 'fa-play' : 'fa-pause'"
              aria-hidden="true"
            ></i>
          </button>
        </div>
      </div>
      <p v-else-if="!reviewsLoading" class="featured-empty">
        Cuando la comunidad publique reseñas, aquí aparecerá una obra destacada.
      </p>

      <div class="feed-columns">
        <section
          id="community"
          class="community-feed"
          aria-labelledby="community-title"
        >
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Voces de la comunidad</p>
              <h2 id="community-title">
                {{
                  feedMode === "following"
                    ? "De quienes sigues"
                    : "Reseñas de la comunidad"
                }}
              </h2>
            </div>
            <div class="feed-mode" role="group" aria-label="Filtrar feed">
              <button
                type="button"
                :aria-pressed="feedMode === 'community'"
                :class="{ selected: feedMode === 'community' }"
                @click="feedMode = 'community'"
              >
                Comunidad
              </button>
              <button
                type="button"
                :aria-pressed="feedMode === 'following'"
                :class="{ selected: feedMode === 'following' }"
                @click="feedMode = 'following'"
              >
                Siguiendo
              </button>
            </div>
          </div>

          <p
            v-if="reviewsError"
            class="feed-state feed-state--error"
            role="alert"
          >
            {{ reviewsError }}
          </p>
          <p
            v-if="reviewsLoading && !reviews.length"
            class="feed-state"
            role="status"
          >
            Cargando reseñas de la comunidad...
          </p>
          <p v-if="searchQuery" class="search-summary">
            Resultados para “{{ route.query.q }}”
          </p>
          <article
            v-for="review in visibleReviews"
            :key="review.id"
            class="review-card"
          >
            <div class="review-card__top">
              <div class="review-author">
                <img
                  v-if="review.avatar"
                  :src="review.avatar"
                  :alt="`Retrato de ${review.author}`"
                />
                <span v-else class="review-author__avatar" aria-hidden="true">{{
                  review.initials
                }}</span>
                <div>
                  <div class="review-author__name">
                    <RouterLink
                      v-if="review.userId"
                      class="review-author__profile"
                      :to="{
                        name: 'profile',
                        params: { userId: review.userId },
                      }"
                      >{{ review.author }}</RouterLink
                    >
                    <strong v-else>{{ review.author }}</strong>
                    <span class="tag tag--small">{{ review.role }}</span>
                  </div>
                  <p>@{{ review.handle || "miembro" }}</p>
                </div>
              </div>
              <div class="review-score">
                <span aria-hidden="true">★★★★★</span
                ><strong>{{ review.rating }}</strong>
              </div>
            </div>

            <RouterLink
              v-if="review.musicType === 'album' && review.albumId"
              class="review-album review-album-link"
              :to="{
                name: 'album-detail',
                params: { externalId: review.albumId },
              }"
            >
              <img
                v-if="review.cover"
                :src="review.cover"
                :alt="`Arte de ${review.album}`"
              />
              <span v-else class="review-album__placeholder"
                ><i class="fa-solid fa-compact-disc" aria-hidden="true"></i
              ></span>
              <div>
                <small class="review-work-kind">Álbum reseñado</small
                ><strong>{{ review.musicTitle }}</strong
                ><span>{{ review.artist }}</span>
              </div>
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </RouterLink>
            <div v-else class="review-album">
              <img
                v-if="review.cover"
                :src="review.cover"
                :alt="`Arte de ${review.album}`"
              />
              <span v-else class="review-album__placeholder"
                ><i class="fa-solid fa-music" aria-hidden="true"></i
              ></span>
              <div>
                <small class="review-work-kind">Canción reseñada</small
                ><strong>{{ review.musicTitle }}</strong
                ><span
                  >{{ review.artist
                  }}<template v-if="review.albumTitle">
                    · {{ review.albumTitle }}</template
                  ></span
                >
              </div>
              <button
                class="review-track-play"
                type="button"
                :aria-label="
                  miniPlayerTrack?.sourceId === review.id && miniPlayerIsPlaying
                    ? `Pausar ${review.musicTitle}`
                    : `Reproducir ${review.musicTitle}`
                "
                :title="
                  review.previewUrl ? 'Reproducir preview' : 'Buscar preview'
                "
                @click="togglePreview(review)"
              >
                <i
                  class="fa-solid"
                  :class="
                    miniPlayerTrack?.sourceId === review.id && miniPlayerIsPlaying
                      ? 'fa-pause'
                      : 'fa-play'
                  "
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            <div class="review-card__copy">
              <h3 class="review-card__title">{{ review.title }}</h3>
              <p>{{ review.text }}</p>
              <blockquote v-if="review.quote">“{{ review.quote }}”</blockquote>
            </div>

            <footer class="review-card__footer">
              <div class="review-work-label">
                <span>
                  <i class="fa-solid" :class="review.musicType === 'album' ? 'fa-compact-disc' : 'fa-music'" aria-hidden="true"></i>
                  {{ review.musicType === "album" ? "Álbum reseñado" : "Canción reseñada" }}
                </span>
              </div>
              <div class="review-actions">
                <button
                  type="button"
                  :class="{ 'is-liked': review.liked }"
                  :aria-pressed="review.liked"
                  @click="toggleLike(review)"
                >
                  <i class="fa-solid fa-thumbs-up" aria-hidden="true"></i>
                  {{ review.likes }}
                </button>
                <button
                  type="button"
                  :aria-expanded="activeCommentReviewId === String(review.id)"
                  :aria-label="`Opiniones de la reseña, ${review.comments}`"
                  @click="toggleReviewComments(review)"
                >
                  <i class="fa-regular fa-comment" aria-hidden="true"></i>
                  {{ review.comments }}
                </button>
                <button type="button" aria-label="Guardar reseña">
                  <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
                </button>
              </div>
            </footer>
            <ReviewComments
              v-if="activeCommentReviewId === String(review.id)"
              :review-id="String(review.id)"
              @count-updated="review.comments = $event"
            />
          </article>
          <p
            v-if="!reviewsLoading && !visibleReviews.length"
            class="empty-results"
          >
            {{
              searchQuery
                ? "No encontramos reseñas que coincidan con tu búsqueda."
                : "Todavía no hay reseñas publicadas por la comunidad."
            }}
          </p>
          <div v-if="hasMoreReviews" class="feed-pagination">
            <button
              type="button"
              class="button-secondary"
              :disabled="loadingMoreReviews"
              @click="loadMoreReviews"
            >
              <i
                class="fa-solid"
                :class="
                  loadingMoreReviews ? 'fa-spinner fa-spin' : 'fa-arrow-down'
                "
                aria-hidden="true"
              ></i>
              {{
                loadingMoreReviews ? "Cargando reseñas" : "Cargar más reseñas"
              }}
            </button>
          </div>

          <section
            id="new-releases"
            class="release-section"
            aria-labelledby="release-title"
          >
            <div class="section-title-row section-title-row--release">
              <div>
                <p class="eyebrow">Descubre en Deezer</p>
                <h2 id="release-title">Álbumes para reseñar</h2>
                <p>
                  Encuentra una obra y busca sus canciones para escribir una
                  reseña.
                </p>
              </div>
            </div>
            <p v-if="albumsLoading" class="feed-state" role="status">
              Buscando álbumes...
            </p>
            <div class="release-grid">
              <article
                v-for="release in newAlbums"
                :key="release.externalId"
                class="release-card"
              >
                <div class="release-card__art-wrap">
                  <img
                    v-if="release.cover"
                    :src="release.cover"
                    :alt="`Portada de ${release.title}`"
                  />
                  <span v-else class="release-placeholder"
                    ><i class="fa-solid fa-compact-disc" aria-hidden="true"></i
                  ></span>
                </div>
                <h3>{{ release.title }}</h3>
                <p>{{ release.artist }}</p>
                <div class="release-card__meta">
                  <span>{{ release.releaseDate || "Deezer" }}</span
                  ><RouterLink
                    class="release-review-link"
                    :to="{
                      name: 'album-detail',
                      params: { externalId: release.externalId },
                    }"
                    >Detalles</RouterLink
                  >
                </div>
              </article>
            </div>
            <p v-if="!albumsLoading && albumsError" class="feed-state feed-state--error" role="alert">
              {{ albumsError }}
              <button class="album-retry" type="button" @click="retryAlbums">Reintentar</button>
            </p>
            <p v-else-if="!albumsLoading && !newAlbums.length" class="empty-results">
              No hay álbumes para mostrar por ahora.
            </p>
          </section>
        </section>

        <aside class="feed-sidebar" aria-label="Descubrimiento">
          <section id="critics" class="sidebar-module">
            <div class="sidebar-module__heading">
              <h2>Críticos de la semana</h2>
              <span class="live-label">En vivo</span>
            </div>
            <ol class="critic-list">
              <li v-for="(critic, index) in topReviewers" :key="critic.userId">
                <span>{{ index + 1 }}</span>
                <img
                  v-if="critic.avatar"
                  :src="critic.avatar"
                  :alt="`Retrato de ${critic.author}`"
                />
                <span v-else class="critic-avatar-fallback">{{
                  critic.author.slice(0, 1).toUpperCase()
                }}</span>
                <div>
                  <RouterLink
                    :to="{ name: 'profile', params: { userId: critic.userId } }"
                    >{{ critic.author }}</RouterLink
                  >
                  <small
                    >{{ critic.count }} reseñas ·
                    {{ critic.handle ? `@${critic.handle}` : "Faudix" }}</small
                  >
                </div>
                <button
                  v-if="String(critic.userId) !== String(authStore.user?.id)"
                  type="button"
                  :aria-pressed="critic.following"
                  @click="toggleFollow(critic)"
                >
                  {{ critic.following ? "Siguiendo" : "Seguir" }}
                </button>
              </li>
              <li v-if="!topReviewers.length" class="critic-empty">
                Aún no hay autores destacados.
              </li>
            </ol>
          </section>

          <section class="sidebar-module genre-module">
            <div class="sidebar-module__heading">
              <h2>Géneros de la comunidad</h2>
            </div>
            <div
              v-for="genre in genreStats"
              :key="genre.name"
              class="genre-meter"
            >
              <div>
                <span>{{ genre.name }}</span
                ><b>{{ genre.count }}</b>
              </div>
              <span><i :style="{ width: `${genre.percentage}%` }"></i></span>
            </div>
            <p v-if="!genreStats.length" class="sidebar-empty">
              Todavía no hay suficientes reseñas.
            </p>
          </section>

          <section class="publish-callout">
            <span>Tu voz cuenta</span>
            <h2>¿Escuchaste algo nuevo hoy?</h2>
            <p>Comparte tu mirada y ayuda a descubrir el próximo gran disco.</p>
            <RouterLink :to="{ name: 'write-review' }"
              >Publicar crítica</RouterLink
            >
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.feed-page {
  min-height: calc(100vh - 64px);
  background: var(--color-background);
}

.trend-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px max(16px, calc((100vw - 1320px) / 2));
  overflow-x: auto;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  white-space: nowrap;
}

.trend-strip__label,
.trend-strip__note {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.trend-strip__label {
  color: var(--color-primary);
}
.trend-strip__note {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  text-transform: none;
}
.trend-strip button,
.tag,
.mood-tags span {
  flex: 0 0 auto;
  padding: 6px 11px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 11px;
  font-weight: 600;
}
.trend-strip button {
  cursor: pointer;
}
.trend-strip button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.feed-container {
  width: min(1320px, 100%);
  margin: 0 auto;
  padding: 24px clamp(16px, 3vw, 40px) 72px;
}
.featured-carousel {
  display: grid;
  gap: 10px;
}
.featured-carousel__controls {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 8px;
  min-height: 38px;
}
.featured-carousel__controls > button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}
.featured-carousel__controls > button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.featured-carousel__controls > span {
  color: var(--color-muted);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}
.featured-carousel__dots {
  display: flex;
  align-items: center;
  gap: 5px;
}
.featured-carousel__dots button {
  width: 7px;
  height: 7px;
  padding: 0;
  border-radius: 999px;
  background: var(--color-border);
  cursor: pointer;
  transition:
    width 150ms ease,
    background-color 150ms ease;
}
.featured-carousel__dots button.active {
  width: 18px;
  background: var(--color-primary);
}
.featured-slide-enter-active,
.featured-slide-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}
.featured-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.featured-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
.featured-empty {
  padding: 30px;
  border: 1px dashed var(--color-border);
  border-radius: 12px;
  color: var(--color-muted);
  font-size: 13px;
  text-align: center;
}
.featured-album {
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.4fr);
  gap: clamp(24px, 4vw, 56px);
  align-items: center;
  padding: clamp(22px, 4vw, 48px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
.featured-album__art-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 10px;
  background: var(--color-surface-muted);
}
.featured-album__art {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.featured-album__placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background: var(--color-surface-muted);
  color: var(--color-primary);
  font-size: 44px;
}
.featured-album__badge,
.featured-album__length {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 92%);
  color: var(--color-primary);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}
.featured-album__badge {
  top: 12px;
  left: 12px;
}
.featured-album__badge i {
  font-size: 7px;
}
.featured-album__length {
  right: 12px;
  bottom: 12px;
  border-radius: 5px;
  background: rgb(19 27 46 / 82%);
  color: #fff;
  text-transform: none;
}
.featured-album__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.tag {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border: 0;
  font-size: 10px;
  text-transform: uppercase;
}
.tag--primary {
  background: var(--color-primary-container);
  color: var(--color-primary);
}
.tag--small {
  padding: 4px 8px;
  font-size: 9px;
}
.eyebrow {
  margin-bottom: 6px;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}
.featured-album h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(30px, 4vw, 52px);
  font-weight: 800;
  line-height: 1.08;
}
.featured-album__artist {
  margin-top: 8px;
  color: var(--color-muted);
  font-size: 14px;
}
.featured-album__artist strong {
  color: var(--color-text);
}
.aggregate-rating {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--color-surface-muted);
}
.aggregate-rating__stars {
  color: var(--color-primary);
  font-size: 20px;
  letter-spacing: 0;
}
.aggregate-rating strong {
  font-family: var(--font-heading);
  font-size: 24px;
}
.aggregate-rating__out-of {
  margin-left: -6px;
  color: var(--color-muted);
  font-size: 11px;
}
.aggregate-rating__divider {
  width: 4px;
  height: 4px;
  margin: 0 3px;
  border-radius: 50%;
  background: var(--color-muted);
}
.aggregate-rating small {
  color: var(--color-muted);
  font-size: 11px;
}
.aggregate-rating small b {
  color: var(--color-text);
}
.featured-album__quote {
  margin: 0;
  padding-left: 14px;
  border-left: 2px solid var(--color-primary-container);
  color: var(--color-muted);
  font-size: 14px;
  font-style: italic;
  line-height: 1.7;
}
.featured-album__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.featured-album__actions > * {
  min-width: 0;
  max-width: 100%;
}
.featured-review-link {
  width: auto;
  padding: 0 12px;
  white-space: normal;
}
.featured-share {
  flex: 0 0 40px;
}
.button-primary,
.button-secondary,
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 15px;
  border: 1px solid var(--color-border);
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}
.button-primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}
.button-primary:hover {
  background: var(--color-primary-dark);
}
.button-secondary,
.icon-action {
  background: var(--color-surface);
  color: var(--color-text);
}
.button-secondary i,
.icon-action i {
  color: var(--color-primary);
}
.button-secondary:hover,
.icon-action:hover {
  border-color: var(--color-primary);
  background: var(--color-hover);
}
.icon-action {
  width: 40px;
  padding: 0;
}
.feed-columns {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 0.92fr);
  align-items: start;
  gap: 28px;
  margin-top: 36px;
}
.community-feed,
.feed-sidebar {
  min-width: 0;
}
.community-feed {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-title-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}
.section-title-row h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 22px;
  line-height: 1.3;
}
.section-title-row .eyebrow {
  margin-bottom: 3px;
}
.feed-mode {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
}
.feed-mode button {
  min-height: 30px;
  padding: 0 10px;
  border-radius: 4px;
  background: transparent;
  color: var(--color-muted);
  font-size: 10px;
  font-weight: 650;
  cursor: pointer;
}
.feed-mode button.selected {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-card);
}
.sort-button {
  padding: 7px 0 5px 10px;
  background: transparent;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.sort-button i {
  margin-left: 4px;
  font-size: 10px;
}
.search-summary {
  margin: -5px 0 2px;
  color: var(--color-muted);
  font-size: 13px;
}
.review-card,
.sidebar-module {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
}
.review-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.review-card__top,
.review-author,
.review-author__name,
.review-card__footer,
.review-actions,
.review-album {
  display: flex;
  align-items: center;
}
.review-card__top {
  justify-content: space-between;
  gap: 14px;
}
.review-author {
  min-width: 0;
  gap: 10px;
}
.review-author img {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 50%;
  object-fit: cover;
}
.review-author__avatar {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-container);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}
.review-author__name {
  flex-wrap: wrap;
  gap: 7px;
}
.review-author__name strong {
  font-size: 13px;
}
.review-author__profile {
  color: var(--color-text);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.review-author__profile:hover {
  color: var(--color-primary);
}
.review-author p {
  margin-top: 3px;
  color: var(--color-muted);
  font-size: 11px;
}
.review-score {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  padding: 7px 9px;
  border-radius: 6px;
  background: var(--color-surface-muted);
}
.review-score span {
  color: var(--color-primary);
  font-size: 13px;
  letter-spacing: 0;
}
.review-score strong {
  font-size: 12px;
}
.review-album {
  gap: 10px;
  padding: 8px;
  border-radius: 7px;
  background: var(--color-surface-muted);
}
.review-album-link {
  width: 100%;
  color: inherit;
  text-decoration: none;
  transition: background-color 140ms ease;
}
.review-album-link:hover {
  background: var(--color-hover);
}
.review-work-kind {
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 750;
  text-transform: uppercase;
}
.review-track-play {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-primary);
  cursor: pointer;
}
.review-track-play:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}
.review-track-play:disabled {
  color: var(--color-muted);
  cursor: not-allowed;
  opacity: 0.6;
}
.review-album img,
.review-album__placeholder {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 4px;
  background: var(--color-primary-container);
  color: var(--color-primary);
  object-fit: cover;
}
.review-album div {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.review-album strong,
.review-album span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.review-album strong {
  font-size: 12px;
}
.review-album span {
  color: var(--color-muted);
  font-size: 11px;
}
.review-album > i {
  color: var(--color-muted);
  font-size: 11px;
}
.review-card__copy {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.65;
}
.review-card__title {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 16px;
  line-height: 1.35;
}
.review-card__copy blockquote {
  margin: 0;
  padding: 12px 14px;
  border-radius: 6px;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-style: italic;
}
.review-card__footer {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
}
.review-work-label {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.review-work-label span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 0 9px;
  border: 1px solid var(--color-primary-container);
  border-radius: 999px;
  background: var(--color-primary-container);
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
}
.mood-tags,
.review-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.mood-tags span {
  padding: 5px 9px;
  border: 0;
  font-size: 10px;
}
.mood-tags span:first-child {
  background: var(--color-primary-container);
  color: var(--color-primary);
}
.review-actions {
  gap: 14px;
}
.review-actions button {
  padding: 4px 0;
  background: transparent;
  color: var(--color-muted);
  font-size: 11px;
  cursor: pointer;
}
.review-actions button:hover,
.review-actions button.is-liked {
  color: var(--color-primary);
}
.empty-results {
  padding: 24px;
  border: 1px dashed var(--color-border);
  border-radius: 8px;
  color: var(--color-muted);
  text-align: center;
}
.feed-state {
  padding: 14px;
  border-radius: 7px;
  background: var(--color-surface);
  color: var(--color-muted);
  font-size: 12px;
}
.feed-state--error {
  border: 1px solid var(--color-danger-border);
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
.feed-pagination {
  display: flex;
  justify-content: center;
  padding: 8px 0 4px;
}
.release-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}
.section-title-row--release {
  align-items: center;
}
.section-title-row--release p:not(.eyebrow) {
  margin-top: 5px;
  color: var(--color-muted);
  font-size: 12px;
}
.section-title-row--release > a,
.sidebar-module__heading > a {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}
.section-title-row--release > a i {
  margin-left: 4px;
}
.release-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.release-card {
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
}
.release-card__art-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 5px;
  background: var(--color-surface-muted);
}
.release-card__art-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 180ms ease;
}
.release-placeholder {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  background: var(--color-surface-muted);
  color: var(--color-primary);
  font-size: 30px;
}
.release-card:hover img {
  transform: scale(1.03);
}
.release-card__art-wrap > span {
  position: absolute;
  top: 7px;
  right: 7px;
  padding: 4px 6px;
  border-radius: 999px;
  background: rgb(19 27 46 / 82%);
  color: white;
  font-size: 10px;
  font-weight: 700;
}
.release-card__art-wrap > span i {
  color: #b4c5ff;
}
.release-card h3 {
  margin-top: 9px;
  overflow: hidden;
  font-family: var(--font-heading);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.release-card p {
  margin-top: 3px;
  overflow: hidden;
  color: var(--color-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.release-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  margin-top: 10px;
  color: var(--color-muted);
  font-size: 9px;
}
.release-card__meta span:last-child {
  padding: 3px 5px;
  border-radius: 3px;
  background: var(--color-surface-muted);
  color: var(--color-text);
}
.release-review-link {
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
  text-decoration: none;
}
.release-review-link:hover {
  text-decoration: underline;
}
.feed-sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sidebar-module {
  padding: 17px;
}
.sidebar-module__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 15px;
}
.sidebar-module__heading h2 {
  font-family: var(--font-heading);
  font-size: 14px;
}
.sidebar-module__heading > small {
  color: var(--color-muted);
  font-size: 10px;
}
.live-label {
  padding: 4px 7px;
  border-radius: 999px;
  background: var(--color-primary-container);
  color: var(--color-primary);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}
.critic-list,
.list-highlights {
  display: flex;
  flex-direction: column;
  gap: 13px;
  list-style: none;
}
.critic-list li {
  display: grid;
  grid-template-columns: 12px 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}
.critic-list li > span {
  color: var(--color-muted);
  font-size: 11px;
}
.critic-list img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}
.critic-avatar-fallback {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-primary-container);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}
.critic-list li div,
.list-highlights li div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.critic-list strong,
.list-highlights strong {
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.critic-list a {
  overflow: hidden;
  color: var(--color-text);
  font-size: 11px;
  font-weight: 650;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.critic-list a:hover {
  color: var(--color-primary);
}
.critic-list small,
.list-highlights small {
  color: var(--color-muted);
  font-size: 10px;
}
.critic-list button {
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--color-surface-muted);
  color: var(--color-primary);
  font-size: 10px;
  cursor: pointer;
}
.critic-list button:hover {
  background: var(--color-primary-container);
}
.critic-empty {
  grid-column: 1 / -1;
  color: var(--color-muted);
  font-size: 11px;
  text-align: center;
}
.list-highlights li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.list-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border-radius: 6px;
  background: var(--color-surface-muted);
  color: var(--color-primary);
  font-size: 13px;
}
.genre-module {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.genre-module .sidebar-module__heading {
  margin-bottom: 0;
}
.genre-meter > div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
  font-size: 10px;
}
.genre-meter b {
  color: var(--color-primary);
  font-size: 10px;
}
.genre-meter > span {
  display: block;
  height: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-track);
}
.genre-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}
.sidebar-empty {
  color: var(--color-muted);
  font-size: 11px;
}
.publish-callout {
  padding: 18px;
  border-radius: 8px;
  background: var(--color-primary);
  color: var(--color-primary-foreground);
}
.publish-callout > span {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}
.publish-callout h2 {
  margin-top: 8px;
  font-family: var(--font-heading);
  font-size: 17px;
}
.publish-callout p {
  margin: 6px 0 14px;
  color: color-mix(in srgb, var(--color-primary-foreground) 82%, transparent);
  font-size: 12px;
  line-height: 1.5;
}
.publish-callout a {
  display: block;
  padding: 9px 10px;
  border-radius: 5px;
  background: var(--color-primary-foreground);
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

@media (max-width: 920px) {
  .featured-album {
    grid-template-columns: minmax(220px, 0.75fr) minmax(0, 1.25fr);
    gap: 24px;
  }
  .feed-columns {
    grid-template-columns: minmax(0, 1fr) 270px;
    gap: 18px;
  }
  .aggregate-rating small {
    flex-basis: 100%;
  }
}
@media (max-width: 720px) {
  .featured-album {
    grid-template-columns: 1fr;
  }
  .featured-album__art-wrap {
    width: min(100%, 400px);
    margin: 0 auto;
  }
  .feed-columns {
    grid-template-columns: 1fr;
  }
  .feed-sidebar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .publish-callout {
    grid-column: 1 / -1;
  }
  .trend-strip__note {
    display: none;
  }
}
@media (max-width: 520px) {
  .feed-container {
    padding: 16px 12px 50px;
  }
  .featured-album {
    gap: 18px;
    padding: 16px;
    border-radius: 10px;
  }
  .featured-album__body {
    gap: 14px;
  }
  .featured-album h1 {
    font-size: 32px;
  }
  .featured-album__quote {
    font-size: 13px;
  }
  .aggregate-rating {
    gap: 6px;
    padding: 10px;
  }
  .aggregate-rating__stars {
    font-size: 16px;
  }
  .aggregate-rating strong {
    font-size: 21px;
  }
  .featured-album__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .featured-album__actions > :first-child {
    grid-column: 1 / -1;
  }
  .featured-album__actions .button-primary,
  .featured-album__actions .button-secondary {
    width: 100%;
    min-height: 42px;
    padding: 6px 9px;
    font-size: 11px;
    text-align: center;
  }
  .featured-share {
    justify-self: end;
  }
  .section-title-row h2 {
    font-size: 19px;
  }
  .review-card {
    padding: 14px;
  }
  .review-card__top {
    align-items: flex-start;
  }
  .review-score span {
    display: none;
  }
  .review-card__footer {
    align-items: flex-start;
  }
  .release-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .feed-sidebar {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .featured-slide-enter-active,
  .featured-slide-leave-active,
  .featured-carousel__dots button {
    transition: none;
  }
  .release-card__art-wrap img {
    transition: none;
  }
}
</style>
