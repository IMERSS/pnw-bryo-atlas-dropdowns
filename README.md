# Bryophytes of the Pacific Northwest

This repository contains the source code and data for the *Bryophytes of the Pacific Northwest* site.
The project is built using [R](https://www.r-project.org/), [RStudio](https://posit.co/download/rstudio-desktop/), and [blogdown](https://bookdown.org/yihui/blogdown/).
It also requires [Node.js](https://nodejs.org/) and `npm` for frontend dependencies.

You can see the deployed site at [https://imerss.github.io/pnw-bryo-atlas/](https://imerss.github.io/pnw-bryo-atlas/).

## Prerequisites

Before building the site, ensure the following are installed:

### R and RStudio

* Download and install R: [https://cran.r-project.org/](https://cran.r-project.org/)
* Download and install RStudio Desktop: [https://posit.co/download/rstudio-desktop/](https://posit.co/download/rstudio-desktop/)

### Node.js and npm

* Download and install Node.js (which includes `npm`): [https://nodejs.org/en/download/](https://nodejs.org/en/download/)
* Verify installation:

  ```bash
  node -v
  npm -v
  ```

### R Packages

Once R and RStudio are installed, open the project in RStudio and install required R packages (if not already installed):

```r
install.packages(c("blogdown", "googledrive", "tidyverse", "stringr"))
```

## Setup After First Checkout

After cloning this repository for the first time, perform the following setup steps:

1. Install Node.js dependencies:

   ```bash
   npm install
   ```

2. Authenticate with Google Drive:

   ```r
   source("R/authenticate.R")
   ```

   This will open a browser window prompting you to log into your Google account and grant access.
   You may need to re-run this step periodically if credentials expire.

## Building the Site

There are two main ways to build the site:

### Full Build

1. Open the project in RStudio.
2. Use **Build > Build Website** in the RStudio IDE
   *or* run the following in the R console:

   ```r
   blogdown::serve_site()
   ```

### Quick Rebuild

If only the spreadsheet content has changed you can quickly regenerate content without a full rebuild:

```r
source("R/generate_pages.R")
```

This approach saves time when there are no updates to the image files or observation catalogue to process.
