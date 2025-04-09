// src/components/admin/schedule/ScheduleTab.tsx
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ScheduleGenerator from './ScheduleGenerator';
import ScheduleList from './ScheduleList';
import ConflictList from './ConflictList';

const ScheduleTab: React.FC = () => {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | undefined>(undefined);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const handleScheduleGenerated = (scheduleId: string) => {
    // Update selectedScheduleId when a new schedule is generated
    setSelectedScheduleId(scheduleId);
    // Force refresh the schedule list
    setRefreshCounter(prev => prev + 1);
  };

  const handleConflictResolved = () => {
    // Refresh schedule list when a conflict is resolved
    // (we keep the same selectedScheduleId)
    setRefreshCounter(prev => prev + 1);
  };

  const handleScheduleDeleted = () => {
    // When a schedule is deleted, clear the selected schedule ID
    // if it was the one that was deleted
    setSelectedScheduleId(undefined);
    // Force refresh the schedule list
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <Box>
      <ScheduleGenerator onScheduleGenerated={handleScheduleGenerated} />
      <ScheduleList 
        selectedScheduleId={selectedScheduleId} 
        forceRefresh={refreshCounter}
        onScheduleDeleted={handleScheduleDeleted}
      />
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