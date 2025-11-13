// Simple UUID v7 generator for browser compatibility
// From: https://gist.github.com/fabiolimace/c0c11c5ea013d4ec54cf6b0d43d366c6
export const uuidV7 = (): string => {
  return "tttttttt-tttt-7xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, function (c) {
      const r = Math.trunc(Math.random() * 16);
      const v = c == "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .replace(/^[t]{8}-[t]{4}/, function () {
      const unixtimestamp = Date.now().toString(16).padStart(12, "0");
      return unixtimestamp.slice(0, 8) + "-" + unixtimestamp.slice(8);
    });
};

export const createTimestamp = (): Date => new Date();

export const softDelete = (record: object): object => ({
  ...record,
  deletedAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

export const updateTimestamp = (record: object): object => ({
  ...record,
  updatedAt: createTimestamp(),
});
