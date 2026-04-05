import { MultipartPart, parseMultipart } from "@mjackson/multipart-parser";

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class Utils {
  static sanitizeFileName(fileName: string): string {
    // Replace illegal characters with an underscore or a safe character
    return fileName
      .replace(/[<>:"/\\|?*]/g, "") // Replace illegal characters on Windows
      .replace(/[\x00-\x1F\x80-\x9F]/g, "") // Remove control characters
      .replace(/^\.+$/, "") // Avoid names like "." or ".."
      .replace(/^\s+|\s+$/g, "") // Trim leading/trailing spaces
      .replace(/[\s.]+$/, "") // Remove trailing spaces or periods
      .substring(0, 255); // Limit filename length
  }

  static slugifyFileName(fileName: string): string {
    return this.sanitizeFileName(fileName)
      .toLowerCase()
      .replace(/ - /g, "-")
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
  }

  static async parseMultipart(articleData: any): Promise<any> {
    // Get the content type and boundary from headers
    const contentType = articleData.headers["content-type"];
    const RE_BOUNDARY =
      /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
    const match = RE_BOUNDARY.exec(contentType);
    if (!match) {
      throw new Error("Invalid multipart content-type");
    }

    const boundary = match[1] || match[2];
    const multipartMessage = new Uint8Array(articleData.arrayBuffer);
    const parts: MultipartPart[] = [];

    const result = (parseMultipart as any)(
      multipartMessage,
      { boundary },
      (part: MultipartPart) => {
        parts.push(part);
      },
    ) as Promise<void> | Iterable<MultipartPart>;

    if (result && typeof (result as any)[Symbol.iterator] === "function") {
      for (const part of result as Iterable<MultipartPart>) {
        parts.push(part);
      }
    } else {
      await result;
    }

    return parts;
  }

  static updateImagePaths(text: string, oldPath: string, newPath: string) {
    const imageRegex = /!\[.*?\]\(\.\/(.*?\.(?:png|jpg|jpeg|gif|svg|webp))\)/g;

    const updatedtext = text.replace(imageRegex, (match, imageId) => {
      return match.replace(`${oldPath}${imageId}`, `${newPath}${imageId}`);
    });

    return updatedtext;
  }

  static parseDateStrToISO(date: string): string | undefined {
    const syncAtDate = new Date(date);
    return isNaN(syncAtDate.getTime()) ? undefined : syncAtDate.toISOString();
  }
}
