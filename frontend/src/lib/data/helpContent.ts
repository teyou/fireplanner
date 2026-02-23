/**
 * Context-aware FAQ content for the Help Panel.
 * Keyed by route path. Each route has 3-5 FAQ items.
 * Content extracted/summarized from ReferencePage sections.
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
