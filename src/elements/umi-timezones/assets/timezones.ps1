mapshaper ne_10m_time_zones.shp `
  -each "tzid = tz_name1st ? tz_name1st : (zone === 0 ? 'Etc/GMT' : (zone > 0 ? 'Etc/GMT-' + Math.round(zone) : 'Etc/GMT+' + Math.abs(Math.round(zone))))" `
  -dissolve tzid `
  -simplify visvalingam 10% keep-shapes `
  -clean `
  -o format=geojson precision=0.001 timezones.json