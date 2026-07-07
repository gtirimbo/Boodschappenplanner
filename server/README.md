# Optional backend (only needed if you don't use GitHub Pages)

Most people should just use GitHub Pages — see the top-level README.
This FastAPI server is only useful if you want to self-host on your own
infrastructure instead.

```bash
pip install fastapi uvicorn
cp ../prices.json .            # or run: python ../update_prices.py
uvicorn server:app --reload    # http://localhost:8000
```

It serves `GET /api/prices` and, if you copy `index.html` into a `static/`
folder next to `server.py`, serves the app itself too.
