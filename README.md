# This repo is deprecated, please see [Penn Course Plan](https://github.com/pennlabs/penn-courses/)

# PennCourseSearch

Fed up with the bloated, inefficient, and slow excuse for an online portal that is Penn InTouch, I decided to make a cleaner and simpler way for Quakers to find classes and make schedules. While this is not a full replacement for Penn InTouch, it acts as an improvement of the "Course Search" and "Mock Schedules" features.

Students can search departments, courses, and sections as well as descriptions and instructors. All of the data comes from the [Penn OpenData API](https://esb.isc-seo.upenn.edu/8091/documentation/) and [PennCourseReview API](http://pennlabs.org/docs/pcr.html). The server sorts and returns the requested information as JSON, which is then formatted client-side. Schedules are also created using OpenData information and the image is made using client-side JS.

The server is written using NodeJS and the frontend with Angular. The app is currently hosted on ~~Heroku~~ ~~DigitalOcean~~ ~~Linode~~ Lightsail.

[![Codacy Badge](https://api.codacy.com/project/badge/grade/2ba7031e553e4126a95ff0e47d65a161)](https://www.codacy.com/app/benb116/PennCourseSearch)

Specific files you may be interested in:

* [Server JS](https://github.com/benb116/PennCourseSearch/blob/master/index.js)
* [JS (including Angular controller)](https://github.com/benb116/PennCourseSearch/tree/master/public/js)
* [CSS](https://github.com/benb116/PennCourseSearch/blob/master/public/css/index.css)
* [HTML with Angular directives](https://github.com/benb116/PennCourseSearch/blob/master/views/index.html)

If you have questions, ideas, bug reports, or if you'd like to suggest a new subtitle, let me know.

Screenshot!

![image](https://raw.githubusercontent.com/benb116/PennCourseSearch/master/Screenshot.png)