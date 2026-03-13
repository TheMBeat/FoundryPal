import type { CompanionItem } from '@foundrypal/shared';

export function groupInventory(items: CompanionItem[]): Array<{ category: string; items: CompanionItem[] }> {
  const groups = new Map<string, CompanionItem[]>();
  items.forEach((item) => {
    const key = item.type || 'other';
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return Array.from(groups.entries()).map(([category, grouped]) => ({ category, items: grouped }));
}

export function InventoryScreen({
  items,
  actorReady,
  onUseItem,
}: {
  items: CompanionItem[];
  actorReady: boolean;
  onUseItem: (itemId: string) => void;
}): JSX.Element {
  if (!actorReady) return <p>Waiting for actor detail stream.</p>;

  const grouped = groupInventory(items);
  if (!grouped.length) return <p>Inventory empty.</p>;

  return (
    <section>
      {grouped.map((group) => (
        <div key={group.category}>
          <h3>{group.category}</h3>
          <ul className="card-list">
            {group.items.map((item) => (
              <li key={item.id} className="card compact">
                <div>
                  <strong>{item.name}</strong>
                  <p>Qty {item.quantity} {item.equipped ? '• Equipped' : ''}</p>
                </div>
                <button onClick={() => onUseItem(item.id)} disabled={item.quantity < 1}>Use</button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
