# Trickopedia

The ultimate body movement and moves database. Search and filter moves, or submit a link to a clip for review.

**Live site:** https://djmboateng.github.io/trickopedia/ (GitHub Pages, deployed from `main`)

## Run it locally

It's a static site, so any static server works. The included one needs [Node.js](https://nodejs.org) and has no install step.

```sh
node server.js
```

Then open http://localhost:8000. Set `PORT` to use a different port.

## How it works

- **Entries** live in the `ENTRIES` list at the top of `app.js`. Add approved moves there, newest first. YouTube links get a thumbnail and play in place; other links open in a new tab.
- **Categories and levels** for the filters are the `CATEGORIES` and `LEVELS` lists in `app.js`.
- **The scrolling ticker** above the nav is the `TICKER_MOVES` list in `app.js`.
- **Submissions** go through a Google Form. Every "Submit a move" button opens `SUBMIT_FORM_URL` from the top of `app.js`. It's a placeholder for now: replace it with the form's share link.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Database page with search and filters |
| `about.html` | About page |
| `styles.css` | All styles |
| `app.js` | Ticker, search and filters, submit form link |
| `server.js` | Local static file server |
| `assets/` | Logos |

Led by [David Boateng](https://djmboateng.github.io/simulations/about.html).
