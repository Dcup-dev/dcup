# Dcup: The Open-Source RAG-as-a-Service Platform 

<h1 align="center">
        <a target="_blank" href="https://dcup.dev"><img align="center" style="width:80%;" src="https://github.com/user-attachments/assets/be7cfdc3-35f2-4886-8616-ebf0bc16be1e"> </a>
</h1>


# 📖 **Open Source, Now and Forever**

<div align="center">
    <a target="_blank" href="https://dcup.dev"><img align="center" style="max-width:300px;" src="https://github.com/user-attachments/assets/1b00557b-e672-480b-b2e1-2dcc6fa5641e"> </a>
</div>

<br>

Dcup is a fully open-source, self-hostable RAG (Retrieval-Augmented Generation) pipeline designed to seamlessly connect your application to your users' data with pre-built integrations and advanced AI capabilities.

## 🚀 Connected RAG

With Dcup Connect, you can easily link your application to data sources like Google Drive, with more integrations coming soon.

## 🌐 Future-Ready

Advanced features such as LLM re-ranking, summary indexing, entity extraction, and hybrid search using OpenAI embeddings and Qdrant vector storage make Dcup the perfect platform for scalable, intelligent retrieval.

## 🛠️ Built for Developers

Dcup provides easy-to-use APIs that get you started in minutes.

# ⚡️ How Dcup Works

### 1️⃣ Ingest

The first step in the RAG pipeline is data ingestion. Dcup offers simple APIs for uploading files or directly connecting to popular sources like Google Drive. With automatic syncing, your data stays up-to-date effortlessly, handling PDFs and more.

### 2️⃣ Chunk and Index

Next, Dcup automatically chunks and embeds your data into vectors using OpenAI embeddings. These vectors are stored in a highly scalable Qdrant vector database. Out of the box, Dcup supports vector indexing, summary indexing, and keyword indexing for enhanced retrieval.

### 3️⃣ Retrieve

The final step is to use the Dcup Retrieval API to get relevant chunks for your semantic search queries. Built-in features like re-ranking, summary index, entity extraction, flexible filtering, and hybrid semantic and keyword search ensure highly accurate and relevant results for your AI applications.
#### Retrieval API Documentation
##### Endpoint
```bash
POST /api/retrievals
```
#### Description
This API endpoint allows you to retrieve relevant chunks from your indexed documents based on a search query. The process involves expanding your query, generating embeddings, and using Qdrant to search for matching chunks. Optionally, the results can be re-ranked using cosine similarity.

##### Request Body Parameters
- **query (string, required)**: The search query. Must be at least 2 characters long.
- **top_chunk (number, optional)**: The number of top results to return. Default is 5.
- **filter (object, optional)**: A filter object to narrow down results.
- **rerank (boolean, optional)**: Set to true to enable re-ranking of results based on similarity. Defaults to false.
- **min_score_threshold (number, optional)**: Minimum score threshold for filtering results.
#### Example Request
```json
{
  "query": "example search query",
  "top_chunk": 5,
  "filter": {
    "field": "value"
  },
  "rerank": true,
  "min_score_threshold": 0.5
}
```
#### Note:
Include an Authorization header with your API key in the format:
Authorization: Bearer YOUR_API_KEY

#### How It Works
- Query Expansion & Embedding:
The API expands your query and generates embeddings using OpenAI.
- Search & Filter:
Qdrant searches the indexed vectors. You can use a filter to refine the search.
- Re-ranking (Optional):
If enabled, the API generates a hypothetical answer, calculates its embedding, and re-ranks the chunks by cosine similarity.
- Response:
The API returns the top matching chunks, each containing metadata like document name, page number, content, and score.

#### Response Format
A successful response returns a JSON object with a key scored_chunks that contains an array of matching chunks. Each chunk includes:

- id: Identifier of the chunk.
- document_name: Name of the source document.
- page_number: Page number (if applicable).
- chunk_number: Chunk identifier.
- source: Data source.
- title: Title of the document/chunk.
- summary: Summary (if available).
- content: The chunk's content.
- type: The type/category of the chunk.
- metadata: Additional metadata.
- score: Matching score.
#### Example Response
```json
{
  "scored_chunks": [
    {
      "id": "chunk_1",
      "document_name": "Document A",
      "page_number": 1,
      "chunk_number": 2,
      "source": "Google Drive",
      "title": "Introduction",
      "summary": "Overview of the topic",
      "content": "Lorem ipsum dolor sit amet...",
      "type": "text",
      "metadata": {},
      "score": 0.87
    }
    // ...more chunks
  ]
}
```
#### Error Handling
- 400 Bad Request:
If the request body fails validation, you'll receive details about the validation errors.
- 401 Unauthorized:
If the Authorization header is missing or invalid.
- 403 Forbidden:
If the API key is not associated with a valid user.
- 500 Internal Server Error:
If an unexpected error occurs.

### 🌟 Key Features

- ✅ Pre-built Google Drive integration (more integrations coming soon)
- ✅ OpenAI-powered embeddings
- ✅ Qdrant vector storage
- ✅ Automatic chunking and indexing
- ✅ Advanced retrieval with re-ranking and hybrid search
- ✅ Easy-to-use APIs for fast implementation
- ✅ Scalable and open-source

## 🛠️ Quick Start Guide
### Self-host Dcup using docker compose
1. Clone the repository
2. Update your ENV config using .env.example
3. Create containers
```bash
docker compose -f docker-compose.prod.yml  --env-file .env up
```
## 💻 For Developers
Dcup is designed to be modular and flexible, allowing developers to build custom RAG pipelines effortlessly. With open-source architecture, you can contribute, customize, and scale as needed

## Contributing
We welcome contributions from the community! Check out our [Contributing Guide](https://github.com/Dcup-dev/dcup/blob/main/CONTRIBUTING.md) to get started.
