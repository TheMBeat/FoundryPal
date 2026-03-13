import type { CompanionActorDetail, CompanionActorSummary } from '@foundrypal/shared';

export function MyCharacterScreen({
  actor,
  summary,
  onUpdateHp,
}: {
  actor?: CompanionActorDetail;
  summary?: CompanionActorSummary;
  onUpdateHp: (delta: number) => void;
}): JSX.Element {
  const sheet = actor ?? summary;
  if (!sheet) return <p>No character selected.</p>;

  return (
    <section>
      <div className="hero">
        {sheet.img ? <img src={sheet.img} alt={sheet.name} /> : <div className="avatar-fallback">{sheet.name[0]}</div>}
        <div>
          <h2>{sheet.name}</h2>
          {'resources' in sheet ? <p>Detailed sheet connected</p> : <p>Waiting for actor detail stream</p>}
        </div>
      </div>
      <div className="stats-grid">
        <div>HP {sheet.hp.value}/{sheet.hp.max}</div>
        <div>Temp {sheet.hp.temp}</div>
        <div>AC {sheet.ac ?? '—'}</div>
        <div>Speed {sheet.speed ?? '—'}</div>
        <div>Passive Perception {sheet.passives.perception ?? '—'}</div>
      </div>
      <div className="row">
        <button onClick={() => onUpdateHp(-1)}>-1 HP</button>
        <button onClick={() => onUpdateHp(1)}>+1 HP</button>
      </div>
      {'resources' in sheet && (
        <ul>
          {sheet.resources.map((resource) => (
            <li key={resource.id}>{resource.label}: {resource.value}/{resource.max ?? '—'}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
