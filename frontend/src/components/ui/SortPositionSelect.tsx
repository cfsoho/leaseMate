export type SortPositionItem = {
  groupValue?: string;
  id: string;
  name: string;
  sortOrder: number;
};

type SortPositionSelectProps = {
  currentItemId?: string | null;
  currentValue: string;
  groupValue?: string;
  items: SortPositionItem[];
  labels: {
    before: (name: string) => string;
    end: string;
  };
  onChange: (value: string) => void;
};

type BuildSortPositionOptionsProps = Omit<
  SortPositionSelectProps,
  "currentValue" | "onChange"
>;

export function SortPositionSelect({
  currentItemId,
  currentValue,
  groupValue,
  items,
  labels,
  onChange,
}: SortPositionSelectProps) {
  const options = buildSortPositionOptions({
    currentItemId,
    groupValue,
    items,
    labels,
  });

  return (
    <select
      className="lm-form-input"
      value={currentValue}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.key} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function buildSortPositionOptions({
  currentItemId,
  groupValue,
  items,
  labels,
}: BuildSortPositionOptionsProps) {
  const groupItems = items
    .filter((item) => !groupValue || item.groupValue === groupValue)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.name.localeCompare(right.name),
    );
  const currentItem = groupItems.find((item) => item.id === currentItemId);
  const positionItems = groupItems.filter((item) => item.id !== currentItemId);
  const options = positionItems.map((item) => ({
    key: `before-${item.id}`,
    label: labels.before(item.name),
    value: String(item.sortOrder - 10),
  }));
  const lastOtherSortOrder = Math.max(
    0,
    ...positionItems.map((item) => item.sortOrder),
  );
  const endSortOrder =
    currentItem && currentItem.sortOrder > lastOtherSortOrder
      ? currentItem.sortOrder
      : lastOtherSortOrder;

  return [
    ...options,
    {
      key: "end",
      label: labels.end,
      value: String(endSortOrder),
    },
  ];
}
