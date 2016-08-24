# 2016 Rio Olympics Team USA

Visualization project with data from [Team USA website](http://www.teamusa.org/road-to-rio-2016/team-usa/athletes).

## R
This folder has data.csv file that is downloaded from the site above then slightly cleaned. This R script includes some pre-work to scan the data. Then it generates json file that is used for the web apps.

## Webapp & Webapp2

These two folders are two seperate client-side only web app projects.

* Webapp: [Team USA] (http://tany.kim/team-usa)
* Webapp2: [Olympian Body Match] (http://tany.kim/olympian-match)

Built with Node, Npm, and Grunt are required. Install libraries first. 

```
cd webapp
bower install
```

Then ```grunt``` for development. Copy the entire /public folder to your web server. Then /public/index.html is starting page.