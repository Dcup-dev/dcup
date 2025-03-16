# Contributing to Dcup
Thanks for taking the time to contribute ❤️ All types of contributions are encouraged and valued!

## How to Report a Bug
We use GitHub issues to track bugs and errors. If you run into an issue with the project:

1. **Open an Issue.**
2. **Explain the behavior you expected and the actual behavior.**
3. **Provide as much context as possible and describe the reproduction steps.**

A good bug report includes isolated code examples and steps to reproduce the issue.

## How to Request a New Feature

Enhancement suggestions are tracked as GitHub issues.

1. Use a clear and descriptive title for the issue.
2. Provide a detailed description of the enhancement.
3. Explain the current behavior and what you expect to happen.
4. Include screenshots or examples when applicable.
5. Describe why this enhancement would be useful for Dcup users.

Describe why this enhancement would be useful for Dcup users.

## How to Contribute Code to Dcup

### Working on Your First Pull Request?

### Opening a Pull Request

1. Fork the repository.
2. Clone the fork to your local machine:

```bash
git clone https://github.com/Dcup-dev/dcup.git
cd dcup
git remote add upstream https://github.com/Dcup-dev/dcup.git
```

3. Sync your local main branch with the upstream one:

```bash
git checkout main
git pull upstream main
```

4. Install dependencies:

```bash
npm install
```

5. Create a new topic branch:

```bash
git checkout -b feature/my-feature
```

6. Make changes, commit, and push to your fork:

```bash
git push -u origin feature/my-feature
```

7. Open a Pull Request on GitHub.

### Commit & Pull Request Naming Conventions

We follow the conventional commit standard:

```
<type>[optional scope]: <description>
```

Examples:

```
feat: add support for Google Drive integration
fix: resolve indexing bug
docs: update API documentation
```

### Merge Strategy

We use **squash & merge** to keep the main branch history clean.


## Setting Up the Development Environment

### Using Docker Compose

1. Clone the Dcup repo:

```bash
git clone https://github.com/dcup/dcup.git
```

2. Copy `.env.example` into `.env` and configure your environment variables.

3. Run the following Docker command to start PostgreSQL, Redis, and Qdrant:

```bash
make docker-run
```

4. Start the Dcup development server:

```bash
npm run dev
```

Now you're ready to start building!

---

Happy coding! 🚀

