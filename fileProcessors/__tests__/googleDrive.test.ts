import { expect } from "@jest/globals";
import { databaseDrizzle } from "@/db";
import { connections } from "@/db/schemas/connections";
import { publishProgress } from "@/events";
import { authGoogleDrive, getGoogleDriveAuthorization, readGoogleDriveFiles } from "@/fileProcessors/connectors/googleDrive";
import { drive } from "@googleapis/drive";
import { auth } from "@googleapis/oauth2";


jest.mock('@googleapis/oauth2', () => {
  const mOn = jest.fn();
  const mSet = jest.fn();
  return {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: mSet,
        on: mOn,
      })),
    },
  };
});
jest.mock('@googleapis/drive');
jest.mock('@/events');

process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'CID';
process.env.GOOGLE_CLIENT_SECRET = 'SEC';
process.env.NEXTAUTH_URL = 'https://app.test';

const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://fake-url');
(auth.OAuth2 as unknown as jest.Mock).mockImplementation(() => ({
  generateAuthUrl: mockGenerateAuthUrl,
  setCredentials: jest.fn(),
  on: jest.fn(),
}));

describe('authGoogleDrive', () => {
  it('builds an OAuth2 and returns authUrl', () => {
    const url = authGoogleDrive();
    expect(mockGenerateAuthUrl).toHaveBeenCalledWith(expect.objectContaining({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
      prompt: 'consent',

    }));
    expect(url).toBe('https://fake-url');
  });
});

describe("getGoogleDriveAuthorization", () => {
  it("hooks tokens listener and updates the DB when tokens change", async () => {
    const fakeCreds = {
      accessToken: 'AAAAAA',
      refreshToken: 'RRRRRR',
      expiryDate: 1234
    };


    const fakeBuilder = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis()
    };
    const updateSpy = jest
      .spyOn(databaseDrizzle, 'update')
      .mockReturnValue(fakeBuilder as any);

    const oauth = await getGoogleDriveAuthorization(fakeCreds, 'conn-id');

    const onMock = oauth.on as jest.Mock;
    expect(onMock).toHaveBeenCalledWith('tokens', expect.any(Function));
    const tokensCallback = onMock.mock.calls[0][1] as (t: any) => void;

    // imulate a token refresh event
    tokensCallback({
      access_token: 'NEW_A',
      refresh_token: 'NEW_R',
      expiry_date: 5678,
    });

    expect(updateSpy).toHaveBeenCalledWith(connections);
    expect(fakeBuilder.set as jest.Mock).toHaveBeenCalledWith({
      credentials: {
        refreshToken: 'NEW_R',
        accessToken: 'NEW_A',
        expiryDate: 5678,
      }
    });
    expect(fakeBuilder.where as jest.Mock).toHaveBeenCalled();
  });
});

describe('readGoogleDriveFiles', () => {
  const fakeCreds = {
    accessToken: 'AAAAAA',
    refreshToken: 'RRRRRR',
    expiryDate: 1234
  };
  const fakeConnectionMetadata = {
    folderId: "root"
  }

  it('on traverseFolder error, publishes progress and returns []', async () => {
    (drive as jest.Mock).mockReturnValue({
      files: { list: jest.fn().mockRejectedValue({ data: 'ERR!' }), get: jest.fn() }
    });

    const out = await readGoogleDriveFiles(
      'conn-id',
      "{}",
      fakeConnectionMetadata,
      fakeCreds
    );

    expect(out).toEqual([]);
    expect(publishProgress).toHaveBeenCalledWith(expect.objectContaining({
      connectionId: 'conn-id',
      processedFile: 0,
      processedPage: 0,
      errorMessage: 'ERR!',
      status: 'FINISHED'
    }));
  });
});
