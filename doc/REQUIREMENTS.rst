TUT2 Requirements Document
==========================

Internally, entries are stored in an (ordered) list, sorted by
starttime.

All times are specified in "ms since epoch" (and are therefore, per
definition, always in UTC).

An entry consists of
 - start time
 - project
 - log message
 - user (who created this entry)

For any given user, there can be no two entries with identical start
time. That is, start time can be used as a (unique) key into that
user's entries.

Duration for any entry is calculated on the fly (duration=next entry's
start time-this.start time) and never stored in the database. (No
redundant data.)

Link between HTML presentation and internal data structures: The HTML
root element of the entry in question holds an ID that links it with
the entry in the applications database. All related HTML elements are
addressed via appropriate (sub-)selectors.

The template entry at the top of the list has the special HTML ID
"template-entry".

The start time of the template entry is updated to the current time at
least once every minute.

The following actions turn the template entry into a regular entry:

 * Any of the template entry's fields are selected for modification
   (e.g. by clicking on them with the mouse).
 * ... keyboard accelerators, tbd ...

Whenever the template entry is turned into a regular entry, the
following actions take place:

 * The start time of the newly created entry is updated to the
   current time.
 * A new template entry is created (and displayed) above the newly
   created entry.

A new entry will be created immediately below the template entry,
when:

 * A resume icon is clicked.

Internally, the following synchronisation logic is implemented:

The model maintains the list of entries.

The view syncs to the model on request.

The database syncs to the model on request.

Ways of adjusting an existing Entry:

 * Drag the Up-Down-Arrow to the left of the start time with the mouse.
   * Straying "too far" to the left or right and releasing the mouse button will abort the operation.
   * Moving the mouse up and down (with mouse button pressed) will adjust the start time as follows:
     * movements "close to" the original position will tentatively adjust time in 1 minute increments:
       moving the mouse up will increase time, moving the mouse down will decrease time
     * movements further afield will adjust time in 15-minute increments
     * movements even further afield will adjust time in 1-hour increments
     * time cannot be adjusted past the start time of adjacent entries (to be revised if desired)

 * Click on the start time. Enter a new time in the entry field and hit enter.
   You cannot change a time entry beyond the boundaries of the current day (in your local time zone).

 * Drag the Up-Down-Arrow to the right of the duration with the mouse. Behaviour will be similar
   to adjusting the start time by dragging (see above).
   
 * Drag the entire entry to a new location.
