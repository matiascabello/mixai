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
      </div>
    </div>
  );
}
