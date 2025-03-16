# Dcup: The Open-Source RAG-as-a-Service Platform 

<h1 align="center">
        <a target="_blank" href="https://dcup.dev"><img align="center" style="width:80%;" src="https://github.com/user-attachments/assets/be7cfdc3-35f2-4886-8616-ebf0bc16be1e"> </a>
</h1>

# 📖 **Open Source, Now and Forever**
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
