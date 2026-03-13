import type { CompanionAction } from '@foundrypal/shared';

export function ActionsScreen({
  actions,
  actorReady,
}: {
  actions: CompanionAction[];
  actorReady: boolean;
}): JSX.Element {
  if (!actorReady) return <p>Waiting for actor detail stream.</p>;
  if (!actions.length) return <p>No actions available.</p>;

  return (
    <section className="card-list">
      {actions.map((action) => (
        <article key={action.id} className="card compact">
          <div>
            <strong>{action.name}</strong>
            <p>{action.type} • {action.activation ?? '—'}</p>
          </div>
          <button disabled={!action.available} title="Action execution hooks are pending bridge support in this client.">
            Use
          </button>
        </article>
      ))}
    </section>
  );
}
