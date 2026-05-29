# evBytes

evBytes is an electric vehicle news and blog website built with Express, EJS, MongoDB, Passport, NewsAPI, and SendGrid.

## What It Does

- Shows electric vehicle news from NewsAPI
- Supports local and social login
- Allows contributors to write blog posts
- Sends blog posts through a moderation step before publishing
- Lets logged-in users bookmark blogs

## Project Structure

```text
app.js                 Express app entry point
config/                Passport and local configuration
models/                Mongoose models
routes/                Express route handlers
views/                 EJS pages and partials
public/                CSS, JavaScript, fonts, and static assets
```

## Setup

Install dependencies.

```bash
npm install
```

Create `config/keys.js`.

```bash
touch config/keys.js
```

Add the required local credentials.

```js
module.exports = {
  mongodb: {
    dbURI: 'mongodb://localhost:27017/evbytes'
  },
  session: {
    cookieKey: 'replace-with-a-session-secret'
  },
  newsapi: {
    key: 'replace-with-newsapi-key'
  },
  sendgrid: {
    key: 'replace-with-sendgrid-api-key'
  },
  google: {
    clientID: 'replace-with-google-client-id',
    clientSecret: 'replace-with-google-client-secret'
  },
  facebook: {
    appID: 'replace-with-facebook-app-id',
    appSecret: 'replace-with-facebook-app-secret'
  },
  twitter: {
    appKey: 'replace-with-twitter-app-key',
    appSecret: 'replace-with-twitter-app-secret'
  }
};
```

`config/keys.js` is ignored by Git because it contains secrets.

## Running

Start the server.

```bash
node app.js
```

Open:

```text
http://localhost:7000
```

## Main Routes

- `/` - Home
- `/newsfeed` - News feed
- `/auth/login` - Login
- `/auth/register` - Register
- `/auth/contributor` - Become a contributor
- `/createblog` - Create blog
- `/bookmarks` - Saved blogs

## Notes

- MongoDB must be running before starting the app.
- NewsAPI powers the news feed.
- SendGrid is used for verification, password reset, and moderation emails.
- OAuth login requires Google, Facebook, and Twitter credentials.
