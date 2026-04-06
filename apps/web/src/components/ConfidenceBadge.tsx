export function ConfidenceBadge({ confidence }: { confidence: "AUTO_OK" | "REVIEW_REQUIRED" }) {
  return (
    <span className={confidence === "AUTO_OK" ? "badge ok" : "badge warn"}>
      {confidence === "AUTO_OK" ? "AUTO_OK" : "REVIEW_REQUIRED"}
    </span>
  );
}
