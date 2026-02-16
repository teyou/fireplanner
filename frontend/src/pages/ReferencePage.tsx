import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

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

**Singapore-specific considerations:**
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

**Key concepts:**
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
    content: `**CPF (Central Provident Fund):**
- Mandatory savings: up to 37% of salary (employee + employer)
- OA: 2.5% interest (housing, education, investment)
- SA: 4% interest (retirement)
- MA: 4% interest (healthcare)
- Extra 1% on first $60K combined balances
- CPF LIFE: Lifetime annuity from age 65

**Taxes:**
- Progressive income tax: 0% to 24%
- No capital gains tax
- No inheritance tax
- SRS tax deduction: up to $15,300/year

**Property:**
- BSD: 1-6% progressive brackets
- ABSD: 0-60% based on residency and property count
- 99-year leasehold is standard (Bala's Table for depreciation)
- LTV cap: 75% for first property`,
  },
  {
    id: 'how-to',
    title: 'How to Use This Tool',
    content: `**Step 1: Profile** — Enter your age, income, expenses, and existing savings. Set your FIRE type and SWR.

**Step 2: Income** — Configure salary model, additional income streams, and life events. Review year-by-year projections.

**Step 3: Allocation** — Choose a template or customize asset class weights. Review portfolio statistics.

**Step 4: Monte Carlo** — Run simulations to test your plan's success probability. Experiment with different methods and strategies.

**Step 5: Withdrawal** — Compare withdrawal strategies on a deterministic path. Find the right balance of income stability and portfolio preservation.

**Step 6: Sequence Risk** — Stress-test against historical crises. Evaluate mitigation strategies.

**Step 7: Backtest** — See how your plan would have performed in every historical period.

**Step 8: Dashboard** — Review your complete FIRE picture with all metrics in one place.`,
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

export function ReferencePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reference Guide</h1>
        <p className="text-muted-foreground text-sm">
          Learn about FIRE planning concepts, Singapore-specific considerations, and how to use this tool effectively.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={['fire']}>
        {SECTIONS.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="text-left font-medium">
              {section.title}
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                {section.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
