export async function parsePdfToText(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Disable worker — running server-side in Node.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';

    const uint8Array = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
    } as any);

    const pdf = await loadingTask.promise;
    console.log(`[Resume Parser] PDF has ${pdf.numPages} pages`);

    const textParts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    const fullText = textParts.join('\n\n');
    console.log(`[Resume Parser] Extracted ${fullText.length} chars from ${pdf.numPages} pages`);
    console.log(`[Resume Parser] First 300 chars: ${fullText.substring(0, 300)}`);

    return fullText;
  } catch (error) {
    console.error('[Resume Parser] Error parsing PDF:', error);
    throw new Error('Failed to parse PDF document');
  }
}
