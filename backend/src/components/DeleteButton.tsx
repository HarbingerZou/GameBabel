export default function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      onClick={onDelete}
      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
    >
      Delete
    </button>
  );
}
