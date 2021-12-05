require("dotenv").config();

const express = require('express');
const fetch = require('isomorphic-fetch');
const btoa = require('btoa');

const CLIENT_ID = '7347dbd64c2b4689aecc2bf54350bab2';
const CLIENT_SECRET = 'qp4z0dkLeyAAo9JIYHUBtshcH8tCfy17';
const AUTHORIZE_ENDPOINT = 'https://us.battle.net/oauth/authorize';
const TOKEN_ENDPOINT = 'https://us.battle.net/oauth/token';

const redirectUri = 'http://localhost:8000/oauth/callback';
const scopes = ['wow.profile'];

const app = express();
app.get('/', (req, res) => {
    res.send('visit /login to login with Blizzard oauth');
});

app.get('/login', (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
    const scopesString = encodeURIComponent(scopes.join(' '));
    const redirectUriString = encodeURIComponent(redirectUri);
    const authorizeUrl = `${AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&scope=${scopesString}&redirect_uri=${redirectUri}&response_type=code`;
    res.redirect(authorizeUrl);
});

app.get('/oauth/callback', async (req, res, next) => {
    const { code } = req.query;

    // build headers
    const basicAuth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const headers = {
        authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // build request body
    const params = new URLSearchParams();
    params.append('redirect_uri', redirectUri);
    params.append('scope', scopes.join(' '));
    params.append('grant_type', 'authorization_code');
    params.append('code', code);

    // execute request
    const requestOptions = {
        method: 'POST',
        body: params,
        headers
    };
    const oauthResponse = await fetch(TOKEN_ENDPOINT, requestOptions);

    // handle errors
    if (!oauthResponse.ok) { // res.status >= 200 && res.status < 300
        console.log(`Token request failed with "${oauthResponse.statusText}"`);
        return next(new Error(oauthResponse.statusText));
    }

    // work with the oauth response
    const responseData = await oauthResponse.json();

    // do something with the `access_token` from `responseData`
    // {
    //     "access_token": "123456789",
    //     "token_type": "bearer",
    //     "expires_in": 86399,
    //     "scope": "wow.profile"
    // }

    // send a JSON response (just an example)
    res.redirect(`http://localhost:3000/?access_token=${responseData.access_token}`)
});

app.use((err, req, res, next) => {
    res.end(err.toString());
});

const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`listening on port ${port}`));