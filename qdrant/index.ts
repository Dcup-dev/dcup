import { QdrantClient } from "@qdrant/js-client-rest";


export const qdrant_collection_name = "documents";
export const qdrantCLient = new QdrantClient({ url: process.env.QDRANT_DB_URL!, apiKey: process.env.QDRANT_DB_KEY });

if (process.env.NEXT_PHASE !== 'phase-production-build') {
  const { collections } = await qdrantCLient.getCollections();

  if (!collections.find(col => col.name === qdrant_collection_name)) {
    await qdrantCLient.createCollection(qdrant_collection_name, {
      vectors: { size: 1536, distance: 'Cosine' },
    });
  }
}
