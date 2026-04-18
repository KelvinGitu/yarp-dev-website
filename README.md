# Yarp Developers Website

The official website for Yarp Developers — a portfolio and app directory site built with Next.js and deployed to Firebase Hosting.

**Live site:** https://yarpdevelopers.com

## Tech stack

- [Next.js](https://nextjs.org) (static export)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- GitHub Actions for CI/CD

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site locally.

## Building

```bash
npm run build
```

Produces a static export in the `out/` directory.

## Deploying

Pushes to `main` automatically deploy to Firebase Hosting via GitHub Actions.

To deploy manually:

```bash
npm run build
firebase deploy
```

## Project structure

```
src/
  components/   # Shared UI components
  data/         # App and content data
  pages/        # Next.js pages (index, apps, privacy, terms, support)
  styles/       # Global styles
public/         # Static assets
```
