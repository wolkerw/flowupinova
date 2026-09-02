import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isVideoMedia,
  publishToFacebook,
  publishToInstagram,
} from "../publisher-service";

describe("Publisher Service — Video & Story Support", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("isVideoMedia helper", () => {
    it("identifies video URLs by extension", () => {
      expect(isVideoMedia("https://firebasestorage.googleapis.com/v0/b/app/o/video.mp4?alt=media")).toBe(true);
      expect(isVideoMedia("https://example.com/story.mov")).toBe(true);
      expect(isVideoMedia("https://example.com/clip.webm")).toBe(true);
      expect(isVideoMedia("https://example.com/feed.m4v")).toBe(true);
    });

    it("identifies video by MIME type", () => {
      expect(isVideoMedia("https://example.com/file", "video/mp4")).toBe(true);
      expect(isVideoMedia("https://example.com/file", "video/quicktime")).toBe(true);
    });

    it("returns false for image files", () => {
      expect(isVideoMedia("https://firebasestorage.googleapis.com/v0/b/app/o/photo.jpg?alt=media")).toBe(false);
      expect(isVideoMedia("https://example.com/banner.png")).toBe(false);
      expect(isVideoMedia("https://example.com/image.webp")).toBe(false);
      expect(isVideoMedia("https://example.com/file", "image/jpeg")).toBe(false);
      expect(isVideoMedia("")).toBe(false);
    });
  });

  describe("publishToFacebook", () => {
    it("calls /photos for static image", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "fb_photo_123" }),
      } as Response);

      const result = await publishToFacebook("page123", "token_abc", "https://example.com/photo.jpg", "Legenda da foto");

      expect(result).toBe("fb_photo_123");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain("graph.facebook.com/v20.0/page123/photos");
      expect(calledUrl).toContain("url=https%3A%2F%2Fexample.com%2Fphoto.jpg");
    });

    it("calls /videos for video file", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "fb_video_456" }),
      } as Response);

      const result = await publishToFacebook("page123", "token_abc", "https://example.com/video.mp4", "Legenda do video");

      expect(result).toBe("fb_video_456");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      expect(calledUrl).toContain("graph.facebook.com/v20.0/page123/videos");
      expect(calledUrl).toContain("file_url=https%3A%2F%2Fexample.com%2Fvideo.mp4");
      expect(calledUrl).toContain("description=Legenda+do+video");
    });
  });

  describe("publishToInstagram", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("creates REELS video container for feed video", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
        // 1. createMediaItemContainer
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "ig_container_vid" }),
        } as Response)
        // 2. checkContainerStatus
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status_code: "FINISHED" }),
        } as Response)
        // 3. publishMediaContainer
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "ig_published_vid" }),
        } as Response);

      const promise = publishToInstagram(
        "ig_account_1",
        "ig_token_1",
        ["https://example.com/reel.mp4"],
        false,
        "Meu novo Reel!",
        undefined,
        undefined
      );

      await vi.advanceTimersByTimeAsync(5000);
      const result = await promise;

      expect(result).toBe("ig_published_vid");
      const containerCallUrl = fetchSpy.mock.calls[0][0] as string;
      expect(containerCallUrl).toContain("media_type=REELS");
      expect(containerCallUrl).toContain("video_url=https%3A%2F%2Fexample.com%2Freel.mp4");
      expect(containerCallUrl).not.toContain("image_url=");
    });

    it("creates STORIES container for story video", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch")
        // 1. createMediaItemContainer
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "ig_story_container" }),
        } as Response)
        // 2. checkContainerStatus
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status_code: "FINISHED" }),
        } as Response)
        // 3. publishMediaContainer
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "ig_story_published" }),
        } as Response);

      const promise = publishToInstagram(
        "ig_account_1",
        "ig_token_1",
        ["https://example.com/story.mp4"],
        false,
        "",
        undefined,
        undefined,
        "STORIES",
        true
      );

      await vi.advanceTimersByTimeAsync(5000);
      const result = await promise;

      expect(result).toBe("ig_story_published");
      const containerCallUrl = fetchSpy.mock.calls[0][0] as string;
      expect(containerCallUrl).toContain("media_type=STORIES");
      expect(containerCallUrl).toContain("video_url=https%3A%2F%2Fexample.com%2Fstory.mp4");
      expect(containerCallUrl).not.toContain("caption=");
    });
  });
});
