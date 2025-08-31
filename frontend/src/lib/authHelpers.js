import { getAuth } from "firebase/auth";

export async function getSessionFromBackend() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const idToken = await user.getIdToken();

  const res = await fetch('/api/auth/session', { // update URL depending on proxy
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    }
  });
  return res.json();
}