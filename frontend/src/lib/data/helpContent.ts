/**
 * Context-aware FAQ content for the Help Panel.
 * Keyed by route path OR section ID (for /inputs sub-sections).
 * Content guides first-time users through filling out each section.
 */

export interface HelpFaqItem {
  question: string
  answer: string
}

export const HELP_FAQ: Record<string, HelpFaqItem[]> = {
  '/': [
    {
      question: 'What is FIRE?',
      answer:
        'FIRE stands for Financial Independence, Retire Early. It means building enough savings and investments so that your investment returns can cover your living expenses indefinitely, freeing you from needing employment income.',
    },
    {
      question: 'How does this tool work?',
      answer:
        'Enter your financial details (income, expenses, savings, CPF), and the tool projects when you can achieve financial independence. It uses Singapore-specific data for CPF, tax, and property calculations. All data stays in your browser \u2014 nothing is sent to a server.',
    },
    {
      question: 'What is the 4% rule?',
      answer:
        "A guideline from William Bengen's 1994 study: if you withdraw 4% of your portfolio in year one and adjust for inflation each year, your money should last at least 30 years. This tool lets you test different withdrawal rates and strategies.",
    },
  ],

  // ─── Input sections ───────────────────────────────────────

  'section-personal': [
    {
      question: 'What retirement age should I use?',
      answer:
        'Use the age you plan to stop working full-time. In Singapore, the re-employment age is 68, but FIRE planners often target 40\u201355. You can always adjust this later \u2014 the projection updates instantly.',
    },
    {
      question: 'How does life expectancy affect my plan?',
      answer:
        'Life expectancy determines how many years your portfolio must last. A longer life expectancy means you need a larger FIRE number. SG average is ~84, but planning to 90\u201395 adds a safety margin against longevity risk.',
    },
    {
      question: 'What life stage should I pick?',
      answer:
        'Pre-FIRE (Accumulating): you\'re still saving toward your target. Post-FIRE (Decumulating): you\'ve already retired and are drawing down. This changes how projections are calculated \u2014 accumulation vs withdrawal mode.',
    },
  ],

  'section-fire-settings': [
    {
      question: 'What SWR (Safe Withdrawal Rate) should I use?',
      answer:
        'The classic 4% rule works for a 30-year retirement. For early retirees (40+ years), consider 3\u20133.5%. A lower SWR means a larger FIRE number but higher safety. You can test different rates in the Stress Test section later.',
    },
    {
      question: 'What FIRE type is right for me?',
      answer:
        'Regular FIRE: fully cover expenses from investments. Lean FIRE: minimal expenses, frugal lifestyle. Fat FIRE: comfortable/luxury expenses. Coast FIRE: enough invested that growth alone reaches your target by retirement \u2014 you just cover current expenses. Barista FIRE: part-time work covers the gap.',
    },
    {
      question: 'Nominal vs Real (inflation-adjusted) basis?',
      answer:
        'Real basis shows everything in today\'s purchasing power \u2014 easier to understand. Nominal shows future dollar amounts. At 2.5% inflation, $100K in 20 years is only worth ~$61K in today\'s dollars. We recommend Real for planning.',
    },
  ],

  'section-income': [
    {
      question: 'Which salary model should I pick?',
      answer:
        'Simple: use if you expect steady raises (e.g., 3%/year). Realistic: models career phases with promotion jumps at specific ages \u2014 good for PMETs. Data-Driven: uses MOM salary benchmarks for your education level \u2014 great if you\'re unsure about future growth.',
    },
    {
      question: 'What income streams should I add?',
      answer:
        'Add any regular income beyond salary: rental income, dividends, freelance work, spouse\'s income, part-time work in retirement. Each stream has its own start/end age, so you can model income changes over your lifetime.',
    },
    {
      question: 'How are bonuses and variable pay handled?',
      answer:
        'Include your expected annual bonus in the bonus months field. The tool distributes it across the year for projection purposes. If your bonus varies, use a conservative estimate \u2014 you can always adjust.',
    },
  ],

  'section-expenses': [
    {
      question: 'Should I include mortgage payments?',
      answer:
        'Yes, if you have an active mortgage. Enter the monthly amount and the year it ends. After the mortgage is paid off, your expenses will drop \u2014 the projection captures this automatically.',
    },
    {
      question: 'How do I estimate retirement expenses?',
      answer:
        'A common rule: 70\u201380% of pre-retirement expenses. You\'ll likely spend less on commuting and work clothes, but more on healthcare and leisure. The tool lets you set a separate retirement expense figure.',
    },
    {
      question: 'What about inflation on expenses?',
      answer:
        'The tool applies your configured inflation rate (default 2.5%) to expenses each year. Healthcare costs often inflate faster \u2014 the Healthcare section lets you model this separately.',
    },
  ],

  'section-net-worth': [
    {
      question: 'What counts as liquid net worth?',
      answer:
        'Cash, stocks, bonds, ETFs, unit trusts, robo-advisor portfolios \u2014 anything you can sell and access within days. Do NOT include CPF (it\'s tracked separately), your home (unless selling), or illiquid assets like private equity.',
    },
    {
      question: 'Should I include CPF balances here?',
      answer:
        'No \u2014 enter CPF OA, SA, and MA in their dedicated fields below. CPF grows at guaranteed rates and has withdrawal restrictions, so the tool models it separately from your liquid investments.',
    },
    {
      question: 'What is SRS and should I contribute?',
      answer:
        'SRS (Supplementary Retirement Scheme) contributions are tax-deductible up to $15,300/year. Withdrawals after age 62 are 50% tax-free. It\'s especially valuable if you\'re in a high tax bracket. Enter your current balance and annual contribution here.',
    },
  ],

  'section-cpf': [
    {
      question: 'How do CPF contribution rates change with age?',
      answer:
        'Total rate drops at age milestones: 37% (up to 55), 29.5% (55\u201360), 20.5% (60\u201365), 16.5% (65\u201370), 12.5% (70+). The employer share reduces more than the employee share. The tool applies the correct rates at each age.',
    },
    {
      question: 'What is CPF LIFE and when does it start?',
      answer:
        'CPF LIFE is a national annuity that provides monthly payouts from age 65 for life. Your Retirement Account balance at 55 determines the payout amount. Basic Plan gives lower payouts but preserves more for beneficiaries; Standard Plan gives higher payouts.',
    },
    {
      question: 'What are BRS, FRS, and ERS?',
      answer:
        'At age 55, your RA is set up. BRS (Basic Retirement Sum) \u2248 $99K, FRS (Full) \u2248 $198K, ERS (Enhanced) \u2248 $298K (2024 values, grow 3.5%/year). Higher sums = higher CPF LIFE payouts. The tool projects these forward to your age 55.',
    },
    {
      question: 'How does the OA housing deduction work?',
      answer:
        'If you used CPF OA for your mortgage, enter the monthly deduction here. This reduces OA growth during your working years but is a common and practical use of CPF for Singaporeans.',
    },
  ],

  'section-healthcare': [
    {
      question: 'How should I estimate healthcare costs?',
      answer:
        'Healthcare costs typically rise with age. The tool lets you set a base annual cost and a healthcare-specific inflation rate (often 5\u20138%, higher than general inflation). Even with MediShield Life, out-of-pocket costs for specialist care can be significant.',
    },
    {
      question: 'What does MediShield Life cover?',
      answer:
        'MediShield Life covers large hospital bills and selected outpatient treatments, but has deductibles and co-insurance. Private Integrated Shield Plans provide wider coverage. Model your expected out-of-pocket portion here.',
    },
    {
      question: 'Why model healthcare separately?',
      answer:
        'Healthcare inflation (5\u20138%) far outpaces general inflation (2\u20133%). A retiree at 65 spending $5K/year on healthcare could face $15K+ by age 85. Modelling it separately gives a more realistic retirement cost picture.',
    },
  ],

  'section-property': [
    {
      question: 'Should I include my home in the plan?',
      answer:
        'Include it if you plan to downsize, sell, or rent it out in retirement. If you plan to live in it forever, it doesn\'t contribute to your investable assets \u2014 but the tool can still model mortgage payments reducing your savings rate.',
    },
    {
      question: 'How does lease decay work for HDB/leasehold?',
      answer:
        'Leasehold properties lose value as the lease shortens, following Bala\'s Table. A 99-year lease HDB at 60 years remaining retains ~80% of value, but drops sharply after 40 years remaining. The tool applies this decay automatically.',
    },
    {
      question: 'What are BSD and ABSD?',
      answer:
        'BSD (Buyer\'s Stamp Duty): 1\u20136% progressive tax on all property purchases. ABSD (Additional BSD): 20% for citizens\' 2nd property, 30% for 3rd+. PRs pay 5% on 1st, 30% on 2nd+. The tool calculates both based on your residency and property count.',
    },
  ],

  'section-allocation': [
    {
      question: 'What allocation is right for me?',
      answer:
        'Use the templates as a starting point: Aggressive (80/20 stocks/bonds) for 20+ year horizons, Balanced (60/40) for 10\u201320 years, Conservative (30/70) for near-retirees. Your risk tolerance and timeline matter most.',
    },
    {
      question: 'What is a glide path?',
      answer:
        'A glide path gradually shifts your allocation from aggressive to conservative as you approach retirement. For example, 80% stocks at age 30 might shift to 40% stocks by age 60. This reduces sequence-of-returns risk near retirement.',
    },
    {
      question: 'How do I read the correlation matrix?',
      answer:
        'Values range from -1 to +1. Low or negative correlation between assets means they don\'t move together \u2014 this is good for diversification. For example, bonds and stocks often have low correlation, so holding both reduces portfolio volatility.',
    },
    {
      question: 'What does the expected return/volatility mean?',
      answer:
        'Expected return is the average annual gain based on historical data. Volatility (standard deviation) measures how much returns swing year to year. Higher volatility = more risk. The Sharpe ratio shows return per unit of risk \u2014 higher is better.',
    },
  ],

  // ─── Non-input pages ──────────────────────────────────────

  '/inputs': [
    {
      question: 'How is my FIRE number calculated?',
      answer:
        'FIRE Number = Annual Expenses / Safe Withdrawal Rate. For example, $48,000 expenses with a 4% SWR gives a FIRE number of $1,200,000. This is the portfolio size needed to sustain your lifestyle from investment returns.',
    },
    {
      question: 'How does CPF affect my plan?',
      answer:
        'CPF contributions reduce your take-home pay during accumulation but grow at guaranteed rates (OA: 2.5%, SA: 4%). At 55, your Retirement Account is set up, and at 65 CPF LIFE provides a monthly payout that reduces how much you need from your portfolio.',
    },
    {
      question: 'What are the salary models?',
      answer:
        'Simple: fixed annual growth rate. Realistic: career phases with promotion jumps at configurable ages. Data-Driven: uses MOM (Ministry of Manpower) salary benchmarks by age and education level.',
    },
    {
      question: 'Should I include property?',
      answer:
        "Include property if you want to model mortgage payments reducing savings, rental income in retirement, or property equity as part of net worth. The tool handles BSD, ABSD, LTV, and lease decay via Bala's Table.",
    },
  ],

  '/projection': [
    {
      question: 'What does the projection table show?',
      answer:
        "A year-by-year breakdown from your current age to life expectancy, showing income, expenses, savings, CPF balances, investment growth, and total net worth. All values can be shown in today's dollars (inflation-adjusted) or future/nominal dollars.",
    },
    {
      question: 'What is the difference between nominal and real dollars?',
      answer:
        "Nominal (future) dollars are the actual amounts you'll see. Real (today's) dollars adjust for inflation so you can compare future values to what money buys today. At 2.5% inflation, $100K in 20 years is worth about $61K in today's dollars.",
    },
    {
      question: 'Why does my portfolio drop at retirement?',
      answer:
        "In retirement years, you're withdrawing from your portfolio to cover expenses instead of adding savings. The projection assumes your chosen withdrawal strategy (e.g., 4% rule) starts at your retirement age.",
    },
  ],

  '/stress-test': [
    {
      question: 'What is Monte Carlo simulation?',
      answer:
        'Running 10,000 random market scenarios to see how often your plan survives. Each scenario generates different annual returns based on historical data. A 95% success rate means your plan survived in 9,500 of 10,000 scenarios.',
    },
    {
      question: 'Parametric vs Bootstrap vs Fat-tail?',
      answer:
        'Parametric: generates returns from a bell curve using historical mean/volatility. Bootstrap: randomly samples actual historical years. Fat-tail: uses a Student-t distribution that produces more extreme events (crashes/booms) than a normal bell curve.',
    },
    {
      question: 'What is sequence of returns risk?',
      answer:
        'The risk that bad market returns happen early in your retirement, when your portfolio is largest and withdrawals have the biggest impact. A 30% crash in year 1 of retirement is far more damaging than the same crash in year 20.',
    },
    {
      question: 'What is historical backtesting?',
      answer:
        'Tests your plan against every possible starting year in history. If your plan is 30 years long, it tests starting in 1928, 1929, 1930... through the most recent possible window. Shows which historical periods would have failed.',
    },
    {
      question: 'What mitigations reduce sequence risk?',
      answer:
        'Bond tent: temporarily holding more bonds around retirement. Cash buffer: keeping 1-3 years of expenses in cash. Flexible spending: reducing withdrawals by 10-25% when the portfolio drops below a threshold.',
    },
  ],

  '/dashboard': [
    {
      question: 'How is the risk score calculated?',
      answer:
        'The risk assessment scores 6 dimensions: withdrawal rate sustainability, portfolio diversification, sequence risk exposure, income stability, CPF/annuity coverage, and expense flexibility. Each dimension is rated and combined into an overall score.',
    },
    {
      question: 'What does "years to FIRE" mean?',
      answer:
        'The number of years until your projected net worth reaches your FIRE number, assuming your current savings rate and expected investment returns continue. If already past your FIRE number, this shows 0.',
    },
    {
      question: 'What is Coast FIRE?',
      answer:
        "The portfolio size where, even if you stop saving entirely, compound growth alone will reach your FIRE number by retirement age. Once you hit Coast FIRE, you only need to earn enough to cover current expenses.",
    },
  ],

  '/reference': [],
  '/checklist': [],
}
