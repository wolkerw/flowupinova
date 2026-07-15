const fs = require('fs');

try {
  let content = fs.readFileSync('src/app/api/conteudo/gerar-referencia/route.ts', 'utf8');

  if(!content.includes('semantic-cache')) {
    content = content.replace(
      'import { logApiUsage } from "@/lib/services/api-usage-service-admin";',
      'import { logApiUsage } from "@/lib/services/api-usage-service-admin";\nimport { getSemanticCache, setSemanticCache } from "@/lib/services/semantic-cache";'
    );
  }

  // semantic cache logic
  const processImageStart = 'const { base64: base64Image1, mimeType: mimeType1 } = await processImage(file);';
  if(content.includes(processImageStart)) {
    const replacement = `const { base64: base64Image1, mimeType: mimeType1 } = await processImage(file);

      let base64Image2 = "";
      let mimeType2 = "";
      if (secondaryFile) {
        const processed = await processImage(secondaryFile);
        base64Image2 = processed.base64;
        mimeType2 = processed.mimeType;
      }

      const cacheKey = "analyze_" + base64Image1 + (base64Image2 ? "_" + base64Image2 : "");
      const cachedData = await getSemanticCache(cacheKey);
      if (cachedData) {
        return NextResponse.json({ success: true, yamlAnalysis: cachedData });
      }`;
        
    content = content.replace(processImageStart, replacement);
    
    // replace the secondary processImage call since we already did it
    const oldSecondaryStr = `const { base64: base64Image2, mimeType: mimeType2 } = await processImage(secondaryFile);`;
    content = content.replace(oldSecondaryStr, `// secondary image already processed for cache key`);
    
    // add setSemanticCache at the end of analyze block
    const analyzeEndReturn = 'return NextResponse.json({ success: true, yamlAnalysis });';
    content = content.replace(analyzeEndReturn, `await setSemanticCache(cacheKey, yamlAnalysis);\n\n      return NextResponse.json({ success: true, yamlAnalysis });`);
  }

  // Claude headers
  const anthropicHeadersStr = `headers: {
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },`;
  const newAnthropicHeadersStr = `headers: {
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
              "anthropic-beta": "prompt-caching-2024-07-31",
            },`;

  content = content.split(anthropicHeadersStr).join(newAnthropicHeadersStr);

  // cache_control
  const imageBlockStr = `type: "image",
                      source: {
                        type: "base64",
                        media_type: mimeType,
                        data: base64Image,
                      },`;
  const newImageBlockStr = `type: "image",
                      source: {
                        type: "base64",
                        media_type: mimeType,
                        data: base64Image,
                      },
                      cache_control: { type: "ephemeral" }`;
  content = content.split(imageBlockStr).join(newImageBlockStr);

  // fallback for v1
  const imageBlockStrV1 = `type: "image",
                        source: {
                          type: "base64",
                          media_type: mimeType,
                          data: base64Image,
                        },`;
  const newImageBlockStrV1 = `type: "image",
                        source: {
                          type: "base64",
                          media_type: mimeType,
                          data: base64Image,
                        },
                        cache_control: { type: "ephemeral" }`;
  content = content.split(imageBlockStrV1).join(newImageBlockStrV1);

  fs.writeFileSync('src/app/api/conteudo/gerar-referencia/route.ts', content);
  console.log('Script done.');
} catch (e) {
  console.error(e);
}
