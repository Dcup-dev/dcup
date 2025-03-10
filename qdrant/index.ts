import { QdrantClient } from "@qdrant/js-client-rest";


export const qdrant_collection_name = "document";
export const qdrantCLient = new QdrantClient({ url: process.env.QDRANT_DB_URL! });
