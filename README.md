# get-base-domain
A simple tool to compute the base domain from an url.
It uses the list of public suffixes from https://publicsuffix.org

# Live version
http://sebastianschnock.github.io/get-base-domain/

# Run locally
```
git clone https://github.com/sebastianschnock/get-base-domain.git
cd get-base-domain
npm install
npm start
```
Then point your browser to http:://127.0.0.1:3000

# Todo
- check if we need to handle special cases like *.bd
- check speed of array splice