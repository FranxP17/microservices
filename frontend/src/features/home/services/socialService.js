import api from "../../../services/api";
import { ENDPOINTS } from "../../../services/endpoints";

export const socialService = {
  async getReviews(filters = {}) {
    const params = typeof filters === "string" ? { musicItemId: filters } : filters;
    const response = await api.get(ENDPOINTS.SOCIAL.REVIEWS, {
      params: Object.keys(params).length ? params : undefined,
    });
    return response.data;
  },

  async getReviewPage(filters = {}, page = 1, pageSize = 12) {
    const params = typeof filters === "string" ? { musicItemId: filters } : filters;
    const response = await api.get(ENDPOINTS.SOCIAL.REVIEWS, {
      params: { ...params, page, pageSize },
    });
    return response.data;
  },

  async getReviewComments(reviewId) {
    const response = await api.get(ENDPOINTS.SOCIAL.REVIEW_COMMENTS(reviewId));
    return response.data;
  },

  async createReviewComment(reviewId, comment) {
    const response = await api.post(ENDPOINTS.SOCIAL.CREATE_REVIEW_COMMENT(reviewId), {
      reviewId,
      comment,
      parentCommentId: null,
    });
    return response.data;
  },

  async createReview(musicItemId, review) {
    const response = await api.post(
      ENDPOINTS.SOCIAL.CREATE_REVIEW(musicItemId),
      review,
    );
    return response.data;
  },

  async updateReview(reviewId, review) {
    const response = await api.put(ENDPOINTS.SOCIAL.UPDATE_REVIEW(reviewId), {
      Music_item_id: review.musicItemId,
      Rating: review.rating,
      Title: review.title,
      Comment: review.comment,
    });
    return response.data;
  },

  async deleteReview(reviewId) {
    const response = await api.delete(ENDPOINTS.SOCIAL.DELETE_REVIEW(reviewId));
    return response.data;
  },

  async likeReview(reviewId) {
    const response = await api.post(ENDPOINTS.SOCIAL.LIKE_REVIEW, {
      review_id: reviewId,
    });
    return response.data;
  },

  async unlikeReview(reviewId) {
    const response = await api.delete(ENDPOINTS.SOCIAL.UNLIKE_REVIEW(reviewId));
    return response.data;
  },

  async getFavorites() {
    const response = await api.get(ENDPOINTS.SOCIAL.FAVORITES);
    return response.data;
  },

  async getFollowers(userId) {
    const response = await api.get(ENDPOINTS.PROFILES.FOLLOWERS(userId));
    return response.data;
  },

  async getFollowing(userId) {
    const response = await api.get(ENDPOINTS.PROFILES.FOLLOWING(userId));
    return response.data;
  },

  async follow(userId) {
    const response = await api.post(ENDPOINTS.SOCIAL.FOLLOW(userId));
    return response.data;
  },

  async unfollow(userId) {
    const response = await api.delete(ENDPOINTS.SOCIAL.UNFOLLOW(userId));
    return response.data;
  },
};
