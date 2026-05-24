# Integrations (embed, badges, status API)

## Embed widget

Minimal iframe view for sites, OBS, or Stream Deck browser sources:

```html
<iframe
  src="https://gassurfer.app/embed?chain=1&lang=en"
  width="400"
  height="520"
  style="border:0;border-radius:12px"
  title="Gas Surfer"
  loading="lazy"
></iframe>
```

In the full app header, use **Copy embed code** (uses your current origin and selected chain).

Query params match the main app: `chain`, `currency`, `lang`.

## Kiosk / PWA shortcut

Installed PWAs can open the manifest shortcut **Kiosk** (`/?widget=1&chain=1&lang=en`) for a compact second-screen layout.

## Status badges

README / dashboard badges (SVG in page):

- `https://gassurfer.app/badge/1` — Ethereum
- `https://gassurfer.app/badge/8453` — Base

Replace the chain ID with any supported network. The page renders an SVG from live fees.

## Optional API: `GET /api/status`

When the self-hosted [Express API](DEVELOPMENT.md) is running and has received tick/snapshot data:

```http
GET /api/status
```

Returns:

```json
{
  "generatedAt": 1710000000000,
  "stale": false,
  "chains": [
    {
      "chainId": 1,
      "name": "Ethereum",
      "condition": "smooth",
      "standard": 12.5,
      "updatedAt": 1710000000000,
      "source": "ethereum.publicnode.com"
    }
  ]
}
```

Use for Home Assistant REST sensors, status pages, or bots. No authentication in the default deployment—rate-limit and firewall at the edge.

## Stream Deck / OBS

- **OBS:** Browser source → embed URL above.
- **Stream Deck:** Open URL action → `https://gassurfer.app/?widget=1&chain=1`
