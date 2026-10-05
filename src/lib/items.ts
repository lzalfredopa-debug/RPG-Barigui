export type InventoryItemState = {
  durability_current?: number | null;
  durability_max?: number | null;
  freshness_minutes_remaining?: number | null;
  shelf_life_multiplier?: number | null;
  unit?: string | null;
  amount?: number | null;
  capacity_ml?: number | null;
};

export function durabilityLabel(item: InventoryItemState) {
  if (item.durability_max == null || item.durability_current == null) return null;
  const current = Number(item.durability_current);
  const max = Number(item.durability_max);
  if (current <= 0) return 'Quebrado';
  if (current === 1) return 'Danificado';
  if (current < max) return 'Gasto';
  return 'Íntegro';
}

export function freshnessLabel(minutes: number | null | undefined, shelfLifeMinutes?: number | null) {
  if (minutes == null) return null;
  if (minutes <= 0) return 'Estragado';
  if (shelfLifeMinutes && minutes <= shelfLifeMinutes * 0.25) return 'Próximo de estragar';
  return 'Bom';
}

export function formatDuration(minutes: number | null | undefined) {
  if (minutes == null) return null;
  if (minutes <= 0) return '0 min';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = Math.floor(minutes % 60);
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins || parts.length === 0) parts.push(`${mins}min`);
  return parts.join(' ');
}

export function formatAmount(amount: number | null | undefined, unit: string | null | undefined) {
  if (amount == null || !unit) return null;
  if (unit === 'ml' && amount >= 1000 && amount % 1000 === 0) return `${amount / 1000} L`;
  if (unit === 'g' && amount >= 1000 && amount % 1000 === 0) return `${amount / 1000} kg`;
  return `${amount} ${unit}`;
}
