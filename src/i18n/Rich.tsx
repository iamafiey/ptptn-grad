import { Fragment } from 'react'

/**
 * Renders a dictionary string that marks one accent phrase with <em>…</em>
 * (e.g. 'Hi, <em>{name}</em>'). Only <em> is supported; everything else is text.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(<em>.*?<\/em>)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('<em>') ? <em key={i}>{p.slice(4, -5)}</em> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  )
}
