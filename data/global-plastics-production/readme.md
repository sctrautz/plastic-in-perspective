# Global plastics production - Data package

This data package contains the data that powers the chart ["Global plastics production"](https://ourworldindata.org/grapher/global-plastics-production?v=1&csvType=full&useColumnShortNames=false) on the Our World in Data website. It was downloaded on March 02, 2026.

### Active Filters

A filtered subset of the full data was downloaded. The following filters were applied:

## CSV Structure

The high level structure of the CSV file is that each row is an observation for an entity (usually a country or region) and a timepoint (usually a year).

The first two columns in the CSV file are "Entity" and "Code". "Entity" is the name of the entity (e.g. "United States"). "Code" is the OWID internal entity code that we use if the entity is a country or region. For most countries, this is the same as the [iso alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) code of the entity (e.g. "USA") - for non-standard countries like historical countries these are custom codes.

The third column is either "Year" or "Day". If the data is annual, this is "Year" and contains only the year as an integer. If the column is "Day", the column contains a date string in the form "YYYY-MM-DD".

The final column is the data column, which is the time series that powers the chart. If the CSV data is downloaded using the "full data" option, then the column corresponds to the time series below. If the CSV data is downloaded using the "only selected data visible in the chart" option then the data column is transformed depending on the chart type and thus the association with the time series might not be as straightforward.


## Metadata.json structure

The .metadata.json file contains metadata about the data package. The "charts" key contains information to recreate the chart, like the title, subtitle etc.. The "columns" key contains information about each of the columns in the csv, like the unit, timespan covered, citation for the data etc..

## About the data

Our World in Data is almost never the original producer of the data - almost all of the data we use has been compiled by others. If you want to re-use data, it is your responsibility to ensure that you adhere to the sources' license and to credit them correctly. Please note that a single time series may have more than one source - e.g. when we stich together data from different time periods by different producers or when we calculate per capita metrics using population data from a second source.

## Detailed information about the data


## Annual plastic production between 1950 and 2019
Annual production of polymer resin and fibers.
Last updated: September 26, 2023  
Date range: 1950–2019  
Unit: tonnes  


### How to cite this data

#### In-line citation
If you have limited space (e.g. in data visualizations), you can use this abbreviated in-line citation:  
Geyer et al. (2017); OECD (2022) – with major processing by Our World in Data

#### Full citation
Geyer et al. (2017); OECD (2022) – with major processing by Our World in Data. “Annual plastic production between 1950 and 2019” [dataset]. Geyer et al., “Production, use, and fate of all plastics ever made”; OECD, “Global Plastics Outlook - Plastics use by application” [original data].
Source: Geyer et al. (2017), OECD (2022) – with major processing by Our World In Data

### How is this data described by its producer - Geyer et al. (2017), OECD (2022)?
Total annual plastic production is global annual pure polymer (resin) production data from 1950 to 2015, published by the Plastics Europe Market Research Group, and global annual fiber production data from 1970 to 2015 published by The Fiber Year and Tecnon OrbiChem (Geyer et al. 2017)

### Sources

#### Geyer et al. – Production, use, and fate of all plastics ever made
Retrieved on: 2023-09-26  
Retrieved from: https://www.science.org/doi/10.1126/sciadv.1700782  

#### OECD – Global Plastics Outlook - Plastics use by application
Retrieved on: 2023-09-21  
Retrieved from: https://stats.oecd.org/viewhtml.aspx?datasetcode=PLASTIC_USE_10&lang=en  

#### Notes on our processing step for this indicator
The data on plastic production from 1950 to 2015 are based on the research by Greyer et al., published in 2017. For the years 2016 to 2018, the figures were projected by applying a consistent annual growth rate of 5%, which aligns with the growth estimates provided by Geyer. The most recent data for the year 2019 has been directly sourced from the OECD Global Plastics Outlook, released in 2022.


    