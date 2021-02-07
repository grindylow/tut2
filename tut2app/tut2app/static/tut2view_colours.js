/* tut2 */

/* functionality related to couloring in project names
 */

'use strict';

/* from https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/43383990#43383990 */
String.prototype.hashCode = function() {
    var hash = 0, i = 0, len = this.length;
    while ( i < len ) {
        hash  = ((hash << 5) - hash + this.charCodeAt(i++)) << 0;
    }
    return hash + 2147483648;
};

// grey_target: 0.5
var project_colours = [
    "#bf684c",   /* hue=0.04, s=0.60, v=0.75 */
    "#91833a",   /* hue=0.14, s=0.60, v=0.57 */
    "#6d953b",   /* hue=0.24, s=0.60, v=0.59 */
    "#43a847",   /* hue=0.34, s=0.60, v=0.66 */
    "#3f9f7d",   /* hue=0.44, s=0.60, v=0.63 */
    "#4593ac",   /* hue=0.54, s=0.60, v=0.68 */
    "#6178f2",   /* hue=0.64, s=0.60, v=0.95 */
    "#9a5de8",   /* hue=0.74, s=0.60, v=0.91 */
    "#c54ec0",   /* hue=0.84, s=0.60, v=0.77 */
    "#d25481"    /* hue=0.94, s=0.60, v=0.83 */
];

function tut2_pick_colour_for_project(fullprojstr) {
    // select a colour based on project name: use hash function to pick
    const regex = /^\s*(?<project>[^ .]+)(\.(?<subproject>[a-zA-Z0-9]+)|)/gm;
    var m = regex.exec(fullprojstr);
    //console.log("regex result", m);
    var proj = m.groups.project;

    const nullproj_regex = /(^0$)/gm;

    var h = proj.hashCode();
    var bgcolidx = h%project_colours.length;
    var colval = project_colours[bgcolidx];
    if(nullproj_regex.exec(proj) !== null) {
        colval = "#bababa";
    }
    //console.log("number of colours", project_colours.length);
    //console.log("Hashcode of ", proj, "is", h);
    return colval;
};
