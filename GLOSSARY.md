# Subnote

Plans how a paper notebook's pages are divided among purposes, borrowing subnetting from networking so boundaries are exact and sections split cleanly.

## Language

**Notebook**:
One physical paper notebook, treated as a fixed, numbered range of pages to divide up.
_Avoid_: Journal (that's a Section), address space

**Page**:
One numbered page of a Notebook; the smallest unit that can be assigned.

**Section**:
A run of pages in a Notebook given to one purpose, such as Journal, Habit Tracker, Idea Capture or Calendar. Its size is a power of two, and it starts on a page boundary that matches its size.
_Avoid_: Subnet, group, collection, sub-notebook

**Title Page**:
The first page of a Section, which carries the Section's name instead of content, like a subnet's network address. It counts toward the Section's size.
_Avoid_: Header page, network page

**Setup**:
The one-time first planning of a Notebook, where every initial Section is entered together and placed largest first. After Setup, placements never move.
_Avoid_: Draft, first iteration

**Free Page**:
A page not inside any Section, so a later Section can still claim it.
_Avoid_: Gap, unused page

**Pending Section**:
A Section that didn't fit in its Notebook and is waiting to be placed at the next Notebook's Setup.
_Avoid_: Queued section, backlog

## Relationships

- A **Notebook** contains many **Sections**; **Sections** never overlap
- A **Section** covers a contiguous run of **Pages** within one **Notebook**
- A **Section** added after **Setup** takes the first block of **Free Pages** that fits its size and alignment, even if that skips pages
- A **Section** with no room in its **Notebook** becomes a **Pending Section**, which joins the next **Notebook's** **Setup**
- Removing a **Section** turns its pages back into **Free Pages**
- A **Section** that fills up is never extended; a new, independent **Section** (e.g. "Journal 2") is created instead
