
const { OllamaEmbeddings } = require("@langchain/ollama");
const { MemoryVectorStore } = require("@langchain/classic/vectorstores/memory");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434"
});

const vectorStore = new MemoryVectorStore(embeddings);

const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150
});

async function addDocumentsToStore(documents) {
    const chunksToStore = [];

    for (const document of documents) {
        const chunks = await textSplitter.createDocuments(
            [document.text],
            [{ source: document.name }]
        );

        chunksToStore.push(...chunks);
    }

    if (chunksToStore.length > 0) {
        await vectorStore.addDocuments(chunksToStore);
    }

    return chunksToStore.length;
}

async function searchDocuments(question, sourceName = null) {
    if (sourceName) {
        return await vectorStore.similaritySearch(
            question,
            6,
            doc => doc.metadata.source === sourceName
        );
    }

    return await vectorStore.similaritySearch(question, 6);
}

module.exports = {
    addDocumentsToStore,
    searchDocuments
};
