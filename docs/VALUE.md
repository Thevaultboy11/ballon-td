# Value & ROI

The **Value** page shows executives what the programme cost, what it returned in money, the value it delivered that is not cash, and every KPI from the KPI catalogue that today's data can measure. Everything is calculated from the records in the app; nothing is typed into the page except the assumptions.

![Value & ROI](screenshots/value.png)

| Section | What it shows |
| --- | --- |
| Headline | Invested, monetised benefit (12 months), net value, ROI with benefit-cost ratio and payback. Switch between **Realised to date** and **Projected** (every planned action done) |
| From investment to net value | Waterfall: benefits up, costs down, net value at the end |
| Break-even | The readiness gain each person needs for the programme to pay for itself in 12 months, against what is measured and what the plan will deliver |
| Value delivered so far | Training and coaching hours, certifications, people ready for the next role, readiness, people with measured gap closure, behaviour change, lab seats |
| Costs and benefits, line by line | Quantity from the records × rate from the assumptions, realised and projected, with the basis of every rate |
| Over several years | 1, 2 and 3 years: benefits continue while skills last; platform and lab seats recur |
| By department | Cost shared by headcount, benefits from each department's own people |
| KPI scorecard | The measurable catalogue KPIs by audience (Board/CEO, CFO, CISO, CHRO, L&D, Compliance, line manager, coach, programme, assessment quality, individual, predictive), with formula and benchmark; the rest listed with the data they need |
| Assumptions and sources | Every rate, its basis and its source. Click a row to change it |

The export has the same content in the sheets `Value_ROI` and `KPI_Scorecard`.

## Method

The page follows the Phillips ROI method with its conservative steps: isolate the programme's share of the change (*attribution*) and discount for uncertainty (*confidence*).

**Costs**

| Line | Quantity from the data | Rate (assumption) |
| --- | --- | --- |
| Training delivery | Completed course hours, plus attended days of courses still running | Cost per learning hour (ATD 2025: US$165) |
| Coaching | Preparation + session + reporting minutes of completed sessions | Coaching rate per hour |
| Certification exams | Certifications achieved, failed or with an exam booked | Exam fee (GIAC 2025: US$999) |
| Hands-on lab seats | People with a lab collection | Seat price (US$2,500 per year, HTB listed tier) |
| Assessment & reporting | People with a completed validation | Per person (Quarterly Readiness Report package) |
| Platform & executive dashboard | Clients in scope | Annual fee (Executive Dashboard package) |
| Participants' time | Training hours + coaching session hours | Loaded annual cost ÷ working hours (switch off with *Count participants' time*) |

**Benefits**

| Benefit | Calculation |
| --- | --- |
| Capability gained | Σ readiness points gained × loaded annual cost × value of full competence × attribution × confidence. Readiness gained = gain between the first and the latest completed assessment, plus the gap closure line managers validated after the latest assessment (monthly progress 1–5 → share of the gap closed: (progress − 1) ÷ 4) |
| Hiring cost avoided | People ready now or in 6–12 months × internal fill rate × (hire cost − upskill cost per person) × confidence |
| Attrition avoided | Participants × baseline attrition × reduction × replacement cost × confidence |

**Projected** keeps the realised figures and adds the training hours and exams already planned, and closes every gap that has an open development-plan action linked to its competency.

ROI = (benefit − cost) ÷ cost · benefit-cost ratio = benefit ÷ cost · payback = cost ÷ (benefit ÷ 12).

## Assumptions

The rates live in the **ValueAssumption** table (Library → Value assumptions, or click a row on the page). Defaults come from the Ballon TD market research (October 2026) and say how solid they are:

| Basis | Meaning |
| --- | --- |
| Fact | A sourced figure (ATD, GIAC, Hack The Box price list) |
| Estimate | Derived from sourced figures (package prices scaled to a 36-person team, coaching cost per employee) |
| Assumption | A placeholder. Replace it with the client's own number and set the basis to *Client data* |

Replace these first, because they move the result most: **loaded annual cost per employee**, **external hire cost**, **attrition** and **attrition reduction**, **internal fill rate**. To show the page in another currency, set *Display currency* to the rate per US$ and put the currency code (e.g. `AED`) in its unit.

## Reading the result honestly

* Early in a programme the realised ROI is usually negative: most of the cost is spent in the first months, while capability gains are only measured once managers validate progress or people are re-assessed. The **Projected** view and **Over several years** show where it is heading.
* The **break-even** card turns the money into one number a manager can act on: how many readiness points each person has to gain.
* Benefits are deliberately conservative: half the improvement credited to the programme, 80 % confidence, no value for behaviour change or for risk reduction. Change attribution and confidence only with evidence.
* Operational outcomes (MTTD, MTTR, phishing rates, audit findings), retention measured from HR data and real cost data are not in the data model yet. The KPI scorecard lists, for every KPI not measured, the data that would unlock it.

## KPI catalogue

The 205 KPIs of the research catalogue are stored in [`server/seed/library/kpiCatalogue.json`](../server/seed/library/kpiCatalogue.json) with their audience, question, formula, benchmark, availability and commercial value. [`server/lib/value.ts`](../server/lib/value.ts) calculates about 65 of them from the records (all measurable *Yes* KPIs that have data, plus the cost KPIs through the assumptions). The department-specific KPIs (K131–K199) need a competency set per department type and operational feeds; they are listed as not measured.
