export const db = {
  collection: () => ({
    get: () => Promise.resolve({ docs: [] }),
    doc: () => ({
      update: () => Promise.resolve(),
    }),
  }),
};
