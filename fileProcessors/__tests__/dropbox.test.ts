import { DropboxAuth } from 'dropbox';
import { authDropbox } from '../connectors/dropbox';
import { expect } from "@jest/globals";

jest.mock('dropbox');

process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'CID';
process.env.GOOGLE_CLIENT_SECRET = 'SEC';
process.env.NEXTAUTH_URL = 'https://app.test';

const mockGenerateAuthUrl = jest.fn().mockResolvedValue('https://fake-url');
(DropboxAuth as unknown as jest.Mock).mockImplementation(() => ({
  getAuthenticationUrl: mockGenerateAuthUrl,
  setCredentials: jest.fn(),
  on: jest.fn(),
}));

describe('authDropbox', () => {
  it('builds an OAuth2 and returns authUrl', async () => {
    const url = await authDropbox();
    expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
      `${process.env.NEXTAUTH_URL}/api/connections/dropbox/callback`,
      undefined,
      'code',
      'offline',
      ["files.metadata.read", "files.content.read", "email", "openid", "account_info.read"]
    );

    expect(url).toBe('https://fake-url&force_reapprove=true');
  });
});
