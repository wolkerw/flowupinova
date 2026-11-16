/**
 * Prompt v2 da Foto Profissional (avatar) — foco em fidelidade facial.
 *
 * Testado em 16/11/2026 contra o prompt original (mesmo modelo gpt-image-2.6-sunburst e mesma ordem
 * de imagens): o v2 preservou entradas do cabelo, volume, desenho e fios grisalhos da barba, formato
 * do rosto e expressão, que o prompt original "embelezava".
 *
 * Como funciona:
 * 1. Uma análise rápida da selfie (Gemini Flash) descreve os traços concretos que tornam a pessoa
 *    reconhecível (IDENTITY_ANALYSIS_PROMPT).
 * 2. O prompt final cita esses traços, proíbe embelezamento de forma explícita e corrige a distorção
 *    da lente grande-angular do celular, mantendo a cena da foto de estilo.
 */

export interface AvatarIdentityTraits {
  ageRange?: string;
  faceShape?: string;
  hair?: string;
  eyebrows?: string;
  eyes?: string;
  nose?: string;
  mouth?: string;
  facialHair?: string;
  skin?: string;
  distinctive?: string | string[];
  neutralExpression?: string;
}

export interface AvatarStyleAnalysis {
  clothing?: string;
  background?: string;
  pose?: string;
  lighting?: string;
}

export const IDENTITY_ANALYSIS_PROMPT = `You are a forensic portrait artist. Describe ONLY the permanent identity traits of the person in this selfie so a photographer could recognize them. Be concrete and specific, avoid flattering words. Note that phone selfies are taken with a wide-angle lens at close distance, which makes the nose look larger and the face narrower at the edges; describe the real proportions. Answer only JSON:
{
  "ageRange": "",
  "faceShape": "shape, width vs length, jaw and chin",
  "hair": "length, volume/density, hairline (temples, recession), texture, color and grey distribution",
  "eyebrows": "thickness, shape, arch, spacing",
  "eyes": "color, shape, eyelids, under-eye",
  "nose": "bridge, tip, nostrils",
  "mouth": "lip thickness and shape",
  "facialHair": "exact shape and coverage per zone (cheeks, mustache, chin, jaw, neck), density, length, color and where it is grey; 'none' if clean-shaven",
  "skin": "tone, texture, marks",
  "distinctive": "the 3 to 5 traits that most make this person recognizable",
  "neutralExpression": "expression in the selfie"
}`;

function clean(value: unknown, max = 320): string {
  const text = Array.isArray(value) ? value.join("; ") : typeof value === "string" ? value : "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function parseIdentityTraits(raw: unknown): AvatarIdentityTraits | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const traits: AvatarIdentityTraits = {
    ageRange: clean(r.ageRange, 40),
    faceShape: clean(r.faceShape),
    hair: clean(r.hair),
    eyebrows: clean(r.eyebrows),
    eyes: clean(r.eyes),
    nose: clean(r.nose),
    mouth: clean(r.mouth),
    facialHair: clean(r.facialHair),
    skin: clean(r.skin),
    distinctive: clean(r.distinctive, 400),
    neutralExpression: clean(r.neutralExpression, 160),
  };
  const filled = Object.values(traits).filter(Boolean).length;
  return filled >= 4 ? traits : null;
}

function identityBlock(id: AvatarIdentityTraits | null): string {
  if (!id) {
    return "Reproduce the client's exact face, hairline, hair volume, facial hair, skin tone and age from IMAGE 1.";
  }
  const lines: Array<[string, string | undefined]> = [
    ["Age", id.ageRange],
    ["Face shape", id.faceShape],
    ["Hair", id.hair],
    ["Eyebrows", id.eyebrows],
    ["Eyes", id.eyes],
    ["Nose", id.nose],
    ["Mouth", id.mouth],
    ["Facial hair", id.facialHair],
    ["Skin", id.skin],
    ["Most distinctive", typeof id.distinctive === "string" ? id.distinctive : clean(id.distinctive)],
  ];
  return [
    "Reproduce these exact traits:",
    ...lines.filter(([, v]) => v).map(([k, v]) => `- ${k}: ${v}`),
  ].join("\n");
}

/**
 * Monta o prompt v2. IMAGE 1 é sempre a selfie; IMAGE 2 (opcional) é a foto de estilo.
 */
export function buildAvatarPromptV2(params: {
  hasStyleImage: boolean;
  style?: AvatarStyleAnalysis | null;
  identity?: AvatarIdentityTraits | null;
  userPrompt?: string;
}): string {
  const { hasStyleImage, style, identity, userPrompt } = params;
  const extra = (userPrompt || "").trim();

  const scene = hasStyleImage
    ? `IMAGE 1 is a phone selfie of the client. IMAGE 2 is the reference photo for the scene.

Create a professional photograph of the client from IMAGE 1, recreating IMAGE 2: same framing, camera angle, pose, clothing (${clean(style?.clothing) || "as in image 2"}), chair and props, background (${clean(style?.background) || "as in image 2"}) and lighting (${clean(style?.lighting) || "as in image 2"}). Pose: ${clean(style?.pose) || "as in image 2"}.${extra ? ` Additional request from the client: ${clean(extra, 400)}.` : ""} Do not use the face, hair or body type of the person in IMAGE 2.`
    : `IMAGE 1 is a phone selfie of the client.

Create a professional editorial portrait of the client from IMAGE 1. ${extra ? `Scene, clothing and pose requested by the client: ${clean(extra, 500)}.` : "Medium close-up, confident and approachable posture, elegant tailored clothing, softly blurred modern office background."} Soft professional studio lighting, 85mm portrait lens.`;

  const expression = identity?.neutralExpression
    ? `Expression: calm and natural, close to the selfie (${identity.neutralExpression}); relight the face with the scene lighting.`
    : "Expression: calm and natural, close to the selfie; relight the face with the scene lighting.";

  return `${scene}

The person must be immediately recognizable as the client in IMAGE 1. ${identityBlock(identity ?? null)}

Keep the client exactly as they are, without beautifying: same hair volume and hairline, same facial hair shape, density and grey pattern, same face width and age. Do not add hair, do not fill the beard, do not slim or sharpen the face.
The selfie was taken with a wide-angle phone lens up close: show the face with natural proportions as seen through an 85mm portrait lens, keeping every feature.
${expression}
Keep the client's real skin tone on every visible part of the body.
Head size and position natural for the pose, with real human proportions. Photorealistic, natural skin texture, no text or logos.`;
}
