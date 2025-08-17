const admin = require('firebase-admin');

const serviceAccount = {
    "type": "service_account",
  "project_id": "cttech-c3806",
  "private_key_id": "71a1d3ab8c74a8da6cc45ca5c9bcb9449cc7a6da",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDdS+9fHVyVWkTJ\ntpqB92I/QL6laAk9FoY5EywwPrdZlAWETXRBMkzFDZSyPPJNV1Tj4AOerkjY36mz\nSjBGLXVyZcqC3de6n+B57tDwjOBgtq911yyOlJ+CPzxTD870qbH4WLYNGZ/GItlR\nHArSy0rdXr/4UohmEcaH9pUGLKDBWABL/Y2tzMGn/hQeGoeJb777fkmv+Musz7Pk\nilXmqf4oTIksDWyNQw534NBY52l1oWd5iEKF17yoBmj2CwrXV36uxR2g0zryF4y6\nQTYZKKIEBa2N+eIRmr61fTCEgV2F6AMhhJ0biKvepJk4UAkQhPy7+Un174guHm9J\nkZpZrl4RAgMBAAECgf8RCcVT8IobPX47nFd5c5NakaDK5+pqR09Xo6xn+ukOsNrF\nP+NZxyjF5x35yf27h9w/A4wYGAzf5DldzXoKzfbD+yzk+tOF9Ee3WhB8NmkAjGFr\nFGItXNIZ/COh2oVYje1F7dNIa82EhcTmA/JRYww3MpUjQ+yPRq5OJa1L1oxhaRWI\nzybtkn85O4NtyfHFGqpaNzBEnD1gXCDCe7terhXUD/K+lqdYU10yS4PbyquYxyeX\nHI5YtblYMiiKXRBb4Hj/yMFFPUuFhGgepsWfuho65m/eO6ZLYRRL10l+IAg7p0SS\nHFTksoVUN0dycUnnTBxnTOU3BfzAqzzpr5FL28ECgYEA9CHuTzfnqEtMXtJ0WMKF\n5kroH89Lx0VwLcwKmGcVsqB8wUlOUNe76QOWJ0PjLr3qb18/MR7ClpR9D0At830q\n8CbY5XOX3/lBnz4RbLfDMGq3OYVTV+pAYiPCYwcuNasrHGjDlrKypfMR42SSxT92\n4/MEAh4jlwDM6TNZcHRKyvECgYEA6A3TfADcSu/86lwd1IW880UKNS2dCaUUT3Ej\nd6dzJAWO+F5KRVGdI9Ih0eSkqUw+xWL5hCW81x/w5qg8HdkaMYCqoasHG2TDYI9F\nCCFNHtfMLzaiHNLppJ2JQKmWTszOE0nVk8z/r6avwe0N8+NrmPfijKnFHi3IwbqM\n/8xLhSECgYAY75ZN1SH+WKKWVNy5bDUNDr2i8iOFWRxaMSsr4eufcTEM9RXgwAhb\nhphBrnd4AMH/WjU0KTYq90PG2QFYi4JlQTKKTUJICEehok9ZUXPIcD4CzBF1O2IU\nJB7oyoT3ymH+5tyDegExXiCHn3A2YYMdSWcxaC6ub9B+SVZrXBV/oQKBgQDPd3UJ\n27cYpIGJgnwFAuDQ2nvq2XIaKmYDNJLSKnqNzQ5qzdo3KWWFnhwwjOwOlKVWUkvk\nstyntN3rSqQcx3pcob1sNv1up2LqVI0SXLuXhLX/zCeZ/5N2YoZQso44u3DO2+dA\ncjpy72MZzXf5Ae2z4IPC4RHkDmj7k272T8+BIQKBgQCaphyhdDdpFic1lJFBFDFB\nV94Qqbw9RyT8nxwg7FYToVOUNH073Ajudy4eH3MpWxdrBH316ZVOYDBmTOL92ThI\nl/lZHHgacw/GwTM7dCjhLrsQooCWPGkz1IoVQnPc+QkhzwsYR9Y/krATGVaZ/k5E\nv/kdYSxSjiew1GntSsZv/A==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-hiix0@cttech-c3806.iam.gserviceaccount.com",
  "client_id": "118155634508409613326",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-hiix0%40cttech-c3806.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cttech-c3806-default-rtdb.firebaseio.com"
});

module.exports = admin;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);  // 👈 important