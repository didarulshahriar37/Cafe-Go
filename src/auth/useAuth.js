import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

// simple store token in localStorage
const TOKEN_KEY = 'firebaseIdToken';

export async function login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    localStorage.setItem(TOKEN_KEY, token);
    return token;
}

export function getIdToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    return auth.signOut();
}
