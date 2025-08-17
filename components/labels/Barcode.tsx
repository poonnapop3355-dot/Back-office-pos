
import React, { useEffect, useRef } from 'react';

interface BarcodeProps {
  value: string;
}

const Barcode: React.FC<BarcodeProps> = ({ value }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
        try {
             // @ts-ignore
            JsBarcode(svgRef.current, value, {
                format: 'CODE128',
                displayValue: false,
                margin: 0,
                height: 40,
                width: 1.5,
            });
        } catch (e) {
            console.error("Barcode generation failed:", e);
        }
    }
  }, [value]);

  return <svg ref={svgRef}></svg>;
};

export default Barcode;
