import axios from 'axios';
import { createWriteStream, PathLike } from 'fs';

export const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms));

export const extractString = (search: RegExp, text: string): string | null => {
  const findMatch = text.match(search);
  if (findMatch) {
    return findMatch[0];
  }

  return null;
};

export async function downloadVideo(url: string, path: PathLike): Promise<void> {
  const writer = createWriteStream(path);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
