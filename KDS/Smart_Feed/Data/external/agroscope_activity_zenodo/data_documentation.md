GENERAL INFORMATION

Title of Dataset: Time Series of Dairy Cow Activity and Barn Area Use

Name: Joanna Stachowicz
ORCID: https://orcid.org/0000-0003-4921-8353
Institution: Agroscope, Sustainability Assessment and Agricultural Management
Address: 8356 Ettenhausen, Switzerland
Email: joa.stachowi@gmail.com

Author/Associate or Co-investigator Information
Name: Hassan-Roland Nasser
ORCID: https://orcid.org/0000-0003-1821-3234
Institution: Agroscope, Sustainability Assessment and Agricultural Management
Address: 8356 Ettenhausen, Switzerland
Email: hassan-roland.nasser@agroscope.admin.ch


Date of data collection: 2020-06 to 2020-08 (55 consecutive days)
Geographic location of data collection: Agroscope experimental farm, Ettenhausen, Switzerland
Information about funding sources that supported the collection of the data: Funded as part of the project digital production in the Agroscope work program 2018–2022.

SHARING/ACCESS INFORMATION

Licenses/restrictions placed on the data: The dataset is openly available under the 'Creative Commons Attribution 4.0 International' license
Links to publications that cite or use the data: Stachowicz, J., Nasser, R., Adrion, F., & Umstätter, C. (2022). Can we detect patterns in behavioral time series of cows using cluster analysis? Journal of Dairy Science, 105(12), 9971–9981. https://doi.org/10.3168/jds.2022-22140
Links to other publicly accessible locations of the data: Supplemental figures available at http://doi.org/10.6084/m9.figshare.21195598
Recommended citation for this dataset: Nasser, H.-R., & Stachowicz, J. (2025). Time Series of Dairy Cow Activity and Barn Area Use [Data set]. Zenodo. https://doi.org/10.5281/zenodo.14886594

DATA & FILE OVERVIEW
File List:

activity_all_cows_sampled_1_min.csv: Time series data of cow activity recorded by IceTag pedomrs. Columns: datetime, cow name, location id (for details about location and stall design, please refer to DOI: 10.3168/jds.2022-22140)
location_all_cows_sampled_1_min.csv: Time series data of area (all areas: 1 to 5) use recorded by SMARTBOW (Zoetis) system.
location_all_cows_sampled_1_min.csv_3lyingareas.csv: Time series data of functionals areas use recorded by SMARTBOW (Zoetis) system. 

Relationship between files, if important: Activity and area use data can be linked by cow ID and timestamp to analyze behavioral patterns.
Are there multiple versions of the dataset? No.

METHODOLOGICAL INFORMATION
Description of methods used for collection/generation of data:
Data were collected from 20 lactating Brown Swiss and Swiss Fleckvieh cows housed in a naturally ventilated freestall barn with cubicles. Activity was recorded using IceTag pedometers (IceRobotics Ltd.) attached to one hind leg of each cow. Area use was recorded via SMARTBOW (Zoetis), a system with ear-tag sensors and wall-mounted receivers that tracked the position of cows within the barn.

Methods for processing the data:
Data from SMARTBOW were aggregated to values per minute, resulting in 1,440 data points per day for each dataset. For area use analysis, two categorizations were considered: (1) functional areas (feeding, lying, and alleys) and (2) three individual lying areas. Activity data from IceTags (motion index based on 3D leg movements) were also analyzed at 1-minute intervals.

Instrument- or software-specific information needed to interpret the data:
R studio (version 4.0.5)
R packages: stats, hclust, TraMineR, dtwclust, effsize, parameters

Standards and calibration information, if appropriate:
The SMARTBOW system had an estimated position error of approximately 1.2 m or less. Both sensor systems (SMARTBOW and IceTags) were previously scientifically validated.
Environmental/experimental conditions:
The study was conducted between June and August 2020 with fairly constant thermal conditions: mean temperature of 19.42°C ± 3.94°C, relative humidity of 85.30 ± 19.61%, and wind speed of 0.63 ± 0.50 m/s.
Describe any quality-assurance procedures performed on the data:
Days with incomplete data from either sensor system were excluded. Data from 2 cows showing clinical signs of mastitis and lameness were excluded. The SMARTBOW system broke down for 4 days, resulting in data collection during 2 periods of approximately 2 and 4 weeks.

People involved with sample collection, processing, analysis and/or submission:
Joanna Stachowicz, Hassan-Roland Nasser, Felix Adrion, Christina Umstätter, Swiss Future Farm staff (animal care), and experimental technicians at Agroscope.

DATA-SPECIFIC INFORMATION FOR: activity_all_cows_sampled_1_min.csv
Number of variables: 4
Number of cases/rows: 51 time series from 14 cows, with 1,440 data points per day (1-min intervals)
Variable List:
time_stamp: Time of measurement in 1-minute intervals
cow_name: Identifier for individual cows
mi: Motion index (a propreprietary measure of cow activity)
steps: Number of steps taken by the cow

DATA-SPECIFIC INFORMATION FOR: location_all_cows_sampled_1_min.csv
Number of variables: 3
Number of cases/rows: 51 time series from 14 cows, with 1,440 data points per day (1-min intervals)
Variable List:
timestamp: Time of measurement in 1-minute intervals
cow_name: Identifier for individual cows
area: Categorical variable indicating positional location

DATA-SPECIFIC INFORMATION FOR: location_all_cows_sampled_1_min_3lyingareas.csv
Number of variables: 3
Number of cases/rows: 51 time series from 14 cows, with 1,440 data points per day (1-min intervals)
Variable List:
timestamp: Time of measurement in 1-minute intervals
cow_name: Identifier for individual cows
area: Categorical variable indicating functional locations
