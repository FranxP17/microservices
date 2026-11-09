import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

export const musicService = {
  async searchDeezer(query, type = "track") {
    const response = await api.get(ENDPOINTS.MUSIC.DEEZER_SEARCH, {
      params: { q: query, type: type === "song" ? "track" : type },
    });
    return response.data;
  },

  async importTrack(externalId, genres = []) {
    const response = await api.post(
      ENDPOINTS.MUSIC.DEEZER_IMPORT(externalId),
      { genres },
    );
    return response.data;
  },

  async importAlbum(externalId, genres = []) {
    const response = await api.post(
      ENDPOINTS.MUSIC.DEEZER_ALBUM_IMPORT(externalId),
      { genres },
    );
    return response.data;
  },

  async getItem(kind, id) {
    const response = await api.get(ENDPOINTS.MUSIC.ITEM(kind, id));
    return response.data;
  },

  async getFreshPreview(track) {
    const artists = track.artists ?? track.Artists ?? track.artistDetails ?? track.ArtistDetails
      ?? (track.artist ? [track.artist] : track.Artist ? [track.Artist] : []);
    const artistNames = (Array.isArray(artists) ? artists : [artists])
      .map((artist) => typeof artist === "string" ? artist : artist?.name ?? artist?.Name)
      .filter(Boolean);
    const title = track.previewTitle ?? track.PreviewTitle ?? track.musicTitle ?? track.MusicTitle
      ?? track.title ?? track.Title ?? track.name ?? track.Name;
    if (!title) return "";

    const response = await this.searchDeezer(`${title} ${artistNames.join(" ")}`.trim(), "song");
    const results = Array.isArray(response)
      ? response
      : response?.data ?? response?.items ?? response?.Items ?? [];
    const externalId = String(track.previewExternalId ?? track.PreviewExternalId ?? track.externalId ?? track.ExternalId ?? "");
    const normalizedTitle = title.trim().toLowerCase();
    const match = results.find((item) => String(item.id ?? item.Id) === externalId && externalId)
      ?? results.find((item) => String(item.name ?? item.Name ?? item.title ?? item.Title).trim().toLowerCase() === normalizedTitle)
      ?? results[0];

    return match?.previewUrl ?? match?.PreviewUrl ?? "";
  },
};
