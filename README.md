# Traffic Fines Data Analysis

An interactive data visualisation and storytelling project exploring Australian traffic-fine enforcement patterns. Created by **Hasib Alam** as a personal portfolio project, it combines a D3.js dashboard, a narrative data story, a storyboard, and supporting analysis materials.

**Explore:** [Live website](https://hasibalam.github.io/Data-Analysis-Project/) | [Dashboard](https://hasibalam.github.io/Data-Analysis-Project/vis2.html) | [About the creator](https://hasibalam.github.io/Data-Analysis-Project/about.html) | [Project report](https://hasibalam.github.io/Data-Analysis-Project/report.html) | [Storyboard](https://hasibalam.github.io/Data-Analysis-Project/story.html)

## Project overview

The project examines recorded traffic fines across Australian jurisdictions, years, offence types, detection methods, and age groups. Its main dashboard covers **2008–2023**, with dedicated **2023** views for age-group distributions and mobile-phone fines.

The homepage presents **“A Drive to Learn: Dad, Son, and the Reality of Mobile Phone Fines”**: a conversation between a father and son that introduces the visualisations through a road-safety story. The dashboard provides a separate space for exploring the charts and controls.

## Questions explored

- How do recorded traffic fines vary across jurisdictions and offence categories?
- How do mobile-phone fines detected by police compare with camera-detected fines over time?
- What is the age-group distribution of fines in the included 2023 dataset?
- How do mobile-phone fine counts vary by jurisdiction and age group?

## Visualisations and interactions

| Visualisation | What it presents |
| --- | --- |
| Stacked bar chart | Fine counts by offence type and jurisdiction |
| Dual-line timeline | Police-detected and camera-detected mobile-phone fines over time |
| Pie chart | Age-group distribution of all offences in the included 2023 data |
| Heatmap | Mobile-phone fines by jurisdiction and age group in 2023 |
| Australian choropleth map | Geographic comparison of mobile-phone fine counts |

The implementation includes jurisdiction, year, and detection-method controls, hover tooltips, clickable chart elements and legends, map zoom, and chart reset controls. The pages share navigation and footer components.

## Pages

| File | Purpose |
| --- | --- |
| `index.html` | Narrative data story and visualisations |
| `vis2.html` | Interactive dashboard |
| `story.html` | Illustrated storyboard |
| `report.html` | Embedded PDF report and supporting downloads |
| `about.html` | Creator background, project context, and professional links |

## Technology

- **HTML and CSS** for page structure, presentation, and shared layouts.
- **JavaScript and D3.js v7** for SVG charts, data loading, filtering, and interactions.
- **CSV and GeoJSON** files for chart data and Australian map geometry.
- **KNIME workflow** included as a supporting analysis artifact.
- **Font Awesome** for navigation and interface icons.
- **GitHub Pages** for static website hosting.

The website runs in the browser and does not require a backend server or database. D3.js and Font Awesome load from external CDNs, so internet access is required.

## Repository structure

| Path | Contents |
| --- | --- |
| `assets folder/` | Images, project report, resume, and KNIME workflow |
| `css folder/` | Page styles and shared layout styles |
| `data folder/` | Prepared CSV datasets and Australian map geometry |
| `js folder/` | Visualisation logic and shared header/footer components |
| `.gitignore` | Exclusions for local tooling, operating-system files, and secrets |
| `.nojekyll` | Requests static publishing without Jekyll processing |

Keep the existing folder names and relative paths when running or deploying the project.

## Included datasets

| File | Role |
| --- | --- |
| `annual_fines_by_metric.csv` | Fine counts used for offence-type and jurisdiction comparisons |
| `mobile_timeline_camera_police.csv` | Annual mobile-phone fines split by detection method |
| `agegroup_pie_2023.csv` | Age-group counts for the 2023 pie chart |
| `mobile_age_heatmap_2023.csv` | Jurisdiction and age-group counts for the 2023 heatmap |
| `cleaned_fines_data.csv` | Prepared fines data loaded by the visualisation script |
| `australia-states.json` | GeoJSON used to draw Australian jurisdictions |

The [About page](https://hasibalam.github.io/Data-Analysis-Project/about.html) references the [National Crash Dashboard](https://datahub.roadsafety.gov.au/reporting/national-crash-dashboard) as data and visualisation inspiration. Consult the supporting report for the project's analysis context.

These files are a historical snapshot, not a live data feed. Fine counts describe recorded enforcement activity; interpreting differences requires context such as population, driving exposure, enforcement practices, and dataset coverage. The visualisations are descriptive and do not establish causal relationships.

## Run locally

1. Clone the repository:

   ```powershell
   git clone https://github.com/HasibAlam/Data-Analysis-Project.git
   Set-Location Data-Analysis-Project
   ```

2. Serve the project through a local HTTP server. For example, if Python is installed:

   ```powershell
   python -m http.server 8000
   ```

3. Open [http://localhost:8000/](http://localhost:8000/) in your browser. The dashboard is available at [http://localhost:8000/vis2.html](http://localhost:8000/vis2.html).

A local HTTP server allows D3.js to fetch the CSV and GeoJSON files. Opening HTML directly with a `file://` address can prevent those requests from working. An editor's local server extension can also be used.

## Supporting materials

- [Data visualisation report (PDF)](assets%20folder/Data_Visualisation_Report.pdf)
- [KNIME analysis workflow](assets%20folder/Traffic_Fines_Analysis.knwf)
- [Creator profile and project background](https://hasibalam.github.io/Data-Analysis-Project/about.html)

## Deployment

The publishing entry point is `index.html` at the repository root. To publish with GitHub Pages, open **Settings → Pages**, select **Deploy from a branch**, and choose **main** and **/(root)**. Once configured, updates are published by committing changes and pushing to `main`.

## Author

**Hasib Alam** — Computer Science graduate, with a major in Data Science and a minor in Applied Mathematics.

[About me](https://hasibalam.github.io/Data-Analysis-Project/about.html) · [Portfolio](https://hasibportfolio.netlify.app/) · [GitHub](https://github.com/HasibAlam) · [LinkedIn](https://www.linkedin.com/in/hasib-alam-b58987214/)
