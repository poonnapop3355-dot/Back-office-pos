
import React from 'react';
import { LabelPayload } from '../../types';
import LabelCard from './LabelCard';

interface LabelSheetProps {
  labels: LabelPayload[];
  layout: '6-per-sheet' | '8-per-sheet';
}

const LabelSheet: React.FC<LabelSheetProps> = ({ labels, layout }) => {
  const itemsPerPage = layout === '6-per-sheet' ? 6 : 8;

  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  const labelChunks = chunkArray(labels, itemsPerPage);

  const gridClasses = {
    '6-per-sheet': 'grid-rows-3 h-[277mm]', // A4 printable height ~277mm
    '8-per-sheet': 'grid-rows-4 h-[277mm]',
  };
  
  const labelHeightClasses = {
    '6-per-sheet': 'h-[92mm]', // ~277/3 - gutter
    '8-per-sheet': 'h-[68mm]', // ~277/4 - gutter
  }

  return (
    <div className="printable-area">
      {labelChunks.map((chunk, pageIndex) => (
        <div
          key={pageIndex}
          className={`label-sheet bg-white shadow-lg w-[210mm] p-[10mm] box-border grid grid-cols-2 gap-[6mm] mx-auto my-4 ${gridClasses[layout]}`}
        >
          {chunk.map((label) => (
            <div key={label.orderCode} className={labelHeightClasses[layout]}>
                <LabelCard label={label} />
            </div>
          ))}
          {/* Fill empty slots to maintain grid structure */}
          {Array.from({ length: itemsPerPage - chunk.length }).map((_, i) => (
            <div key={`placeholder-${i}`} className={`border-2 border-dashed border-gray-200 rounded-lg ${labelHeightClasses[layout]}`}></div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default LabelSheet;
