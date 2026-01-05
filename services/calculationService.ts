
import { BodyMeasurements, RatioAnalysis, Archetype } from '../types';

export const calculateRatios = (data: BodyMeasurements): RatioAnalysis => {
  if (!data) {
    return {
      apeIndex: 1,
      headRatio: 8,
      handRatio: null,
      footRatio: null,
      vitruvianScore: 0,
      archetype: Archetype.UNDEFINED
    };
  }

  const height = data.height || 175;
  const wingspan = data.wingspan || 175;
  const headLength = data.headLength || 22;

  const apeIndex = wingspan / height;
  const headRatio = height / headLength;
  
  const handRatio = data.handLength ? data.handLength / height : null;
  const footRatio = data.footLength ? data.footLength / height : null;

  const targetApe = 1.0;
  const targetHead = 8.0;

  const apeDeviation = Math.abs(apeIndex - targetApe) / targetApe;
  const headDeviation = Math.abs(headRatio - targetHead) / targetHead;

  const weightedError = (headDeviation * 0.6) + (apeDeviation * 0.4);
  
  let score = 100 - (weightedError * 200);
  score = Math.max(0, Math.min(100, score));

  let archetype = Archetype.UNDEFINED;

  if (score > 90) {
    archetype = Archetype.VITRUVIAN_IDEAL;
  } else if (headRatio > 8.2) {
    archetype = Archetype.MODERN_HEROIC;
  } else if (headRatio < 7.5) {
    archetype = Archetype.RENAISSANCE_REALISM;
  } else if (apeIndex > 1.05) {
    archetype = Archetype.NEOCLASSICAL_POWER;
  } else {
    archetype = Archetype.RENAISSANCE_REALISM;
  }

  return {
    apeIndex,
    headRatio,
    handRatio,
    footRatio,
    vitruvianScore: parseFloat(score.toFixed(1)),
    archetype
  };
};

export const generateCsvContent = (data: BodyMeasurements, analysis: RatioAnalysis): string => {
  if (!data || !analysis) return "";
  const headers = ["Metric", "Value", "Ideal Target", "Difference"];
  const rows = [
    ["Height", `${data.height}cm`, "N/A", "-"],
    ["Wingspan", `${data.wingspan}cm`, `${data.height}cm`, `${((data.wingspan || 0) - (data.height || 0)).toFixed(1)}cm`],
    ["Head Length", `${data.headLength}cm`, `${((data.height || 0) / 8).toFixed(1)}cm`, `${((data.headLength || 0) - ((data.height || 0) / 8)).toFixed(1)}cm`],
    ["Ape Index (Ratio)", analysis.apeIndex.toFixed(3), "1.000", (analysis.apeIndex - 1).toFixed(3)],
    ["Head Proportion", `1:${analysis.headRatio.toFixed(2)}`, "1:8.00", (analysis.headRatio - 8).toFixed(2)],
    ["Vitruvian Score", analysis.vitruvianScore.toString(), "100", `-${(100 - analysis.vitruvianScore).toFixed(1)}`]
  ];

  return "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
};
