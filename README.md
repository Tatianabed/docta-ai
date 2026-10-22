# Docta AI — AI Document Chatbot

## Project Description

Docta AI is an AI-powered document chatbot that allows users to upload documents and ask questions about their content. It uses Retrieval-Augmented Generation (RAG) to retrieve relevant document text and generate answers with a local AI model.

## Features

- Responsive interface built with Bootstrap.
- Supports PDF, TXT, DOCX, and CSV files.
- Uses RAG to answer questions based on uploaded documents.
- Supports multiple document uploads.
- Displays conversation history during the session.
- Includes a loading indicator and error handling.
- Includes dark and light modes.
- Allows users to clear the chat.
- Allows new documents to be uploaded without restarting the application.
- Uses an in-memory vector store.

## Technologies Used

- JavaScript
- Node.js
- Express.js
- LangChain.js
- Bootstrap
- Ollama
- Qwen 2.5 3B language model
- Nomic Embed Text embedding model
- Memory Vector Store

## Requirements

- Node.js and npm
- Ollama
- The `qwen2.5:3b` model
- The `nomic-embed-text` model

## Setup Instructions

1. Install Node.js and Ollama.
2. Open a terminal in the project folder.
3. Install the project dependencies:

   `npm install`

4. Download the required Ollama models if they are not already installed:

   `ollama pull qwen2.5:3b`

   `ollama pull nomic-embed-text`

5. Make sure Ollama is running.
6. Start the application:

   `node server.js`

7. Open `http://localhost:3000` in your browser.

## Important Note

The application uses Memory Vector Store. Uploaded document indexes are stored in memory and are lost when the server restarts. Documents must be uploaded again after restarting the application.

## Author

Tatiana Bedikian