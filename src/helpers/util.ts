export const sleep = async (ms: number) => await new Promise((resolve) => setTimeout(resolve, ms));

export const extractString = (search: RegExp, text: string): string | null => {
  const findMatch = text.match(search);
  if (findMatch) {
    return findMatch[0];
  }

  return null;
};
