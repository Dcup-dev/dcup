import fs from 'node:fs'
import { http, HttpResponse } from 'msw'
import path from 'path';
type DropboxFile = {
  path: string,
  recursive: boolean
}
export const handlers = [
  http.post("https://content.dropboxapi.com/2/files/download", async ({ request }) => {
    // parse the Dropbox-API-Arg header
    const header = request.headers.get('Dropbox-API-Arg') || '{}'
    const { path: filePathLower } = JSON.parse(header) as { path: string }
    const filename = filePathLower.replace(/^\//, '')

    // resolve it under cypress/fixtures
    const fullPath = path.resolve(process.cwd(), 'cypress', 'fixtures', filename)
    const buffer = fs.readFileSync(fullPath)
   const uint8 = new Uint8Array(buffer)  
    const arrayBuffer = uint8.buffer
    return HttpResponse.arrayBuffer(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf'
      },
    })
  }),
  http.post("https://api.dropboxapi.com/2/files/list_folder", async (res) => {
    const body = (await res.request.json()) as DropboxFile
    const files = body.path.split('/').slice(1)
    return HttpResponse.json({
      cursor: "ZtkX9_EHj3x7PMkVuFIhwKYXEpwpLwyxp9vMKomUhllil9q7eWiAu",
      has_more: false,
      entries: files.map(f => ({
        ".tag": "file",
        "client_modified": "2015-05-12T15:50:38Z",
        "content_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "file_lock_info": {
          "created": "2015-05-12T15:50:38Z",
          "is_lockholder": true,
          "lockholder_name": "Imaginary User"
        },
        "has_explicit_shared_members": false,
        "id": "id:a4ayc_80_OEAAAAAAAAAXw",
        "is_downloadable": true,
        "name": `${f}`,
        "path_display": `/${f}`,
        "path_lower": `/${f}`,
        "property_groups": [
          {
            "fields": [
              {
                "name": "Security Policy",
                "value": "Confidential"
              }
            ],
            "template_id": "ptid:1a5n2i6d3OYEAAAAAAAAAYa"
          }
        ],
        "rev": "a1c10ce0dd78",
        "server_modified": "2015-05-12T15:50:38Z",
        "sharing_info": {
          "modified_by": "dbid:AAH4f99T0taONIb-OurWxbNQ6ywGRopQngc",
          "parent_shared_folder_id": "84528192421",
          "read_only": true
        },
        "size": 7212
      })
      )
    }, { status: 200 })
  }),
  http.post("https://api.dropboxapi.com/2/users/get_current_account", () => {
    return HttpResponse.json({
      uid: '987654321',
      email: "testing@gmail.com",
    }, { status: 200 })
  }),
  http.post("https://api.dropboxapi.com/oauth2/token", () => {
    return HttpResponse.json({
      access_token: 'mocked_access_token_123',
      token_type: 'bearer',
      expires_in: 14400,
      refresh_token: 'mocked_refresh_token_456',
      scope: 'files.metadata.read',
      uid: '987654321',
      account_id: 'dbid:ABCDEFGH'
    }, { status: 200 })
  }),
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

