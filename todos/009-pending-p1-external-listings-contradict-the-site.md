---
status: pending
priority: p1
issue_id: 009
tags: [seo, geo, local-listings, duplicated-facts, owner-action]
dependencies: []
---

# Third-party listings contradict the site, and one says the license is expired

## Problem Statement

The site is the single source of truth for the practice's facts, but patients,
Google and AI assistants mostly read *other* sites about the practice. Several
of those are wrong. This is the duplicated-facts defect from
`docs/solutions/logic-errors/duplicated-facts-and-partial-fix-propagation.md`,
except the second copies live on sites this repo cannot edit.

Generative engines (ChatGPT search, Perplexity, Google AI Overviews) build an
answer out of sources that agree with each other. Listings that disagree lead
the model to hedge, to leave the practice out, or to repeat the wrong value.

## Findings

Checked 2026-09-21 by fetching each page:

- **WebMD** says, verbatim: *"Medical Doctor with an **expired** medical license
  in the state of California that expired in 2026."* `practice.ts` publishes
  license `A 33409` as `Active`. **Not verified against the Medical Board**:
  `search.dca.ca.gov` refuses automated requests. The likely explanation is that
  WebMD's data lags a biennial renewal, but that is a guess.
  WebMD also shows hours of 9:00 AM – 6:00 PM.
  https://doctor.webmd.com/doctor/sheng-chang-346bb9a3-7039-467b-975e-d5e0976a3dc3-overview
- **CivilSurgeonFinder** (an I-693 directory, so directly relevant to the
  immigration-exam goal): hours 9:00 AM – 6:00 PM, languages listed without
  English.
  https://www.civilsurgeonfinder.com/immigration-medical-exam/california/san-gabriel/chang-sheng-h-chang
- **Doximity** and **US News** list his specialty as Pathology. That is
  defensible, since he holds the ABP certification, but it tells an AI
  "pathologist", not "family physician and civil surgeon".
- The real hours are **9:00 AM – 1:00 PM** (owner-confirmed 2026-08-06). The
  "6 PM" these listings show is the same value the original scaffold had, which
  suggests a shared stale source.

Other listings that exist and have not been checked field by field:
Healthgrades, Vitals, Healthline FindCare, Optum, MD.com.

**Google Business Profile:** a profile exists; the owner is working on gaining
ownership (2026-09-21). Not yet claimed.

## Chinese-language directories to list on

Found 2026-09-21. Each exists and covers San Gabriel Valley doctors. Dr. Chang
was not found on any of them in web search, but their internal search is not
well indexed, so check each one before creating a listing to avoid a
duplicate.

1. **華人工商網 / Chinese Consumer Yellow Pages (CCYP)**, https://www.ccyp.com.
   The largest, publishing since 1982, office in Rosemead. Category
   全科及家庭醫科 with a San Gabriel filter. Mostly paid placements.
2. **洛杉矶华人资讯网 / ChineseInLA**, https://www.chineseinla.com. Has a
   dedicated 移民体检 (immigration exam) doctor category, which makes it the
   highest-value listing for I-693 patients.
3. **CDoc101 华人医生查询**, https://www.cdoc101.com. A free directory of
   Chinese-speaking doctors in North America.
4. **金海湾 JinBay**, https://southerncalifornia.jinbay.com/bizinfo/111/
5. **iTalkBB精英**, https://www.italkbbelite.com. Has a 家庭医生 category and
   publishes civil-surgeon articles.
6. **世界日報 World Journal classifieds**, https://www.worldjournal.com/page/topic/17828.
   Paid, print and online; its readers are older and lean Taiwanese.

Not a directory, but where Chinese-American patients actually search for
doctors: 小红书 (Xiaohongshu), WeChat groups, LINE. See todo 010.

## Recommended Action

1. **Owner:** verify license `33409` at https://search.dca.ca.gov. If it is
   active, ask WebMD to correct the profile. If it is not, that is a legal
   matter for the practice and outranks everything else here.
2. **Owner:** claim the Google Business Profile, Healthgrades, WebMD, Vitals and
   Yelp listings, and correct the hours on every one.
3. **Owner:** create or claim listings on the Chinese directories above.
4. **Copy every field exactly as the site renders it**: the name, the address
   (`addressParts` in `practice.ts`), `(626) 573-0055`, `9:00 AM – 1:00 PM`,
   the Chinese name 張勝雄醫師, the five languages from `practice.languages`,
   and "USCIS civil surgeon". Consistent listings matter more to AI answers
   than the number of listings.

## Acceptance Criteria

- [ ] License status confirmed against the Medical Board, with the date recorded here
- [ ] Hours corrected on WebMD, CivilSurgeonFinder and every other listing that shows 6 PM
- [ ] Google Business Profile claimed by the practice
- [ ] Each Chinese directory in the list above checked, and listed where appropriate
- [ ] A table in this file of every listing, its URL, and the date its fields were verified

## Work Log

**2026-09-21** — Found while brainstorming the SEO strategy. Fetched WebMD and
CivilSurgeonFinder directly and quoted their text. DCA lookup attempted, and
blocked (the lookup returned a 26-byte response).
