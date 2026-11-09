<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "../../../components/common/BaseButton.vue";
import BaseInput from "../../../components/common/BaseInput.vue";
import BaseModal from "../../../components/common/BaseModal.vue";
import { musicService } from "../services/musicService";
import { socialService } from "../services/socialService";
import { useHome } from "../composables/useHome.js";

const {
  user,
  isOwnProfile,
  selectedUser,
  profile,
  name,
  initials,
  details,
  profileExists,
  detailLoading,
  detailError,
  editOpen,
  editLoading,
  editError,
  editForm,
  avatars,
  avatarsLoading,
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
const router = useRouter();
const profileReviews = ref([]);
const favorites = ref([]);
const followersCount = ref(0);
const followingCount = ref(0);
const activityLoading = ref(false);
const activityError = ref("");
const isFollowing = ref(false);
const followLoading = ref(false);
const reviewToDelete = ref(null);
const reviewDeleteLoading = ref(false);
const reviewDeleteError = ref("");
const targetUserId = computed(() =>
  profile.value?.userId ?? profile.value?.user_id ??
  (isOwnProfile.value ? user.value?.id : selectedUser.value?.id),
);
const stats = computed(() => [
  { value: profileReviews.value.length, label: "Reseñas" },
  { value: favorites.value.length, label: "Favoritos" },
  { value: followersCount.value, label: "Seguidores" },
  { value: followingCount.value, label: "Siguiendo" },
]);
const genres = computed(() => {
  const counts = new Map();
  for (const review of profileReviews.value) {
    for (const genre of review.genres) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count, value: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
});
const artists = computed(() => {
  const counts = new Map();
  for (const review of profileReviews.value) {
    if (review.artist) counts.set(review.artist, (counts.get(review.artist) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
});

function getArray(data) {
  const value = data?.data ?? data?.Data ?? data;
  return Array.isArray(value) ? value : [];
}

function getValue(item, camel, pascal) {
  return item?.[camel] ?? item?.[pascal];
}

function artistNames(track) {
  const values = track?.artists ?? track?.Artists ?? [];
  return values.map((artist) => typeof artist === "string" ? artist : artist.name ?? artist.Name).filter(Boolean).join(", ");
}

function getGenres(track) {
  const values = track?.genres ?? track?.Genres ?? [];
  return values.map((genre) => typeof genre === "string" ? genre : genre.name ?? genre.Name).filter(Boolean);
}

async function loadProfileActivity() {
  const userId = targetUserId.value;
  if (!userId) return;
  const activeUserId = userId;
  activityLoading.value = true;
  activityError.value = "";
  try {
    const response = await socialService.getReviews({ userId });
    const reviews = await Promise.all(getArray(response).map(async (item) => {
      const musicItemId = getValue(item, "musicItemId", "MusicItemId");
      let track = null;
      let musicType = "song";
      if (musicItemId) {
        try {
          track = await musicService.getItem("song", musicItemId);
        } catch {
          try {
            track = await musicService.getItem("album", musicItemId);
            musicType = "album";
          } catch {
            track = null;
          }
        }
      }
      const album = track?.album ?? track?.Album;
      const profileData = item.profile ?? item.Profile ?? {};
      return {
        id: getValue(item, "id", "Id"),
        musicType,
        albumId: musicType === "album" ? musicItemId : getValue(album, "id", "Id"),
        title: getValue(item, "title", "Title") || "Reseña sin título",
        rating: Number(getValue(item, "rating", "Rating") ?? 0).toFixed(1),
        text: getValue(item, "comment", "Comment") ?? "",
        album: musicType === "album"
          ? track?.title ?? track?.Title ?? "Álbum"
          : typeof album === "string" ? album : album?.title ?? album?.Title ?? track?.title ?? track?.Title ?? "Obra musical",
        artist: artistNames(track),
        image: musicType === "album"
          ? track?.imageUrl ?? track?.ImageUrl ?? ""
          : track?.albumImageUrl ?? track?.AlbumImageUrl ?? album?.imageUrl ?? album?.ImageUrl ?? track?.imageUrl ?? track?.ImageUrl ?? "",
        genres: getGenres(track),
        likes: Number(getValue(item, "likesCount", "LikesCount") ?? 0),
        comments: Number(getValue(item, "commentsCount", "CommentsCount") ?? 0),
        author: profileData.name ?? profileData.Name ?? "Miembro de Faudix",
      };
    }));

    if (targetUserId.value !== activeUserId) return;
    profileReviews.value = reviews;

    const [followers, following] = await Promise.allSettled([
      socialService.getFollowers(userId),
      socialService.getFollowing(userId),
    ]);
    followersCount.value = followers.status === "fulfilled" ? getArray(followers.value).length : 0;
    followingCount.value = following.status === "fulfilled" ? getArray(following.value).length : 0;

    if (isOwnProfile.value) {
      try {
        const saved = getArray(await socialService.getFavorites());
        favorites.value = saved
          .filter((item) => String(item.type ?? item.Type).toLowerCase() === "album")
          .map((item) => {
            const metadata = item.metadata ?? item.Metadata ?? {};
            return {
              id: item.id ?? item.Id,
              title: metadata.title ?? metadata.Title ?? "Álbum",
              artist: artistNames(metadata),
              image: metadata.imageUrl ?? metadata.ImageUrl ?? metadata.albumImageUrl ?? metadata.AlbumImageUrl ?? "",
              genres: getGenres(metadata),
            };
          });
      } catch {
        favorites.value = [];
      }
    } else {
      favorites.value = [];
      isFollowing.value = false;
      if (user.value?.id) {
        try {
          const currentFollowing = getArray(await socialService.getFollowing(user.value.id));
          isFollowing.value = currentFollowing.some((relation) => (relation.id ?? relation.Id) === userId);
        } catch {
          isFollowing.value = false;
        }
      }
    }
  } catch (error) {
    activityError.value = getErrorMessagge(error);
    profileReviews.value = [];
  } finally {
    activityLoading.value = false;
  }
}

async function toggleFollow() {
  const userId = targetUserId.value;
  if (!userId || followLoading.value) return;
  const wasFollowing = isFollowing.value;
  isFollowing.value = !wasFollowing;
  followLoading.value = true;
  try {
    if (wasFollowing) {
      await socialService.unfollow(userId);
      followersCount.value = Math.max(0, followersCount.value - 1);
    } else {
      await socialService.follow(userId);
      followersCount.value += 1;
    }
  } catch (error) {
    isFollowing.value = wasFollowing;
    activityError.value = getErrorMessagge(error);
  } finally {
    followLoading.value = false;
  }
}

function openDeleteReview(review) {
  reviewDeleteError.value = "";
  reviewToDelete.value = review;
}

function editReview(review) {
  return router.push({ name: "write-review", query: { reviewId: review.id } });
}

function closeDeleteReview() {
  if (!reviewDeleteLoading.value) reviewToDelete.value = null;
}

async function confirmDeleteReview() {
  if (!reviewToDelete.value || reviewDeleteLoading.value) return;
  reviewDeleteLoading.value = true;
  reviewDeleteError.value = "";
  try {
    await socialService.deleteReview(reviewToDelete.value.id);
    profileReviews.value = profileReviews.value.filter((review) => review.id !== reviewToDelete.value.id);
    reviewToDelete.value = null;
  } catch (error) {
    reviewDeleteError.value = getErrorMessagge(error);
  } finally {
    reviewDeleteLoading.value = false;
  }
}

watch([targetUserId, isOwnProfile], loadProfileActivity, { immediate: true });

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
      <p v-if="!profileExists && !detailLoading" class="profile-setup-note">
        Completa tu perfil público para empezar a compartir tus reseñas.
        <button type="button" @click="openEditProfile">Crear perfil</button>
      </p>
      <p v-if="detailLoading" class="profile-loading" role="status">Cargando perfil...</p>
      <p v-if="detailError" class="profile-error" role="alert">{{ detailError }}</p>
      <p v-if="activityError" class="profile-error" role="alert">{{ activityError }}</p>
      <section class="curator-overview">
        <div class="curator-identity">
          <div class="curator-avatar">
            <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="`Foto de ${name}`" />
            <span v-else>{{ initials }}</span>
          </div>
          <div class="curator-copy">
            <div class="curator-name-line"><h1>{{ name }}</h1><span>@{{ profile.username || "nuevo-curador" }}</span></div>
            <p>{{ profile.bio || "Añade una biografía breve para que la comunidad conozca tus gustos." }}</p>
            <div class="curator-meta"><span><i class="fa-regular fa-envelope" aria-hidden="true"></i> {{ profile.email || "Correo no disponible" }}</span><span><i class="fa-solid fa-user-tag" aria-hidden="true"></i> {{ profile.role || "Miembro Faudix" }}</span></div>
          </div>
          <div class="curator-actions">
            <BaseButton v-if="isOwnProfile" type="button" color="secondary" @click="openEditProfile"><i class="fa-solid fa-pen" aria-hidden="true"></i> {{ profileExists ? "Editar perfil" : "Crear perfil" }}</BaseButton>
            <BaseButton v-else type="button" color="secondary" :loading="followLoading" @click="toggleFollow"><i class="fa-solid" :class="isFollowing ? 'fa-user-minus' : 'fa-user-plus'" aria-hidden="true"></i> {{ isFollowing ? "Dejar de seguir" : "Seguir" }}</BaseButton>
            <BaseButton type="button" @click="shareProfile"><i class="fa-solid fa-share-nodes" aria-hidden="true"></i> Compartir</BaseButton>
          </div>
        </div>
        <div class="curator-stats" aria-label="Estadísticas del perfil">
          <div v-for="item in stats" :key="item.label"><strong>{{ item.value }}</strong><span>{{ item.label }}</span></div>
        </div>
      </section>

      <section v-if="isOwnProfile || favorites.length" class="profile-section" aria-labelledby="favorites-title">
        <div class="profile-section-heading"><div><div class="profile-title"><i class="fa-regular fa-heart" aria-hidden="true"></i><h2 id="favorites-title">Álbumes favoritos</h2></div><p>Guardados en Faudix.</p></div></div>
        <div class="favorites-grid">
          <article v-for="album in favorites" :key="album.id" class="favorite-card">
            <div class="favorite-card__art"><img v-if="album.image" :src="album.image" :alt="`Portada de ${album.title}`" /><span v-else class="favorite-art-placeholder"><i class="fa-solid fa-music" aria-hidden="true"></i></span></div>
            <h3>{{ album.title }}</h3><p>{{ album.artist || "Artista no disponible" }}</p><div class="favorite-meta"><span v-for="genre in album.genres.slice(0, 2)" :key="genre">{{ genre }}</span></div>
          </article>
        </div>
        <p v-if="!favorites.length && isOwnProfile && !activityLoading" class="profile-empty">Todavía no guardas álbumes favoritos.</p>
      </section>

      <div v-if="genres.length || artists.length" class="profile-insights">
        <section v-if="genres.length" class="insight-panel"><div class="insight-heading"><h2><i class="fa-solid fa-chart-pie" aria-hidden="true"></i> Géneros reseñados</h2></div><div v-for="genre in genres" :key="genre.name" class="genre-stat"><div><span>{{ genre.name }}</span><b>{{ genre.count }}</b></div><span class="genre-stat__track"><i :style="{ width: `${genre.value}%` }"></i></span></div></section>
        <section v-if="artists.length" class="insight-panel artist-panel"><div class="insight-heading"><h2><i class="fa-solid fa-chart-column" aria-hidden="true"></i> Artistas reseñados</h2></div><ol><li v-for="(artist, index) in artists" :key="artist.name"><span>{{ String(index + 1).padStart(2, "0") }}</span><i class="artist-avatar" :class="`artist-avatar--${index + 1}`"></i><div><strong>{{ artist.name }}</strong><small>{{ artist.count }} reseñas</small></div></li></ol></section>
      </div>

      <nav class="profile-tabs" aria-label="Actividad del perfil">
        <button type="button" class="active"><i class="fa-regular fa-message" aria-hidden="true"></i> Reseñas <span>{{ profileReviews.length }}</span></button>
      </nav>

      <div class="profile-activity">
        <section class="activity-feed" aria-live="polite">
          <p v-if="activityLoading" class="profile-loading" role="status">Cargando reseñas...</p>
          <template v-else>
            <article v-for="review in profileReviews" :key="review.id" class="profile-review">
              <div class="profile-review__art">
                <img v-if="review.image" :src="review.image" :alt="`Portada de ${review.album}`" />
                <span v-else class="profile-review__placeholder"><i class="fa-solid" :class="review.musicType === 'album' ? 'fa-compact-disc' : 'fa-music'" aria-hidden="true"></i></span>
                <span class="profile-review__type">{{ review.musicType === 'album' ? 'Álbum' : 'Canción' }}</span>
              </div>
              <div class="profile-review__content"><div class="profile-review__meta"><span>★★★★★ <b>{{ review.rating }}</b></span><small>{{ review.musicType === 'album' ? 'Reseña de álbum' : 'Reseña de canción' }}</small></div><h3>{{ review.title }}</h3><p class="profile-review__artist">{{ review.album }}<template v-if="review.artist"> · {{ review.artist }}</template></p><p>{{ review.text }}</p><div v-if="review.genres.length" class="review-foot"><span v-for="genre in review.genres.slice(0, 3)" :key="genre">{{ genre }}</span></div><footer><span><i class="fa-regular fa-heart" aria-hidden="true"></i> {{ review.likes }}</span><span><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ review.comments }}</span><button v-if="isOwnProfile" type="button" class="edit-review-button" :aria-label="`Editar reseña ${review.title}`" :title="`Editar reseña ${review.title}`" @click="editReview(review)"><i class="fa-regular fa-pen-to-square" aria-hidden="true"></i></button><button v-if="isOwnProfile" type="button" class="delete-review-button" :aria-label="`Eliminar reseña ${review.title}`" :title="`Eliminar reseña ${review.title}`" @click="openDeleteReview(review)"><i class="fa-regular fa-trash-can" aria-hidden="true"></i></button></footer></div>
            </article>
            <p v-if="!profileReviews.length && !activityLoading" class="profile-empty">{{ isOwnProfile ? "Todavía no has publicado reseñas." : "Este usuario todavía no tiene reseñas." }}</p>
          </template>
        </section>

        <aside class="profile-rail">
          <section v-if="isOwnProfile" class="rail-panel account-panel"><div class="rail-heading"><h2>Datos de cuenta</h2><button type="button" @click="openEditProfile">Editar</button></div><dl><div v-for="item in details" :key="item.label"><dt>{{ item.label }}</dt><dd>{{ item.value || "—" }}</dd></div></dl><BaseButton type="button" color="danger" size="sm" @click="openDeleteAccount">Eliminar cuenta</BaseButton></section>
        </aside>
      </div>
    </div>

    <BaseModal :model-value="editOpen" labelledby="edit-profile-title" :loading="editLoading" @update:model-value="closeEditProfile">
      <form class="profile-form" @submit.prevent="saveProfile">
        <header class="profile-form-header"><div><p class="eyebrow">Perfil Faudix</p><h2 id="edit-profile-title">{{ profileExists ? "Editar perfil" : "Crear perfil público" }}</h2></div><BaseButton type="button" color="secondary" size="sm" aria-label="Cerrar" title="Cerrar" :disabled="editLoading" @click="closeEditProfile"><i class="fa-solid fa-xmark" aria-hidden="true"></i></BaseButton></header>
        <p v-if="editError" class="profile-state error" role="alert">{{ editError }}</p>
        <div class="profile-form-fields">
          <label class="profile-form-group" for="profile-name"><span>Nombre</span><BaseInput id="profile-name" v-model="editForm.name" name="name" autocomplete="name" required :disabled="editLoading" /></label>
          <label class="profile-form-group" for="profile-username"><span>Nombre de usuario</span><BaseInput id="profile-username" v-model="editForm.username" name="username" autocomplete="username" maxlength="50" required :disabled="editLoading" /></label>
          <label class="profile-form-group" for="profile-bio"><span>Biografía <small>{{ editForm.bio.length }}/500</small></span><textarea id="profile-bio" v-model="editForm.bio" name="bio" maxlength="500" rows="4" :disabled="editLoading" placeholder="Cuéntale a la comunidad qué música te mueve."></textarea></label>
          <fieldset class="profile-form-group avatar-fieldset"><legend>Elige tu avatar</legend><p v-if="avatarsLoading" class="avatar-loading">Cargando avatares...</p><div v-else-if="avatars.length" class="profile-avatar-options"><label v-for="avatar in avatars" :key="avatar.id" class="profile-avatar-option" :class="{ selected: editForm.avatarId === avatar.id }"><input v-model="editForm.avatarId" type="radio" name="avatarId" :value="avatar.id" :disabled="editLoading" /><img :src="avatar.imageUrl" :alt="avatar.name" /><span>{{ avatar.name }}</span></label></div><p v-else class="avatar-loading">No hay avatares disponibles.</p></fieldset>
        </div>
        <footer class="profile-form-actions"><BaseButton type="button" color="neutral" :disabled="editLoading" @click="closeEditProfile">Cancelar</BaseButton><BaseButton type="submit" :loading="editLoading" :disabled="avatarsLoading || !avatars.length">{{ editLoading ? "Guardando..." : profileExists ? "Guardar perfil" : "Crear perfil" }}</BaseButton></footer>
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

    <BaseModal :model-value="Boolean(reviewToDelete)" labelledby="delete-review-title" :loading="reviewDeleteLoading" @update:model-value="closeDeleteReview">
      <section class="review-delete-dialog">
        <header><h2 id="delete-review-title">Eliminar reseña</h2></header>
        <p>Se eliminará <strong>{{ reviewToDelete?.title }}</strong>. Esta acción no se puede deshacer.</p>
        <p v-if="reviewDeleteError" class="profile-state error" role="alert">{{ reviewDeleteError }}</p>
        <footer><BaseButton type="button" color="neutral" :disabled="reviewDeleteLoading" @click="closeDeleteReview">Cancelar</BaseButton><BaseButton type="button" color="danger" :loading="reviewDeleteLoading" @click="confirmDeleteReview">{{ reviewDeleteLoading ? "Eliminando..." : "Eliminar reseña" }}</BaseButton></footer>
      </section>
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
.profile-setup-note,.profile-loading,.profile-error { margin-bottom: 14px; padding: 11px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-muted); font-size: 12px; }
.profile-setup-note button { margin-left: 8px; background: transparent; color: var(--color-primary); font-weight: 700; cursor: pointer; }
.profile-error { border-color: var(--color-danger-border); background: var(--color-danger-bg); color: var(--color-danger); }
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
.profile-review__art { position: relative; width: 100%; aspect-ratio: 1; overflow: hidden; align-self: start; border: 1px solid var(--color-border); border-radius: 7px; background: var(--color-surface-muted); }
.profile-review__art > img,.profile-review__placeholder { display: grid; width: 100%; height: 100%; place-items: center; object-fit: cover; }
.profile-review__placeholder { color: var(--color-primary); font-size: 20px; }
.profile-review__type { position: absolute; right: 5px; bottom: 5px; padding: 4px 6px; border-radius: 999px; background: color-mix(in srgb, var(--color-surface) 92%, transparent); color: var(--color-primary); font-size: 8px; font-weight: 750; backdrop-filter: blur(8px); }
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
.profile-review footer .edit-review-button { margin-left: auto; color: var(--color-primary); }
.profile-review footer .delete-review-button { margin-left: 0; color: var(--color-danger); }
.profile-review footer i { margin-right: 4px; }
.review-delete-dialog { display: flex; flex-direction: column; gap: 16px; }
.review-delete-dialog header { padding: 18px 22px; border-bottom: 1px solid var(--color-border); }
.review-delete-dialog h2 { font-family: var(--font-heading); font-size: 18px; }
.review-delete-dialog > p { padding: 0 22px; color: var(--color-muted); font-size: 13px; line-height: 1.55; }
.review-delete-dialog > p strong { color: var(--color-text); }
.review-delete-dialog footer { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 13px 22px; border-top: 1px solid var(--color-border); background: var(--color-hover); }
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
.profile-form-group > span { display: flex; justify-content: space-between; }
.profile-form-group > span small { color: var(--color-muted); font-weight: 500; }
.profile-form-group textarea { width: 100%; min-height: 104px; padding: 10px 11px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); font: inherit; font-size: 12px; resize: vertical; }
.avatar-fieldset { min-width: 0; border: 0; padding: 0; }
.avatar-fieldset legend { margin-bottom: 8px; }
.profile-avatar-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 8px; }
.profile-avatar-option { display: grid; justify-items: center; gap: 6px; min-width: 0; padding: 9px 5px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); cursor: pointer; }
.profile-avatar-option.selected { border-color: var(--color-primary); background: var(--color-primary-container); }
.profile-avatar-option input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.profile-avatar-option:focus-within { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.profile-avatar-option img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; background: var(--color-surface-muted); }
.profile-avatar-option > span { max-width: 100%; overflow: hidden; color: var(--color-muted); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.avatar-loading { color: var(--color-muted); font-size: 11px; }
.profile-form-actions { position: sticky; bottom: 0; justify-content: flex-end; padding: 13px 22px; border-top: 1px solid var(--color-border); background: var(--color-hover); }
.profile-state.error { margin: 0 22px; color: var(--color-danger); font-size: 12px; }
.delete-copy { padding: 0 22px; color: var(--color-muted); font-size: 13px; line-height: 1.6; }
@media (max-width: 1000px) { .profile-insights { grid-template-columns: repeat(2, minmax(0, 1fr)); } .affinity-panel { grid-column: 1 / -1; } .profile-activity { grid-template-columns: minmax(0, 1fr) 260px; } }
@media (max-width: 760px) { .curator-identity { align-items: flex-start; flex-wrap: wrap; } .curator-actions { width: 100%; justify-content: flex-end; } .profile-activity { grid-template-columns: 1fr; } .profile-rail { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); } .account-panel { grid-column: 1 / -1; } }
@media (max-width: 560px) { .curator-container { padding: 14px 12px 40px; } .curator-overview { padding: 15px; } .curator-avatar { width: 66px; height: 66px; flex-basis: 66px; font-size: 20px; } .curator-name-line h1 { font-size: 20px; } .curator-name-line > span:not(.level-badge) { display: none; } .curator-stats { grid-template-columns: repeat(2, 1fr); gap: 12px; } .profile-section-heading { align-items: flex-start; } .profile-title h2 { font-size: 16px; } .favorites-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .profile-insights,.profile-rail { grid-template-columns: 1fr; } .affinity-panel,.account-panel { grid-column: auto; } .profile-review { grid-template-columns: 68px minmax(0, 1fr); gap: 9px; padding: 10px; } .profile-review__meta small { display: none; } .profile-form-header,.profile-form-fields,.profile-form-actions { padding-right: 16px; padding-left: 16px; } .profile-state.error,.delete-copy { margin-right: 16px; margin-left: 16px; padding-right: 0; padding-left: 0; } }
</style>
