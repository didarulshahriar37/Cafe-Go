import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// configuration read from Vite environment variables
// make sure to create a `.env` file at project root with values prefixed by VITE_
// load config from CRA environment variables (must start with REACT_APP_)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_apiKey,
    authDomain: process.env.REACT_APP_authDomain,
    projectId: process.env.REACT_APP_projectId,
    storageBucket: process.env.REACT_APP_storageBucket,
    messagingSenderId: process.env.REACT_APP_messagingSenderId,
    appId: process.env.REACT_APP_appId,
};

// sanity check: all values must be provided
const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
if (missing.length) {
    console.error(
        `Firebase config missing env vars: ${missing.join(', ')}. ` +
        'Make sure you have a .env with REACT_APP_ values and restart the server.'
    );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
