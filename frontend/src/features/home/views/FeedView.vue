<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const playing = ref(false);
const savedFeatured = ref(false);
const reviews = ref([
  {
    id: 1,
    author: "Ignacio Soto",
    handle: "@nachosoto",
    role: "Crítico senior",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces&auto=format&q=80",
    cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=160&h=160&fit=crop&auto=format&q=80",
    album: "Vórtice Temporal — LP Completo",
    artist: "Los Santos Eléctricos · 2024",
    rating: "5.0",
    published: "hace 4 horas",
    text: "No esperaba que este disco superara su debut, pero la madurez en la producción analógica es apabullante. Las frecuencias bajas retumban con la calidez de un máster en cinta sin perder nitidez moderna.",
    quote: "El solo de sintetizador modular redefine lo que el neo-psicodelismo en español puede alcanzar hoy.",
    moods: ["Eufórico", "Experimental", "Inmersivo"],
    likes: 342,
    comments: 48,
    liked: false,
  },
  {
    id: 2,
    author: "Carla V. Rivas",
    handle: "@carlasound",
    role: "Curadora",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces&auto=format&q=80",
    cover: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=160&h=160&fit=crop&auto=format&q=80",
    album: "Lluvia de Medianoche",
    artist: "Cero Absoluto · Sencillo",
    rating: "4.2",
    published: "hace 7 horas",
    text: "Un tema visceral que atrapa de inmediato por su atmósfera fría y minimalista. Las percusiones reverberadas transmiten una soledad urbana conmovedora.",
    quote: "Se siente como caminar solo por una avenida vacía a las tres de la mañana bajo la llovizna de otoño.",
    moods: ["Melancólico", "Nostálgico", "Nocturno"],
    likes: 198,
    comments: 19,
    liked: false,
  },
]);

const releases = [
  {
    title: "Geometría Serena",
    artist: "Aurora & Prisma",
    genre: "Art Pop",
    score: "94",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=480&h=480&fit=crop&auto=format&q=85",
  },
  {
    title: "Cielos de Neón",
    artist: "Kavinsky Club",
    genre: "Synthwave",
    score: "91",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop&auto=format&q=85",
  },
  {
    title: "Doble Tracción",
    artist: "Bala Perdida",
    genre: "Post-Punk",
    score: "89",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=480&h=480&fit=crop&auto=format&q=85",
  },
  {
    title: "Mares Suspendidos",
    artist: "Clara & El Viento",
    genre: "Dream Pop",
    score: "88",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=480&h=480&fit=crop&auto=format&q=85",
  },
];

const trending = ["Top 100 2024", "Indie Rock Esencial", "Artpop Renaciente", "Álbumes del mes", "Debates calientes"];
const searchQuery = computed(() => String(route.query.q ?? "").trim().toLowerCase());
const visibleReviews = computed(() => {
  if (!searchQuery.value) return reviews.value;
  return reviews.value.filter((review) =>
    [review.author, review.album, review.artist, review.text, ...review.moods]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.value),
  );
});

function toggleLike(review) {
  review.liked = !review.liked;
  review.likes += review.liked ? 1 : -1;
}

function searchTrend(term) {
  router.push({ name: "home", query: { q: term } });
}

async function shareFeatured() {
  try {
    if (navigator.share) {
      await navigator.share({ title: "Ecos del Horizonte", url: location.href });
    } else {
      await navigator.clipboard?.writeText(location.href);
    }
  } catch {
    // Sharing can be dismissed by the user.
  }
}
</script>

<template>
  <main class="feed-page">
    <div class="trend-strip" aria-label="Tendencias musicales">
      <span class="trend-strip__label"><i class="fa-solid fa-arrow-trend-up" aria-hidden="true"></i> En tendencia</span>
      <button v-for="term in trending" :key="term" type="button" @click="searchTrend(term)">
        {{ term }}
      </button>
      <span class="trend-strip__note"><i class="fa-solid fa-headphones" aria-hidden="true"></i> Más de 4.8k críticas publicadas hoy</span>
    </div>

    <div class="feed-container">
      <section class="featured-album" aria-labelledby="featured-title">
        <div class="featured-album__art-wrap">
          <img
            class="featured-album__art"
            src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&h=900&fit=crop&auto=format&q=90"
            alt="Paisaje nocturno azul para el álbum Ecos del Horizonte"
          />
          <span class="featured-album__badge"><i class="fa-solid fa-circle" aria-hidden="true"></i> Álbum de la semana</span>
          <span class="featured-album__length">44 min · 11 canciones</span>
        </div>
        <div class="featured-album__body">
          <div class="tag-row">
            <span class="tag tag--primary">Selección de la crítica</span>
            <span class="tag">Indie Rock</span>
            <span class="tag">Art Pop</span>
            <span class="tag">2024 · Edición Deluxe</span>
          </div>
          <div>
            <p class="eyebrow">Catedral de Cristal</p>
            <h1 id="featured-title">Ecos del Horizonte</h1>
            <p class="featured-album__artist">Por <strong>Silvia Marín &amp; Las Mareas</strong></p>
          </div>
          <div class="aggregate-rating" aria-label="Puntuación media 4.8 de 5, basada en 1420 reseñas">
            <span class="aggregate-rating__stars" aria-hidden="true">★★★★★</span>
            <strong>4.8</strong><span class="aggregate-rating__out-of">/ 5.0</span>
            <span class="aggregate-rating__divider"></span>
            <small>Basado en <b>1,420 reseñas</b> verificadas</small>
          </div>
          <blockquote class="featured-album__quote">
            “Una obra expansiva donde las texturas de guitarra shoegaze colisionan con sintetizadores orquestales impolutos. Marín entrega la composición en español más audaz y emotiva de la última década.”
          </blockquote>
          <div class="featured-album__actions">
            <button class="button-primary" type="button" :aria-pressed="playing" @click="playing = !playing">
              <i class="fa-solid" :class="playing ? 'fa-pause' : 'fa-play'" aria-hidden="true"></i>
              {{ playing ? "Pausar vista previa" : "Escuchar fragmento (1:30)" }}
            </button>
            <RouterLink class="button-secondary" :to="{ name: 'write-review' }">
              <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Escribir reseña
            </RouterLink>
            <button class="icon-action" type="button" :aria-label="savedFeatured ? 'Quitar de guardados' : 'Guardar álbum'" :aria-pressed="savedFeatured" @click="savedFeatured = !savedFeatured">
              <i class="fa-solid" :class="savedFeatured ? 'fa-bookmark' : 'fa-bookmark'" aria-hidden="true"></i>
            </button>
            <button class="icon-action" type="button" aria-label="Compartir álbum" @click="shareFeatured">
              <i class="fa-solid fa-share-nodes" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </section>

      <div class="feed-columns">
        <section id="community" class="community-feed" aria-labelledby="community-title">
          <div class="section-title-row">
            <div>
              <p class="eyebrow">Voces de la comunidad</p>
              <h2 id="community-title">Reseñas populares</h2>
            </div>
            <button class="sort-button" type="button">Más votadas <i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>
          </div>

          <p v-if="searchQuery" class="search-summary">Resultados para “{{ route.query.q }}”</p>
          <article v-for="review in visibleReviews" :key="review.id" class="review-card">
            <div class="review-card__top">
              <div class="review-author">
                <img :src="review.avatar" :alt="`Retrato de ${review.author}`" />
                <div>
                  <div class="review-author__name">
                    <strong>{{ review.author }}</strong>
                    <span class="tag tag--small">{{ review.role }}</span>
                  </div>
                  <p>Publicado {{ review.published }} · {{ review.handle }}</p>
                </div>
              </div>
              <div class="review-score"><span aria-hidden="true">★★★★★</span><strong>{{ review.rating }}</strong></div>
            </div>

            <div class="review-album">
              <img :src="review.cover" :alt="`Arte de ${review.album}`" />
              <div><strong>{{ review.album }}</strong><span>{{ review.artist }}</span></div>
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </div>

            <div class="review-card__copy">
              <p>{{ review.text }}</p>
              <blockquote>“{{ review.quote }}”</blockquote>
            </div>

            <footer class="review-card__footer">
              <div class="mood-tags">
                <span v-for="mood in review.moods" :key="mood">{{ mood }}</span>
              </div>
              <div class="review-actions">
                <button type="button" :class="{ 'is-liked': review.liked }" :aria-pressed="review.liked" @click="toggleLike(review)">
                  <i class="fa-solid fa-thumbs-up" aria-hidden="true"></i> {{ review.likes }}
                </button>
                <button type="button" aria-label="Comentarios"><i class="fa-regular fa-comment" aria-hidden="true"></i> {{ review.comments }}</button>
                <button type="button" aria-label="Guardar reseña"><i class="fa-regular fa-bookmark" aria-hidden="true"></i></button>
              </div>
            </footer>
          </article>
          <p v-if="!visibleReviews.length" class="empty-results">No encontramos reseñas que coincidan con tu búsqueda.</p>

          <section id="new-releases" class="release-section" aria-labelledby="release-title">
            <div class="section-title-row section-title-row--release">
              <div>
                <p class="eyebrow">Lo mejor de esta semana</p>
                <h2 id="release-title">Nuevos lanzamientos</h2>
                <p>Álbumes y EP mejor recibidos por la comunidad.</p>
              </div>
              <a href="#new-releases">Ver todos <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
            </div>
            <div class="release-grid">
              <article v-for="release in releases" :key="release.title" class="release-card">
                <div class="release-card__art-wrap">
                  <img :src="release.image" :alt="`Portada de ${release.title}`" />
                  <span><i class="fa-solid fa-star" aria-hidden="true"></i> {{ release.score }}</span>
                </div>
                <h3>{{ release.title }}</h3>
                <p>{{ release.artist }}</p>
                <div class="release-card__meta"><span>Álbum · 2024</span><span>{{ release.genre }}</span></div>
              </article>
            </div>
          </section>
        </section>

        <aside class="feed-sidebar" aria-label="Descubrimiento">
          <section id="critics" class="sidebar-module">
            <div class="sidebar-module__heading"><h2>Críticos de la semana</h2><span class="live-label">En vivo</span></div>
            <ol class="critic-list">
              <li><span>1</span><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=faces&auto=format&q=80" alt="" /><div><strong>Matías Albarrán</strong><small>38 críticas · 98% útil</small></div><button type="button">Seguir</button></li>
              <li><span>2</span><img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=faces&auto=format&q=80" alt="" /><div><strong>Daniela Orozco</strong><small>29 críticas · 95% útil</small></div><button type="button">Seguir</button></li>
              <li><span>3</span><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces&auto=format&q=80" alt="" /><div><strong>Gabriel Thorne</strong><small>24 críticas · 93% útil</small></div><button type="button">Seguir</button></li>
            </ol>
          </section>

          <section id="lists" class="sidebar-module">
            <div class="sidebar-module__heading"><h2>Listas destacadas</h2><a href="#lists">Explorar</a></div>
            <ul class="list-highlights">
              <li><span class="list-icon"><i class="fa-solid fa-cloud-rain" aria-hidden="true"></i></span><div><strong>Noches de lluvia y synthwave</strong><small>54 temas · 14.2k oyentes</small></div></li>
              <li><span class="list-icon"><i class="fa-solid fa-guitar" aria-hidden="true"></i></span><div><strong>Post-Punk Revival</strong><small>40 temas · 9.8k oyentes</small></div></li>
              <li><span class="list-icon"><i class="fa-solid fa-moon" aria-hidden="true"></i></span><div><strong>Ecos oníricos</strong><small>36 temas · 6.3k oyentes</small></div></li>
            </ul>
          </section>

          <section class="sidebar-module genre-module">
            <div class="sidebar-module__heading"><h2>Géneros en auge</h2><small>+28% esta semana</small></div>
            <div class="genre-meter"><div><span>Art Pop iberoamericano</span><b>+44%</b></div><span><i style="width: 92%"></i></span></div>
            <div class="genre-meter"><div><span>Post-Punk revival</span><b>+31%</b></div><span><i style="width: 72%"></i></span></div>
            <div class="genre-meter"><div><span>Hyperpop acústico</span><b>+19%</b></div><span><i style="width: 54%"></i></span></div>
            <div class="mood-tags"><span>#IndieRock</span><span>#Neopsicodelia</span><span>#LoFiTape</span><span>#AmbientJazz</span><span>#DreamPop</span></div>
          </section>

          <section class="publish-callout">
            <span>Tu voz cuenta</span>
            <h2>¿Escuchaste algo nuevo hoy?</h2>
            <p>Comparte tu mirada y ayuda a descubrir el próximo gran disco.</p>
            <RouterLink :to="{ name: 'write-review' }">Publicar crítica</RouterLink>
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

.trend-strip__label { color: var(--color-primary); }
.trend-strip__note { margin-left: auto; font-size: 11px; font-weight: 500; text-transform: none; }
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
.trend-strip button { cursor: pointer; }
.trend-strip button:hover { border-color: var(--color-primary); color: var(--color-primary); }

.feed-container { width: min(1320px, 100%); margin: 0 auto; padding: 24px clamp(16px, 3vw, 40px) 72px; }
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
.featured-album__art-wrap { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 10px; background: var(--color-surface-muted); }
.featured-album__art { width: 100%; height: 100%; object-fit: cover; }
.featured-album__badge,
.featured-album__length { position: absolute; display: inline-flex; align-items: center; gap: 7px; padding: 7px 10px; border-radius: 999px; background: rgb(255 255 255 / 92%); color: var(--color-primary); font-size: 10px; font-weight: 700; text-transform: uppercase; backdrop-filter: blur(8px); }
.featured-album__badge { top: 12px; left: 12px; }
.featured-album__badge i { font-size: 7px; }
.featured-album__length { right: 12px; bottom: 12px; border-radius: 5px; background: rgb(19 27 46 / 82%); color: #fff; text-transform: none; }
.featured-album__body { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.tag-row { display: flex; flex-wrap: wrap; gap: 7px; }
.tag { display: inline-flex; align-items: center; padding: 5px 10px; border: 0; font-size: 10px; text-transform: uppercase; }
.tag--primary { background: var(--color-primary-container); color: var(--color-primary); }
.tag--small { padding: 4px 8px; font-size: 9px; }
.eyebrow { margin-bottom: 6px; color: var(--color-primary); font-size: 11px; font-weight: 700; letter-spacing: 0; text-transform: uppercase; }
.featured-album h1 { margin: 0; font-family: var(--font-heading); font-size: clamp(30px, 4vw, 52px); font-weight: 800; line-height: 1.08; }
.featured-album__artist { margin-top: 8px; color: var(--color-muted); font-size: 14px; }
.featured-album__artist strong { color: var(--color-text); }
.aggregate-rating { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; padding: 12px 14px; border-radius: 8px; background: var(--color-surface-muted); }
.aggregate-rating__stars { color: var(--color-primary); font-size: 20px; letter-spacing: 0; }
.aggregate-rating strong { font-family: var(--font-heading); font-size: 24px; }
.aggregate-rating__out-of { margin-left: -6px; color: var(--color-muted); font-size: 11px; }
.aggregate-rating__divider { width: 4px; height: 4px; margin: 0 3px; border-radius: 50%; background: var(--color-muted); }
.aggregate-rating small { color: var(--color-muted); font-size: 11px; }
.aggregate-rating small b { color: var(--color-text); }
.featured-album__quote { margin: 0; padding-left: 14px; border-left: 2px solid var(--color-primary-container); color: var(--color-muted); font-size: 14px; font-style: italic; line-height: 1.7; }
.featured-album__actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.button-primary,
.button-secondary,
.icon-action { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 0 15px; border: 1px solid var(--color-border); border-radius: 7px; font-size: 12px; font-weight: 700; text-decoration: none; cursor: pointer; transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease, transform 140ms ease; }
.button-primary { border-color: var(--color-primary); background: var(--color-primary); color: var(--color-primary-foreground); }
.button-primary:hover { background: var(--color-primary-dark); }
.button-secondary,.icon-action { background: var(--color-surface); color: var(--color-text); }
.button-secondary i,.icon-action i { color: var(--color-primary); }
.button-secondary:hover,.icon-action:hover { border-color: var(--color-primary); background: var(--color-hover); }
.icon-action { width: 40px; padding: 0; }
.feed-columns { display: grid; grid-template-columns: minmax(0, 2fr) minmax(260px, 0.92fr); align-items: start; gap: 28px; margin-top: 36px; }
.community-feed,.feed-sidebar { min-width: 0; }
.community-feed { display: flex; flex-direction: column; gap: 16px; }
.section-title-row { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
.section-title-row h2 { margin: 0; font-family: var(--font-heading); font-size: 22px; line-height: 1.3; }
.section-title-row .eyebrow { margin-bottom: 3px; }
.sort-button { padding: 7px 0 5px 10px; background: transparent; color: var(--color-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
.sort-button i { margin-left: 4px; font-size: 10px; }
.search-summary { margin: -5px 0 2px; color: var(--color-muted); font-size: 13px; }
.review-card,.sidebar-module { padding: 20px; border: 1px solid var(--color-border); border-radius: 10px; background: var(--color-surface); }
.review-card { display: flex; flex-direction: column; gap: 16px; }
.review-card__top,.review-author,.review-author__name,.review-card__footer,.review-actions,.review-album { display: flex; align-items: center; }
.review-card__top { justify-content: space-between; gap: 14px; }
.review-author { min-width: 0; gap: 10px; }
.review-author img { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 50%; object-fit: cover; }
.review-author__name { flex-wrap: wrap; gap: 7px; }
.review-author__name strong { font-size: 13px; }
.review-author p { margin-top: 3px; color: var(--color-muted); font-size: 11px; }
.review-score { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; padding: 7px 9px; border-radius: 6px; background: var(--color-surface-muted); }
.review-score span { color: var(--color-primary); font-size: 13px; letter-spacing: 0; }
.review-score strong { font-size: 12px; }
.review-album { gap: 10px; padding: 8px; border-radius: 7px; background: var(--color-surface-muted); }
.review-album img { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
.review-album div { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 3px; }
.review-album strong,.review-album span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.review-album strong { font-size: 12px; }
.review-album span { color: var(--color-muted); font-size: 11px; }
.review-album > i { color: var(--color-muted); font-size: 11px; }
.review-card__copy { display: flex; flex-direction: column; gap: 10px; color: var(--color-muted); font-size: 13px; line-height: 1.65; }
.review-card__copy blockquote { margin: 0; padding: 12px 14px; border-radius: 6px; background: var(--color-surface-muted); color: var(--color-text); font-style: italic; }
.review-card__footer { justify-content: space-between; flex-wrap: wrap; gap: 14px; }
.mood-tags,.review-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.mood-tags span { padding: 5px 9px; border: 0; font-size: 10px; }
.mood-tags span:first-child { background: var(--color-primary-container); color: var(--color-primary); }
.review-actions { gap: 14px; }
.review-actions button { padding: 4px 0; background: transparent; color: var(--color-muted); font-size: 11px; cursor: pointer; }
.review-actions button:hover,.review-actions button.is-liked { color: var(--color-primary); }
.empty-results { padding: 24px; border: 1px dashed var(--color-border); border-radius: 8px; color: var(--color-muted); text-align: center; }
.release-section { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
.section-title-row--release { align-items: center; }
.section-title-row--release p:not(.eyebrow) { margin-top: 5px; color: var(--color-muted); font-size: 12px; }
.section-title-row--release > a,.sidebar-module__heading > a { color: var(--color-primary); font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap; }
.section-title-row--release > a i { margin-left: 4px; }
.release-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.release-card { min-width: 0; padding: 8px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); }
.release-card__art-wrap { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: 5px; background: var(--color-surface-muted); }
.release-card__art-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 180ms ease; }
.release-card:hover img { transform: scale(1.03); }
.release-card__art-wrap > span { position: absolute; top: 7px; right: 7px; padding: 4px 6px; border-radius: 999px; background: rgb(19 27 46 / 82%); color: white; font-size: 10px; font-weight: 700; }
.release-card__art-wrap > span i { color: #b4c5ff; }
.release-card h3 { margin-top: 9px; overflow: hidden; font-family: var(--font-heading); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.release-card p { margin-top: 3px; overflow: hidden; color: var(--color-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.release-card__meta { display: flex; align-items: center; justify-content: space-between; gap: 5px; margin-top: 10px; color: var(--color-muted); font-size: 9px; }
.release-card__meta span:last-child { padding: 3px 5px; border-radius: 3px; background: var(--color-surface-muted); color: var(--color-text); }
.feed-sidebar { display: flex; flex-direction: column; gap: 14px; }
.sidebar-module { padding: 17px; }
.sidebar-module__heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 15px; }
.sidebar-module__heading h2 { font-family: var(--font-heading); font-size: 14px; }
.sidebar-module__heading > small { color: var(--color-muted); font-size: 10px; }
.live-label { padding: 4px 7px; border-radius: 999px; background: var(--color-primary-container); color: var(--color-primary); font-size: 9px; font-weight: 700; text-transform: uppercase; }
.critic-list,.list-highlights { display: flex; flex-direction: column; gap: 13px; list-style: none; }
.critic-list li { display: grid; grid-template-columns: 12px 34px minmax(0, 1fr) auto; align-items: center; gap: 8px; }
.critic-list li > span { color: var(--color-muted); font-size: 11px; }
.critic-list img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; }
.critic-list li div,.list-highlights li div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.critic-list strong,.list-highlights strong { overflow: hidden; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.critic-list small,.list-highlights small { color: var(--color-muted); font-size: 10px; }
.critic-list button { padding: 5px 8px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-primary); font-size: 10px; cursor: pointer; }
.critic-list button:hover { background: var(--color-primary-container); }
.list-highlights li { display: flex; align-items: center; gap: 10px; }
.list-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 6px; background: var(--color-surface-muted); color: var(--color-primary); font-size: 13px; }
.genre-module { display: flex; flex-direction: column; gap: 12px; }
.genre-module .sidebar-module__heading { margin-bottom: 0; }
.genre-meter > div { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 5px; font-size: 10px; }
.genre-meter b { color: var(--color-primary); font-size: 10px; }
.genre-meter > span { display: block; height: 5px; overflow: hidden; border-radius: 999px; background: var(--color-track); }
.genre-meter i { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); }
.publish-callout { padding: 18px; border-radius: 8px; background: var(--color-primary); color: var(--color-primary-foreground); }
.publish-callout > span { font-size: 9px; font-weight: 700; text-transform: uppercase; }
.publish-callout h2 { margin-top: 8px; font-family: var(--font-heading); font-size: 17px; }
.publish-callout p { margin: 6px 0 14px; color: color-mix(in srgb, var(--color-primary-foreground) 82%, transparent); font-size: 12px; line-height: 1.5; }
.publish-callout a { display: block; padding: 9px 10px; border-radius: 5px; background: var(--color-primary-foreground); color: var(--color-primary); font-size: 11px; font-weight: 700; text-align: center; text-decoration: none; }

@media (max-width: 920px) {
  .featured-album { grid-template-columns: minmax(220px, .75fr) minmax(0, 1.25fr); gap: 24px; }
  .feed-columns { grid-template-columns: minmax(0, 1fr) 270px; gap: 18px; }
  .aggregate-rating small { flex-basis: 100%; }
}
@media (max-width: 720px) {
  .featured-album { grid-template-columns: 1fr; }
  .featured-album__art-wrap { width: min(100%, 400px); margin: 0 auto; }
  .feed-columns { grid-template-columns: 1fr; }
  .feed-sidebar { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .publish-callout { grid-column: 1 / -1; }
  .trend-strip__note { display: none; }
}
@media (max-width: 520px) {
  .feed-container { padding: 16px 12px 50px; }
  .featured-album { gap: 18px; padding: 16px; border-radius: 10px; }
  .featured-album__body { gap: 14px; }
  .featured-album h1 { font-size: 32px; }
  .featured-album__quote { font-size: 13px; }
  .aggregate-rating { gap: 6px; padding: 10px; }
  .aggregate-rating__stars { font-size: 16px; }
  .aggregate-rating strong { font-size: 21px; }
  .featured-album__actions { display: grid; grid-template-columns: 1fr 40px 40px; }
  .button-primary,.button-secondary { grid-column: 1 / -1; }
  .icon-action { grid-row: 2; }
  .section-title-row h2 { font-size: 19px; }
  .review-card { padding: 14px; }
  .review-card__top { align-items: flex-start; }
  .review-score span { display: none; }
  .review-card__footer { align-items: flex-start; }
  .release-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .feed-sidebar { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .release-card__art-wrap img { transition: none; }
}
</style>
