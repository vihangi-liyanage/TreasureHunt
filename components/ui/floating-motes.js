const motes = [["12%","24%","0s"],["18%","70%","1.4s"],["47%","19%","2.2s"],["63%","78%",".6s"],["82%","33%","3.1s"],["90%","68%","1.8s"]];

export function FloatingMotes() {
  return <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">{motes.map(([left,top,delay]) => <i className="floating-mote" key={`${left}-${top}`} style={{ left, top, animationDelay: delay }} />)}</div>;
}
