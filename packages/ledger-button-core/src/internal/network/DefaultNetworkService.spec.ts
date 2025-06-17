import { headers } from "./model/constant.js";
import { DefaultNetworkService } from "./DefaultNetworkService.js";

describe("DefaultNetworkService", () => {
  let networkService: DefaultNetworkService;

  beforeEach(() => {
    networkService = new DefaultNetworkService();
    vi.clearAllMocks();
  });

  describe("get", () => {
    it("should have the correct headers", async () => {
      const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      await networkService.get("https://whater.com/ap1/posts/1", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(spy.mock.calls[0][0]).toBe("https://whater.com/ap1/posts/1");
      expect(spy.mock.calls[0][1]).toMatchObject({
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        method: "GET",
      });
    });

    it("should be able to get a resource", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
          title:
            "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
        }),
      } as unknown as Response);

      const res = await networkService.get("https://whater.com/ap1/posts/1");

      expect(res.isRight()).toBe(true);
      expect(res.extract()).toEqual({
        id: 1,
        title:
          "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
      });
    });

    it("should be able to get a resource and return an error (response error)", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const res = await networkService.get("https://whater.com/ap1/posts/1");

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Network error"));
    });

    it("should be able to get a resource and return an error (res.json())", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        json: vi.fn().mockRejectedValue(new Error("Parsing failed")),
      } as unknown as Response);

      const res = await networkService.get("https://whater.com/ap1/posts/1");

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Parsing failed"));
    });
  });

  describe("post", () => {
    it("should have the correct headers", async () => {
      const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      await networkService.post(
        "https://whater.com/ap1/posts",
        {
          id: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      expect(spy.mock.calls[0][0]).toBe("https://whater.com/ap1/posts");
      expect(spy.mock.calls[0][1]).toMatchObject({
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: {
          id: 1,
        },
      });
    });

    it("should be able to post a resource", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      const res = await networkService.post("https://whater.com/ap1/posts", {
        id: 1,
      });

      expect(res.isRight()).toBe(true);
      expect(res.extract()).toEqual({
        id: 1,
      });
    });

    it("should be able to post a resource and return an error (response error)", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const res = await networkService.post("https://whater.com/ap1/posts", {
        id: 1,
      });

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Network error"));
    });

    it("should be able to post a resource and return an error (res.json())", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        json: vi.fn().mockRejectedValue(new Error("Parsing failed")),
      } as unknown as Response);

      const res = await networkService.post("https://whater.com/ap1/posts", {
        id: 1,
      });

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Parsing failed"));
    });
  });

  describe("put", () => {
    it("should have the correct headers", async () => {
      const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      await networkService.put(
        "https://whater.com/ap1/posts/1",
        {
          id: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      expect(spy.mock.calls[0][0]).toBe("https://whater.com/ap1/posts/1");
      expect(spy.mock.calls[0][1]).toMatchObject({
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        method: "PUT",
        body: {
          id: 1,
        },
      });
    });

    it("should be able to put a resource", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      const res = await networkService.put("https://whater.com/ap1/posts/1", {
        id: 1,
      });

      expect(res.isRight()).toBe(true);
      expect(res.extract()).toEqual({
        id: 1,
      });
    });

    it("should be able to put a resource and return an error (response error)", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const res = await networkService.put("https://whater.com/ap1/posts/1", {
        id: 1,
      });

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Network error"));
    });

    it("should be able to put a resource and return an error (res.json())", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        json: vi.fn().mockRejectedValue(new Error("Parsing failed")),
      } as unknown as Response);

      const res = await networkService.put("https://whater.com/ap1/posts/1", {
        id: 1,
      });

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Parsing failed"));
    });
  });

  describe("patch", () => {
    it("should have the correct headers", async () => {
      const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      await networkService.patch(
        "https://whater.com/ap1/posts/1",
        {
          id: 1,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      expect(spy.mock.calls[0][0]).toBe("https://whater.com/ap1/posts/1");
      expect(spy.mock.calls[0][1]).toMatchObject({
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        method: "PATCH",
        body: {
          id: 1,
        },
      });
    });

    it("should be able to patch a resource", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      const res = await networkService.patch("https://whater.com/ap1/posts/1", {
        id: 1,
      });

      expect(res.isRight()).toBe(true);
      expect(res.extract()).toEqual({
        id: 1,
      });
    });

    it("should be able to patch a resource and return an error (response error)", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const res = await networkService.patch("https://whater.com/ap1/posts/1", {
        id: 1,
      });

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Network error"));
    });

    it("should be able to patch a resource and return an error (res.json())", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        json: vi.fn().mockRejectedValue(new Error("Parsing failed")),
      } as unknown as Response);

      const res = await networkService.patch("https://whater.com/ap1/posts/1", {
        id: 1,
      });

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Parsing failed"));
    });
  });

  describe("delete", () => {
    it("should call fetch with the correct headers", async () => {
      const spy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      await networkService.delete("https://whater.com/ap1/posts/1", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(spy.mock.calls[0][0]).toBe("https://whater.com/ap1/posts/1");
      expect(spy.mock.calls[0][1]).toMatchObject({
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });
    });

    it("should be able to delete a resource", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: vi.fn().mockResolvedValueOnce({
          id: 1,
        }),
      } as unknown as Response);

      const res = await networkService.delete("https://whater.com/ap1/posts/1");

      expect(res.isRight()).toBe(true);
      expect(res.extract()).toEqual({
        id: 1,
      });
    });

    it("should be able to delete a resource and return an error (response error)", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

      const res = await networkService.delete("https://whater.com/ap1/posts/1");

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Network error"));
    });

    it("should be able to delete a resource and return an error (res.json())", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        json: vi.fn().mockRejectedValue(new Error("Parsing failed")),
      } as unknown as Response);

      const res = await networkService.delete("https://whater.com/ap1/posts/1");

      expect(res.isLeft()).toBe(true);
      expect(res.extract()).toEqual(new Error("Parsing failed"));
    });
  });
});
