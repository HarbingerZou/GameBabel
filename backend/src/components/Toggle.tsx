interface ToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  leftValue: T;
  rightValue: T;
  leftLabel: string;
  rightLabel: string;
}

export default function Toggle<T extends string>({
  value,
  onChange,
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
}: ToggleProps<T>) {
  const isLeft = value === leftValue;

  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange(leftValue)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          isLeft
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {leftLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(rightValue)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
          !isLeft
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );
}
