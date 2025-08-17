import React from 'react';
import { LabelPayload } from '../../types';

interface LabelCardProps {
  label: LabelPayload;
}

const LabelCard: React.FC<LabelCardProps> = ({ label }) => {
  return (
    // Using flex-col and overflow-hidden to contain all content within the card borders
    <div className="border border-gray-400 rounded-lg p-3 flex flex-col text-[10pt] leading-snug h-full font-sans overflow-hidden">
      {/* Top Section */}
      <div className="pb-2 border-b border-dashed border-gray-300">
        <div>
          {/* Added break-words to all text elements to prevent horizontal overflow */}
          <p className="font-bold text-xs break-words">{label.shopName}</p>
          {label.shopAddress && <p className="text-xs text-gray-600 whitespace-pre-line break-words">{label.shopAddress}</p>}
          <p className="text-xs text-gray-600 break-words">{label.shopPhone}</p>
        </div>
      </div>

      {/* Main Section: flex-grow with flex-col allows pushing summary to bottom */}
      <div className="flex-grow pt-2 flex flex-col min-h-0">
        <div className="mb-2">
          <p className="text-xs text-gray-600">ผู้รับ (Recipient)</p>
          <p className="font-bold text-sm break-words">{label.recipientName}</p>
          <p className="text-sm whitespace-pre-line break-words">{label.fullAddress}</p>
          <p className="text-sm font-bold break-words">{label.postcode}</p>
          <p className="text-sm break-words">โทร. {label.phone}</p>
        </div>

        {/* Item summary is pushed to the bottom of the card to handle variable address heights */}
        <div className="text-xs text-gray-500 mt-auto pt-1">
            <p className="break-words">สินค้า: {label.itemsSummary}</p>
        </div>
      </div>
    </div>
  );
};

export default LabelCard;
