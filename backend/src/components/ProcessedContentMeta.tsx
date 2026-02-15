interface ProcessedContentMetaProps {
  seoTitle: string | null;
  qualityScore: number;
  topic: string | null;
}

export default function ProcessedContentMeta({
  seoTitle,
  qualityScore,
  topic,
}: ProcessedContentMetaProps) {
  const getQualityColor = (score: number) => {
    if (score >= 8) return "text-emerald-600 bg-emerald-50";
    if (score >= 5) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50">
      <div className="mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
          SEO Title
        </span>
        <p className="mt-1 text-base font-semibold text-slate-800">
          {seoTitle || (
            <span className="text-slate-400 italic font-normal">
              No SEO title generated
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Quality
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-sm font-semibold ${getQualityColor(qualityScore)}`}
          >
            {qualityScore}/10
          </span>
        </div>

        {topic && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Topic
            </span>
            <span className="px-2 py-0.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
              {topic}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
