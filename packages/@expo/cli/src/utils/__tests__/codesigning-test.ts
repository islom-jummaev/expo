import { vol } from 'memfs';

import { APISettings } from '../../api/settings';
import { getCodeSigningInfoAsync, signManifestString } from '../codesigning';

const selfSignedCert = `-----BEGIN CERTIFICATE-----
MIICzTCCAbWgAwIBAgIJIOitOIH2bNqCMA0GCSqGSIb3DQEBCwUAMA8xDTALBgNV
BAMTBHRlc3QwIBcNMjIwMzEyMTgwMTU2WhgPMjEyMjAzMTIxNzAxNTZaMA8xDTAL
BgNVBAMTBHRlc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC915Fd
39jg0XXrtafeWl5dyINazMn14CMskLuXGWNqsv3tqTcGHwkiDkWOBlTz9kPoPtHe
T1HMGwgA9UcqFMtamugDx6BYIndNZsttfhVeJ1MQIvp2UJbkph3dJolIWQ8VYeNX
anZx3rlAbjoGq4S/tBS6zszutpWZFNUSM+TyMG4JdFdVskKsqKcYpdIjZu3ZZZxy
4iQvlSgQZIFDX3ZUnKH06RYs5SrGDigwjfOMolpvEj7bzR/86zBDCJ0EaZCrI/nz
dYKTCknFWOP2Bb81HTNvkzFPcMWCA/AlBZp2WWzTuXhf2xiGf4X/qqh4siJn3A98
8PI2JXRP1B8MACWfAgMBAAGjKjAoMA4GA1UdDwEB/wQEAwIHgDAWBgNVHSUBAf8E
DDAKBggrBgEFBQcDAzANBgkqhkiG9w0BAQsFAAOCAQEAQC8/Vpk2PkyByra+IXVZ
sbrCMcqu0vkQc1NXyrhi0ZrFq1+uYz6N+8M2U/oW7FIhSuVwZEqTRGqEC7l8/hFl
630/lMAWnmIQZ1ojD5eBPykvfolX/dQOFm+vstRGa5pLeD8SxGxPoFpuQC633rs/
e5O85vVK0Cdi5sjNHh3/+Xz0P9AqtskDNWni1tq+T+8hl+/DUG0zD9n4VczpswPY
+p0khYAHPWa0L4WEfH9xzBXIQcUD67w6ICT1q1pXmfFGaZL9U8qKXIn1hPU8lxPI
WlFFdh9HwWaoVIETqpJKjTe3k5+LrjkawOoMEnvJ2poKKG6lverU+vVu2zMG2Aix
/w==
-----END CERTIFICATE-----`;
const selfSignedCertPrivateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAvdeRXd/Y4NF167Wn3lpeXciDWszJ9eAjLJC7lxljarL97ak3
Bh8JIg5FjgZU8/ZD6D7R3k9RzBsIAPVHKhTLWproA8egWCJ3TWbLbX4VXidTECL6
dlCW5KYd3SaJSFkPFWHjV2p2cd65QG46BquEv7QUus7M7raVmRTVEjPk8jBuCXRX
VbJCrKinGKXSI2bt2WWccuIkL5UoEGSBQ192VJyh9OkWLOUqxg4oMI3zjKJabxI+
280f/OswQwidBGmQqyP583WCkwpJxVjj9gW/NR0zb5MxT3DFggPwJQWadlls07l4
X9sYhn+F/6qoeLIiZ9wPfPDyNiV0T9QfDAAlnwIDAQABAoIBAQCdqlPrkAZSKQPz
gAnsDEeFQgt9tMkisETmNUnm4soDiqaD5F5zcgEmzI2Nt8qEVwns74djR6MajXSn
Pw4cb+q31CFPSlLr/6vvl6jpxaY/bQ96PmKfMq0vNptk2SV49aYmTwb9yciXJ6/Z
R/JfKcH1aL0yrJ/cvb0exwNyu7CwRoN/ree9SxGRqS0E31m3kZDTB8n2ZVWMFjoN
/zRrDy1m1JuWyzcmwfOKk8MDxJWkOwUplLdMi3pA39vVx88Rb/4qQ4BX+TNkuSmH
aoI01H5nPhIJROdrNOU0YfrPE15bl+N0Nq8MU/ygsTJstxNTck+CEmjYhT7gn/kT
kzwhP8wRAoGBAOwtoWYkvGWMmQ7nPJSrqyZZFg7TnCeIshtvrZsMl6VmxXnBAfCs
lcPBbX6XbHRyoVhZeWV0YbvVNqq6LVjto3pZjQdzLbr7ef+biciJU9cVT9RNVjcf
fraoa9vPPsLW4k4EpyXPSMPCTtYokGgqtDvQhiYw2SJKBu2CmG2RMiNXAoGBAM3G
Y4k6Fy7hbWGdZOacYYFtcoSkfiQKaoUc8/AOkY5KpvDWYcXsjs/ZX7mT5w9RPL05
YE9+vp0bStyWG4sCjvJZzaUIxkQLMFSLr6JIah422x97OyT6YwC/ebClksdRBXG6
mN20YghJSrSU56bvPngJWbnkaoToqIP9vz0Y3Kr5AoGBAKINjTkw67QiDMOVFpRM
VlsxtVjnCbZ2rP72WgCRW1w6cDVioZoqUXjIOAEslVYxcVPV0N40RPtFCQWMSaFD
LXC+EW6TMUWjV8pzRs86qzRhgy0BA68/BQr/9UIVqdK27wDpYGcpG5x2rvFzU+Kl
qpWANwvtaI+Gi8pcWYqUnfpxAoGAOnuB2oR6BkbnUXDsNmaHh8NVYsFlYFTdhUt/
QODDGY+59oTXcOsUg5oiDJoudzn9a0IdTzqUbg5NrnezCEUH33UKbzcZMkmDyOOS
XSr7je7FRCM/4fiPnqzMpxnHp4Ita+8+dvRHUFeUNdKEK/ue43q015JFe9Sr4CeD
7JdeT/ECgYEAmmkGP0SBXG97loeWrTnelLIdxExpEeQ3PHWkJBjg/fRNa8Qack+3
o0G+LL1P0gRD0XZcccIaJ38QIoL63xx7yCCRlw821gB9SrNJau8+rl6LE3lF22RG
KM04JH2KT9s6MrNy70DdYRjuh2lQeK6kbtur8XYvW/fEYVo1wX/PxDg=
-----END RSA PRIVATE KEY-----`;

jest.mock('@expo/code-signing-certificates', () => ({
  ...(jest.requireActual(
    '@expo/code-signing-certificates'
  ) as typeof import('@expo/code-signing-certificates')),
  generateKeyPair: jest.fn(() =>
    (
      jest.requireActual(
        '@expo/code-signing-certificates'
      ) as typeof import('@expo/code-signing-certificates')
    ).convertKeyPairPEMToKeyPair({
      publicKeyPEM: `-----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtDpF2+EeUkWz0Z0fykCc
    d0/w9110+BSBSDXDn8pEQLZCnf49YCK5ZuHutt+uiEyWfNLc2CeOwGBDRSHL4kj1
    objmB8KFU/YfD4ynX2lTqapGnF/VyfVQFBf0IAe5sdx2RjbW5A1El68xKcsi75R7
    ib44kdRTtoR7j3BgcpxZByvuJcArB6wZbVzjw76a5JkbNqSd01+ggYd5T6FGebzF
    PZwi2Jq9L0qVWHfyc6XfYXZAzS81EvJpXY3BfZIHjVvO13SI+k4j4K4z5eTJbWST
    OJKZvH9AoMfGK9Jt8ah2RkALTqQVcwDvUrLnSw3F/LKwNmZ7gT4/SarAnd2dW0Yz
    MQIDAQAB
    -----END PUBLIC KEY-----`,
      privateKeyPEM: `-----BEGIN RSA PRIVATE KEY-----
    MIIEowIBAAKCAQEAtDpF2+EeUkWz0Z0fykCcd0/w9110+BSBSDXDn8pEQLZCnf49
    YCK5ZuHutt+uiEyWfNLc2CeOwGBDRSHL4kj1objmB8KFU/YfD4ynX2lTqapGnF/V
    yfVQFBf0IAe5sdx2RjbW5A1El68xKcsi75R7ib44kdRTtoR7j3BgcpxZByvuJcAr
    B6wZbVzjw76a5JkbNqSd01+ggYd5T6FGebzFPZwi2Jq9L0qVWHfyc6XfYXZAzS81
    EvJpXY3BfZIHjVvO13SI+k4j4K4z5eTJbWSTOJKZvH9AoMfGK9Jt8ah2RkALTqQV
    cwDvUrLnSw3F/LKwNmZ7gT4/SarAnd2dW0YzMQIDAQABAoIBAFt3J3ULrsO6NCQx
    RazzVXUH0Rb5Cx/L6ECpaHpzwGfHF8/u818SwF0CVI/ivUTW+ZinuwTILp5bPEid
    ekeBF4fXuoY9pkSSJ/lQPLEjVx5IGEXMLUetg9JuxaprwUYOyMehlTVvtlv0wVKg
    kT5dcMTbEQKRa1q5qauGMKx5xITqX2NTFa3BUfl6tKc5Z0+Q0fsbXw1g5MJuKOmA
    Ue0EWDLUJEIku77rCBI2o1yi2vn+xJV6x9nG6c0jfRZay2WxFRe/eXd2LGJFArp8
    T12jmgMPvUnlXHxQhxVKMsciCj2rfBjVVsPBsGdFlD+1geijSB/4iNuJijEUfh28
    888ObwECgYEA7kpHoFOEkELggVdGsGwJL5hL3l6fmijesdvmKUcL0VW8CIMcH6Ox
    WYzXY0kMqxgdUHIjlAqo+TqBw+tma84wD29T6c1SxfE8wCGVbyEXs+uE3TxDIDsK
    3T+TL7uSp7wjJoQhc8oCkC+StRJgA39S962aahpe31zhqj9EtMTBhUkCgYEAwZ9K
    6Bt0efdPudCyjAmaKSnth0M+bDpnPLHCOv2A2lu6HiozDDraDK48HhaxSIHr/fZA
    U8/8UWkMV8PNE5mDiGnY4IP1w8cZuvOzHxvo8B8S97FxrcrmDAHB/3yFbrr1r/T0
    nFswhgumdxVpzHqvq7OeKDcKbvXBPiFOXAq5hqkCgYEApxzOuKB5wlY0bmDPwWAy
    3P8Yjf2cPpfU/bTy6BXcMtXGhc21BnddJClC0G1lhgPmYwl47BTBxe+DG+xVqtsy
    F1EC71/AYfM5oKCs1P/HSLWuOx1NEih2CQ3R4lLQmfO2TwexEiwkuguy/mvBjBJa
    FDrapPiTemAAHs46F/A4q4kCgYAO/90YsA/M5wjJF07NpGzJ5ZKeGOp8DeYzgH3Q
    fhT+VX7MmW5M8z4zH0hO+GkReecjTHFdTM56LA4lumhnrUvQRIrlkbN3UDRBFGH6
    9fmMqIuanqd01DQQGA7EUQwxMNCZqftNJY9TwxFJRmJk0dhMD+UfrmvjfqxSuNfO
    L5KByQKBgA2nW+dcvQ/t9OMD0DZ0IBe24zobmZUUrgDUh7VL5MSI9p7R2wvJKrpm
    PuvYcMA5Z3Wbu9mL5PMQabu01GfEjt2n5Pdki5K088m4NfJSDzzqLYcqy9HCNLj9
    X563PtW2kul9lrlkNUqZNn/oTTMcVmBrz2B6u+VWApyle40Wd2Wd
    -----END RSA PRIVATE KEY-----`,
    })
  ),
}));
jest.mock('../../api/getProjectDevelopmentCertificate', () => ({
  getProjectDevelopmentCertificateAsync: jest.fn(
    () => `-----BEGIN CERTIFICATE-----
  MIIDxzCCAq+gAwIBAgIJPwjUxmTw0yorMA0GCSqGSIb3DQEBCwUAMHkxHDAaBgNV
  BAMTE0V4cG8gR28gQ2VydGlmaWNhdGUxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpD
  YWxpZm9ybmlhMRIwEAYDVQQHEwlQYWxvIEFsdG8xDTALBgNVBAoTBEV4cG8xFDAS
  BgNVBAsTC0VuZ2luZWVyaW5nMB4XDTIyMDMxMjE3NTczOVoXDTIyMDQxMTE2NTcz
  OVowTzFNMEsGA1UEAxNERXhwbyBHbyBEZXZlbG9wbWVudCBDZXJ0aWZpY2F0ZSAy
  ODVkYzljYS1hMjVkLTRmNjAtOTNiZS0zNmRjMzEyMjY2ZDcwggEiMA0GCSqGSIb3
  DQEBAQUAA4IBDwAwggEKAoIBAQC0OkXb4R5SRbPRnR/KQJx3T/D3XXT4FIFINcOf
  ykRAtkKd/j1gIrlm4e62366ITJZ80tzYJ47AYENFIcviSPWhuOYHwoVT9h8PjKdf
  aVOpqkacX9XJ9VAUF/QgB7mx3HZGNtbkDUSXrzEpyyLvlHuJvjiR1FO2hHuPcGBy
  nFkHK+4lwCsHrBltXOPDvprkmRs2pJ3TX6CBh3lPoUZ5vMU9nCLYmr0vSpVYd/Jz
  pd9hdkDNLzUS8mldjcF9kgeNW87XdIj6TiPgrjPl5MltZJM4kpm8f0Cgx8Yr0m3x
  qHZGQAtOpBVzAO9SsudLDcX8srA2ZnuBPj9JqsCd3Z1bRjMxAgMBAAGjfDB6MA4G
  A1UdDwEB/wQEAwIHgDAWBgNVHSUBAf8EDDAKBggrBgEFBQcDAzBQBh4qhkiG9xQB
  vkCTeoLTLYF+gQBmgR2D4ep1gZ9XAgEELjI4NWRjOWNhLWEyNWQtNGY2MC05M2Jl
  LTM2ZGMzMTIyNjZkNyxAdGVzdC9hcHAwDQYJKoZIhvcNAQELBQADggEBAB0egBAv
  bkqvuLy5h2faz9XEkwTBtnmuY2maGDU4n3qgBKuoP06aOaqLNymqF5l3ymQjkoG/
  FJIy81l2PM8E0q3SSo9aagrYazD0RGqwvhll4B7l6qcaAvaPRl2WVN2Dd4UVC08v
  iJLSY4ho7KsxmLejxOFSGa8gHokJoT1378Rws7ESuENBBVnRSDmxhIMhZg+dKdaN
  69F4DH/JE/zfiCWlO9Wwe2GICfJFY21wDEklbxl0oeirE6MhPWOwUmLRNttMX2PY
  ncRkbVz/rQMFbb/8vyGGd/s7zBzgzSmErM+I3K2fUuHQQe+HhLQ539FLRE6iqx4p
  LGtk6qIqD0tvNfA=
  -----END CERTIFICATE-----`
  ),
}));
jest.mock('../../api/getExpoGoIntermediateCertificate', () => ({
  getExpoGoIntermediateCertificateAsync: jest.fn(
    () => `-----BEGIN CERTIFICATE-----
    MIIDtTCCAp2gAwIBAgIJOzyHLivOO4R2MA0GCSqGSIb3DQEBCwUAMHsxHjAcBgNV
    BAMTFUV4cG8gUm9vdCBDZXJ0aWZpY2F0ZTELMAkGA1UEBhMCVVMxEzARBgNVBAgT
    CkNhbGlmb3JuaWExEjAQBgNVBAcTCVBhbG8gQWx0bzENMAsGA1UEChMERXhwbzEU
    MBIGA1UECxMLRW5naW5lZXJpbmcwHhcNMjIwMzEyMTc1NzM5WhcNMjQwMzEyMTY1
    NzM5WjB5MRwwGgYDVQQDExNFeHBvIEdvIENlcnRpZmljYXRlMQswCQYDVQQGEwJV
    UzETMBEGA1UECBMKQ2FsaWZvcm5pYTESMBAGA1UEBxMJUGFsbyBBbHRvMQ0wCwYD
    VQQKEwRFeHBvMRQwEgYDVQQLEwtFbmdpbmVlcmluZzCCASIwDQYJKoZIhvcNAQEB
    BQADggEPADCCAQoCggEBAMk7quEu5Jgi9ogV4IVyWdfAxlu14fsbBTo04Nu02f+2
    o9iyVi4pSo6QBog8UXetFiujRssBP04G7UAp4R7ZAczY9QwRRYbeC2caTvan6ibs
    D7QD59pDbvizeQXWg9SiQrjkCS16NcFm6m2WF3ZHyw+dQNAv691aBIIUrLRkykmr
    OYqTK2mAoVyGHPvvqcp4EpbOVzKfk0APSstbHbwQM5eU8nxPca7ExY+cWShUPqGF
    dmfz0VMrHAhwWBJh0+5mTfPAW4mKQXY4K0PCDrgWmNl4zq0z81uU4txemTBvRKei
    TxlqB3X7HfPKgv3XnrBDlsz/qyRQStNCzLg5/h9F6lMCAwEAAaM+MDwwEgYDVR0T
    AQH/BAgwBgEB/wIBADAOBgNVHQ8BAf8EBAMCAYYwFgYDVR0lAQH/BAwwCgYIKwYB
    BQUHAwMwDQYJKoZIhvcNAQELBQADggEBAI7VMf1Xi2onC7rJt7b8tgXcAEPX8EMe
    Aa4xuBeT5vJKgVk6OCF12StjjLTzjGx9cnhegbgNfjOUQVBJYTn7UubhzDBB8kSm
    tTzZ8kTMmOEvzbm5+lRvd/9tJCoeBpwFGw2ArjYNLhDrElWdqZKcwoKvJ/X0TSGx
    QZuSXE5oWjKVUidovOiEXgCm5Fsrr7FjDPHyCqvYjbmTGK+0N8LVFuR6teWVs9dH
    5MOzNkeB93i2zcKa8Jk4q9wEjpX12luFe6UvTsKZQrBIrqlI0FdZ772G0IzTpaSV
    VGW3wyFSeIA3AuNLpSUxR6P2ks2H+R9Y08voHiUVxcBsmLFSKVOhrnc=
    -----END CERTIFICATE-----`
  ),
}));

beforeEach(() => {
  vol.reset();
});

describe(getCodeSigningInfoAsync, () => {
  it('returns null when no expo-expect-signature header is requested', async () => {
    await expect(getCodeSigningInfoAsync({} as any, null, null)).resolves.toBeNull();
  });

  it('throws when expo-expect-signature header has invalid format', async () => {
    await expect(getCodeSigningInfoAsync({} as any, 'hello', null)).rejects.toThrowError(
      'keyid not present in expo-expect-signature header'
    );
    await expect(getCodeSigningInfoAsync({} as any, 'keyid=1', null)).rejects.toThrowError(
      'Invalid value for keyid in expo-expect-signature header: 1'
    );
    await expect(
      getCodeSigningInfoAsync({} as any, 'keyid="hello", alg=1', null)
    ).rejects.toThrowError('Invalid value for alg in expo-expect-signature header');
  });

  describe('expo-root keyid requested', () => {
    describe('online', () => {
      beforeEach(() => {
        APISettings.isOffline = false;
      });

      it('normal case gets a development certificate', async () => {
        const result = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        expect(result).toMatchSnapshot();
      });

      it('requires easProjectId to be configured', async () => {
        const result = await getCodeSigningInfoAsync(
          { extra: { eas: {} } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        expect(result).toBeNull();
      });

      it('falls back to cached when offline', async () => {
        const result = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        APISettings.isOffline = true;
        const result2 = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        expect(result2).toEqual(result);
        APISettings.isOffline = false;
      });
    });
  });

  describe('expo-go keyid requested', () => {
    it('throws', async () => {
      await expect(
        getCodeSigningInfoAsync({} as any, 'keyid="expo-go"', null)
      ).rejects.toThrowError(
        'Invalid certificate requested: cannot sign with embedded keyid=expo-go key'
      );
    });
  });

  describe('non expo-root certificate keyid requested', () => {
    it('normal case gets the configured certificate', async () => {
      vol.fromJSON({
        'keys/cert.pem': selfSignedCert,
        'keys/private-key.pem': selfSignedCertPrivateKey,
      });

      const result = await getCodeSigningInfoAsync(
        {
          updates: {
            codeSigningCertificate: 'keys/cert.pem',
            codeSigningMetadata: { keyid: 'test', alg: 'rsa-v1_5-sha256' },
          },
        } as any,
        'keyid="test", alg="rsa-v1_5-sha256"',
        undefined
      );
      expect(result).toMatchSnapshot();
    });

    it('throws when it cannot generate the requested keyid due to no code signing configuration in app.json', async () => {
      await expect(
        getCodeSigningInfoAsync(
          {
            updates: { codeSigningCertificate: 'keys/cert.pem' },
          } as any,
          'keyid="test", alg="rsa-v1_5-sha256"',
          undefined
        )
      ).rejects.toThrowError(
        'Must specify "codeSigningMetadata" under the "updates" field of your app config file to use EAS code signing'
      );
    });

    it('throws when it cannot generate the requested keyid due to configured keyid or alg mismatch', async () => {
      await expect(
        getCodeSigningInfoAsync(
          {
            updates: {
              codeSigningCertificate: 'keys/cert.pem',
              codeSigningMetadata: { keyid: 'test2', alg: 'rsa-v1_5-sha256' },
            },
          } as any,
          'keyid="test", alg="rsa-v1_5-sha256"',
          undefined
        )
      ).rejects.toThrowError('keyid mismatch: client=test, project=test2');

      await expect(
        getCodeSigningInfoAsync(
          {
            updates: {
              codeSigningCertificate: 'keys/cert.pem',
              codeSigningMetadata: { keyid: 'test', alg: 'fake' },
            },
          } as any,
          'keyid="test", alg="fake2"',
          undefined
        )
      ).rejects.toThrowError('alg mismatch: client=fake2, project=fake');
    });

    it('throws when it cannot load configured code signing info', async () => {
      await expect(
        getCodeSigningInfoAsync(
          {
            updates: {
              codeSigningCertificate: 'keys/cert.pem',
              codeSigningMetadata: { keyid: 'test', alg: 'rsa-v1_5-sha256' },
            },
          } as any,
          'keyid="test", alg="rsa-v1_5-sha256"',
          undefined
        )
      ).rejects.toThrowError('Code signing certificate cannot be read from path: keys/cert.pem');
    });
  });
});

describe(signManifestString, () => {
  it('generates signature', () => {
    expect(
      signManifestString('hello', {
        certificateChainForResponse: [],
        certificateForPrivateKey: selfSignedCert,
        privateKey: selfSignedCertPrivateKey,
      })
    ).toMatchSnapshot();
  });
  it('validates generated signature against certificate', () => {
    expect(() =>
      signManifestString('hello', {
        certificateChainForResponse: [],
        certificateForPrivateKey: '',
        privateKey: selfSignedCertPrivateKey,
      })
    ).toThrowError('Invalid PEM formatted message.');
  });
});
