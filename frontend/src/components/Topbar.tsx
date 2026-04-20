type Props = {
  title: string;
  description: string;
  onQuickExit: () => void;
};

export default function Topbar({ title, description, onQuickExit }: Props) {
  return (
    <div className="topbar">
      <div className="headline">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="actions">
        <span className="pill">React + TypeScript</span>
        <span className="pill">Working case platform</span>
        <button className="quick-exit" onClick={onQuickExit}>Quick Exit</button>
      </div>
    </div>
  );
}
