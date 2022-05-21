# りり村のWeb地図

View site at https://oatmeal.github.io/llmr

## Build instructions

To build the website from source, follow these steps:

- Clone this repository

- Install　NodeJS 16 or newer from https://nodejs.org/

- In your terminal, navigate to the root directory of this repository and run the following command to set up the environment (only needs to be run once unless `package.json` has been updated.)
```
npm install
```

- Each time you edit HTML / JS / CSS files or adding new tiles or data files, run the following to build the website:
```
npm run build
```

- The site will be at `deploy/index.html`. You will have to run a local web server to view it properly:
  - https://developer.mozilla.org/ja/docs/Learn/Common_questions/set_up_a_local_testing_server
  - I use VS Code for development, and the "VS Code Live Preview Extension" is handy for this.

## How to add tiles / data

To be written...

## Development notes

[These very rough notes](./notes.md) contain an outline of the data structures used in the app.

## THANKS TO

### Open source libraries used
- https://leafletjs.com
- https://github.com/ghybs/Leaflet.TileLayer.Fallback
- https://github.com/noerw/leaflet-sidebar-v2

### Icons
- https://uxwing.com

## LICENSE

Portions of the code are modified from LeafletJS and Leaflet.TileLayer.Fallback and are under their respective licenses (BSD 2-clause and Apache v2). Other Javascript / CSS / HTML / Python code in this project is licensed under the BSD 2-clause license. See the LICENSE file for full details.

Icon SVG files are from https://uxwing.com and used under the terms specified at https://uxwing.com/license/.

Tile images and JSON data files may not be used in other projects without explicit written permission.
