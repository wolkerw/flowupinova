import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

vi.mock("@/lib/admin-auth", () => ({
  validateAdminToken: vi.fn(),
}));

const TEST_IMAGE = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800";
const recent = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60 * 1000);
const ts = (date: Date) => ({ toDate: () => date });

function makeDoc(id: string, data: any, parentUserId = "") {
  return {
    id,
    data: () => data,
    ref: { parent: { parent: parentUserId ? { id: parentUserId } : null } },
  };
}

function makeQuery(docs: any[] | Error) {
  const query: any = {
    orderBy: () => query,
    where: () => query,
    limit: () => query,
    get: () => (docs instanceof Error ? Promise.reject(docs) : Promise.resolve({ docs })),
  };
  return query;
}

let collectionGroupDocs: Record<string, any[] | Error> = {};
let usersDocs: any[] = [];

vi.mock("@/lib/firebase-admin", () => ({
  adminDb: {
    collectionGroup: (name: string) => makeQuery(collectionGroupDocs[name] ?? []),
    collection: () => ({ get: () => Promise.resolve({ docs: usersDocs }) }),
  },
}));

function makeUser(id: string, posts: any[], media: any[]) {
  return {
    id,
    ref: {
      collection: (name: string) => makeQuery(name === "posts" ? posts : media),
    },
  };
}

function request(days = "30") {
  return new NextRequest(`http://localhost/api/admin/posts?days=${days}`, {
    headers: { cookie: "firebase-id-token=token" },
  });
}

describe("GET /api/admin/posts", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { validateAdminToken } = await import("@/lib/admin-auth");
    (validateAdminToken as any).mockResolvedValue({ uid: "admin" });
    collectionGroupDocs = {};
    usersDocs = [];
  });

  it("nega acesso a quem não é admin", async () => {
    const { validateAdminToken } = await import("@/lib/admin-auth");
    (validateAdminToken as any).mockResolvedValue(null);
    const res = await GET(request());
    expect(res.status).toBe(403);
  });

  it("fallback: não descarta o usuário quando a galeria tem createdAt em string ISO", async () => {
    collectionGroupDocs = { posts: new Error("FAILED_PRECONDITION: index required") };
    usersDocs = [
      makeUser(
        "flowup",
        [makeDoc("p1", { text: "Post real", imageUrls: ["https://cdn/p1.png"], createdAt: ts(recent(60)) })],
        [
          makeDoc("edit_1", { url: "https://cdn/edit.png", prompt: "Edição real", createdAt: recent(5).toISOString() }),
          makeDoc("ai_1", { url: "https://cdn/ai.png", prompt: "Geração real", createdAt: ts(recent(10)) }),
          makeDoc("sem_url", { createdAt: ts(recent(1)) }),
        ]
      ),
    ];

    const res = await GET(request());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.posts.map((p: any) => p.id)).toEqual(["media_edit_1", "media_ai_1", "p1"]);
    expect(body.posts.every((p: any) => p.userId === "flowup")).toBe(true);
  });

  it("fallback: remove gerações dos testes E2E e itens fora do período", async () => {
    collectionGroupDocs = { posts: new Error("index required") };
    usersDocs = [
      makeUser(
        "tester",
        [
          makeDoc("e2e_img", { text: "Dicas", imageUrls: [TEST_IMAGE], createdAt: ts(recent(5)) }),
          makeDoc("e2e_prompt", {
            promptUsed: "Novidades da semana: Dicas imperdíveis para impulsionar seu negócio em 2026 com IA!",
            imageUrls: ["https://cdn/x.png"],
            createdAt: ts(recent(6)),
          }),
          makeDoc("antigo", { text: "Antigo", imageUrls: ["https://cdn/old.png"], createdAt: ts(new Date("2020-01-01")) }),
          makeDoc("real", { text: "Post real", imageUrls: ["https://cdn/real.png"], createdAt: ts(recent(7)) }),
        ],
        []
      ),
    ];

    const res = await GET(request());
    const body = await res.json();

    expect(body.posts.map((p: any) => p.id)).toEqual(["real"]);
  });

  it("collectionGroup: mescla posts e galeria, deduplica URLs e filtra testes", async () => {
    collectionGroupDocs = {
      posts: [
        makeDoc("p1", { text: "Real", imageUrls: ["https://cdn/a.png"], createdAt: ts(recent(30)) }, "u1"),
        makeDoc("p2", { text: "Teste", imageUrls: [TEST_IMAGE], createdAt: ts(recent(2)) }, "u2"),
      ],
      mediaGallery: [
        makeDoc("m1", { url: "https://cdn/a.png", createdAt: ts(recent(30)) }, "u1"),
        makeDoc("m2", { url: "https://cdn/b.png", caption: "Nova", createdAt: ts(recent(1)) }, "u1"),
      ],
    };

    const res = await GET(request("0"));
    const body = await res.json();

    expect(body.posts.map((p: any) => p.id)).toEqual(["media_m2", "p1"]);
    expect(body.posts[0].isDraftMedia).toBe(true);
  });
});
