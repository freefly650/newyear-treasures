import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/toys/route";

vi.mock("@/lib/session", () => ({
  getCurrentUserId: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  ensureSchema: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/cloudinary", () => ({
  isCloudinaryConfigured: vi.fn().mockReturnValue(true),
  uploadImage: vi.fn().mockResolvedValue("https://example.com/img.jpg"),
}));

function createGetRequest() {
  return new NextRequest("http://localhost/api/toys");
}

function createPostRequest(formData: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(formData)) {
    fd.set(k, v);
  }
  return new NextRequest("http://localhost/api/toys", {
    method: "POST",
    body: fd,
  });
}

describe("GET /api/toys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    const { getCurrentUserId } = await import("@/lib/session");
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 200 and toys array when authenticated", async () => {
    const { getCurrentUserId } = await import("@/lib/session");
    const { query } = await import("@/lib/db");
    const userId = "user-uuid-1";
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(userId);
    const now = new Date();
    vi.mocked(query)
      .mockResolvedValueOnce([
        {
          id: "doll-1",
          name: "Barbie",
          line: "Collector",
          year: 2020,
          condition: "mint",
          notes: null,
          image_url: null,
          created_at: now,
          updated_at: now,
        },
      ] as never);

    const res = await GET(createGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("doll-1");
    expect(data[0].name).toBe("Barbie");
    expect(data[0].line).toBe("Collector");
    expect(data[0].imageUrl).toBeUndefined();
    expect(data[0].createdAt).toBe(now.toISOString());
  });
});

describe("POST /api/toys", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { getCurrentUserId } = await import("@/lib/session");
    vi.mocked(getCurrentUserId).mockResolvedValueOnce(null);

    const res = await POST(createPostRequest({ name: "Doll" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when name is missing", async () => {
    const { getCurrentUserId } = await import("@/lib/session");
    vi.mocked(getCurrentUserId).mockResolvedValueOnce("user-1");

    const res = await POST(createPostRequest({ line: "only" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Name is required");
  });

  it("returns 400 when name is empty string", async () => {
    const { getCurrentUserId } = await import("@/lib/session");
    vi.mocked(getCurrentUserId).mockResolvedValueOnce("user-1");

    const res = await POST(createPostRequest({ name: "   " }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Name is required");
  });
});
