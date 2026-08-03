const STEPS = ["Connect", "Choose your DJ", "Chat", "Confirm tracks", "Playlist ready"];

type StepIndicatorProps = {
  currentStep: number;
};

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <ol className="step-indicator">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const status = step < currentStep ? "done" : step === currentStep ? "current" : "upcoming";
        return (
          <li key={label} className={`step step--${status}`}>
            <span className="step-number" aria-hidden="true">
              {String(step).padStart(2, "0")}
            </span>
            <span className="step-label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
