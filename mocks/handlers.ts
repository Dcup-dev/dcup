import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post("https://models.inference.ai.azure.com/embeddings", () => {
    return HttpResponse.json({
      data: [
        {
          embedding: Array(1536).fill(0),
          index: 0,
        },
      ],
      model: "text-embedding-3-small",
      object: 'list',
    })
  }),
  http.post("https://models.inference.ai.azure.com/chat/completions", () => {
    return HttpResponse.json({
      id: 'chatcmpl-mock-id',
      object: 'chat.completion',
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify({
              title: 'Mock Title',
              summary: 'Mock Summary based on document chunk.',
            }),
          },
          finish_reason: 'stop',
          index: 0,
        },
      ],
      model: 'gpt-4o-mini',
      usage: {
        prompt_tokens: 10,
        completion_tokens: 10,
        total_tokens: 20,
      },
    })
  }),
  http.post('https://oauth2.googleapis.com/token', () => {
    return HttpResponse.json({
      access_token: 'FAKE_ACCESS_TOKEN',
      refresh_token: 'FAKE_REFRESH_TOKEN',
      expires_in: 3600,
      token_type: 'Bearer',
    }, { status: 200 })
  }),
  http.get('https://www.googleapis.com/oauth2/v2/userinfo', () => {
    return HttpResponse.json({
      sub: '1234567890',
      email: 'test@dcup.dev',
      name: 'Test User',
      picture: 'https://via.placeholder.com/200?text=Test+User',
    }, { status: 200 })
  }),
];

