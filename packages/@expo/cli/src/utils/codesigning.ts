import {
  convertCertificatePEMToCertificate,
  convertKeyPairToPEM,
  convertCSRToCSRPEM,
  generateKeyPair,
  generateCSR,
  convertPrivateKeyPEMToPrivateKey,
  validateSelfSignedCertificate,
  signStringRSASHA256AndVerify,
} from '@expo/code-signing-certificates';
import { ExpoConfig } from '@expo/config';
import { promises as fs } from 'fs';
import { pki as PKI } from 'node-forge';
import path from 'path';
import { Dictionary, parseDictionary } from 'structured-headers';

import { getExpoGoIntermediateCertificateAsync } from '../api/getExpoGoIntermediateCertificate';
import { getProjectDevelopmentCertificateAsync } from '../api/getProjectDevelopmentCertificate';
import { APISettings } from '../api/settings';
import * as Log from '../log';
import { createTemporaryProjectFile } from '../start/project/dotExpo';

export type CodeSigningInfo = {
  privateKey: string;
  certificateForPrivateKey: string;
  certificateChainForResponse: string[]; // empty means no need to serve the certificate chain in the multipart response
};

type StoredDevelopmentExpoRootCodeSigningInfo = {
  easProjectId: string | null;
  privateKey: string | null;
  certificateChain: string[] | null;
};
const DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME = 'development-code-signing-settings.json';
const DevelopmentCodeSigningInfoFile =
  createTemporaryProjectFile<StoredDevelopmentExpoRootCodeSigningInfo>(
    DEVELOPMENT_CODE_SIGNING_SETTINGS_FILE_NAME,
    {
      easProjectId: null,
      privateKey: null,
      certificateChain: null,
    }
  );

/**
 * Get info necessary to generate a response `expo-signature` header given a project and incoming request `expo-expect-signature` header.
 * This only knows how to serve two code signing keyids:
 * - `expo-root` indicates that it should use a development certificate in the `expo-root` chain. See {@link getExpoRootDevelopmentCodeSigningInfoAsync}
 * - <developer's expo-updates keyid> indicates that it should sign with the configured certificate. See {@link getProjectCodeSigningCertificateAsync}
 */
export async function getCodeSigningInfoAsync(
  projectRoot: string,
  exp: ExpoConfig,
  expectSignatureHeader: string | null,
  privateKeyPath: string | undefined
): Promise<CodeSigningInfo | null> {
  if (!expectSignatureHeader) {
    return null;
  }

  let parsedExpectSignature: Dictionary;
  try {
    parsedExpectSignature = parseDictionary(expectSignatureHeader);
  } catch {
    throw new Error('Invalid value for expo-expect-signature header');
  }

  const expectedKeyIdOuter = parsedExpectSignature.get('keyid');
  if (!expectedKeyIdOuter) {
    throw new Error('keyid not present in expo-expect-signature header');
  }

  const expectedKeyId = expectedKeyIdOuter[0];
  if (typeof expectedKeyId !== 'string') {
    throw new Error(`Invalid value for keyid in expo-expect-signature header: ${expectedKeyId}`);
  }

  let expectedAlg: string | null = null;
  const expectedAlgOuter = parsedExpectSignature.get('alg');
  if (expectedAlgOuter) {
    const expectedAlgTemp = expectedAlgOuter[0];
    if (typeof expectedAlgTemp !== 'string') {
      throw new Error('Invalid value for alg in expo-expect-signature header');
    }
    expectedAlg = expectedAlgTemp;
  }

  if (expectedKeyId === 'expo-root') {
    return await getExpoRootDevelopmentCodeSigningInfoAsync(projectRoot, exp);
  } else if (expectedKeyId === 'expo-go') {
    throw new Error('Invalid certificate requested: cannot sign with embedded keyid=expo-go key');
  } else {
    return await getProjectCodeSigningCertificateAsync(
      exp,
      privateKeyPath,
      expectedKeyId,
      expectedAlg
    );
  }
}

/**
 * Get a development code signing certificate for the expo-root -> expo-go -> (development certificate) certificate chain.
 * This requires the user be logged in and online, otherwise try to use the cached development certificate.
 */
async function getExpoRootDevelopmentCodeSigningInfoAsync(
  projectRoot: string,
  exp: ExpoConfig
): Promise<CodeSigningInfo | null> {
  const easProjectId = exp.extra?.eas?.projectId;
  // can't check for scope key validity since scope key is derived on the server from projectId and we may be offline.
  // we rely upon the client certificate check to validate the scope key
  if (!easProjectId) {
    Log.warn('No project ID specified in app.json, unable to sign manifest');
    return null;
  }

  // 1. If online, ensure logged in, generate PK, CSR, fetch and cache cert chain for projectId
  //    (overwriting existing dev cert in case projectId changed or it has expired)
  if (!APISettings.isOffline) {
    return await fetchAndCacheNewDevelopmentCodeSigningInfoAsync(projectRoot, easProjectId);
  }

  // 2. check for cached cert/pk matching projectId and scopeKey of project, if found and valid return PK and cert chain including expo-go cert
  const developmentCodeSigningInfoFromFile = await DevelopmentCodeSigningInfoFile.readAsync(
    projectRoot
  );
  const validatedCodeSigningInfo = validateStoredDevelopmentExpoRootCertificateCodeSigningInfo(
    developmentCodeSigningInfoFromFile,
    easProjectId
  );
  if (validatedCodeSigningInfo) {
    return validatedCodeSigningInfo;
  }

  // 3. if offline, return null
  Log.warn('Offline and no cached development certificate found, unable to sign manifest');
  return null;
}

/**
 * Get the certificiate configured for expo-updates for this project.
 */
async function getProjectCodeSigningCertificateAsync(
  exp: ExpoConfig,
  privateKeyPath: string | undefined,
  expectedKeyId: string,
  expectedAlg: string | null
): Promise<CodeSigningInfo | null> {
  const codeSigningCertificatePath = exp.updates?.codeSigningCertificate;
  if (!codeSigningCertificatePath) {
    return null;
  }

  if (!privateKeyPath) {
    privateKeyPath = path.join(path.dirname(codeSigningCertificatePath), 'private-key.pem');
  }

  const codeSigningMetadata = exp.updates?.codeSigningMetadata;
  if (!codeSigningMetadata) {
    throw new Error(
      'Must specify codeSigningMetadata under the "updates" field of your app config file to use EAS code signing'
    );
  }

  const { alg, keyid } = codeSigningMetadata;
  if (!alg || !keyid) {
    throw new Error(
      'Must specify keyid and alg in the codeSigningMetadata field under the "updates" field of your app config file to use EAS code signing'
    );
  }

  if (expectedKeyId !== keyid) {
    throw new Error(`keyid mismatch: client=${expectedKeyId}, project=${keyid}`);
  }

  if (expectedAlg && expectedAlg !== alg) {
    throw new Error(`alg mismatch: client=${expectedAlg}, project=${alg}`);
  }

  const { privateKeyPEM, certificatePEM } =
    await getProjectPrivateKeyAndCertificateFromFilePathsAsync({
      codeSigningCertificatePath,
      privateKeyPath,
    });

  return {
    privateKey: privateKeyPEM,
    certificateForPrivateKey: certificatePEM,
    certificateChainForResponse: [],
  };
}

async function readFileWithErrorAsync(path: string, errorMessage: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch {
    throw new Error(errorMessage);
  }
}

async function getProjectPrivateKeyAndCertificateFromFilePathsAsync({
  codeSigningCertificatePath,
  privateKeyPath,
}: {
  codeSigningCertificatePath: string;
  privateKeyPath: string;
}): Promise<{ privateKeyPEM: string; certificatePEM: string }> {
  const [codeSigningCertificatePEM, privateKeyPEM] = await Promise.all([
    readFileWithErrorAsync(
      codeSigningCertificatePath,
      `Code signing certificate cannot be read from path: ${codeSigningCertificatePath}`
    ),
    readFileWithErrorAsync(
      privateKeyPath,
      `Code signing private key cannot be read from path: ${privateKeyPath}`
    ),
  ]);

  const privateKey = convertPrivateKeyPEMToPrivateKey(privateKeyPEM);
  const certificate = convertCertificatePEMToCertificate(codeSigningCertificatePEM);
  validateSelfSignedCertificate(certificate, {
    publicKey: certificate.publicKey as PKI.rsa.PublicKey,
    privateKey,
  });

  return { privateKeyPEM, certificatePEM: codeSigningCertificatePEM };
}

function validateStoredDevelopmentExpoRootCertificateCodeSigningInfo(
  codeSigningInfo: StoredDevelopmentExpoRootCodeSigningInfo,
  easProjectId: string
): CodeSigningInfo | null {
  if (codeSigningInfo.easProjectId !== easProjectId) {
    return null;
  }

  const { privateKey: privateKeyPEM, certificateChain: certificatePEMs } = codeSigningInfo;
  if (!privateKeyPEM || !certificatePEMs) {
    return null;
  }

  const certificateChain = certificatePEMs.map((certificatePEM) =>
    convertCertificatePEMToCertificate(certificatePEM)
  );

  // TODO(wschurman): maybe move to @expo/code-signing-certificates
  const leafCertificate = certificateChain[0];
  const now = new Date();
  if (leafCertificate.validity.notBefore > now || leafCertificate.validity.notAfter < now) {
    return null;
  }

  // TODO(wschurman): maybe do more validation

  return {
    certificateChainForResponse: certificatePEMs,
    certificateForPrivateKey: certificatePEMs[0],
    privateKey: privateKeyPEM,
  };
}

async function fetchAndCacheNewDevelopmentCodeSigningInfoAsync(
  projectRoot: string,
  easProjectId: string
): Promise<CodeSigningInfo> {
  const keyPair = generateKeyPair();
  const keyPairPEM = convertKeyPairToPEM(keyPair);
  const csr = generateCSR(keyPair, `Development Certificate for ${easProjectId}`);
  const csrPEM = convertCSRToCSRPEM(csr);
  const [developmentCertificate, expoGoIntermeidateCertificate] = await Promise.all([
    getProjectDevelopmentCertificateAsync(easProjectId, csrPEM),
    getExpoGoIntermediateCertificateAsync(easProjectId),
  ]);

  await DevelopmentCodeSigningInfoFile.setAsync(projectRoot, {
    easProjectId,
    privateKey: keyPairPEM.privateKeyPEM,
    certificateChain: [developmentCertificate, expoGoIntermeidateCertificate],
  });

  return {
    certificateChainForResponse: [developmentCertificate, expoGoIntermeidateCertificate],
    certificateForPrivateKey: developmentCertificate,
    privateKey: keyPairPEM.privateKeyPEM,
  };
}
/**
 * Generate the `expo-signature` header for a manifest and code signing info.
 */
export function signManifestString(
  stringifiedManifest: string,
  codeSigningInfo: CodeSigningInfo
): string {
  const privateKey = convertPrivateKeyPEMToPrivateKey(codeSigningInfo.privateKey);
  const certificate = convertCertificatePEMToCertificate(codeSigningInfo.certificateForPrivateKey);
  return signStringRSASHA256AndVerify(privateKey, certificate, stringifiedManifest);
}
