type Props = { current: number };

const labels = ['Incident Type', 'Location', 'Description', 'Evidence', 'Contact'];

export default function ReportStepper({ current }: Props) {
  return (
    <div className="stepper">
      {labels.map((label, index) => (
        <span key={label} className={`step ${current === index + 1 ? 'current' : ''}`}>
          {index + 1}. {label}
        </span>
      ))}
    </div>
  );
}
