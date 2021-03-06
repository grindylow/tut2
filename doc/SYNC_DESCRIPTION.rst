How does Syncing work in TUT2?
==============================

Tut2 seamlessly syncs log entries between multiple domains, 
usually without the user having to trouble about any of the
details.

Here's to the details:

(1) Syncing between multiple open browser windows/tabs

Log entries are saved to the browser-provided "localStorage"
object. Any changes are written to "localStorage".

localStorage is "regularly" read back. Any differences between
localStorage and the app's internal log are merged as follows:

(remote) refers to localStorage (or any other remote repository).
   me.last_synced_revision is maintained *for every repository*.

(me) refers to the app's local internal data 

For the time period from STARTTIME up to MOST RECENT ENTRY

(1.1) 
Entries that don't exist in (remote) are copied to (remote).
Potential issue: (remote) doesn't reach far enough back
But: in that case, the revision number will remain the same,
so things will go well the next time around

(1.2)
Entries that don't exist in (me) are copied to (me).

At this stage, (remote) and (me) will have the same number of
entries, with the same set of IDs.

(1.3)
For each entry-ID, once of the following cases arises:

  a. (me).revision==(me).last_synced_revision
     No changes at this end since last sync. 
     Check with (remote). If they have a newer revision, grab that 
     one and use it from then onwards.

     sub-case a.1: (me).revision==(remote).revision 
     entries are identical, all is well, no need to sync

     sub-case a.2: (me).revision>(remote).revision
     impossible - we have already established that our
     last_synced_revision equals our revision, and that
     revision came from (remote) (, and revisions always
     count upwards).
     This could happen if (remote) was reverted back to
     some older (backup) version.

     sub-case a.3: (remote).revision>(me).revision
     (remote) has a newer version, and ours doesn't have
     any local changes -> copy the new version from (remote)
     to (me).

  b. (me).last_synced_revision < (me).revision
     I have updated my entry. 

     sub-case b.1: (remote).revision==(me).last_synced_revision
     The remote is still at the original revision,
     so I can simply copy my revision across to the (remote).

     sub-case b.2: (remote).revision>(me).last_synced_revision
     Conflict! Can't even tell who's got the newer version.
     Resolve by merging entries.

     sub-case b.3: (remote).revision<(me).last_synced_revision
     impossible, but see a.2


Exploring an alternative approach (A): repository-wide revision numbers for "upstream"
--------------------------------------------------------------------------------------

Each client maintains a record of "upstream" revision numbers for each Entry
in the local database.

Upstream revision numbers are always monotonically increasing.

Whenever a sync is desired/scheduled/requested, the following happens:

1. Client requests any elements with 
    * revision number > biggest currently stored revision number, and
    * time in desired time range (usually something like "anything newer than ...")

    Upstream repo responds with list of Entries. Those get integrated into local repo.
    Any conflicts with locally changed Entries are detected as follows:

    a. local item doesn't exist --> insert, with local revision number "0" @todo ?
    b. local item exists, and its revision number matches the revision number that
       was last synced to upstream --> overwrite with new version from repo.
    c. local item exists, with changes --> merge somehow

2. Client transmits any elements with local revision number > 0
    * upstream responds with global revision number for that entry. reset local revision
      to "0".
    * that's it. all the merging has already happened in step 1 above.

