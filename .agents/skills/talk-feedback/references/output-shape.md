# Feedback report shape

Write in this order. Do not add a preamble about how you reviewed the
files.

```markdown
# Feedback — <talk title>
Mode: <week-before | day-before | immediately-after | after-recording>
Slot: <N minutes>  Audience: <one line>

## Thesis (as I read it)
<one sentence, quoted or reconstructed>

## Verdict
<Ready to give | Ready after the Monday list | Not yet a talk>
<one paragraph: the highest-leverage reason>

## Rubric
| Dimension | Score | Evidence |
|-----------|-------|----------|
| Content | strong/workable/weak/not evidenced | Slide "…" / RESEARCH.md |
| Narrative | … | … |
| Slides | … | … |
| Code/demo | … | … |
| Images | … | … |
| Timing | … | … |
| Speaker notes | … | … |

## Findings
### 1. <short name>
- **What:** <the observed thing, cited>
- **Why:** <what it does to the thesis or the room>
- **How:** <the concrete edit, with a path>

### 2. …
(at most seven; diamonds and spades only)

## Monday list
1. <path>: <edit>
2. <path>: <edit>
3. <path>: <edit>
```

Immediately-after mode drops the rubric table and the Monday list.
It is only the thesis sentence plus diamonds.

## Example finding (diamond)

- **What:** Slide `The crash between two writes` plants the distributed
  write before Temporal is named.
- **Why:** The room now has a problem that is theirs, not a vendor's.
  That is the Strange Loop bar.
- **How:** Keep this beat. Do not insert a product logo slide in front
  of it.

## Example finding (spade)

- **What:** Slides `Subscription can arrive` and `Compensation is part
  of the workflow` are both 1.5-minute side quests with no cut mark in
  the 30-minute path except the RESEARCH.md omit list.
- **Why:** In a short slot they starve the replay-compatibility cost,
  which is the honest-cost beat the thesis needs.
- **How:** Week-before: promote the omit list into `App.tsx` comments
  or a spoken "if we had time". Do not delete the files.
