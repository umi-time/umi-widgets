# Timezone Boundary Data Generation Process

This document describes the process used to obtain and convert timezone boundary data for the Umi World Map demo.

## Source Dataset

Timezone boundaries were obtained from the [Natural Earth project](https://www.naturalearthdata.com/).

Dataset:

- Natural Earth 1:10m Time Zones
- File: `ne_10m_time_zones.shp`

Natural Earth data is public domain and may be used and redistributed without restriction.

## Tooling

The conversion was performed using Mapshaper.

Install Mapshaper globally:

```powershell
npm install -g mapshaper
```

## Conversion Process

From the directory containing the Natural Earth shapefile, run the following Mapshaper command:

```powershell
mapshaper ne_10m_time_zones.shp `
  -each "tzid = tz_name1st ? tz_name1st : (zone === 0 ? 'Etc/GMT' : (zone > 0 ? 'Etc/GMT-' + Math.round(zone) : 'Etc/GMT+' + Math.abs(Math.round(zone))))" `
  -dissolve tzid `
  -simplify visvalingam 10% keep-shapes `
  -clean `
  -o format=geojson precision=0.001 timezones.json
```

## Processing Steps

### 1. Create a Time Zone Identifier

```text
-each
```

Creates a `tzid` attribute for every feature.

Uses the Natural Earth `tz_name1st` field when available.

For zones without a named timezone, generates an appropriate
`Etc/GMT±N` identifier from the zone offset.

Examples:

```text
America/Los_Angeles
Europe/London
Asia/Tokyo
Etc/GMT
Etc/GMT+5
Etc/GMT-3
```

### 2. Dissolve Features

```text
-dissolve tzid
```

Combines all polygons that belong to the same timezone into a
single multipolygon feature.

This significantly reduces feature count.

Observed output:

```text
[dissolve] Dissolved 120 features into 84 features
```

### 3. Simplify Geometry

```text
-simplify visvalingam 10% keep-shapes
```

Reduces vertex count using the Visvalingam simplification algorithm.

The `keep-shapes` option preserves

## Output dataset

Timezone boundaries were obtained from the Natural Earth project.

Dataset:

- Simplified GeoJSON timezone boundary dataset
- File: `timezones.json`

Natural Earth data is public domain and may be used and redistributed without restriction.