/** Labs use invented examples and deterministic arithmetic. Shared with navigation. */
export const RAG_LAB_GROUPS = {
  chunking:[4,5,30,32],
  fusion:[10,27,36],
  colbert:[12,13],
  evaluation:[16,21,31],
  vectors:[7,8,29,33],
  acl:[24,35],
  freshness:[22,38,41],
  pdf:[20,37,42],
  hops:[9,14,18,39],
  latency:[23,26]
};
export const ragLessonHasLab = id => Object.values(RAG_LAB_GROUPS).some(ids => ids.includes(Number(id)));
