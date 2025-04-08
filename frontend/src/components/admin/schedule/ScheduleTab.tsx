// src/components/admin/schedule/ScheduleTab.tsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ScheduleGenerator from './ScheduleGenerator';
import ScheduleList from './ScheduleList';
import ConflictList from './ConflictList';

const ScheduleTab: React.FC = () => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(undefined);

  const handleScheduleGenerated = (scheduleId: string) => {
    // Update selectedScheduleId when a new schedule is generated
    setSelectedScheduleId(scheduleId);
  };

  const handleConflictResolved = () => {
    // Refresh schedule list when a conflict is resolved
    // (we keep the same selectedScheduleId)
  };

  return (
    <Box>
      <ScheduleGenerator onScheduleGenerated={handleScheduleGenerated} />
      <ScheduleList selectedScheduleId={selectedScheduleId} />
      {selectedScheduleId && (
        <ConflictList 
          scheduleId={selectedScheduleId} 
          onConflictResolved={handleConflictResolved} 
        />
      )}
    </Box>
  );
};

export default ScheduleTab;