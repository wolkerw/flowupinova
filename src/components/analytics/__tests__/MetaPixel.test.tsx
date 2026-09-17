import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MetaPixel } from "../MetaPixel";
import { isPublicRoute } from "@/lib/meta-pixel";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next/script", () => ({
  default: ({ id, dangerouslySetInnerHTML }: any) => (
    <script id={id} dangerouslySetInnerHTML={dangerouslySetInnerHTML} />
  ),
}));

describe("MetaPixel Component & Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isPublicRoute helper", () => {
    it("should return true for public routes", () => {
      expect(isPublicRoute("/")).toBe(true);
      expect(isPublicRoute("/acesso/login")).toBe(true);
      expect(isPublicRoute("/acesso/cadastro")).toBe(true);
      expect(isPublicRoute("/termos")).toBe(true);
      expect(isPublicRoute("/privacidade")).toBe(true);
    });

    it("should return false for protected dashboard and admin routes", () => {
      expect(isPublicRoute("/dashboard")).toBe(false);
      expect(isPublicRoute("/dashboard/anuncios")).toBe(false);
      expect(isPublicRoute("/dashboard/posts")).toBe(false);
      expect(isPublicRoute("/admin")).toBe(false);
      expect(isPublicRoute("/admin/usuarios")).toBe(false);
      expect(isPublicRoute("/api/ads")).toBe(false);
    });
  });

  describe("MetaPixel Rendering", () => {
    it("should render script tag on public route '/'", () => {
      mockUsePathname.mockReturnValue("/");
      const { container } = render(<MetaPixel />);
      const script = container.querySelector("#meta-pixel-script");
      expect(script).not.toBeNull();
    });

    it("should NOT render script tag on protected route '/dashboard/anuncios'", () => {
      mockUsePathname.mockReturnValue("/dashboard/anuncios");
      const { container } = render(<MetaPixel />);
      const script = container.querySelector("#meta-pixel-script");
      expect(script).toBeNull();
    });

    it("should NOT render script tag on admin route '/admin'", () => {
      mockUsePathname.mockReturnValue("/admin");
      const { container } = render(<MetaPixel />);
      const script = container.querySelector("#meta-pixel-script");
      expect(script).toBeNull();
    });
  });
});
