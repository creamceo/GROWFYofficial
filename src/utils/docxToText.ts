// src/utils/docxToText.ts
import mammoth from "mammoth";

/**
 * Преобразует .docx файл в plain text (без разметки).
 * Дальше этот текст можно отправлять на сервер как "script_text".
 */
export async function docxFileToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return (value || "").trim();
}
