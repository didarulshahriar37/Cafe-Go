# Cafe-Go Frontend

This repository contains a React frontend for a microservices-based café ordering system.

## Folder Structure

```
/public
/src
  /api          # backend API helpers
  /auth         # Firebase configuration & auth hooks
  /components   # UI pages: Login, Dashboard
  /utils        # utility functions (token storage, etc.)
  App.jsx       # top-level router/component
  index.js      # application entry point
package.json
```

## Features

- Firebase Authentication (Email/Password)
- Login page with form
- Dashboard page with "Place Order" button
- ID token stored in localStorage after login
- API call to `http://localhost:5000/order` with `Authorization: Bearer <token>` header
- Functional components and React hooks throughout

## Getting Started

1. Install dependencies (this will include React, Firebase, etc.):
   ```bash
   npm install
   ```
   If you add new packages later (e.g. axios for HTTP requests), re-run
   ```bash
   npm install axios
   ```

2. Create a `.env` file in the project root containing your Firebase credentials with the `REACT_APP_` prefix, for example:
   ```env
   REACT_APP_apiKey=AIzaSyCnahU2p-p37GDkNgUTKJMkVNecF3Py254
   REACT_APP_authDomain=cafe-go-client.firebaseapp.com
   REACT_APP_projectId=cafe-go-client
   REACT_APP_storageBucket=cafe-go-client.firebasestorage.app
   REACT_APP_messagingSenderId=630661940235
   REACT_APP_appId=1:630661940235:web:3a168f7b81f25bfc03730e
   ```
   The values will be available through `process.env` in `src/auth/firebase.js` after restarting the dev server.

3. Run the development server:
   ```bash
   npm start
   ```

## Notes

- Replace the placeholder order payload in `Dashboard.jsx` with real order data as needed.
- You can add additional routes or components under `/components`.

Enjoy building the café frontend!