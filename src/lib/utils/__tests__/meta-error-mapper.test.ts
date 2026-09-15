import { describe, it, expect } from "vitest";
import { parseMetaError, getAccountStatusInfo } from "../meta-error-mapper";

describe("meta-error-mapper", () => {
  describe("parseMetaError", () => {
    it("should handle null or empty errors gracefully", () => {
      const res = parseMetaError(null);
      expect(res.title).toBe("Erro Inesperado na Meta");
      expect(res.isRecoverable).toBe(true);
    });

    it("should map expired token code 190", () => {
      const res = parseMetaError({ error: { code: 190, message: "Error validating access token" } });
      expect(res.title).toBe("Sessão da Meta Expirada");
      expect(res.actionText).toBe("Renovar Conexão");
    });

    it("should map password changed subcode 463", () => {
      const res = parseMetaError({ error: { code: 190, error_subcode: 463, message: "Password changed" } });
      expect(res.title).toBe("Senha do Facebook Alterada");
      expect(res.description).toContain("senha");
    });

    it("should map permission error code 200", () => {
      const res = parseMetaError({ error: { code: 200, message: "Permissions error" } });
      expect(res.title).toBe("Permissão de Anúncios Não Concedida");
    });

    it("should map rate limit code 80004", () => {
      const res = parseMetaError({ error: { code: 80004, message: "There have been too many calls" } });
      expect(res.title).toBe("Limite de Consultas na Meta Atingido");
    });

    it("should map missing ad accounts message", () => {
      const res = parseMetaError("Nenhuma conta de anúncios encontrada no perfil");
      expect(res.title).toBe("Nenhuma Conta de Anúncios Encontrada");
    });
  });

  describe("getAccountStatusInfo", () => {
    it("should return Active status info for status 1", () => {
      const info = getAccountStatusInfo(1);
      expect(info.label).toBe("Ativa");
      expect(info.isUsable).toBe(true);
      expect(info.statusText).toContain("🟢");
    });

    it("should return Disabled status info for status 2", () => {
      const info = getAccountStatusInfo(2);
      expect(info.label).toBe("Desativada na Meta");
      expect(info.isUsable).toBe(false);
      expect(info.warningMessage).toBeDefined();
    });

    it("should return Unsettled status info for status 3", () => {
      const info = getAccountStatusInfo(3);
      expect(info.label).toBe("Pagamento Pendente");
      expect(info.isUsable).toBe(false);
    });
  });
});
