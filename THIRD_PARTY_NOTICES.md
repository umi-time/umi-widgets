# Third-Party Assets

## umi-world-map Asset: mercator.svg

### Source

Mercator Projection political world map

https://commons.wikimedia.org/wiki/File:Mercator_Projection.svg

### Author

Geordie Bosanko (Geord0)

### Date

2011-08-30

### License

Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0)

https://creativecommons.org/licenses/by-sa/3.0/

### Modifications

The version distributed with this project was modified from the original:

- Removed circular map markers
- Removed reference lines
- Removed bright political boundary styling
- Adapted as a subdued background for Umi World Map rendering

---

## umi-timezones Asset: timezones.json

### Source

Natural Earth 1:10m Time Zones dataset

https://www.naturalearthdata.com/

### License

Natural Earth data is public domain.

https://www.naturalearthdata.com/about/terms-of-use/

### Original Data Format

ESRI Shapefile:

```text
ne_10m_time_zones.shp
```

### Transformation Process

The source shapefile was transformed into a simplified GeoJSON FeatureCollection using Mapshaper:

https://github.com/mbloch/mapshaper

Command used:

```powershell
mapshaper ne_10m_time_zones.shp `
  -each "tzid = tz_name1st ? tz_name1st : (zone === 0 ? 'Etc/GMT' : (zone > 0 ? 'Etc/GMT-' + Math.round(zone) : 'Etc/GMT+' + Math.abs(Math.round(zone))))" `
  -dissolve tzid `
  -simplify visvalingam 10% keep-shapes `
  -clean `
  -o format=geojson precision=0.001 timezones.json
```

### Processing Steps

- Created a timezone identifier (`tzid`) for each feature.
- Dissolved polygons sharing the same timezone identifier.
- Simplified geometry using the Visvalingam algorithm.
- Removed slivers and topology artifacts.
- Reduced coordinate precision to 0.001°.
- Exported the final result as GeoJSON.

### Result

The resulting file:

```text
timezones.json
```

is a GeoJSON FeatureCollection containing timezone boundary Polygon and MultiPolygon geometries suitable for client-side rendering.

### Purpose

Used by the `<umi-demo-world-map>` component to visualize timezone boundaries and demonstrate how real-world timezone regions differ from idealized 15-degree longitude zones.