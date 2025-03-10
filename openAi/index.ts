import OpenAI from "openai";

export const openAiClient = new OpenAI({
  baseURL: process.env.OPENAI_ENDPOINT!,
  apiKey: process.env.OPENAI_KEY!
});

export const getTitleAndSummary = async (chunk: string, metadata: string) => {
  const response = await openAiClient.chat.completions.create({
    model: process.env.OPENAI_AGENT_MODEL!,
    messages: [
      {
        role: 'system',
        content: `You are an AI that extracts titles and summaries from documentation chunks.
    Return a JSON object with 'title' and 'summary' keys.
    For the title: If this seems like the start of a document, extract its title. If it's a middle chunk, derive a descriptive title.
    For the summary: Create a concise summary of the main points in this chunk.
    Keep both title and summary concise but informative.`
      },
      {
        role: "user",
        content: `Metadata: ${metadata}\n\nContent:\n${chunk.substring(0, 1000)}...`
      }
    ],
    response_format: { type: 'json_object' }
  })

  return JSON.parse(response.choices[0].message.content || `{"title": "Error processing title", "summary": "Error processing summary"}`)
}
export const expandQuery = async (originalQuery: string) => {
  const response = await openAiClient.chat.completions.create({
    model: process.env.OPENAI_AGENT_MODEL!,
    messages: [
      {
        role: 'system',
        content: `You are an AI that generates a diverse set of search queries to help retrieve relevant information or news articles based on a given user question. Your task is to:
- Identify the key topics, entities, and keywords in the question.
- Generate multiple search queries by combining synonyms, related terms, and different phrasings.
- Include both broad queries and specific queries covering various angles.
- Always include the original question as one of the queries.
Return a JSON object with a single key "queries" mapping to an array of query strings. Do not include any additional text or explanation.`
      },
      {
        role: 'user',
        content: `User Question: ${originalQuery}`
      }
    ],
    max_tokens: 120,
    temperature: 0.7,
    n: 1,
    response_format: {
      type: 'json_object'
    }
  });
  return response.choices[0].message.content || originalQuery;
};


export const vectorizeText = async (chunk: string) => {
  const modelName = process.env.OPENAI_EMBEDDINGS_MODEL!
  const response = await openAiClient.embeddings.create({
    input: chunk,
    model: modelName
  });
  return response.data[0].embedding;
}

export const generateHypotheticalAnswer = async (query: string) => {
  const response = await openAiClient.chat.completions.create({
    model: process.env.OPENAI_AGENT_MODEL!,
    messages: [
      {
        role: "system",
        content: `Generate a hypothetical answer to the user's question. This answer will be used to rank search results.Pretend you have all the information you need to answer, but don't use any actual facts. Instead, use placeholders like NAME did something, or NAME said something at PLACE.`
      },
      {
        role: "user",
        content: `User Question: ${query}\n\n generate a final answer that summarizes the key points and fully addresses the user's question.`
      }
    ],
    max_tokens: 300,
    temperature: 1,
    n: 1,
  });

  return `{"hypotheticalAnswer": "${response.choices[0].message.content || query}"}`
}
