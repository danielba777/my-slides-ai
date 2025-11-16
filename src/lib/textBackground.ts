


export type BlobInput = {
  lineWidths: number[]; 
  lineHeight: number; 
  padding: number; 
  radius: number; 
};


export function getBlockRectDims(
  lineWidths: number[],
  lineHeight: number,
  padding: number,
) {
  const maxW = Math.max(0, ...lineWidths);
  const h = lineWidths.length * lineHeight;
  return {
    x: -padding,
    y: 0,
    width: maxW + padding * 2,
    height: h,
  };
}


export function buildBlobPath({
  lineWidths,
  lineHeight,
  padding,
  radius,
}: BlobInput): string {
  const n = lineWidths.length;
  if (n === 0) return "";

  const right = (i: number) => (lineWidths[i] ?? 0) + padding; 
  const left = () => -padding; 
  const yTop = (i: number) => i * lineHeight;
  const yBot = (i: number) => (i + 1) * lineHeight;

  const r = Math.max(0, Math.min(radius, lineHeight * 0.5)); 
  const curveDepth = Math.min(lineHeight * 0.45, Math.max(6, r)); 

  
  let d = "";
  
  d += `M ${right(0) - r}, ${yTop(0)} `;
  
  d += `Q ${right(0)}, ${yTop(0)} ${right(0)}, ${yTop(0) + r} `;

  
  for (let i = 0; i < n; i++) {
    
    d += `L ${right(i)}, ${yBot(i) - (i === n - 1 ? r : 0)} `;
    if (i < n - 1) {
      
      const curr = right(i);
      const next = right(i + 1);
      const midY = yBot(i); 
      const ctrlX = curr + (next - curr) * 0.5; 
      
      d += `Q ${ctrlX}, ${midY + curveDepth * Math.sign(next - curr)} ${next}, ${midY} `;
    }
  }

  
  d += `Q ${right(n - 1)}, ${yBot(n - 1)} ${right(n - 1) - r}, ${yBot(n - 1)} `;

  
  d += `L ${left() + r}, ${yBot(n - 1)} `;
  
  d += `Q ${left()}, ${yBot(n - 1)} ${left()}, ${yBot(n - 1) - r} `;

  
  d += `L ${left()}, ${yTop(0) + r} `;
  
  d += `Q ${left()}, ${yTop(0)} ${left() + r}, ${yTop(0)} Z`;

  return d;
}
