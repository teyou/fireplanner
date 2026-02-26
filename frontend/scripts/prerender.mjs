/**
 * Post-build prerender script.
 *
 * Reads dist/index.html as a template and writes route-specific copies with
 * correct <title>, meta description, canonical, OG, and Twitter tags baked in.
 * Social bots (Facebook, Slack, WhatsApp, Twitter/X) don't execute JavaScript,
 * so they need these tags in the static HTML.
 *
 * No new dependencies -- pure Node fs/path.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')
const BASE_URL = 'https://sgfireplanner.com'

// Route meta map -- matches usePageMeta calls in each page component exactly
const routes = [
  {
    path: '/inputs',
    title: 'Plan Inputs \u2014 SG FIRE Planner',
    description: 'Configure your income, expenses, CPF, investments, and retirement assumptions for Singapore FIRE planning.',
  },
  {
    path: '/projection',
    title: 'Projection \u2014 SG FIRE Planner',
    description: 'Year-by-year financial projection with net worth trajectory, CPF balances, and retirement milestones.',
  },
  {
    path: '/withdrawal',
    title: 'Withdrawal Strategies \u2014 SG FIRE Planner',
    description: 'Compare 12 retirement withdrawal strategies including the 4% rule, VPW, guardrails, and CAPE-based approaches.',
  },
  {
    path: '/stress-test',
    title: 'Stress Test \u2014 SG FIRE Planner',
    description: 'Monte Carlo simulation, historical backtesting, and sequence risk analysis for your Singapore retirement plan.',
  },
  {
    path: '/dashboard',
    title: 'Dashboard \u2014 SG FIRE Planner',
    description: 'Your FIRE dashboard with key metrics, risk assessment, and retirement readiness overview.',
  },
  {
    path: '/checklist',
    title: 'FIRE Checklist \u2014 SG FIRE Planner',
    description: 'Track your progress toward financial independence with this Singapore-specific FIRE checklist.',
  },
  {
    path: '/reference',
    title: 'Reference Guide \u2014 SG FIRE Planner',
    description: 'Comprehensive guide to Singapore retirement planning: CPF, tax, withdrawal strategies, Monte Carlo methods, and data sources.',
  },
]

const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

for (const route of routes) {
  const url = `${BASE_URL}${route.path}`
  let html = template

  // <title>...</title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${route.title}</title>`,
  )

  // <meta name="description" content="...">
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`,
  )

  // <link rel="canonical" href="...">
  html = html.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${url}$2`,
  )

  // OG tags
  html = html.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${route.title}$2`,
  )
  html = html.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`,
  )
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${url}$2`,
  )

  // Twitter tags
  html = html.replace(
    /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/,
    `$1${route.title}$2`,
  )
  html = html.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`,
  )

  // Write to dist/<route>/index.html
  const routeDir = join(distDir, route.path.slice(1))
  mkdirSync(routeDir, { recursive: true })
  writeFileSync(join(routeDir, 'index.html'), html)
  console.log(`  Pre-rendered: ${route.path}`)
}

console.log(`\nPre-rendered ${routes.length} routes.`)
