import { http, HttpResponse } from 'msw'

export const handlers = [
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

