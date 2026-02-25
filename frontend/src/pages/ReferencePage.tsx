import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExternalLink, RefreshCw, Sparkles, Bug, ChevronRight, Lightbulb } from 'lucide-react'
import { DATA_SOURCES } from '@/lib/data/sources'
import { CHANGELOG, DATA_VINTAGE } from '@/lib/data/changelog'
import { useUIStore } from '@/stores/useUIStore'

// ── ELI5 glossary ──────────────────────────────────────────────────────
const GLOSSARY: Record<string, string> = {
  // Monte Carlo
  'Monte Carlo simulation': 'Like rolling dice thousands of times to see how often your retirement plan works out.',
  'Monte Carlo simulations': 'Like rolling dice thousands of times to see how often your retirement plan works out.',
  'Parametric': 'Generates fake market returns using a mathematical bell curve.',
  'multivariate normal distribution': 'A bell curve, but for multiple things at once (e.g. stocks and bonds moving together).',
  'Cholesky decomposition': 'A math trick that keeps fake random returns realistically correlated with each other.',
  'Historical Bootstrap': 'Picks random real years from history and replays them in shuffled order.',
  'Bootstrap': 'Picks random real years from history and replays them in shuffled order.',
  'Student-t distribution': 'A bell curve with fatter edges — makes extreme crashes and booms more likely.',
  'Fat-Tail': 'A model where extreme events (crashes, booms) happen more often than a normal bell curve predicts.',
  'fan chart': 'A chart shaped like a fan showing the range of possible outcomes from best to worst.',
  'percentile bands': 'Dividing outcomes into slices — p5 means only 5% of scenarios did worse.',
  // SWR
  'CAPE ratio': 'A stock market "is it expensive?" gauge — compares prices to 10 years of earnings.',
  'CAPE earnings yield': 'The inverse of the CAPE ratio — tells you what return the market is "priced to deliver".',
  'CAPE': 'Cyclically Adjusted Price-to-Earnings — a stock market "is it expensive?" gauge using 10 years of earnings.',
  'volatility': 'How wildly your investments swing up and down.',
  'equities': 'Stocks — ownership shares in companies.',
  'longevity insurance': 'Protection against the risk of living longer than your money lasts.',
  // Asset Allocation
  'REITs': 'Companies that own buildings and pay you rent as dividends.',
  'Markowitz efficient frontier': 'The "best possible" combinations of risk and return — you can\'t do better without taking more risk.',
  'Sharpe ratio': 'How much extra return you earn for each unit of risk — higher is better.',
  'Sharpe Ratio': 'How much extra return you earn for each unit of risk — higher is better.',
  'Diversification ratio': 'A score showing how much spreading across assets reduces your overall risk.',
  'Glide path': 'Automatically shifting from aggressive to safer investments as you age.',
  'Glide Path': 'Automatically shifting from aggressive to safer investments as you age.',
  // Sequence Risk
  'Bond tent': 'Temporarily holding more bonds around retirement to cushion early crashes.',
  'Bucket strategy': 'Splitting money into "spend soon", "spend later", and "long-term growth" buckets.',
  // Withdrawal
  'VPW': 'Recalculates your withdrawal each year based on how much is left and how long you need it.',
  'Guyton-Klinger': 'Rules that automatically cut or boost spending when your portfolio crosses preset thresholds.',
  // Singapore
  'annuity': 'A product that pays you a fixed amount every month for life.',
  'SRS': 'A voluntary savings account that reduces your income tax now, taxed lightly when you withdraw later.',
  'LTV': 'The maximum percentage of a property\'s value the bank will lend you.',
  'leasehold': 'You own the property for a set number of years (usually 99), then it reverts to the state.',
  "Bala's Table": 'An official lookup table that says how much value a leasehold property loses as the lease gets shorter.',
  // Legacy & Estate
  'testator': 'The person making the will.',
  'Intestate Succession Act': 'Singapore\'s rulebook for dividing assets when someone dies without a will.',
  'Faraid': 'Islamic inheritance rules that assign fixed shares to specific family members.',
  'intestacy laws': 'The default rules for who gets what when there\'s no will.',
  'intestacy rules': 'The default rules for who gets what when there\'s no will.',
  'Section 73 trust': 'A legal shield that protects your life insurance payout from creditors — goes straight to spouse/kids.',
  // Glossary
  'VaR': '"In a bad month, the most I\'d expect to lose is $X" — a worst-case estimate at a given confidence level.',
  'Value at Risk': '"In a bad month, the most I\'d expect to lose is $X" — a worst-case estimate at a given confidence level.',
  'Standard Deviation': 'How spread out returns are from the average — bigger number means wilder swings.',
}

// Sort terms longest-first so "Historical Bootstrap" matches before "Bootstrap"
const SORTED_TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length)
const GLOSSARY_RE = new RegExp(`(${SORTED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')

function injectTooltips(text: string): ReactNode[] {
  const parts = text.split(GLOSSARY_RE)
  return parts.map((part, i) => {
    const eli5 = GLOSSARY[part]
    if (eli5) {
      return (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <span className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 cursor-help">{part}</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-sm">{eli5}</TooltipContent>
        </Tooltip>
      )
    }
    return part
  })
}

function buildMarkdownComponents(tooltipsEnabled: boolean): Components {
  if (!tooltipsEnabled) return {}
  return {
    p: ({ children }) => <p>{processChildren(children)}</p>,
    li: ({ children }) => <li>{processChildren(children)}</li>,
    td: ({ children }) => <td>{processChildren(children)}</td>,
    th: ({ children }) => <th>{processChildren(children)}</th>,
    strong: ({ children }) => <strong>{processChildren(children)}</strong>,
    em: ({ children }) => <em>{processChildren(children)}</em>,
  }
}

function processChildren(children: ReactNode): ReactNode {
  if (typeof children === 'string') return injectTooltips(children)
  if (Array.isArray(children)) return children.map((child, i) => {
    if (typeof child === 'string') return <span key={i}>{injectTooltips(child)}</span>
    return child
  })
  return children
}

const SECTIONS = [
  {
    id: 'fire',
    title: 'What is FIRE?',
    content: `FIRE stands for Financial Independence, Retire Early. It's a movement focused on aggressive saving and investing to achieve financial freedom decades before traditional retirement age. The core idea: accumulate enough invested assets that passive income covers living expenses indefinitely.

Key variants:
- **Regular FIRE**: 25x annual expenses (4% SWR)
- **Lean FIRE**: Minimalist lifestyle, lower target (~15-20x expenses)
- **Fat FIRE**: Comfortable lifestyle, higher target (~30-40x expenses)
- **Coast FIRE**: Enough saved that compound growth alone reaches FIRE target by traditional retirement
- **Barista FIRE**: Semi-retirement, cover gap between passive income and expenses with part-time work`,
  },
  {
    id: 'four-percent',
    title: 'The 4% Rule',
    content: `The 4% rule (Bengen's Rule) states you can withdraw 4% of your initial portfolio in year one of retirement, then adjust for inflation annually, with a high probability of not running out of money over 30 years.

Based on William Bengen's 1994 study of US stock/bond returns from 1926-1992. The rule worked for every 30-year period in that dataset.

**Limitations:**
- Based on US market history (no guarantees for Singapore or future returns)
- Assumes 30-year retirement (early retirees may need 40-60 years)
- Doesn't account for variable spending or additional income sources
- International diversification may require lower SWR`,
  },
  {
    id: 'swr',
    title: 'Safe Withdrawal Rate (SWR)',
    content: `The SWR is the maximum annual withdrawal rate that allows a portfolio to survive a given retirement duration with a specified confidence level.

**Formula:** Annual Withdrawal = Portfolio × SWR

**Factors affecting SWR:**
- Asset allocation (more equities → potentially higher SWR but more volatility)
- Retirement duration (longer → lower SWR needed)
- Market conditions (CAPE ratio, interest rates)
- Tax implications (Singapore has no capital gains tax — advantage)
- Additional income (CPF LIFE, rental, part-time work)

### Singapore-Specific Considerations
- No capital gains tax improves effective SWR
- CPF LIFE provides longevity insurance from age 65
- Lower inflation historically than US (2-3% vs 3-4%)
- SGD-denominated bonds yield less than USD`,
  },
  {
    id: 'monte-carlo',
    title: 'Monte Carlo Simulation',
    content: `Monte Carlo simulation runs thousands of random scenarios to estimate the probability of retirement success. Each simulation randomly generates annual returns based on historical patterns.

**Three methods in this tool:**
1. **Parametric**: Generates returns from a multivariate normal distribution using expected returns and correlations (Cholesky decomposition)
2. **Historical Bootstrap**: Randomly samples actual historical return years with replacement
3. **Fat-Tail (Student-t)**: Uses Student-t distribution (df=5) to better model extreme market events

**Interpreting results:**
- **Success rate > 95%**: Very comfortable margin
- **Success rate 80-95%**: Reasonable, consider flexibility
- **Success rate < 80%**: Significant risk, adjust plan

The fan chart shows percentile bands (p5 to p95) of portfolio paths over time.`,
  },
  {
    id: 'sequence-risk',
    title: 'Sequence of Returns Risk',
    content: `Sequence risk is the danger that poor market returns in early retirement years permanently deplete your portfolio, even if long-term average returns are adequate.

**Why it matters:** Withdrawing from a declining portfolio locks in losses. A 30% drop in year 1 of retirement is devastating; the same drop in year 20 has much less impact.

**Mitigation strategies:**
- **Bond tent**: Temporarily increase bond allocation around retirement date
- **Cash buffer**: Hold 2-3 years of expenses in cash/short-term bonds
- **Flexible spending**: Reduce withdrawals during market downturns
- **Guardrails strategy**: Automatic spending adjustments based on portfolio performance
- **Bucket strategy**: Separate short/medium/long-term buckets`,
  },
  {
    id: 'allocation',
    title: 'Asset Allocation',
    content: `Asset allocation is the distribution of your portfolio across different asset classes. It's the primary driver of long-term returns and volatility.

**8 asset classes in this tool:**
| Class | Expected Return | Risk |
|-------|----------------|------|
| US Equities | 10% | High |
| SG Equities (STI) | 8% | High |
| Intl Equities | 9% | High |
| Bonds | 4% | Low |
| REITs | 7% | Medium |
| Gold | 5% | Medium |
| Cash | 2% | Very Low |
| CPF (OA+SA) | 3.5% | Very Low |

### Key Concepts
- **Markowitz efficient frontier**: Optimal risk-return tradeoff
- **Sharpe ratio**: Return per unit of risk
- **Diversification ratio**: How much diversification reduces portfolio risk
- **Glide path**: Gradually shifting allocation from aggressive to conservative over time`,
  },
  {
    id: 'withdrawal',
    title: 'Withdrawal Strategies',
    content: `Six strategies for drawing down your portfolio in retirement:

1. **Constant Dollar (4% Rule)**: Fixed inflation-adjusted amount. Simple but rigid.
2. **Variable Percentage (VPW)**: Withdraws based on remaining years and portfolio size. Adjusts naturally.
3. **Guardrails (Guyton-Klinger)**: Inflation-adjust spending but cut/raise when portfolio hits thresholds.
4. **Vanguard Dynamic**: Target a percentage of portfolio with ceiling and floor limits on changes.
5. **CAPE-Based**: Blend CAPE earnings yield with a base rate. Adjusts for market valuation.
6. **Floor-and-Ceiling**: Withdraw percentage of portfolio, clamped between minimum and maximum amounts.

**Trade-offs:** More adaptive strategies provide better portfolio survival but less predictable income.`,
  },
  {
    id: 'singapore',
    title: 'Singapore Considerations',
    content: `### CPF (Central Provident Fund)
- Mandatory savings: up to 37% of salary (employee + employer)
- OA: 2.5% interest (housing, education, investment)
- SA: 4% interest (retirement)
- MA: 4% interest (healthcare)
- Extra 1% on first $60K combined balances
- CPF LIFE: Lifetime annuity from age 65

### Taxes
- Progressive income tax: 0% to 24%
- No capital gains tax
- No inheritance tax
- SRS tax deduction: up to $15,300/year

### Property
- BSD: 1-6% progressive brackets
- ABSD: 0-60% based on residency and property count
- 99-year leasehold is standard (Bala's Table for depreciation)
- LTV cap: 75% for first property`,
  },
  {
    id: 'healthcare',
    title: 'Healthcare & Insurance Planning',
    content: `Planning for healthcare costs is critical for a sustainable retirement in Singapore. Key programmes and considerations:

### MediShield Life (as of 1 Apr 2025)
- Universal basic health insurance administered by CPF Board
- Covers large hospital bills and selected costly outpatient treatments
- Premiums increase with age (e.g., ~$300/yr at age 40, ~$1,400/yr at age 70, ~$2,250/yr at age 90)
- Premiums are fully payable from MediSave

### Integrated Shield Plans (ISPs)
- Private insurance top-ups on MediShield Life, offered by 7 insurers
- Tiers: Basic, Standard, Enhanced (private hospital coverage)
- Additional premiums range from ~$200-$2,000+/yr depending on tier and age
- Payable partly from MediSave up to the Additional Withdrawal Limits (AWL)
- Consider whether you need private hospital coverage vs restructured hospital (Class B1/A)

### CareShield Life (as of Oct 2020)
- Long-term care insurance for severe disability
- Mandatory for citizens/PRs born 1980 or later
- Premiums payable from MediSave until age 67
- Pays $600/month (as of 2020, increases 2%/yr) if unable to perform 3+ Activities of Daily Living

### MediSave
- CPF MA earns 4% interest (floor rate)
- Used for premiums (MediShield Life, ISP, CareShield) and approved outpatient/inpatient
- MediSave has withdrawal limits for different treatments
- Typical depletion risk: heavy claims or long hospitalisation can exhaust MA, especially post-75

### Budgeting for Healthcare in Retirement
- Out-of-pocket costs rise significantly with age (roughly doubling every 15 years after 50)
- Consider: chronic condition management, dental, vision, specialist visits
- Nursing home / home care costs: $2,000-$4,500/month (as of 2024)
- Rule of thumb: budget $1,000-$2,000/year in out-of-pocket costs at age 60, scaling up with age

*Rates and figures are illustrative and sourced from CPF Board, MOH, and CareShield Life publications. They do not substitute for professional financial or medical advice.*`,
  },
  {
    id: 'legacy',
    title: 'Legacy & Estate Planning',
    content: `Estate planning ensures your assets are distributed according to your wishes and minimises complications for your family.

### Making a Will in Singapore
- A will is the primary instrument for directing asset distribution
- Must be signed by the testator (age 21+) in the presence of 2 witnesses
- Can be prepared by a lawyer (~$200-$500 for simple wills) or via online will-writing services
- Without a valid will, assets are distributed under the Intestate Succession Act (for non-Muslims) or the Administration of Muslim Law Act

### Intestate Succession Act (ISA)
If you die without a will (non-Muslim):
- Spouse only: spouse gets everything
- Spouse + children: spouse gets 50%, children share 50%
- Spouse + parents (no children): spouse gets 50%, parents get 50%
- Children only: children share equally
- Parents only: parents share equally

### Muslim Inheritance (Faraid)
- Governed by Islamic law under the Administration of Muslim Law Act
- Fixed shares for specified heirs (e.g., spouse, children, parents)
- Cannot be overridden by a civil will for assets subject to Faraid

### Lasting Power of Attorney (LPA)
- Legal document allowing a trusted person to make decisions if you lose mental capacity
- Covers personal welfare and/or property & affairs
- Must be certified by an LPA certificate issuer and registered with the OPG (~$75 registration fee)
- Without an LPA, your family must apply to court to manage your affairs — costly and slow

### Advance Medical Directive (AMD)
- Legal document instructing doctors not to use extraordinary life-sustaining treatment when you are terminally ill and unconscious
- Optional and revocable; registered with the Registrar of AMDs (MOH)

### Insurance Trusts
- Insurance policies can be placed in trust to bypass the estate and provide for beneficiaries immediately
- Useful for ensuring life insurance payouts go directly to intended recipients
- Section 73 trust (Married Women's Property Act) protects policy proceeds for spouse/children from creditors

*This information is general in nature and does not constitute legal advice. Consult a qualified lawyer for estate planning.*`,
  },
  {
    id: 'cpf-nominations',
    title: 'CPF Nominations & Beneficiaries',
    content: `CPF savings are **not** covered by a will. You must make a separate CPF nomination to direct how your CPF balances are distributed upon death.

### How to Nominate
- Log in to my cpf > My Requests > Make/Change My Nomination
- Free for online nominations; $8 at CPF Service Centres
- You can nominate anyone (not restricted to family)
- Allocate percentages to multiple nominees (must total 100%)
- Two witnesses required (must not be nominees; must be age 21+)

### What Happens Without a Nomination
- CPF savings are distributed under the intestacy laws, administered by the Public Trustee's Office
- Processing takes 4-6 months (vs immediate with nomination)
- Administration fee: up to 6% of the estate or $15,000, whichever is lower
- You lose control over who receives what

### Marriage Revocation
- **Important:** Marriage automatically revokes all prior CPF nominations
- You must re-nominate after marriage, or your CPF savings will follow intestacy rules
- Divorce does NOT automatically revoke nominations — you may want to update manually

### CPF vs Will
| | CPF Nomination | Will |
|---|---|---|
| Covers | CPF OA, SA, MA, RA balances | All other assets |
| Mechanism | CPF Board distributes directly | Executor administers estate |
| Speed | Weeks | Months to years |
| Revoked by marriage? | Yes | Yes (for wills before 2024 reforms) |

### SRS Nomination
- SRS accounts also require a separate nomination with the SRS operator (bank)
- Without nomination, SRS funds follow estate distribution under the will or ISA

### Actionable Steps
1. Check your CPF nomination status at my cpf online
2. Update nominations after marriage, divorce, or birth of children
3. Ensure SRS nominations are also in place
4. Coordinate CPF/SRS nominations with your will

*Information based on CPF Board guidelines. Visit cpf.gov.sg for the latest rules.*`,
  },
  {
    id: 'dependents',
    title: 'Supporting Dependents in Retirement',
    content: `Many Singaporeans provide financial support to aging parents and other dependents in retirement. Planning for these costs is essential to avoid underestimating your FIRE number.

### Aging Parent Support Costs
- Monthly allowances: median ~$500-$1,000/parent (varies widely by family)
- Should be factored as a time-bounded expense (e.g., from age 35 to age 75)
- Consider: who else in your family contributes, and what happens if siblings reduce support

### Eldercare Costs in Singapore (as of 2024)
| Care Type | Monthly Cost |
|-----------|-------------|
| Day care / activity centre | $500-$1,500 |
| Home care (part-time helper) | $800-$2,000 |
| Nursing home (subsidised) | $1,500-$2,500 |
| Nursing home (private) | $3,000-$4,500 |
| Live-in domestic helper | $800-$1,200 + levy |

### MediSave Top-Ups for Parents
- You can top up your parents' MediSave accounts voluntarily
- Tax relief: up to $8,000/year for topping up parents'/grandparents' RA or SA
- Useful for ensuring parents' MediShield Life / ISP premiums remain funded

### Government Schemes for Seniors
- **Silver Support Scheme**: Cash supplement for lower-income seniors (65+), up to $900/quarter
- **CHAS (Community Health Assist Scheme)**: Subsidised outpatient care at participating GPs
- **Pioneer / Merdeka Generation packages**: Additional Medisave top-ups, outpatient subsidies, MediShield Life premium subsidies for eligible cohorts
- **ElderFund**: Financial assistance for seniors unable to pay nursing home fees after subsidies

### Caregiver Support
- **Foreign Domestic Worker Levy Concession**: Reduced levy ($60 vs $300/month) for households with elderly dependents
- **Home Caregiving Grant**: $250/month for caregivers of care recipients who need permanent moderate to total assistance
- **Parent Relief**: Tax relief of $9,000 (no handicap) / $14,000 (handicap) for supporting parents aged 55+ living in Singapore

### Planning Tips
- Model parent support as a separate expense stream with its own start/end age and growth rate
- Don't assume healthcare costs stay flat — they accelerate with age
- Consider long-term care insurance (CareShield Life supplements) for yourself as you age
- Discuss care plans and cost-sharing with siblings early

*Costs are indicative estimates based on publicly available data from MOH, MSF, and AIC as of 2024.*`,
  },
  {
    id: 'how-to',
    title: 'How to Use This Tool',
    content: `**Step 1: Start Here** — Choose a pathway (Goal-first, Story-first, or Already FIRE) to set up your initial profile.

**Step 2: Inputs** — Fill in your financial details across 8 sections: Personal, FIRE Settings, Income, Expenses & Withdrawal, Net Worth, CPF, Property, and Asset Allocation. All changes save automatically.

**Step 3: Projection** — Review the year-by-year deterministic trajectory. Toggle column groups to see income breakdowns, tax/CPF, balances, and portfolio details.

**Step 4: Stress Test** — Run Monte Carlo simulations (10K paths), historical backtests, and sequence risk crisis scenarios to pressure-test your plan.

**Step 5: Dashboard** — Review your complete FIRE picture: status, portfolio projection, and risk assessment in one place.

**Step 6: Reference Guide** — You're here! Learn about FIRE concepts and Singapore-specific considerations.`,
  },
  {
    id: 'glossary',
    title: 'Glossary',
    content: `- **FIRE Number**: Annual expenses / SWR. Portfolio size needed for financial independence.
- **SWR**: Safe Withdrawal Rate. Maximum annual withdrawal as % of initial portfolio.
- **Coast FIRE**: Enough saved that growth alone reaches FIRE number by traditional retirement age.
- **Barista FIRE**: Gap between passive income and expenses covered by part-time work.
- **CAPE**: Cyclically Adjusted Price-to-Earnings ratio. 10-year average real earnings.
- **Sharpe Ratio**: (Return - Risk-Free Rate) / Standard Deviation. Higher = better risk-adjusted return.
- **VaR**: Value at Risk. Maximum expected loss at a given confidence level.
- **Cholesky Decomposition**: Mathematical method for generating correlated random variables.
- **Bootstrap**: Resampling method using actual historical data.
- **Glide Path**: Gradual shift in asset allocation over time (e.g., from aggressive to conservative).
- **BSD**: Buyer's Stamp Duty. Tax on property purchases in Singapore.
- **ABSD**: Additional Buyer's Stamp Duty. Extra tax based on residency/property count.
- **Bala's Table**: SLA table mapping remaining lease years to fraction of freehold value.`,
  },
]

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case 'data-update': return <RefreshCw className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
    case 'feature': return <Sparkles className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
    case 'fix': return <Bug className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
    default: return null
  }
}

function ChangelogList() {
  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, typeof CHANGELOG>()
    for (const entry of CHANGELOG) {
      const existing = map.get(entry.date) ?? []
      existing.push(entry)
      map.set(entry.date, existing)
    }
    return Array.from(map.entries())
  }, [])

  return (
    <div className="space-y-1">
      {grouped.map(([date, entries], dateIdx) => (
        <details key={date} open={dateIdx === 0} className="group/date">
          <summary className="flex items-center gap-2 cursor-pointer py-2 select-none list-none [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open/date:rotate-90" />
            <span className="text-sm font-medium text-foreground">{date}</span>
            <span className="text-xs text-muted-foreground">({entries.length} {entries.length === 1 ? 'change' : 'changes'})</span>
          </summary>
          <div className="ml-5 space-y-1 pb-2">
            {entries.map((entry) => (
              <details key={`${entry.date}-${entry.title}`} className="group/entry rounded-md">
                <summary className="flex items-start gap-2 cursor-pointer py-1.5 select-none list-none [&::-webkit-details-marker]:hidden">
                  <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-muted-foreground/50 transition-transform group-open/entry:rotate-90 shrink-0" />
                  <CategoryIcon category={entry.category} />
                  <span className="text-sm font-medium text-foreground">{entry.title}</span>
                </summary>
                <div className="ml-9 pb-2 space-y-2">
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                  {entry.insight && (
                    <div className="flex gap-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-2.5">
                      <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-900 dark:text-amber-200/80">{entry.insight}</p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  )
}

export function ReferencePage() {
  const location = useLocation()
  const hashId = location.hash.slice(1)
  const allIds = [...SECTIONS.map(s => s.id), 'changelog', 'data-sources']
  const validHash = allIds.includes(hashId) ? hashId : null
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true)
  const lastSeenDataVintage = useUIStore((s) => s.lastSeenDataVintage)
  const hasUnseenEntries = lastSeenDataVintage !== DATA_VINTAGE

  const mdComponents = useMemo(() => buildMarkdownComponents(tooltipsEnabled), [tooltipsEnabled])

  // Include hash target in initial open set; also open on hash changes via key reset
  const openDefault = validHash
    ? [validHash, ...(validHash !== 'fire' ? ['fire'] : [])]
    : ['fire']

  // Scroll to hash target after mount/hash change
  useEffect(() => {
    if (!validHash) return
    requestAnimationFrame(() => {
      document.getElementById(`ref-${validHash}`)?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [validHash])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reference Guide</h1>
            <p className="text-muted-foreground text-sm">
              Learn about FIRE planning concepts, Singapore-specific considerations, and how to use this tool effectively.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            <Switch id="eli5" checked={tooltipsEnabled} onCheckedChange={setTooltipsEnabled} />
            <Label htmlFor="eli5" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
              ELI5 tooltips
            </Label>
          </div>
        </div>

        <Accordion type="multiple" key={validHash ?? 'default'} defaultValue={openDefault}>
          <AccordionItem value="changelog" id="ref-changelog">
            <AccordionTrigger className="text-left font-medium">
              <span className="flex items-center gap-2">
                What's New
                {hasUnseenEntries && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ChangelogList />
            </AccordionContent>
          </AccordionItem>

          {SECTIONS.map((section) => (
            <AccordionItem key={section.id} value={section.id} id={`ref-${section.id}`}>
              <AccordionTrigger className="text-left font-medium">
                {section.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose prose-sm max-w-none prose-neutral prose-headings:text-foreground prose-headings:text-base prose-headings:mt-6 prose-headings:mb-2 prose-strong:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-td:text-muted-foreground prose-th:text-foreground prose-th:text-xs">
                  <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>{section.content}</Markdown>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}

          <AccordionItem value="data-sources">
            <AccordionTrigger>Data Sources & Methodology</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  All data used in this tool comes from publicly available sources.
                  Data is refreshed annually in January.
                </p>
                {Object.entries(DATA_SOURCES).map(([category, sources]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium capitalize mb-1">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <ul className="space-y-1">
                      {sources.map((src, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            {src.name}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          <span className="ml-1">{'\u2014'} {src.period}</span>
                          <span className="ml-1 text-muted-foreground/60">({src.license})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  )
}
