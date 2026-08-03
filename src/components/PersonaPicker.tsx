"use client";

import { PERSONA_IDS, PERSONAS, type PersonaId } from "@/lib/openai/personas/registry";

type PersonaPickerProps = {
  onSelect: (personaId: PersonaId) => void;
};

export function PersonaPicker({ onSelect }: PersonaPickerProps) {
  return (
    <div className="persona-picker">
      <p className="eyebrow">Select your DJ</p>
      <div className="persona-cards">
        {PERSONA_IDS.map((id, index) => {
          const persona = PERSONAS[id];
          return (
            <button key={id} type="button" className="persona-card" onClick={() => onSelect(id)}>
              <span className="persona-index" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="persona-card-body">
                <span className="persona-name">{persona.displayName}</span>
                <span className="persona-tagline">{persona.tagline}</span>
              </span>
            </button>
          );
        })}
        <button
          type="button"
          className="persona-card persona-card--disabled"
          disabled
          aria-disabled="true"
        >
          <span className="persona-index" aria-hidden="true">
            {String(PERSONA_IDS.length + 1).padStart(2, "0")}
          </span>
          <span className="persona-card-body">
            <span className="persona-name">Build your own DJ</span>
            <span className="persona-tagline">Design a DJ with your own taste and voice</span>
          </span>
          <span className="coming-soon-badge">Coming soon</span>
        </button>
      </div>
    </div>
  );
}
