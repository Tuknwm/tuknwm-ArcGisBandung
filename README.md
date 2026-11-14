# Bandung Regency Tourism Map

An interactive map of 108 tourist destinations in Bandung Regency. Supports search, category filtering, destination comparison, and ranking based on the SAW (Simple Additive Weighting) method.

## Features

- Interactive 3D map with hillshade and terrain (MapLibre GL + OpenTopoMap)
- Category filter: Nature, Man-made, Culture, Tourism Village
- Search by destination, district, or category
- Destination detail: ticket price, distance, facilities, accessibility, coordinates
- Compare two destinations using the SAW method
- Top 10 destination ranking with customizable criterion weights
- Indonesian and English language support
- Dark mode

## Tech Stack

- React 19 + Vite
- MapLibre GL JS
- SAW (Simple Additive Weighting) for decision support
- GeoJSON data of Bandung Regency

## Data Structure

Tourism destination data is stored in `src/data/Lokasi_Wisata.geojson` with attributes: name, category, district, address, ticket price, distance from Soreang, facilities, accessibility, and rating.

## SAW Method

Rankings and comparisons are calculated based on 5 criteria:

| Criterion | Default Weight |
|---|---|
| Rating | 35% |
| Facilities | 25% |
| Accessibility | 20% |
| Distance from Soreang | 10% |
| Ticket Price | 10% |

Weights can be adjusted manually via the Priority Criteria panel.
