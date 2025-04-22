# Dcup: The Open-Source RAG-as-a-Service Platform 
📖 **Open Source, Now and Forever**

<div align="center">
    <a target="_blank" href="https://dcup.dev"><img align="center" style="max-width:300px;" src="https://github.com/user-attachments/assets/1b00557b-e672-480b-b2e1-2dcc6fa5641e"> </a>
</div>

<br>

🚀 Dcup is your go-to solution for building and scaling Retrieval-Augmented Generation (RAG) systems. Whether you’re a developer looking to integrate AI-driven search capabilities or a team wanting to harness data for smarter retrieval, Dcup is fully open-source, self-hostable, and built with scalability in mind.

## ✨ Key Features
- **Fully Open Source & Self-Hostable:** Maintain control over your data and infrastructure.
- **Connected RAG:** Easy-to-use integrations with Google Drive, Dropbox, AWS, and direct file uploads.
- **Advanced Search Capabilities:** LLM re-ranking, summary indexing, hybrid search using OpenAI embeddings and Qdrant vector storage.
- **Intuitive Retrieval API:** Seamlessly query and refine your data with optional re-ranking.
- **Developer-Centric:** With clear documentation, easy-to-use APIs, and a modular architecture.

## ⚡️ How Dcup Works

### 1️⃣ Ingest
Start by ingesting your data. Dcup offers simple APIs for uploading files or directly connecting to popular sources like Google Drive, Dropbox, and AWS. Your data stays up-to-date automatically with effortless syncing.

### 2️⃣ Chunk and Index
Once ingested, Dcup automatically chunks and embeds your data into vectors using OpenAI embeddings. The vectors are stored in a scalable Qdrant vector database, with indexing for enhanced retrieval (vector, summary, and keyword indexing).

### 3️⃣ Retrieve
The final step is retrieval. With the Dcup Retrieval API, you can query your data and refine results. Features like re-ranking, summary index, entity extraction, flexible filtering, and hybrid search (semantic + keyword) ensure high precision and relevant results for your AI applications.

## 📄 Documentation
For more in-depth details about Dcup's features, API endpoints, and usage, check out our comprehensive documentation [dcup/docs](https://dcup.dev/docs).

## 🛠️ Quick Start Guide
### Self-host Dcup using docker compose
1. Clone the repository
2. Update your ENV config using .env.example
3. Create containers
```bash
docker compose -f docker-compose.prod.yml  --env-file .env up
```
## 🌍 Cloud Version
If you prefer a hosted solution, try the cloud version of Dcup at [app.Dcup](https://dcup.dev) . No setup required — just sign up, connect your data, and start querying.

## 💻 For Developers
Dcup is designed to be modular and flexible, allowing developers to build custom RAG pipelines effortlessly. With open-source architecture, you can contribute, customize, and scale as needed

## Contributing
We welcome contributions from the community! Check out our [Contributing Guide](https://github.com/Dcup-dev/dcup/blob/main/CONTRIBUTING.md) to get started.
