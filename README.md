# Trickopedia

The ultimate body movement and moves database. Search and filter moves, or submit a link to a clip for review.

## Run it locally

Requires [Node.js](https://nodejs.org). No install step.

```sh
node server.js
```

Then open http://localhost:8000. Set `PORT` to use a different port.

## How it works

- **Entries** live in the `ENTRIES` list at the top of `app.js`. Add approved moves there, newest first. YouTube links get a thumbnail and play in place; other links open in a new tab.
- **Categories and levels** for the filters and the form are the `CATEGORIES` and `LEVELS` lists in `app.js`.
- **The scrolling ticker** above the nav is the `TICKER_MOVES` list in `app.js`.
- **Submissions** from the form are saved by `server.js` to `data/submissions.json`, which is kept out of git. The form needs `server.js` running; on static hosting it will show an error.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Database page with search, filters and the submit form |
| `about.html` | About page |
| `styles.css` | All styles |
| `app.js` | Ticker, search and filters, submit form |
| `server.js` | Static file server plus the `/api/submit` endpoint |
| `assets/` | Logos |

Led by [David Boateng](https://djmboateng.github.io/simulations/about.html).
