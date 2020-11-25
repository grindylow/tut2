"""
The data model(s)
"""

from tut2app import tut2db
import pymongo
import logging
import math  # floor (report generator)
import re    # report generator relies on regular expressions
logger = logging.getLogger(__name__)


class Model:

    def __init__(self):
        logger.info("model initialising...")
        db = tut2db.get_db()

        # Ensure the database has a 'unique' constraint set up on revision field.
        # This is needed for our handmade 'auto-incrementing' revision number.
        # Note: Trying to (re)creating an existing index is overlooked gracefully by mongodb.
        logger.info('Ensuring database schema is set up...')
        db.tut2entries.create_index([('revision', pymongo.DESCENDING)], unique=True)
        logger.info('...done')

    def retrieve_next_rev_no(self, db):
        """
        We use what might be called 'opportunistic auto-increment' as described in the
        mongodb manual: https://docs.mongodb.com/v3.0/tutorial/create-an-auto-incrementing-field/
        In other words: we attempt to insert a document with a revision number
        one higher than what we found in the database an instant earlier. If this goes
        wrong, we try again, until we succeed. This relies on a 'unique' constraint being
        set up on the 'revision' field.
        """
        logger.debug('retrieving latest revision number...')
        entry = db.tut2entries.find_one(sort=[('revision', -1)], projection=('revision',))
        if not entry:
            logger.warning('Empty database. First revision number is half the truth.')
            return 21
        else:
            next_rev_no = entry['revision'] + 1
            logger.debug('Next revision should be %s. If you are quick.' % next_rev_no)
            return next_rev_no

    def queryEntries(self, fromrev=0, user_uid='*invalid*uid*'):
        db = tut2db.get_db()
        cursor = db.tut2entries.find({'revision': {'$gte': fromrev}, 'user': user_uid})
        entries = []
        for document in cursor:
            # translate uid from mongodb speech back to tut2 speech
            document['uid'] = document['_id']
            del document['_id']
            entries.append(document)
        return entries

    def addOrUpdateEntries(self, entries, user_uid='USER_UID_UNSPECIFIED'):
        """
        Add/update the given entries, return their respective
        (server-side) revision numbers, or None for all entries that were not
        updated/added.
        NOTE: this is currently only ever called with one single entry in the list
        of entries to add. Needs testing if we want to use add/update multi
        functionality.
        """
        logger.info('addOrUpdateEntries()')

        # store entry in database
        revnrs = []

        for e in entries:
            logger.debug("e: %s", e)
            e['_id'] = e['uid']  # translate tut2 UID to mongodb primary key
            del e['uid']
            e['user'] = user_uid  # This is where entries get associated with a specific user id.
            # No such thing exists in the client (browser) model, as it
            # always belongs to the "current" user.
            revno = self.addOrUpdateEntry(e)
            revnrs.append(revno)

        return revnrs

    def addOrUpdateEntry(self, e):
        # attempt to insert, see https://docs.mongodb.com/v3.0/tutorial/create-an-auto-incrementing-field/
        retries = 20
        db = tut2db.get_db()

        # do we want to update an existing entry, or create an
        # entirely new one?
        # 1. Check if entry with given uid exists already
        existingentry = db.tut2entries.find_one({'_id': e['_id']})

        # 2. Either create a new entry, or update the existing one
        result = None
        if existingentry:
            id = e['_id']
            del e['_id']  # prevent "Mod on _id not allowed"
            logger.debug("entry exists: %s", existingentry)
            while retries:
                retries = retries - 1
                revno = self.retrieve_next_rev_no(db)
                e['revision'] = revno
                try:
                    result = db.tut2entries.update({'_id': id}, {"$set": e}, upsert=False)
                    break
                except pymongo.errors.DuplicateKeyError:
                    logger.warning('duplicate key error on update() - trying again...')
                    continue
                # @todo investigate if we could simply use update() with upsert=true for both cases
                # this currently fails because we then get a "mod on _id not allowed" error.
        else:
            logger.debug("entry doesn't exist yet")
            while retries:
                retries = retries - 1
                revno = self.retrieve_next_rev_no(db)
                e['revision'] = revno
                try:
                    result = db.tut2entries.insert_one(e)
                    break
                except pymongo.errors.DuplicateKeyError:
                    logger.warning('duplicate key error on insert_one() - trying again...')
                    continue

        logger.debug("result: %s", result)
        if result is None:
            logger.critical('FAILED to add or update entry %s. Giving up.' % e)
            revno = None  # indicate that there is no valid server-side revno
        return revno

    def generate_report(self, user_uid, starttime_ms, endtime_ms, interval_ms, maxiter=20):
        """
        Report generator. Specify details of what kind of report to generate
        with the various arguments.

        @param maxiter Maximum number of loop iterations before we abort
                       (prevents excessive use of processor time)

        @returns dict: { projectlist: [...], starttimes: [...], accumulated_times_for_interval: [...] }
        """

        results_by_interval = []
        starttime_by_interval = []
        all_projects = set(())

        def ms_to_duration_str(duration_ms):
            hrs = math.floor(duration_ms/1000/60/60);
            rem = duration_ms - hrs*1000*60*60
            mins = math.floor(rem/1000/60)
            s = "%d:%02d" % (hrs, mins)  # f"{hrs}:{mins:02}"
            return s

        ctr = 0
        for s in range(starttime_ms, endtime_ms, interval_ms):
            t = self.accumulate_times_for(s, s+interval_ms, user_uid)
            # for display purposes, convert ms-values to "hh:mm" strings
            for p in t.keys():
                t[p]["total_ms"] = ms_to_duration_str(t[p]["total_ms"])
            results_by_interval.append(t)
            starttime_by_interval.append(s)
            all_projects.update(t.keys())
            logging.info(t)
            ctr += 1
            if ctr>=maxiter:
                break
        r = { "projectlist":sorted(all_projects, key=lambda x: str(x)), "starttimes":starttime_by_interval, "accumulated_times_for_interval": results_by_interval }
        #r = { "projectlist":all_projects, "starttimes":starttime_by_interval, "accumulated_times_for_interval": results_by_interval }
        return r

        # The most common form of report is reporting the number of hours
        # per project for a given timespan.
        # Variations on this include
        #  - excluding certain projects by pattern
        #  - accumulating sub-projects under their respective main projects

        # Any such report will always be evaluated on a per-user basis.

        # The algorithm goes as follows:

        # 1. Select first entry *pre-dating* (or falling exactly onto
        #    the requested start time.
        #    This will define the project that will accumulate hours
        #    initially.
        #    If no such entries - assume a default one, e.g. '_tut_pre_first_entry'.

        # 2. Select next entry. Bill time between start and this entry to
        #    the project determined above. Remember project for next iteration.

        # 3. Keep selecting next entry until entry is *after* (or exactly
        #    equal to) the requested end time, or no more entries exist.

        # In fact, do it the other way around. Because that way we don't have
        # to worry about race conditions between finding the "pre-dated"
        # entry and finding all the rest of 'em.

        # In SQL this would read something like
        #  SELECT * FROM ENTRIES WHERE starttime_utc_ms <= report_end_time ORDER BY starttime_utc_ms

        # ...and then keep reading from the iterator until we are past the
        # start time... Or run a separate query with COUNT=1 for that, after all.

    def accumulate_times_for(self,
                             starttime_ms=1,
                             endtime_ms=1552211030733,
                             user_uid='*invalid*uid*'):
        """
        Internal function for report generator. Query the database to list
        all entries between the given start- and endtimes.
        Calculate time spent on each entry.
        Optional: Accumulate entries according to accumulation pattern(s).
        (e.g.: subprojects)
        Optional: Ignore certain entries.
        @param starttime_ms Start of accumulation period, inclusive
        @param endtime_ms   End of accumulation period, exclusive

        @returns List of projects and subprojects like this:
                 { 'P100': { 'total_ms': 928378,
                             'subprojects': { '300': 23453,
                                              '311': 2222,
                                              '700': 22222,
                                              '': 383
                                            }
                         }
                 }

        See regex-tester at https://regex101.com/r/IUWLYM/1
        """

        regex_proj_subproj = r"^\s*(?P<project>[a-zA-Z0-9]+)(\.(?P<subproject>[a-zA-Z0-9]+)|)"
        regex_ignore = r"..."

        cur_endtime = endtime_ms

        # The algorithm is as follows:
        #
        # 1. Query database for all entries before endtime_ms.
        #
        # 2. Register each entry's duration as the time duration from its
        #    starttime to the starttime of the previously processed entry (or
        #    the initial endtime_ms).
        #
        # 3. Accumulate entries, either as we go along, or after we have
        #    collected all of them.

        db = tut2db.get_db()

        cursor = db.tut2entries.find(
            {'deleted': False,
             'user': user_uid,
             'starttime_utc_ms': {'$lt': endtime_ms}
             }).sort('starttime_utc_ms', pymongo.DESCENDING)

        accumulator = { 0: {'total_ms': 0} }  # entry 0 sums up all durations

        for entry in cursor:
            print(entry)
            corrected_starttime = max(entry['starttime_utc_ms'], starttime_ms)
            matches = re.search(regex_proj_subproj, entry['project'])
            if not matches:
                logger.warning(f"Could not parse project entry {entry['project']}")
                continue

            print(matches)
            projectstr = matches['project']
            if not projectstr:
                projectstr = "UNKNOWN"
            subprojectstr = matches['subproject'] if matches['subproject'] else ''
            duration_ms = cur_endtime - corrected_starttime

            if not projectstr in accumulator:
                accumulator[projectstr] = {'total_ms':0, 'subprojects':{}}
            accumulator[projectstr]['total_ms'] = accumulator[projectstr]['total_ms'] + duration_ms

            if not subprojectstr in accumulator[projectstr]['subprojects']:
                accumulator[projectstr]['subprojects'][subprojectstr] = 0
            accumulator[projectstr]['subprojects'][subprojectstr] += duration_ms

            accumulator[0]['total_ms'] += duration_ms

            if corrected_starttime <= starttime_ms:
                break  # we're done
            cur_endtime = corrected_starttime

        return accumulator
