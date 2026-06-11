# Test fixture: a trimmed public-apis README.

We cover the three row shapes (5-cell, 6-cell, 7-cell), a `### ` heading, the header line, the separator line, the index/list at the top, and an empty category. Anything this fixture exercises, the importer must handle.

## Index

This index section is in the upstream README and must be ignored — only `### ` (not `## `) marks a real category.

### Animals

| API | Description | Auth | HTTPS | CORS |
|:---|:---|:---|:---|:---|
| [AdoptAPet](https://www.adoptapet.com/public/apis/pet_list.html) | Resource to help get pets adopted | `apiKey` | Yes | Yes |
| [Axolotl](https://theaxolotlapi.netlify.app/) | Collection of axolotl pictures and facts | No | Yes | No |
| [Cat Facts](https://alexwohlbruck.github.io/cat-facts/) | Daily cat facts | No | Yes | No | |
| [HTTP Cat](https://http.cat/) | Cat for every HTTP Status | No | Yes | Yes |

### Art & Design

| API | Description | Auth | HTTPS | CORS | Link |
|:---|:---|:---|:---|:---|:---|
| [Behance](https://www.behance.net/dev) | Design portfolio & job search | apiKey | Yes | Yes | https://developer.behance.net/ |
| [Dribbble](https://dribbble.com/api) | Design community | OAuth | Yes | Yes | https://developer.dribbble.com/ |

### Empty Category

This section is intentionally empty — no table at all.

### Weather

| API | Description | Auth | HTTPS | CORS | Link |
|:---|:---|:---|:---|:---|:---|
| [Open-Meteo](https://open-meteo.com) | Free weather forecast for any location | No | Yes | Yes | https://api.open-meteo.com/v1/forecast |
| [Pirate Weather](https://pirateweather.net/) | Drop-in Dark Sky replacement | apiKey | Yes | Unknown | https://api.pirateweather.net/forecast |
