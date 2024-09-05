import { Readable } from "stream";

// Convert a Readable stream to Buffer
export const streamToBuffer = (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = [];
    stream.on("data", (chunk) => buffers.push(chunk));
    stream.on("end", () => {
      const result = Buffer.concat(buffers);
      resolve(result);
    });
    stream.on("error", (error) => reject(error));
  });
};

// Convert file to Buffer
export const fileToBuffer = async (
  file: Express.Multer.File,
): Promise<Buffer> => {
  // Convert file.buffer (which is already a Buffer) to a Readable stream
  const stream = Readable.from(file.buffer);
  return await streamToBuffer(stream);
};
