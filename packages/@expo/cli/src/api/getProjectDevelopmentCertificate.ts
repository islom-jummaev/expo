import { CommandError } from '../utils/errors';
import { fetchAsync } from './rest/client';
import { ensureLoggedInAsync } from './user/actions';

export async function getProjectDevelopmentCertificateAsync(
  easProjectId: string,
  csrPEM: string
): Promise<string> {
  await ensureLoggedInAsync();
  const response = await fetchAsync(`projects/${easProjectId}/development-certificates`, {
    method: 'POST',
    body: JSON.stringify({
      csrPEM,
    }),
  });
  if (!response.ok) {
    throw new CommandError('API', `Unexpected from Expo servers: ${response.statusText}.`);
  }
  const buffer = await response.buffer();
  return buffer.toString('utf8');
}
