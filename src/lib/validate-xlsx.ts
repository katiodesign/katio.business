import { fromBuffer, type Entry } from "yauzl";

// Check actual decompressed bytes before ExcelJS builds its in-memory workbook.
export function validateXlsx(buffer: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error || !zip) return reject(error || new Error("XLSX inválido."));
      let size = 0;
      let entries = 0;
      const limit = 20_000_000;
      const fail = (reason: Error) => { zip.close(); reject(reason); };
      zip.on("error", fail);
      zip.on("end", resolve);
      zip.on("entry", (entry: Entry) => {
        entries += 1;
        if (entries > 200 || entry.uncompressedSize > limit - size || entry.generalPurposeBitFlag & 1) {
          fail(new Error("El XLSX supera los límites de contenido o está cifrado."));
          return;
        }
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) return fail(streamError || new Error("XLSX inválido."));
          stream.on("error", fail);
          stream.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > limit) {
              stream.destroy();
              fail(new Error("El XLSX descomprimido supera 20 MB."));
            }
          });
          stream.on("end", () => zip.readEntry());
        });
      });
      zip.readEntry();
    });
  });
}
