import { Spin } from 'antd'

// ─── Parser (runs only on complete text, after streaming) ──────────────────
function normalizeMealText(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\*\*\s*Macros\s*:?\s*\*\*/gi, '\nMacros: ')
    .replace(/\*\*\s*Why it fits\s*:?\s*\*\*/gi, '\nWhy it fits: ')
    .replace(/\s*[-*]\s*(Macros:)/gi, '\n$1')
    .replace(/\s*[-*]\s*(Why it fits:)/gi, '\n$1')
    .replace(/\s+(Macros:)/gi, '\n$1')
    .replace(/\s+(Why it fits:)/gi, '\n$1')
    .replace(/\n?\s*---+\s*\n?/g, '\n---\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitMealBlocks(text) {
  const separatorBlocks = text
    .split(/^\s*---+\s*$/m)
    .map(block => block.trim())
    .filter(Boolean)

  if (separatorBlocks.length > 1) return separatorBlocks

  const headingMatches = [...text.matchAll(/(?:^|\n)\s*\*\*([^*\n]+?)\*\*/gm)].filter(
    ([, heading]) => {
      const trimmedHeading = heading.trim()
      return !trimmedHeading.endsWith(':') && !/^Macros:?$/i.test(trimmedHeading) && !/^Why it fits:?$/i.test(trimmedHeading)
    }
  )

  if (headingMatches.length > 1) {
    return headingMatches
      .map((match, index) => {
        const start = match.index + (match[0].startsWith('\n') ? 1 : 0)
        const end = headingMatches[index + 1]?.index ?? text.length
        return text.slice(start, end).trim()
      })
      .filter(Boolean)
  }

  return text ? [text] : []
}

function cleanInlineText(text) {
  return text
    .replace(/^[\-:–—\s]+/, '')
    .replace(/\s+[\-:–—]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseMeals(text) {
  const normalizedText = normalizeMealText(text)

  return splitMealBlocks(normalizedText)
    .map(block => {
      const headingMatch = block.match(/\*\*([^*\n]+?)\*\*/)
      let name = ''
      let content = block

      if (headingMatch && headingMatch.index !== undefined) {
        name = headingMatch[1].trim()
        content = block.slice(headingMatch.index + headingMatch[0].length).trim()
      } else {
        const lines = block.split('\n').map(line => line.trim()).filter(Boolean)
        name = cleanInlineText(lines[0] || '')
        content = lines.slice(1).join('\n').trim()
      }

      const macrosMatch = content.match(/Macros:\s*([^\n]+)/i)
      const whyMatch = content.match(/Why it fits:\s*([^\n]+)/i)
      const sectionStarts = [macrosMatch?.index, whyMatch?.index]
        .filter(index => index !== undefined)
        .sort((a, b) => a - b)
      const descriptionEnd = sectionStarts[0] ?? content.length
      const description = cleanInlineText(content.slice(0, descriptionEnd))

      let macros = null
      if (macrosMatch) {
        const macroText = macrosMatch[1]
        const get = (...patterns) => patterns
          .map(pattern => macroText.match(pattern)?.[1] ?? null)
          .find(Boolean) ?? null

        macros = {
          calories: get(/(\d+(?:\.\d+)?)\s*k?cal/i, /calories?\s*:\s*(\d+(?:\.\d+)?)/i),
          protein: get(/(\d+(?:\.\d+)?)\s*g?\s*protein/i, /protein\s*:\s*(\d+(?:\.\d+)?)\s*g?/i),
          carbs: get(/(\d+(?:\.\d+)?)\s*g?\s*carb/i, /carbs?\s*:\s*(\d+(?:\.\d+)?)\s*g?/i),
          fat: get(/(\d+(?:\.\d+)?)\s*g?\s*fat/i, /fat\s*:\s*(\d+(?:\.\d+)?)\s*g?/i),
        }
      }

      const why = whyMatch ? cleanInlineText(whyMatch[1]) : null

      return { name, description, macros, why }
    })
    .filter(m => m.name)
}

// ─── Card component ─────────────────────────────────────────────────────────
function MealCard({ meal, index }) {
  const BADGE_COLORS = [
    { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)', text: '#34D399' },
    { bg: 'rgba(99,179,237,0.08)', border: 'rgba(99,179,237,0.25)', text: '#63B3ED' },
    { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)', text: '#FBBF24' },
    { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', text: '#A78BFA' },
  ]
  const color = BADGE_COLORS[index % BADGE_COLORS.length]

  const macroPills = meal.macros ? [
    { label: 'kcal', value: meal.macros.calories },
    { label: 'protein', value: meal.macros.protein ? `${meal.macros.protein}g` : null },
    { label: 'carbs', value: meal.macros.carbs ? `${meal.macros.carbs}g` : null },
    { label: 'fat', value: meal.macros.fat ? `${meal.macros.fat}g` : null },
  ].filter(p => p.value) : []

  return (
    <div style={{
      background: '#1E293B',
      border: `1px solid ${color.border}`,
      borderLeft: `3px solid ${color.text}`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: color.bg,
          border: `1px solid ${color.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color.text,
          fontWeight: 700,
          fontSize: 12,
          flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <span style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
          {meal.name}
        </span>
      </div>

      {/* Description */}
      {meal.description && (
        <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6, margin: '0 0 10px 0' }}>
          {meal.description}
        </p>
      )}

      {/* Macro pills */}
      {macroPills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: meal.why ? 10 : 0 }}>
          {macroPills.map((pill) => (
            <span key={pill.label} style={{
              background: color.bg,
              border: `1px solid ${color.border}`,
              borderRadius: 20,
              padding: '2px 10px',
              fontSize: 12,
              color: color.text,
              fontWeight: 500,
            }}>
              {pill.value} {pill.label}
            </span>
          ))}
        </div>
      )}

      {/* Why it fits */}
      {meal.why && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 6,
          padding: '8px 10px',
          fontSize: 12,
          color: '#64748B',
          lineHeight: 1.55,
          borderLeft: `2px solid ${color.border}`,
        }}>
          💡 {meal.why}
        </div>
      )}
    </div>
  )
}

// ─── Typewriter box (during streaming) ──────────────────────────────────────
function TypewriterBox({ text }) {
  return (
    <div style={{
      background: '#0F172A',
      border: '1px solid #334155',
      borderRadius: 10,
      padding: '14px 16px',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: 13,
      color: '#94A3B8',
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      maxHeight: 400,
      overflowY: 'auto',
    }}>
      {text}
      <span style={{
        display: 'inline-block',
        width: 2,
        height: '1em',
        background: '#34D399',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'blink 1s step-end infinite',
      }} />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function MealSuggestionOutput({ text, streaming }) {
  if (streaming) {
    return (
      <div style={{ marginBottom: 16 }}>
        <TypewriterBox text={text} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#64748B', fontSize: 12 }}>
          <Spin size="small" />
          <span>Generating suggestions…</span>
        </div>
      </div>
    )
  }

  const meals = parseMeals(text)

  if (meals.length === 0) {
    // Fallback: render as plain pre-formatted text if parsing fails
    return (
      <div style={{
        background: '#1E293B',
        border: '1px solid #334155',
        borderRadius: 10,
        padding: '14px 16px',
        fontSize: 13,
        color: '#94A3B8',
        lineHeight: 1.7,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        marginBottom: 16,
      }}>
        {text}
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {meals.map((meal, i) => (
        <MealCard key={i} meal={meal} index={i} />
      ))}
    </div>
  )
}
