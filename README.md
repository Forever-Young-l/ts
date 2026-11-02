# 方块世界 · 滕王阁

A small browser-based Minecraft-inspired voxel exploration scene of Tengwang Pavilion, Nanchang.

## Run locally

Open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000.

The scene uses Three.js from a CDN and is implemented as a static page. It is a stylized voxel interpretation, not a survey-accurate reconstruction.


## Live demo

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` deploys this static site to GitHub Pages on every push to `main`.

After the first successful deployment, the site is available at:

https://forever-young-l.github.io/ts/

You can also trigger a deployment manually from the Actions tab using **Deploy static site to GitHub Pages**.
