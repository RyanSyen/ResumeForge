import type { CustomSection } from '../../types'
import { newId, useResume } from '../../store/resume'
import { Field, TextArea } from '../ui'
import { AddButton } from './EditorPanel'
import { ItemCard, SectionShell } from './SectionShell'

const splitLines = (v: string) => v.split('\n')

export function CustomSectionEditor({
  section,
  first,
  last,
}: {
  section: CustomSection
  first: boolean
  last: boolean
}) {
  const {
    renameCustomSection,
    removeCustomSection,
    addCustomItem,
    updateCustomItem,
    removeCustomItem,
    moveCustomItem,
  } = useResume.getState()

  return (
    <SectionShell
      section={section.id}
      label={section.title || 'Untitled Section'}
      first={first}
      last={last}
      onDelete={() => {
        if (confirm(`Delete "${section.title || 'this section'}" and all its items? This cannot be undone.`)) {
          removeCustomSection(section.id)
        }
      }}
    >
      <Field
        label="Section name"
        value={section.title}
        onChange={(e) => renameCustomSection(section.id, e.target.value)}
      />
      {section.items.map((it, i) => (
        <ItemCard
          key={it.id}
          title={it.title}
          subtitle={it.subtitle}
          first={i === 0}
          last={i === section.items.length - 1}
          onMoveUp={() => moveCustomItem(section.id, it.id, -1)}
          onMoveDown={() => moveCustomItem(section.id, it.id, 1)}
          onRemove={() => removeCustomItem(section.id, it.id)}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <Field
              label="Title"
              value={it.title}
              onChange={(e) => updateCustomItem(section.id, it.id, { title: e.target.value })}
            />
            <Field
              label="Subtitle"
              value={it.subtitle}
              onChange={(e) => updateCustomItem(section.id, it.id, { subtitle: e.target.value })}
            />
          </div>
          <Field
            label="Date"
            placeholder="2023"
            value={it.date}
            onChange={(e) => updateCustomItem(section.id, it.id, { date: e.target.value })}
          />
          <Field
            label="Description"
            value={it.description}
            onChange={(e) => updateCustomItem(section.id, it.id, { description: e.target.value })}
          />
          <TextArea
            label="Bullets"
            hint="one bullet per line"
            rows={3}
            value={it.bullets.join('\n')}
            onChange={(e) => updateCustomItem(section.id, it.id, { bullets: splitLines(e.target.value) })}
          />
        </ItemCard>
      ))}
      <AddButton
        label="Add item"
        onClick={() =>
          addCustomItem(section.id, {
            id: newId(),
            title: '',
            subtitle: '',
            date: '',
            description: '',
            bullets: [],
          })
        }
      />
    </SectionShell>
  )
}
