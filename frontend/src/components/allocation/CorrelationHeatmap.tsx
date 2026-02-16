import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { CORRELATION_MATRIX } from '@/lib/data/historicalReturns'

const LABELS = ['US Eq', 'SG Eq', 'Intl', 'Bonds', 'REITs', 'Gold', 'Cash', 'CPF']

export function CorrelationHeatmap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const containerWidth = containerRef.current.clientWidth
    const size = Math.min(containerWidth, 500)
    const margin = { top: 40, right: 10, bottom: 10, left: 50 }
    const cellSize = (size - margin.left - margin.right) / LABELS.length

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    svg.attr('width', size).attr('height', size)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Color scale: green → yellow → red
    const colorScale = d3.scaleLinear<string>()
      .domain([-0.3, 0, 0.3, 0.6, 1.0])
      .range(['#22c55e', '#86efac', '#fde047', '#fb923c', '#ef4444'])
      .clamp(true)

    // Draw cells
    for (let i = 0; i < LABELS.length; i++) {
      for (let j = 0; j < LABELS.length; j++) {
        const value = CORRELATION_MATRIX[i][j]
        const isDiagonal = i === j

        g.append('rect')
          .attr('x', j * cellSize)
          .attr('y', i * cellSize)
          .attr('width', cellSize - 1)
          .attr('height', cellSize - 1)
          .attr('fill', isDiagonal ? '#d4d4d8' : colorScale(value))
          .attr('rx', 2)
          .style('cursor', 'pointer')
          .on('mouseenter', function (event) {
            d3.select(this).attr('stroke', '#000').attr('stroke-width', 2)
            tooltip
              .style('opacity', 1)
              .html(`<strong>${LABELS[i]} / ${LABELS[j]}</strong><br/>Correlation: ${value.toFixed(2)}`)
              .style('left', `${event.offsetX + 10}px`)
              .style('top', `${event.offsetY - 10}px`)
          })
          .on('mouseleave', function () {
            d3.select(this).attr('stroke', 'none')
            tooltip.style('opacity', 0)
          })

        // Cell text
        g.append('text')
          .attr('x', j * cellSize + cellSize / 2)
          .attr('y', i * cellSize + cellSize / 2)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', cellSize > 50 ? '11px' : '9px')
          .attr('fill', isDiagonal ? '#71717a' : Math.abs(value) > 0.5 ? '#fff' : '#374151')
          .attr('pointer-events', 'none')
          .text(value.toFixed(2))
      }
    }

    // Column labels (top)
    g.selectAll('.col-label')
      .data(LABELS)
      .enter()
      .append('text')
      .attr('x', (_, i) => i * cellSize + cellSize / 2)
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .text((d) => d)

    // Row labels (left)
    g.selectAll('.row-label')
      .data(LABELS)
      .enter()
      .append('text')
      .attr('x', -8)
      .attr('y', (_, i) => i * cellSize + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .text((d) => d)

    // Tooltip div
    const tooltip = d3.select(containerRef.current)
      .selectAll('.d3-tooltip')
      .data([null])
      .join('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', 'rgba(0,0,0,0.85)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '6px')
      .style('font-size', '12px')
      .style('opacity', 0)
      .style('transition', 'opacity 0.15s')

    return () => {
      svg.selectAll('*').remove()
      d3.select(containerRef.current).selectAll('.d3-tooltip').remove()
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Correlation Matrix
          <InfoTooltip
            text="Pairwise correlations between asset classes. Low or negative correlations provide diversification benefit."
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative">
          <svg ref={svgRef} />
        </div>
      </CardContent>
    </Card>
  )
}
