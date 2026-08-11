import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  carYears,
  CAR_TYPES,
  fetchRegions,
  PLATE_CHARACTERS,
  registerAdvertiser,
  registerDriver,
  registerTaxiCompany,
  RegistrationError,
} from './registration';
import { base64Bytes, scaledDimensions, stripDataUrlPrefix } from './imageUpload';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('registering', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the account id and the review message for an advertiser', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({
      accountId: 'a1',
      status: 'PendingVerification',
      message: "Your account is being reviewed. You'll be able to sign in once it's approved.",
    }, 201)));

    const result = await registerAdvertiser({
      companyName: 'Beirut Coffee', contactName: 'Rana K', email: 'r@example.com', password: 'Passw0rd!',
    });

    expect(result.id).toBe('a1');
    // The whole point: a new account is never usable straight away.
    expect(result.status).toBe('PendingVerification');
  });

  it('never returns a token, for any account type', async () => {
    const bodies: unknown[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(JSON.parse(init.body as string));
      return jsonResponse({ accountId: 'x', driverId: 'x', status: 'PendingVerification', message: 'ok' }, 201);
    }));

    const results = [
      await registerAdvertiser({ companyName: 'C', contactName: 'N', email: 'e@x.com', password: 'p' }),
      await registerTaxiCompany({ companyName: 'C', email: 'e@x.com', mobileNumber: '1', region: 'Beirut', password: 'p' }),
      await registerDriver({
        firstName: 'Elie', lastName: 'H', mobileNumber: '1', region: 'Beirut',
        plateNumber: '123', plateCharacter: 'B', carType: 'Sedan', carModel: 'Corolla', carYear: 2019,
        password: 'p', idImageBase64: 'a', licenseImageBase64: 'b', carPapersImageBase64: 'c',
      }),
    ];

    // Nothing here can sign anyone in, so no form built on it can navigate to a dashboard.
    for (const result of results) {
      expect(result).not.toHaveProperty('token');
      expect(Object.keys(result)).toEqual(['id', 'status', 'message']);
    }
  });

  it('sends the driver documents the endpoint expects', async () => {
    let sent: Record<string, unknown> = {};
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      sent = JSON.parse(init.body as string);
      return jsonResponse({ driverId: 'd1', status: 'PendingVerification' }, 201);
    }));

    await registerDriver({
      firstName: 'Elie', lastName: 'Haddad', mobileNumber: '0096170123456', region: 'Beirut',
      plateNumber: '123456', plateCharacter: 'B', carType: 'Sedan', carModel: 'Corolla', carYear: 2019,
      password: 'Passw0rd!', idImageBase64: 'AAA', licenseImageBase64: 'BBB', carPapersImageBase64: 'CCC',
    });

    expect(sent.idImageBase64).toBe('AAA');
    expect(sent.licenseImageBase64).toBe('BBB');
    expect(sent.carPapersImageBase64).toBe('CCC');
    expect(sent.carYear).toBe(2019);
  });

  it('recognises an account that already exists', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      jsonResponse({ message: 'An account already exists for this email.' }, 409)));

    const error = (await registerAdvertiser({
      companyName: 'C', contactName: 'N', email: 'taken@example.com', password: 'p',
    }).catch((e) => e)) as RegistrationError;

    // Worth telling apart: the answer is to sign in, not to fill the form in again.
    expect(error.isAlreadyRegistered).toBe(true);
    expect(error.message).toContain('already exists');
  });

  it("passes through the server's wording on a rejected password", async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      jsonResponse({ message: 'Could not create the account. Check the password requirements.' }, 400)));

    await expect(registerTaxiCompany({
      companyName: 'C', email: 'e@x.com', mobileNumber: '1', region: 'Beirut', password: 'short',
    })).rejects.toThrow('Check the password requirements');
  });

  it('says the server was unreachable rather than blaming the form', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));

    const error = (await registerAdvertiser({
      companyName: 'C', contactName: 'N', email: 'e@x.com', password: 'p',
    }).catch((e) => e)) as RegistrationError;

    expect(error.status).toBe(0);
    expect(error.message).toContain('Could not reach the server');
  });
});

describe('regions', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the list the platform actually holds', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([
      { id: 'r1', code: 'beirut', name: 'Beirut', isPremium: false },
      { id: 'r2', code: 'beirut-verdun', name: 'Verdun', isPremium: true },
    ])));

    const regions = await fetchRegions();

    expect(regions.map((r) => r.name)).toEqual(['Beirut', 'Verdun']);
  });

  it('fails loudly when the list cannot be loaded', async () => {
    // Silently falling back to a hardcoded list is how a form ends up offering regions that
    // resolve to nothing on the server.
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 500)));

    await expect(fetchRegions()).rejects.toBeInstanceOf(RegistrationError);
  });
});

describe('vehicle options', () => {
  it('matches the choices the driver app offers', () => {
    expect(CAR_TYPES).toEqual(['Sedan', 'SUV', 'Hatchback', 'Van', 'Pickup', 'Coupe']);
    expect(PLATE_CHARACTERS).toHaveLength(26);
    expect(PLATE_CHARACTERS[0]).toBe('A');
    expect(PLATE_CHARACTERS[25]).toBe('Z');
  });

  it('offers years newest first, back to 1990', () => {
    const years = carYears(new Date('2026-08-11T00:00:00Z'));

    expect(years[0]).toBe(2026);
    expect(years.at(-1)).toBe(1990);
  });
});

describe('preparing document photos', () => {
  it('shrinks a phone photo to the longest-edge limit, keeping its shape', () => {
    // A typical 12 MP portrait shot.
    const scaled = scaledDimensions(3024, 4032);

    expect(scaled.height).toBe(1600);
    expect(scaled.width).toBe(1200);
  });

  it('leaves an already-small image alone rather than upscaling it', () => {
    // Upscaling adds bytes and no information.
    expect(scaledDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('handles landscape as well as portrait', () => {
    expect(scaledDimensions(4000, 2000)).toEqual({ width: 1600, height: 800 });
  });

  it('never scales to a zero dimension', () => {
    const scaled = scaledDimensions(4000, 3);

    expect(scaled.width).toBe(1600);
    expect(scaled.height).toBeGreaterThanOrEqual(1);
  });

  it('measures base64 payloads so a size can be reported', () => {
    expect(base64Bytes('AAAA')).toBe(3);
    expect(base64Bytes('AAA=')).toBe(2);
    expect(base64Bytes('AA==')).toBe(1);
  });

  it('sends the payload rather than the data URL', () => {
    expect(stripDataUrlPrefix('data:image/jpeg;base64,AAAA')).toBe('AAAA');
    expect(stripDataUrlPrefix('AAAA')).toBe('AAAA');
  });
});
